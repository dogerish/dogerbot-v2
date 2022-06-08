const   STCmd     = require("../cmd-types/stcmd.js");
const { STMatch } = require("sauertracker");

class MatchupCmd extends STCmd
{
	// 0 on success
	async /*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (args.length < 3)
		{
			this.error(msg, "You must give two or more players.");
			return 1;
		}
		let emoji = "<a:spinking:865774704974888980>"; // spinning thinking :spinking:
		msg.react(emoji).catch(() => this.output(msg, emoji));
		let match = await new STMatch(...args.slice(1)).teamsplit();
		// send embed with good and evil teams as inline fields
		this.output(msg, { embeds: [{ fields:
		[
			{ name: "good", value: match.good.join('\n'), inline: true },
			{ name: "evil", value: match.evil.join('\n'), inline: true }
		]
		}]});
		return 0;
	}
}

module.exports = MatchupCmd;
