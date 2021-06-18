/* modules */
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds    = require("./config/cmds.json");

/* instances */
const client = new Discord.Client();
const parser = new Parser({}, {});

let commands = {};
let aliases  = {};
// load the commands
for (let cmd of cmds)
{
	let tmp = require("./cmds/" + cmd.file);
	// exceptions to constructor args
	cmd.baseArgs = [cmd.orig, cmd.manpage];
	if (cmd.ctorArgs instanceof Array)
		commands[cmd.orig] = new tmp(cmd.baseArgs, ...cmd.ctorArgs);
	else
		switch (cmd.ctorArgs)
		{
		case "CUSTOM_SET":
			commands[cmd.orig] = new tmp(cmd.baseArgs, parser, ...cmd.ARGS);
			break;
		default:
			console.error(
				`Method for constructing ${cmd.orig} unknown (${cmd.ctorArgs}).
				Not constructed.`
			);
			continue;
		}
	Object.assign(aliases, cmd.aliases);
}
parser.commands = commands;
parser.aliases  = aliases;

client.on("message", msg => parser.onMessage(msg));
client.on("ready", ()  => console.log(`${client.user.username} online.`));
client.login(cfg.token);
