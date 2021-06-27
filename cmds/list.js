const BaseCmd = require("../cmd-types/basecmd.js");

class ListCmd extends BaseCmd
{
	constructor(baseArgs, /*Parser*/ parser)
	{
		super(...baseArgs);
		this.parser = parser;
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		msg.channel.send(
			  "Available commands: `"
			+ Array.from(this.parser.commands.keys()).join("`, `")
			+ '`'
		);
		return 0;
	}
}

module.exports = ListCmd;
