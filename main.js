#! /usr/local/bin/node

/* modules */
const util    = require("util");
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds    = require("./config/cmds.json");

/* instances */
const client = new Discord.Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES"
	],
	partials: ["CHANNEL"]
});
const parser = new Parser(new Map(), new Map());

// load the commands
for (const cmd of cmds)
{
	let CmdClass = require("./cmds/" + cmd.file);
	let baseArgs = [client, parser, cmd];
	parser.commands.set(cmd.orig, new CmdClass(baseArgs, ...cmd.ctorArgs));
}

let authority = cfg.rootusers[0];
function onError(error, message)
{
	if (message)
		error.stack += `\n    at ${util.inspect(message.content)}\n    at ${message.url}`;
	console.error(error);
	authority?.send("```\n" + error.stack + "\n```").catch(e => null);
}
client.errorProcedure = onError;
client.on("error", onError);
process.on("unhandledRejection", onError);
client.on("messageCreate", msg => parser.onMessage(msg).catch(e => onError(e, msg)));
client.on("ready", async ()  =>
{
	authority = await client.users.fetch(authority);
	console.log(`${client.user.username} online.`);
	client.user.setPresence(cfg.dftPres || {});
});
client.login(cfg.token);
