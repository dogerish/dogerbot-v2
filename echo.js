// echo command
const BaseCmd = require("./basecmd.js");

class EchoCmd extends BaseCmd
{
	call(/*Discord.Message*/ msg, /*String...*/ arg0, ...args)
	{ msg.channel.send(args.join(' ') || "** **"); }
}

module.exports = EchoCmd;
