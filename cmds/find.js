const   STCmd      = require("../cmd-types/stcmd.js");
const { ferr     } = require("../utils/utils.js");
const { STPlayer } = require("sauertracker");

class FindCmd extends STCmd
{
	// 0 on success
	async /*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let players;
		try { players = await STPlayer.find(...args.slice(1)); }
		catch (e)
		{
			msg.channel.send(e.message);
			return 1;
		}
		msg.channel.send({ embed:
		{
			title:
				`Top results for ${
					args[1] ? `\`${args[1]}\`` : "all players"
				} in ${
					args[2] ? `\`${args[2]}\`` : "any country"
				}`,
			description: players.slice(0, 10).reduce(
				(acc, p) =>
					  `${acc}\`${p.name}\` `
					+ `(${p.stats.total.frags} frags, ${p.country.name})\n`,
				""
			)
		}
		});
		return 0;
	}
}

module.exports = FindCmd;
