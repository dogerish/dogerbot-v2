const   STCmd   = require("../cmd-types/stcmd.js");
const { ferr  } = require("../utils/utils.js");
const { STPlayer, utils: { requests: { HOST } } } = require("sauertracker");

class PlayerCmd extends STCmd
{
	// generate an EmbedField for a stat
	static /*EmbedField*/ statfield(/*STStats*/ stats, /*String*/ name)
	{
		return {
			name: name,
			value:
				  `Frags: ${stats.frags}\n`
				+ `Flags: ${stats.flags}\n`
				+ `Deaths: ${stats.deaths}\n`
				+ `Teamkills: ${stats.tks}\n`
				+ `K/D: ${stats.kpd}\n`
				+ `Accuracy: ${stats.acc}%`,
			inline: true
		}
	}

	// 0 on success
	async /*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (!args[1])
		{
			msg.channel.send(ferr(args[0], "No name specified."));
			return 1;
		}
		msg.react('🤔').catch(e => msg.channel.send('🤔')); // :thinking:

		let player = new STPlayer(args[1]);
		try { await player.fetch(); }
		catch (e)
		{
			msg.channel.send(ferr(args[0], e.message));
			return 1;
		}

		let duels = player.duels;
		msg.channel.send({ embed:
		{
			title: player.name,
			url: `${HOST}/player/${encodeURIComponent(player.name)}`,
			thumbnail: { url: player.country.flag },
			fields:
			[
				{
					name: "Rank",
					value:
						  `Rank: #${player.rank}\n`
						+ `elo: ${player.elo}\n`
						+ `Games: ${player.totalGames}`,
					inline: true
				},
				{
					name: "Duels",
					value:
						  `Wins: ${duels.wins} (${duels.winRate()}%)\n`
						+ `Losses: ${duels.losses} (${duels.lossRate()}%)\n`
						+ `Ties: ${duels.ties} (${duels.tieRate()}%)\n`
						+ `Total: ${duels.count}`,
					inline: true
				},
				{
					name: "General Information",
					value:
						  (player.clan ? `Clan: ${player.clan.tag}\n` : "")
						+ `Country: ${player.country.name || "Unknown"}\n`
						+ `Status: ${player.online ? "On" : "Off"}line\n`
						+ (player.latestGames.length ? `Last game on:\n${
							player.latestGames[0].date.toUTCString()
						   }` : ""),
					inline: true
				},
				PlayerCmd.statfield(player.stats.insta, "Instagib Stats"),
				PlayerCmd.statfield(player.stats.effic, "Efficiency Stats"),
				PlayerCmd.statfield(player.stats.total, "Total Stats")
			]
		}
		});
		return 0;
	}
}

module.exports = PlayerCmd;
