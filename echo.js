const BaseCmd = require("./basecmd.js");
const GetOpt  = require("./getopt.js");
const utils   = require("./utils.js");

// echo command
class EchoCmd extends BaseCmd
{
	call(/*Discord.Message*/ msg, /*String...*/ ...args)
	{
		// get delimiter, default is a space
		let delim = ' ';
		const go = new GetOpt("d:delim:", args);
		while (go.next())
		{
			if (go.opterr) return msg.channel.send(utils.ferr(args[0], go.opterr));
			delim = go.optarg;
		}
		msg.channel.send(args.slice(go.optind).join(delim) || "** **");
	}
}

module.exports = EchoCmd;
