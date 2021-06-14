const BaseCmd = require("./basecmd.js");
const utils   = require("../utils/utils.js");

// only works in guilds/servers
class GuildCmd extends BaseCmd
{
	// returns 0 on pass
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (!["dm", "unknown"].includes(msg.channel.type)) return 0;
		msg.channel.send(
			utils.ferr(
				args[0],
				"This command needs to be used in a server."
			)
		);
		return 1;
	}
}

module.exports = GuildCmd;
