const RootCmd = require("../cmd-types/rootcmd.js");
const cfg     = require("../config/cfg.json");

class QuitCmd extends RootCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		msg.channel.send("Going offline.").then(() => msg.client.destroy());
		return 0;
	}
}

module.exports = QuitCmd;
