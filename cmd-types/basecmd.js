const fs = require("fs");
// base for a command
class BaseCmd
{
	constructor(/*String*/ orig, /*String*/ manpage)
	{
		// config file for channels
		this.chancfg = `config/user/set/${orig}.txt`;
		this.chans = new Map();
		try
		{
			let tmp = String(fs.readFileSync(this.chancfg)).split(/\W/);
			for (let id of tmp) this.chans.set(id);
		}
		catch (e)
		{
			if (e.code != "ENOENT") throw e;
			console.error(
				  `Warning: '${e.path}' doesn't exist.`
				+ " Defaulting to empty disabled channel list."
			);
		}
		this.manpage = manpage ? `man/${manpage}` : `man/${orig}.txt`;
		fs.access(this.manpage, err => {
			if (err) console.log(`Warning: ${orig}: '${this.manpage}' doesn't exist.`);
		});
	}

	// whether or not command is allowed in channel id
	blockedIn(/*Discord.Snowflake*/ id) { return this.chans.has(id); }
	saveChans()
	{
		let arr = Array.from(this.chans.keys());
		fs.writeFileSync(
			this.chancfg,
			// newline every 10
			arr.length
			? arr.reduce((acc, val, i) => acc + ((i % 10) ? ' ' : '\n') + val)
			: ""
		);
	}
	  blockChan(/*Discord.Snowflake*/ id) { this.chans.set(id); }
	unblockChan(/*Discord.Snowflake*/ id) { this.chans.delete(id); }

	// child classes should call this first thing and fail if it returns non-zero
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (!this.blockedIn(msg.channel.id)) return 0;
		msg.react('❌');
		return 1;
	}
}

module.exports = BaseCmd;
