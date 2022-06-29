/* modules */
const util    = require("util");
const Discord = require("discord.js");
const Parser  = require("./parser.js");
/* config */
const cfg     = require("./config/cfg.json");
const cmds    = require("./config/cmds.json");

let commands = new Map();
let aliases  = new Map();
/* instances */
const client = new Discord.Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"DIRECT_MESSAGES"
	],
	partials: ["CHANNEL"]
});
const parser = new Parser(commands, aliases);

// load the commands
for (let cmd of cmds)
{
	let tmp      = require("./cmds/" + cmd.file);
	cmd.baseArgs = [client, parser, cmd.orig, cmd.manpage];
	commands.set(cmd.orig, new tmp(cmd.baseArgs, ...cmd.ctorArgs));
	for (let kv of Object.entries(cmd.aliases))
		aliases.set(...kv);
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
