const BaseCmd = require("../cmd-types/basecmd.js");
const fs      = require("fs");
const GetOpt  = require("../utils/getopt.js");
const utils   = require("../utils/utils.js");

class GetpicCmd extends BaseCmd
{
	constructor(baseArgs)
	{
		super(baseArgs);
		this.functional = true;
		this.udfunc(err =>
		{
			if (err) console.log(
				  "Warning: getpic: 'base/' doesn't exist. This command will not be"
				+ " functional."
			);
		});
	}

	// UpDate FUNCtional
	udfunc(/*function(err)*/ callback = err => err)
	{
		fs.access("base/", err =>
		{
			this.functional = !err
			callback(err);
		});
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let go = new GetOpt("u,update,", args);
		while (go.next())
		{
			if (go.opterr)
			{
				this.error(msg, go.opterr);
				return 1;
			}
			switch (go.opt)
			{
			case 'u': case "update":
				this.udfunc();
				this.output(msg, "Updating.");
				return 0;
			}
		}
		let name = args[go.optind];
		// not functional or no name given
		if (!this.functional || !name)
		{
			this.error(msg, this.functional ? "No map name given." : "Not functional.");
			return 1;
		}
		// no relative paths
		name = name.replace(/\.\.\//g, "");
		this.output(msg, { files: [`base/${name}.jpg`] }).catch(e =>
		{
			if (e.code == "ENOENT")
				this.error(msg, `Couldn't find \`${name}\`.`);
			else console.error(e);
		});
		return 0;
	}
}

module.exports = GetpicCmd;
