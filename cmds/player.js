const   SauerTrackerCmd     = require("../cmd-types/sauertrackercmd.js");
const { ferr, percent     } = require("../utils/utils.js");
const { request           } = require("http");

class PlayerCmd extends SauerTrackerCmd
{
	// generate an EmbedField for a stat
	static /*EmbedField*/ statfield(/*Object*/ data, /*String*/ name, /*String*/ stat)
	{
		let i = stat ? data[stat] : data;
		return {
			name: name,
			value:
				  `Frags: ${i.frags}\n`
				+ `Flags: ${i.flags}\n`
				+ `Deaths: ${i.deaths}\n`
				+ `Teamkills: ${i.tks}\n`
				+ `K/D: ${i.kpd}\n`
				+ `Accuracy: ${i.acc}%`,
			inline: true
		}
	}
	onresponse(/*Discord.Message*/ msg, /*Object*/ data)
	{
		let { duelWins: DW, duelLosses: DL, duelTies: DT, duelCount: DC } = data;
		let embed =
		{
			title: data.name,
			url: `${this.url}/player/${encodeURIComponent(data.name)}`,
			thumbnail: { url: `${this.url}/images/flags/${data.country}.png` },
			fields:
			[
				{
					name: "Rank",
					value:
						  `Rank: #${data.rank}\n`
						+ `ELO: ${data.elo}\n`
						+ `Games: ${data.totalGames}\n`,
					inline: true
				},
				{
					name: "Duels",
					value:
						  `Wins: ${DW} (${percent(DW, DC)}%)\n`
						+ `Losses: ${DL} (${percent(DL, DC)}%)\n`
						+ `Ties: ${DT} (${percent(DT, DC)}%)\n`
						+ `Total: ${DC}`,
					inline: true
				},
				{
					name: "General Information",
					value:
						  (data.clan ? `Clan: ${data.clan}\n` : "")
						+ `Country: ${data.countryName || "Unknown"}\n`
						+ `Status: ${data.online ? "On" : "Off"}line\n`
						+ (data.latestGames.length ? `Date of last game:\n${
							new Date(data.latestGames[0].time)
								.toUTCString()
						}` : ""),
					inline: true
				},
				PlayerCmd.statfield(data, "Insta Stats", "instaStats"),
				PlayerCmd.statfield(data, "Effic Stats", "efficStats"),
				PlayerCmd.statfield(data, "Total Stats")
			]
		};
		msg.channel.send({ embed: embed });
	}
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (!args[1])
		{
			msg.channel.send(ferr(args[0], "No name specified."));
			return 1;
		}
		msg.react('🤔').catch(e => msg.channel.send('🤔')); // :thinking:
		let req =
		request(`http://${this.host}/api/v2/player/${encodeURIComponent(args[1])}`, res =>
		{
			let data = "";
			res.on("data", chunk => data += chunk);
			res.on("end", () =>
			{
				if (res.statusCode != 200) msg.channel.send(ferr(
					args[0],
					  `${res.statusCode}: ${res.statusMessage}`
					+ ` (\`${res.req.path}\`, recieved name: \`${args[1]}\`)`
				));
				else this.onresponse(msg, JSON.parse(data));
			});
		});
		req.on("error", e =>
		{
			console.error(e);
			msg.channel.send(ferr(args[0], "Failed to get from SauerTracker."));
		});
		req.end();
		return 0;
	}
}

module.exports = PlayerCmd;
