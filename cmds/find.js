const   SauerTrackerCmd   = require("../cmd-types/sauertrackercmd.js");
const { request         } = require("http");
const { ferr            } = require("../utils/utils.js");

class FindCmd extends SauerTrackerCmd
{
	onresponse(/*Discord.Message*/ msg, /*Array<String>*/ args, /*Object*/ data)
	{
		let embed = {
			title: `Top results for \`${args[1]}\`${
				args[2] ? `in \`${args[2]}\`` : ""
			}`,
			url: `https://${this.host}/players/find?name=${
				encodeURIComponent(args[1])
			}${
				args[2] ? `&country=${encodeURIComponent(args[2])}` : ""
			}`,
			// `playername` (frags, country) for top 10
			description: data.slice(0, 10).reduce(
				(acc, p, i) =>
					  acc
					+ `\`${p.name}\` `
					+ `(${p.frags} frags, ${p.countryName || "Unknown"})\n`,
				""
			)
		}
		msg.channel.send({ embed: embed });
	}
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		args[1] = args[1] || "";
		let req = request(
			`http://${this.host}/api/v2/players/find?name=${
				encodeURIComponent(args[1])
			}${
				args[2] ? `&country=${encodeURIComponent(args[2])}` : ""
			}`,
			res =>
			{
				let data = "";
				res.on("data", chunk => data += chunk);
				res.on("end", () => this.onresponse(msg, args, JSON.parse(data)));
			}
		);
		req.on("error", err => {console.error(err); msg.channel.send(ferr(args[0], err));});
		req.end();
		return 0;
	}
}

module.exports = FindCmd;
