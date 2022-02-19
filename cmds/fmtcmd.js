const BaseCmd = require("../cmd-types/basecmd.js");
const utils   = require("../utils/utils.js");

// formats a random response, replaces the first {} in a response selection
class FmtCmd extends BaseCmd
{
	constructor(baseArgs, /*String...*/ ...responses)
	{
		super(...baseArgs);
		this.responses = responses;
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		this.output(msg,
			this.responses.random().replace("{}", 
				utils.cleanString(args.slice(1).join(' '), msg)
			)
		);
		return 0;
	}
}

module.exports = FmtCmd;
