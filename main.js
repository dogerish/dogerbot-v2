/* modules */
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds       = require("./config/cmds.json");

const botCmds    = [ /*BaseCmd...*/ ];
let commands     = {};
let aliases      = {};
// load the commands
let tmp;
for (let cmd of cmds)
{
	tmp = require("./" + cmd.file);
	tmp = botCmds.push(new tmp(...cmd.ctorArgs)) - 1;
	commands[cmd.orig] = botCmds[tmp].call;
	Object.assign(aliases, cmd.aliases);
}

/* instances */
const client  = new Discord.Client();
const parser = new Parser(commands, aliases);

client.on("message", msg =>
{
	console.log(`Recieved message: ${msg}`);
	parser.parse(msg);
});
client.on("ready", ()  => console.log(`${client.user.username} online.`));
client.login(cfg.token);
