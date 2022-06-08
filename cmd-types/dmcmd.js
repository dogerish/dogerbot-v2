const BaseCmd = require("./basecmd.js");
const utils   = require("../utils/utils.js");

// replies in DMs
class DMCmd extends BaseCmd
{
	async /*Promise<Discord.Message>*/ output(/*Discord.Message*/ msg, data)
	{
		if (msg.channel.type == "DM") return super.output(msg, data);
		try
		{
			await msg.react('📧');
			return await msg.author.send(data);
		}
		catch (e)
		{
			let m = await this.lower_error(super.output, msg, "I can't DM you 😔");
			setTimeout(() => m.delete(), 10e3);
			return m;
		}
	}
}

module.exports = DMCmd;
