const BaseCmd = require("../cmd-types/basecmd.js");

class TemplateCmd extends BaseCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		/* command body */
		return 0;
	}
}

module.exports = TemplateCmd;
