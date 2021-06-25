const RootCmd = require("../cmd-types/rootcmd.js");
const GetOpt  = require("../utils/getopt.js");
const utils   = require("../utils/utils.js");
const cfg     = require("../config/cfg.json");

class PresenceCmd extends RootCmd
{
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let go = new GetOpt("s:status:t:type:u:url:", args);
		let status, type = "PLAYING", url;
		while (go.next())
		{
			if (go.opterr)
			{
				msg.channel.send(utils.ferr(args[0], go.opterr));
				return 1;
			}
			switch (go.opt)
			{
			case 's': case "status": status = go.optarg; break;
			case 't': case "type"  : type   = go.optarg; break;
			case 'u': case "url"   : url    = go.optarg; break;
			}
		}

		let toSet = (args.length > 1)
			? {
				status  : status,
				activity:
				{
					name: args.slice(go.optind).join(' '),
					type: type,
					url: url
				}
			}
			: cfg.dftPres || {};
		msg.client.user.setPresence(toSet).then(pres => msg.channel.send("Status set."));
		return 0;
	}
}

module.exports = PresenceCmd;
