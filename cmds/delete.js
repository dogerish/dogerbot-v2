const { MessageManager } = require("discord.js");
const RootCmd = require("../cmd-types/rootcmd.js");

class DeleteCmd extends RootCmd
{
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
				this.error(
					msg,
					`Could not resolve \`${snowflake}\` to a message.`
				);
				return -1;
			}
			// make sure this is a message from the bot
			if (todel[i].author.id != msg.client.user.id)
			{
				this.error(msg, `${todel[i].url} isn't my message.`);
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
