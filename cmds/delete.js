const { MessageManager } = require("discord.js");
const RootCmd = require("../cmd-types/rootcmd.js");
const utils   = require("../utils/utils.js");

class DeleteCmd extends RootCmd
{
	constructor(baseArgs) { super(baseArgs); }

	// 0 on success
	/*Number*/ async call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let todel = args.slice(1);
		for (let i = 0; i < todel.length; i++)
		{
			let snowflake = todel[i].match(/[0-9]*$/)[0];
			// check that it was resolved
			try {
				todel[i] = await msg.channel.messages.fetch(snowflake);
			} catch (e)  {
				msg.channel.send(utils.ferr(
					args[0],
					`Could not resolve \`${snowflake}\` to a message.`
				));
				return -1;
			}
			// make sure this is a message from the bot
			if (todel[i].author.id != msg.client.user.id)
			{
				msg.channel.send(utils.ferr(
					args[0],
					`${todel[i].url} isn't my message.`
				));
				return -2;
			}
		}
		// delete them
		msg.rect('🆗');
		todel.forEach(m => m.delete());
		return 0;
	}
}

module.exports = DeleteCmd;
