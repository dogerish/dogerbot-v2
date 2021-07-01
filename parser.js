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
	/* Return value:
		 0: Success, command was called
		 1: OK, message was ignored.
		-1: Fail, unknown command
	*/
	/*Number*/ onMessage(/*Discord.Message*/ message)
	{
		// check prefix and ignore bots
		if (!message.content.startsWith(cfg.prefix) || message.author.bot) return 1;
		let args = this.parse(message.content.substr(cfg.prefix.length));
		// undefined command
		if (!this.commands.get(args[0]))
		{
			message.channel.send(utils.ferr(args[0], "Unknown command."));
			return -1;
		}
		this.commands.get(args[0]).call(message, args);
		return 0;
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
		let arg0 = this.parse(cmdname)[0];
		return [arg0, this.commands.get(arg0)];
	}

	// parses the message and calls the command, returns the args from arg0 on
	/*Array<String>*/ parse(/*String*/ cmdstr)
	{
		let args   = [""];
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
				&& (flip && argi || i >= cmdstr.length)
				&& (cmd = this.aliases.get(args[0]))
			)
			{
				cmdstr = cmdstr.replace(torpc, cmd);
				args[argi = i = 0] = "";
				first = false;
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
				args[++argi] = "";
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
			default:
				args[argi] += c;
				break;
			}
		}
		return args;
	}
}

module.exports = Parser;
