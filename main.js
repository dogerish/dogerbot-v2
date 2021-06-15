/* modules */
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds    = require("./config/cmds.json");

/* instances */
const client = new Discord.Client();

let commands = {};
let aliases  = {};
// load the commands
let tmp;
for (let cmd of cmds)
{
	tmp = require("./cmds/" + cmd.file);
	// exceptions to constructor args
	if (cmd.ctorArgs instanceof Array)
		commands[cmd.orig] = new tmp(...cmd.ctorArgs);
	else
		switch (cmd.ctorArgs)
		{
		default:
			console.error(
				`Method for constructing ${cmd.orig} unknown (${cmd.ctorArgs}).
				Not constructed.`
			);
			continue;
		}
	Object.assign(aliases, cmd.aliases);
}

/* instances */
const parser = new Parser(commands, aliases);

client.on("message", msg => parser.onMessage(msg));
client.on("ready", ()  => console.log(`${client.user.username} online.`));
client.login(cfg.token);
