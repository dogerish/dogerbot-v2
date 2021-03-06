const BaseCmd = require("./basecmd.js");
const utils   = require("../utils/utils.js");

// only works in guilds/servers
class GuildCmd extends BaseCmd
{
	// returns 0 on pass
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (!["DM", "UNKNOWN"].includes(msg.channel.type)) return 0;
		this.error(msg, "This command needs to be used in a server.");
		return 1;
	}
}

module.exports = GuildCmd;
