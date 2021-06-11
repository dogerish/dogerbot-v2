/* modules */
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds    = require("./config/cmds.json");

let commands = {};
let aliases  = {};
// load the commands
let tmp;
for (let cmd of cmds)
{
	tmp = require("./" + cmd.file);
	commands[cmd.orig] = new tmp(...cmd.ctorArgs);
	Object.assign(aliases, cmd.aliases);
}

/* instances */
const client = new Discord.Client();
const parser = new Parser(commands, aliases);

client.on("message", msg => parser.onMessage(msg));
client.on("ready", ()  => console.log(`${client.user.username} online.`));
client.login(cfg.token);
