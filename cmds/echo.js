const BaseCmd = require("../cmd-types/basecmd.js");
const GetOpt  = require("../utils/getopt.js");
const utils   = require("../utils/utils.js");

// echo command
class EchoCmd extends BaseCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array(String)*/ args)
	{
		if (super.call(msg, args)) return 1;
		// get delimiter, default is a space
		let delim = ' ';
		const go = new GetOpt("d:delim:", args);
		while (go.next())
		{
			if (go.opterr)
			{
				msg.channel.send(utils.ferr(args[0], go.opterr));
				return 1;
			}
			delim = go.optarg;
		}
		msg.channel.send(
			utils.cleanString(
				args.slice(go.optind).join(delim) || "** **",
				msg
			)
		);
		return 0;
	}
}

module.exports = EchoCmd;
