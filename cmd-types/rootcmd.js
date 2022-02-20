const BaseCmd = require("./basecmd.js");
const utils   = require("../utils/utils.js");
const cfg     = require("../config/cfg.json");

// only accessible to root users
class RootCmd extends BaseCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (cfg.rootusers.includes(msg.author.id)) return 0;
		msg.channel.send(utils.ferr(args[0], "This is only accesible to root users."));
		return 1;
	}
}

module.exports = RootCmd;
