const PermCmd     = require("../cmd-types/permcmd.js");
const cfg         = require("../config/cfg.json");

class SetCmd extends PermCmd
{
	// 0 on success
	async /*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (!cfg.rootusers.includes(msg.author.id) && super.call(msg, args))
			return 1;
		let [cmd, val] = args.slice(1);
		if (!cmd)
		{
			this.error(msg, "No command specified.");
			return 1;
		}
		cmd = await this.parser.deAliasCmd(msg, cmd);
		if (!cmd[1] || cmd[1] === this)
		{
			this.error(msg, `\`${cmd[0]}\` can't be set.`);
			return 1;
		}
		cmd = cmd[1];
		cmd[((val == "on") ? "un" : "") + "blockChan"](msg.channel.id);
		cmd.saveChans();
		                                         /*red_circle : green_circle*/
		msg.react(cmd.blockedIn(msg.channel.id) ? '\u{1f534}' : '\u{1f7e2}');
		return 0;
	}
}

module.exports = SetCmd;
