const cfg     = require("./config/cfg.json");
const utils   = require("./utils/utils.js");
const Context = require("./context.js");

class StringType
{
	constructor(/*String*/ open, /*String*/ close, /*Boolean*/ greedy, reducer)
	{
		this.open = open;
		this.close = close ?? open;
		this.greedy = greedy ?? false;
		this.reduce = reducer ?? ((content, parser, message, error) => content);
	}

	/*Boolean*/ startsAt(/*String*/ source, /*Number*/ from)
	{ return source.startsWith(this.open, from); }

	// parses from a starting index in a string to get a string defined in it
	// the from index should be before or at the start of the opening sequence
	// returns an object containing the string and the start & end source indices
	// start or end index is -1 if the respective piece is missing
	/* Example:
	 * source = " thingies {open}string contents \\{close} other stuff{close} more"
	 * from = 0
	 * open = "{open}"
	 * close = "{close}"
	 * return = { start: 10, end: 50, content: "string contents {close} other stuff" }
	 */
	/*Object*/ getstring(/*String*/ source, /*Number*/ from)
	{
		// find first unescaped instance of {open}
		let start = from;
		do start = source.indexOf(this.open, start);
		while (start > from && source[start - 1] == '\\' && start++);
		if (start < 0) return { start: -1, end: undefined, content: undefined };

		let content = "";
		let end = start + this.open.length;
		let depth = 1;
		while (end <= source.length - this.close.length)
		{
			if (source.startsWith(this.close, end)) { if (--depth == 0) break; }
			else if (source.startsWith(this.open, end)) depth++;
			else if (source[end] == '\\' && source.startsWith(this.close, end + 1))
				end++;
			content += source[end++];
		}
		// closing piece wasn't found
		if (depth > 0) return { start, end: -1, content: content + source.substr(end) };
		// normal
		return { start, end: end + this.close.length - 1, content };
	}
	/*String*/ toString() { return `${this.open}...${this.close} type string`; }
}

class Parser
{
	static /*Array<StringType>*/ stringTypes = [
		new StringType('"'),
		new StringType("'"),
		new StringType("$'", "'", false, c => Parser.evalbses(c)),
		new StringType("$(", ")", false, async (c, p, m, e) => {
			// make sure we have a message
			if (!m)
			{
				e("Nested command needs a Message");
				return null;
			}
			// push the context onto the context stack
			let o = "";
			m.context.push(new Context(d => o += (d.content ?? d ?? "")));
			await p.exec(m, c);
			m.context.pop();
			// return the text output of the command
			return o;
		})
	];
	/*
	commands: Map<String, Object>: { "<primary alias>": <Object with call() method>... }
		function(message, args);
			message: Discord.Message - The message object that called the command
			args   : Array<String>   - The arguments given to the command
			    [0]: The primary alias that was called
	aliases : Map<String, String>: { "<alias>" : "<substitution>"... }
	*/
	constructor(commands, aliases)
	{
		this.commands = commands;
		this.aliases  = aliases;
	}
	
	// evaluates an incoming message
	/* Return value elements:
		 0: Success, command was called
		 1: Internal unhandled error in command
		-1: Fail, unknown command
	*/
	async /*Array<Number>*/ onMessage(/*Discord.Message*/ message)
	{
		// check prefix and ignore bots
		if (
			   message.channel.type != "DM"
			&& !message.content.startsWith(cfg.prefix)
			|| message.author.bot
		) return [];
		let cmdstr = message.content;
		if (cmdstr.startsWith(cfg.prefix)) cmdstr = cmdstr.substr(cfg.prefix.length);
		message.context = [null];
		return await this.exec(message, cmdstr);
	}

	async /*Array<Number>*/ exec(/*Discord.Message*/ message, /*String*/ cmdstr)
	{ return await this.callCmds(message, await this.parse(message, cmdstr)); }

	async /*Array<Number>*/ callCmds(/*Discord.Message*/ message, /*Array<Array<String>>*/ cmds)
	{
		let r = [];
		for (let args of cmds)
		{
			// undefined command
			if (!this.commands.get(args[0]))
			{
				message.channel.send(utils.ferr(args[0], "Unknown command.")).catch(
					console.error
				);
				r.push(-1);
				continue;
			}
			// try calling the command, if it fails say so without dying
			try { r.push(await this.commands.get(args[0]).call(message, args)); }
			catch (e)
			{
				message.client.errorProcedure(e, message);
				message.channel.send(utils.ferr(
					args[0],
					  `Internal \`${e.name}\`:\nContact my owner or make an `
					+ `issue if one doesn't already cover this: <${cfg.issues}>`
				)).catch(console.error);
				r.push(-2);
				continue;
			}
		}
		return r;
	}

