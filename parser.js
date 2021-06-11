const cfg   = require("./config/cfg.json");
const utils = require("./utils/utils.js");

class Parser
{
	/*
	commands: { "<primary alias>": <function to call>... }
		function(message, arg0, arg1, arg2...);
			message: Discord.Message
			arg0   : The alias which called this
			arg1...: The arguments given to the command
	aliases : { "<alias>" : "<substitution>"... }
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
		if (!this.commands[args[0]])
		{
			message.channel.send(utils.ferr(args[0], "Unknown command."));
			return -1;
		}
		this.commands[args[0]].call(message, ...args);
		return 0;
	}
	
	// parses the message and calls the command, returns the args from arg0 on
	/*Array(String)*/ parse(/*String*/ cmdstr)
	{
		let args   = [""];
		let torpc  = "";   // the original string of arg TO RePlaCe when substituting
		let argi   = 0;    // index of this argument
		let flip   = true; // true if we just started an argument
		let first  = true; // true if we just started parsing
		for (let i = 0; i <= cmdstr.length; i++)
		{
			// substitute alias if one exists and start over once
			let cmd;
			if (
				   first
				&& (flip && argi || i >= cmdstr.length)
				&& (cmd = this.aliases[args[0]])
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
			case '"':
			case "'":
				// copy until next quote
				for (i++; cmdstr[i] != c && i < cmdstr.length; i++)
				{
					torpc += cmdstr[i];
					// increment i if the next character is escped
					// backlashes ignored in single-quote strings
					if (c != "'" && cmdstr[i] == '\\')
					{
						i++;
						if (i >= cmdstr.length) break;
						torpc += cmdstr[i];
					}
					args[argi] += cmdstr[i];
				}
				if (i < cmdstr.length) torpc += cmdstr[i];
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
