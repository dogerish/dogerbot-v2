const BaseCmd = require("../cmd-types/basecmd.js");

class DickRollCmd extends BaseCmd
{
	constructor(baseArgs) { super(...baseArgs); }

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		// send rick roll, you're welcome Avior
		this.output(msg, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
		return 0;
	}
}

module.exports = DickRollCmd;
