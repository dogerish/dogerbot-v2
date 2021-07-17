const   STCmd     = require("../cmd-types/stcmd.js");
const { STMatch } = require("sauertracker");
const { ferr    } = require("../utils/utils.js");

class MatchupCmd extends STCmd
{
	constructor(baseArgs) { super(baseArgs); }

	// 0 on success
	async /*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (args.length < 3)
		{
			msg.channel.send(ferr(args[0], "You must give two or more players."));
			return 1;
		}
		let emoji = "<a:spinking:865774704974888980>"; // spinning thinking :spinking:
		msg.react(emoji).catch(() => msg.channel.send(emoji));
		let match = await new STMatch(...args.slice(1)).teamsplit();
		// send embed with good and evil teams as inline fields
		msg.channel.send({ embed: { fields:
		[
			{ name: "good", value: match.good.join('\n'), inline: true },
			{ name: "evil", value: match.evil.join('\n'), inline: true }
		]
		}});
		return 0;
	}
}

module.exports = MatchupCmd;
