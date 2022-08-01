const fs = require("fs");
const utils = require("../utils/utils.js");
const Context = require("../context.js");
// base for a command
class BaseCmd
{
	constructor([
		/*Discord.Client*/ client,
		/*Parser*/         parser,
		{
			/*String*/        orig,
			/*String*/        manpage,
			/*Array<String>*/ aliases
		}
	])
	{
		this.client = client;
		this.parser = parser;
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
		this.aliases = aliases;
		// add aliases to parser
		for (let kv of Object.entries(aliases))
			parser.aliases.set(...kv);
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
		/*String*/ brief, data
	)
	{
		let d = { content: utils.ferr(this.orig, brief), ...data };
		let ctx = msg.context[msg.context.length - 1];
		if (ctx && ctx.error) return ctx.error(d);
		if (ctx) return msg.channel.send(d);
		return output(msg, d);
	}

	/*Promise<Discord.Message>*/ error(/*Discord.Message*/ msg, /*String*/ brief, data)
	{ return this.lower_error(this.output, msg, brief, data); }
	/*Promise<Discord.Message>*/ output(/*Discord.Message*/ msg, data)
	{
		let ctx = msg.context[msg.context.length - 1];
		if (ctx && ctx.output) return ctx.output(data);
		return msg.channel.send(data);
	}
}

module.exports = BaseCmd;
