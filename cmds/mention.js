const BaseCmd = require("../cmd-types/basecmd.js");
const utils   = require("../utils/utils.js");

class MentionCmd extends BaseCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		this.output(
			msg,
			`<@${msg.author.id}>` + utils.cleanString(args.slice(1).join(' '), msg)
		);
		return 0;
	}
}

module.exports = MentionCmd;
