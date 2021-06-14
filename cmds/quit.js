const RootCmd = require("../cmd-types/rootcmd.js");
const cfg     = require("../config/cfg.json");

class QuitCmd extends RootCmd
{
	constructor(/*Discord.Client*/ client)
	{
		super();
		this.client = client;
	}
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		msg.channel.send("Going offline.").then(() => this.client.destroy());
		return 0;
	}
}

module.exports = QuitCmd;