	// evaluates backlash escapes of a string and returns the result, with sequences substituted
	static /*String*/ evalbses(/*String*/ str)
	{
		for (let i = str.indexOf('\\'); ++i; i = str.indexOf('\\', i))
		{
			let rep = `\\${str[i]}`;
			let nc;
			switch (str[i])
			{
			case 't': nc = '\t'; break;
			case 'n': nc = '\n'; break;
			case 'b'/*backspace*/:
				// take the character before this as well
				if (str[i - 2]) rep = str[i - 2] + rep;
				nc = ""; break;
			case 'x'/*single byte hexadecimal char code*/:
				nc = str.substr(i + 1).match(/.{1,2}/);
				if (nc) rep += nc[0];
				nc = String.fromCodePoint(`0x${nc ? nc[0] : '0'}`);
				break;
			case 'u'/*hexadecimal until ;*/:
				nc = str.substr(i + 1).match(/(.*)[;]/);
				if (nc) { rep += nc[0]; nc = nc[1]; }
				else nc = "0";
				nc = String.fromCodePoint(`0x${nc}`);
				break;
			default: continue;
			}
			i  -= rep.length - nc.length;
			str = str.replace(rep, nc);
		}
		return str;
	}

	// de-alias cmdname to its command object
	async /*Array<arg0, ?BaseCmd>*/ deAliasCmd(/*Discord.Message*/ message, /*String*/ cmdname)
	{
		let [[arg0]] = await this.parse(message, cmdname);
		return [arg0, this.commands.get(arg0)];
	}

	// describe an error
	static /*String*/ ferr(error, cmdstr, i)
	{ return error + "\n```\n" + cmdstr + "\n" + " ".repeat(i) + "^\n```"; }

	// parses the message into an array of arg arrays, each command denoted by the 0th arg
	async /*Array<Array<String>>*/ parse(
		/*Discord.Message*/ message,
		/*String*/ cmdstr,
		/*function(String error)*/ error_func
	)
	{
		error_func ??= message ?
			(err => message.channel.send(utils.ferr("parse", err))) :
			console.error;

		let cmds   = [];
		let args   = [""];
		let fin0   = false; // finished the first arg?
		let torpc  = "";    // the original string of arg TO RePlaCe when substituting
		let argi   = 0;     // index of this argument
		let flip   = true;  // true if we just started an argument
		let first  = true;  // true if we just started parsing

		let i;
		let error = e => error_func(Parser.ferr(e, cmdstr, i));
		for (i = 0; i <= cmdstr.length; i++)
		{
			// substitute alias if one exists and start over once
			let cmd;
			if (
				   first
				&& (flip && argi || i >= cmdstr.length || fin0)
				&& (cmd = this.aliases.get(args[0]))
			)
			{
				cmdstr = cmdstr.replace(torpc, cmd);
				args[argi = i = 0] = "";
				fin0 = first = false;
			}
			else if (fin0)
			{
				i--; // go back to semicolon so it moves to next command
				first = fin0 = false;
			}
			if (i >= cmdstr.length) break;
			if (flip)
			{
				first = first && !argi;
				torpc = "";
				flip = false;
			}

			// check for string
			let st = Parser.stringTypes.find(e => e.startsAt(cmdstr, i));
			if (st)
			{
				let r = st.getstring(cmdstr, i);
				if (r.end == -1 && !st.greedy)
				{
					error(`${st} missing closing delimiter`);
					return [];
				}
				if (r.end == -1) r.end += cmdstr.length;
				let s = await st.reduce(r.content, this, message, error);
				// bail on error
				if (s == null) return [];
				// append to argument and continue
				args[argi] += s;
				torpc += cmdstr.substr(i, r.end - i + 1);
				i = r.end;
				continue;
			}
			// no string found, evaluate character
			let c = cmdstr[i];
			torpc += c;
			switch (c)
			{
					// next arg on whitespace which is outside of quotes
				case ' ' :
				case '\t':
				case '\n':
					// unadd this character
					torpc = torpc.substr(0, torpc.length - 1);
					// ignore sequential whitespaces
					if (!torpc.length) break;
					if (i != 0) args[++argi] = "";
					flip = true;
					break;
				case '\\':
					// don't read next char if it's not there
					if (i + 1 >= cmdstr.length)
					{
						flip = true;
						argi++;
						break;
					}
					args[argi] += cmdstr[++i];
					torpc      += cmdstr[i];
					break;
				case ';':
					torpc = torpc.substr(0, torpc.length - 1);
					if (first)
					{
						fin0 = true;
						break;
					}
					cmdstr = cmdstr.substr(i + 1);
					if (torpc == "") args.pop();
					if (args.length && args[0] != "") cmds.push(args);
					args = [""];
					torpc = "";
					argi = 0;
					i = -1;
					flip = first = true;
					break;
				default:
					args[argi] += c;
					break;
			}
		}
		if (args[0] != "") cmds.push(args);
		return cmds;
	}
}

module.exports = Parser;
