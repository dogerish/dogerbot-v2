const BaseCmd = require("../cmd-types/basecmd.js");
const GetOpt  = require("../utils/getopt.js");
const utils   = require("../utils/utils.js");
const Parser  = require("../parser.js");

// echo command
class EchoCmd extends BaseCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		// DELIMiter, Evaluate Backslash Escapes
		let delim = ' ', ebe = false;
		const go = new GetOpt("d:delim:e,ebe,", args);
		while (go.next())
		{
			if (go.opterr)
			{
				msg.channel.send(utils.ferr(args[0], go.opterr));
				return 1;
			}
			switch (go.opt)
			{
			case 'd': case "delim": delim = go.optarg; break;
			case 'e': case "ebe"  : ebe   = true;      break;
			}
		}
		let newargs = args.slice(go.optind);
		msg.channel.send(
			utils.cleanString(
				(ebe ? newargs.map(Parser.evalbses) : newargs)
					.join(delim)
					.trim()
				|| "** **",
				msg
			)
		);
		return 0;
	}
}

module.exports = EchoCmd;
