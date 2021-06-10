const Discord = require("discord.js");
const cfg     = require("./config/cfg.json");

const client  = new Discord.Client();
const Parser  = new require("./parser.js");

function echo(msg, arg0, arg1, arg2) { msg.reply(`${arg0} ${arg1} ${arg2}`); }
const parser = new Parser(
	{ "echo": echo },
	{
		"asdf": "echo",
		"adsf yeetus!": "echo asdf yeeeeeeet",
		"asdfa": "echo lol"
	}
);
client.on("message", msg =>
{
	console.log(`Recieved message: ${msg}`);
	console.log(parser.parse(msg));
});
client.on("ready",   ()  => console.log(`${client.user.username} online.`));
client.login(cfg.token);
