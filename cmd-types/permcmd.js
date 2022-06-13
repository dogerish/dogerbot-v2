const GuildCmd = require("./guildcmd.js");
const utils    = require("../utils/utils.js");

class PermCmd extends GuildCmd
{
	constructor(
		baseArgs,
		/*Array<Discord.PermissionResolvable>*/ perms,
		/*Boolean*/ checkAdmin = true
	)
	{
		super(baseArgs);
		this.perms = perms;
		this.checkAdmin = checkAdmin;
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (this.perms.some(perm => msg.member.permissions.has(perm, this.checkAdmin)))
			return 0;
		this.error(msg, `You need any of these permissions: ${this.perms.join(", ")}.`);
		return 1;
	}
}

module.exports = PermCmd;
