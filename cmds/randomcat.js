const BaseCmd = require("../cmd-types/basecmd.js");
const CatCmd  = require("./cat.js");
const utils   = require("../utils/utils.js");

class RandomCatCmd extends BaseCmd
{
	constructor(baseArgs, /*Parser*/ parser)
	{
		super(...baseArgs);
		// get all the cat commands
		this.cats = new Map(
			Array.from(parser.commands.entries()).filter(
				([key, cmd]) => cmd instanceof CatCmd
			)
		);
		this.catkeys = Array.from(this.cats.keys());
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		if (!this.catkeys.length)
		{
			msg.channel.send(utils.ferr(args[0], "No cats found."));
			return 1;
		}
		// get and call a random cat command
		args[0] = this.catkeys.random();
		return this.cats.get(args[0]).call(msg, args);
	}
}

module.exports = RandomCatCmd;