const cfg = require("./config/cfg.json");
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
	
	// parses the message and calls the command
	// returns -1 when the command is undefined
	parse(/*Discord.Message*/ message)
	{
		// trim off the prefix
		let msg    = message.content.substr(cfg.prefix.length);
		let args   = [""];
		let torpc  = "";   // the original string of arg TO RePlaCe when substituting
		let argi   = 0;    // index of this argument
		let flip   = true; // true if we just started an argument
		for (let i = 0; i <= msg.length; i++)
		{
			// substitute alias if one exists and start over
			let cmd;
			if ((flip && argi == 1 || i == msg.length) && (cmd = this.aliases[args[0]]))
			{
				msg = msg.replace(torpc, cmd);
				args[argi = i = 0] = "";
			}
			if (i >= msg.length) break;
			if (flip) torpc = "";
			flip = false;

			let c = msg[i];
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
				if (!args[argi].length) break;
				args[++argi] = "";
				flip = true;
				break;
			case '"':
			case "'":
				// copy until next quote
				for (i++; msg[i] != c && i < msg.length; i++)
				{
					torpc += msg[i];
					// increment i if the next character is escped
					// backlashes ignored in single-quote strings
					if (c != "'" && msg[i] == '\\')
					{
						i++;
						if (i >= msg.length) break;
						torpc += msg[i];
					}
					args[argi] += msg[i];
				}
				if (i < msg.length) torpc += msg[i];
				break;
			case '\\':
				// don't read next char if it's not there
				if (i + 1 >= msg.length)
				{
					flip = true;
					argi++;
					break;
				}
				args[argi] += msg[++i];
				torpc += msg[i];
				break;
			default:
				args[argi] += c;
				break;
			}
		}
		if (!this.commands[args[0]]) return -1;
		if (!args[args.length - 1]) args.pop();
		this.commands[args[0]].call(message, ...args);
		return 0;
	}
}

module.exports = Parser;
