const BaseCmd = require("../cmd-types/basecmd.js");

// report time since message was sent to gotten
class PingCmd extends BaseCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array(String)*/ args)
	{
		if (super.call(msg, args)) return 1;
		msg.channel.send(Date.now() - msg.createdAt + "ms");
		return 0;
	}
}

module.exports = PingCmd;
