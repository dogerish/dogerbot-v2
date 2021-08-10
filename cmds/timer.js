const BaseCmd  = require("../cmd-types/basecmd.js");
const { ferr } = require("../utils/utils.js");

class TemplateCmd extends BaseCmd
{
	constructor(baseArgs) { super(...baseArgs); }

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (args.length < 2)
		{
			msg.channel.send(ferr(args[0], "Missing duration argument."));
			return 1;
		}
		// conversion to ms from seconds, minutes, and hours
		let msFactors = [1000, 60000, 3600000];
		// number of ms to wait
		// specified as hours:minutes:seconds
		let duration = args[1].split(':').reverse().slice(0, 3).reduce(
			(a, v, i) => a + Number(v) * msFactors[i],
			0
		);
		setTimeout(() => msg.reply("time's up"), duration);
		msg.react('⏰'); // :alarm_clock:
		return 0;
	}
}

module.exports = TemplateCmd;
