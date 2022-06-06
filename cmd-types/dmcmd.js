const BaseCmd = require("./basecmd.js");
const utils   = require("../utils/utils.js");

// replies in DMs
class DMCmd extends BaseCmd
{
	async /*Promise<Discord.Message>*/ output(/*Discord.Message*/ msg, ...args)
	{
		if (msg.channel.type == "dm") return super.output(msg, ...args);
		try
		{
			await msg.react('📧');
			return await msg.author.send(...args);
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
