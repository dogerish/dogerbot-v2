const RootCmd = require("../cmd-types/rootcmd.js");
const GetOpt  = require("../utils/getopt.js");

class ApproveCmd extends RootCmd
{
	constructor(baseArgs, /*String*/ pubcat)
	{
		super(baseArgs);
		this.pubcat = this.parser.commands.get(pubcat);
	}

	// deals with rejecting or applying the nth application
	dealwith(/*Discord.message*/ msg, /*Boolean*/ reject, /*Number*/ n)
	{
		if (!reject) this.pubcat.applyapp(msg, this.pubcat.apps[n]);
		else         this.output(msg, `Rejecting ${this.pubcat.apps[n]}`);
		this.pubcat.apps.splice(n, 1);
		this.pubcat.saveapps();
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		const getopt = new GetOpt("a,all,l,list,r,reject,", args);
		let reject = false, all = false;
		while (getopt.next())
		{
			switch (getopt.opt)
			{
			case 'a': case "all": all = true; break;
			case 'l': case "list":
				this.output(msg, "Applications:\n" + this.pubcat.apps.join('\n'));
				return 0;
			case 'r': case "reject": reject = true; break;
			default: return this.error(msg, getopt.opterr);
			}
		}
		if (all)
		{
			if (!reject)
				for (let app of this.pubcat.apps)
					this.pubcat.applyapp(msg, app);
			else this.output(
				msg,
				`Rejecting applications:\n${this.pubcat.apps.join('\n')}`
			);
			this.pubcat.apps.length = 0;
			this.pubcat.saveapps();
			return 0;
		}
		let n = (getopt.optind - args.length == 0)
		        ? this.pubcat.apps.length - 1
		        : Number.parseInt(args[getopt.optind]);
		if (Number.isNaN(n) || n >= this.pubcat.apps.length || n < 0)
		{
			this.error(msg, `Bad index: ${n}`);
			return 1;
		}
		this.dealwith(msg, reject, n);
		return 0;
	}
}

module.exports = ApproveCmd;
