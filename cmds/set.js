const PermCmd     = require("../cmd-types/permcmd.js");
const utils       = require("../utils/utils.js");
const cfg         = require("../config/cfg.json");

class SetCmd extends PermCmd
{
	constructor(baseArgs, /*Parser*/ parser, ...args)
	{
		super(baseArgs, ...args);
		this.parser = parser;
	}
	
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (!cfg.rootusers.includes(msg.author.id) && super.call(msg, args))
			return 1;
		let [cmd, val] = args.slice(1);
		if (!cmd)
		{
			msg.channel.send(utils.ferr(args[0], "No command specified."));
			return 1;
		}
		cmd = this.parser.deAliasCmd(cmd);
		if (!cmd[1] || cmd[1] === this)
		{
			msg.channel.send(utils.ferr(args[0], `\`${cmd[0]}\` can't be set.`));
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
