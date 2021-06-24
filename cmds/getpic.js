const BaseCmd = require("../cmd-types/basecmd.js");
const fs      = require("fs");
const utils   = require("../utils/utils.js");

class GetpicCmd extends BaseCmd
{
	constructor(baseArgs)
	{
		super(...baseArgs);
		this.functional = true;
		fs.access('base/', err =>
		{
			if (err) console.log(
				  "Warning: getpic: 'base/' doesn't exist. This command will not be"
				+ " functional."
			);
			this.functional = !err;
		});
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let name = args[1];
		// not functional or no name given
		if (!this.functional || !name)
		{
			msg.channel.send(utils.ferr(
				args[0],
				this.functional ? "No map name given." : "Not functional."
			));
			return 1;
		}
		// no relative paths
		name = name.replace(/\.\.\//g, "");
		msg.channel.send({ files: [`base/${name}.jpg`] }).catch(e =>
		{
			if (e.code == "ENOENT")
				msg.channel.send(utils.ferr(args[0], `Couldn't find \`${name}\`.`));
			else console.error(e);
		});
		return 0;
	}
}

module.exports = GetpicCmd;
