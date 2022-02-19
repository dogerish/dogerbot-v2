const BaseCmd = require("../cmd-types/basecmd.js");

class UptimeCmd extends BaseCmd
{
	constructor(baseArgs) { super(...baseArgs); }

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let ut = msg.client.uptime, n = 1000;
		let s = Math.round((ut /= n) % (n = 60)),
		    m = Math.floor((ut /= n) %  n      ),
		    h = Math.floor((ut /= n) % (n = 24)),
		    d = Math.floor( ut /= n            );
		this.output(
			msg,
			  `Up for ${d}d ${h}h ${m}m ${s}s.`
			+ ` Online since ${new Date(Date.now() - msg.client.uptime)}.`
			+ ` Total milliseconds *(imprecise)*: ${msg.client.uptime}.`
		);
		return 0;
	}
}

module.exports = UptimeCmd;
