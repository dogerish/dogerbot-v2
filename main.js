const Discord = require("discord.js");
const cfg     = require("./config/cfg.json");

const client = new Discord.Client();
client.on("message", msg => console.log(`Recieved message: ${msg}`));
client.on("ready",   ()  => console.log(`${client.user.username} online.`));
client.login(cfg.token);
