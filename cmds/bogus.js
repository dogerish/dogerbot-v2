const PermCmd = require("../cmd-types/permcmd.js");

class BogusCmd extends PermCmd
{
	call(msg, args)
	{
		if (super.call(msg, args)) return 1;
		msg.channel.send("Bogus");
		return 0;
	}
}

module.exports = BogusCmd;
