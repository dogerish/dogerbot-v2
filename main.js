/* modules */
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds    = require("./config/cmds.json");

let commands = new Map();
let aliases  = new Map();
/* instances */
const client = new Discord.Client();
const parser = new Parser(commands, aliases);

// load the commands
for (let cmd of cmds)
{
	let tmp      = require("./cmds/" + cmd.file);
	cmd.baseArgs = [cmd.orig, cmd.manpage];
	let addcmd   = (...args) => commands.set(cmd.orig, new tmp(cmd.baseArgs, ...args));
	if (cmd.ctorArgs instanceof Array) addcmd(...cmd.ctorArgs);
	// exceptions to constructor args
	else
		switch (cmd.ctorArgs)
		{
		case "CUSTOM_SET": addcmd(parser, ...cmd.ARGS); break;
		default:
			console.error(
				  `Method for constructing ${cmd.orig} unknown (${cmd.ctorArgs}).`
				+ ` Not constructed.`
			);
			continue;
		}
	for (let kv of Object.entries(cmd.aliases)) aliases.set(...kv);
}

client.on("message", msg => parser.onMessage(msg));
client.on("ready", ()  =>
{
	console.log(`${client.user.username} online.`);
	client.user.setPresence(cfg.dftPres || {});
});
client.login(cfg.token);
