const SauerTrackerCmd = require("../cmd-types/sauertrackercmd.js");

class TemplateCmd extends SauerTrackerCmd
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
