const cfg   = require("./config/cfg.json");
const utils = require("./utils/utils.js");

class Parser
{
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
		let r = [];
		// check prefix and ignore bots
		if (
			   message.channel.type != "dm"
			&& !message.content.startsWith(cfg.prefix)
			|| message.author.bot
		) return r;
		let cmdstr = message.content;
		if (cmdstr.startsWith(cfg.prefix)) cmdstr = cmdstr.substr(cfg.prefix.length);
		let cmds = this.parse(cmdstr);
		for (let args of cmds)
		{
			// undefined command
			if (!this.commands.get(args[0]))
			{
				message.channel.send(utils.ferr(args[0], "Unknown command."));
				r.push(-1);
				continue;
			}
			// try calling the command, if it fails say so without dying
			try { await this.commands.get(args[0]).call(message, args); }
			catch (e)
			{
				console.error(e);
				message.channel.send(utils.ferr(
					args[0],
					  `Internal \`${e.name}\`:\n`
					+ `\`\`\`\n${e.message}\n\`\`\`\n`
					+ `<@${cfg.rootusers[0]}> needs to fix this - make an issue`
					+ " if one doesn't already cover this: "
					+ "<https://github.com/dogerish/dogerbot-v2/issues>"
				));
				r.push(1);
				continue;
			}
			r.push(0);
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
	/*Array<arg0, ?BaseCmd>*/ deAliasCmd(/*String*/ cmdname)
	{
		let arg0 = this.parse(cmdname)[0][0];
		return [arg0, this.commands.get(arg0)];
	}

	// parses the message into an array of arg arrays, each command denoted by the 0th arg
	/*Array<Array<String>>*/ parse(/*String*/ cmdstr)
	{
		let cmds   = [];
		let args   = [""];
		let fin0   = false; // finished the first arg?
		let torpc  = "";    // the original string of arg TO RePlaCe when substituting
		let argi   = 0;     // index of this argument
		let flip   = true;  // true if we just started an argument
		let first  = true;  // true if we just started parsing
		let dolstr = false; // true if in a dollar string ($'')
		for (let i = 0; i <= cmdstr.length; i++)
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
			case '$':
				if (cmdstr[i + 1] === "'") dolstr = true;
				else args[argi] += c;
				break;
			case '"':
			case "'":
				let ss = cmdstr.substr(i + 1);
				// str til next unescaped quote
				let tmp = ss.match(new RegExp(`(.*?)(?<!\\\\)${c}`));
				// search failed, take until end of message
				if (!tmp) tmp = [ss, ss];
				// turn all escaped quotes into normal quotes
				tmp[1] = tmp[1].replace(
					new RegExp(`\\\\${c}`, 'g'),
					c
				);
				torpc += tmp[0];
				i     += tmp[0].length;
				// evaluate bses in a dollar string ($'')
				tmp = dolstr ? Parser.evalbses(tmp[1]) : tmp[1];
				args[argi] += tmp;
				dolstr = false; // reset
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
