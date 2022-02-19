const fs = require("fs");
const utils = require("../utils/utils.js");
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
		catch (e) { if (e.code != "ENOENT") throw e; } // ignore missing config file
		this.manpage = manpage ? `man/${manpage}` : `man/${orig}.txt`;
		fs.access(this.manpage, err => {
			if (err) console.log(`Warning: ${orig}: '${this.manpage}' doesn't exist.`);
		});
		this.orig = orig;
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
		msg.react('❌').catch(() => {});
		return 1;
	}

	/*Promise<Discord.Message>*/ lower_error(
		/*Function*/ output,
		/*Discord.Message*/ msg,
		/*String*/ brief, ...args
	)
	{ return output(msg, utils.ferr(this.orig, brief), ...args); }

	/*Promise<Discord.Message>*/ error(/*Discord.Message*/ msg, /*String*/ brief, ...args)
	{ return this.lower_error(this.output, msg, brief, ...args); }
	/*Promise<Discord.Message>*/ output(/*Discord.Message*/ msg, ...args)
	{ return msg.channel.send(...args); }
}

module.exports = BaseCmd;
