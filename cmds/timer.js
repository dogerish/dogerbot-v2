const BaseCmd = require("../cmd-types/basecmd.js");
const GetOpt  = require("../utils/getopt.js");
// conversion to ms from seconds, minutes, and hours
const msFactors = [1000, 60000, 3600000];

class Timer
{
	constructor(/*Number*/ id, /*Number*/ duration, /*String*/ callback)
	{
		this.id = id;
		this.endTime = new Date(Date.now() + duration);
		this.callback = callback;
	}
	/*String*/ toString()
	{ return `${this.id}: \`${this.callback?.replaceAll('`', "\\`")}\` at ${this.endTime}`; }
}
class TimerManager
{
	constructor()
	{
		this.timers = new Map();
	}
	/*Map<Number,Timer>*/ getUser(/*Discord.Snowflake*/ user)
	{
		return this.timers.get(user) || new Map();
	}
	addTimer(/*Discord.Snowflake*/ user, /*Timer*/ tm)
	{
		if (!this.timers.has(user)) this.timers.set(user, new Map());
		this.timers.get(user).set(tm.id, tm);
	}
	// returns false if the timer doesn't exist
	/*Boolean*/ delTimer(/*Discord.Snowflake*/ user, /*Number*/ timerid)
	{
		if (!this.timers.has(user) || !this.timers.get(user).has(timerid)) return false;
		clearTimeout(timerid);
		this.timers.get(user).delete(timerid);
		return true;
	}
}

class TimerCmd extends BaseCmd
{
	constructor(baseArgs)
	{
		super(baseArgs);
		this.timers = new TimerManager();
	}
	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let go = new GetOpt("l,list,c:clear:", args);
		while (go.next())
		{
			if (go.opterr)
			{
				this.error(msg, go.opterr);
				return 1;
			}
			switch (go.opt)
			{
			case "l": case "list":
				// list stuff
				let l = Array.from(this.timers.getUser(msg.author.id).entries());
				if (!l.length)
				{
					this.output(msg, "No timers.");
					return 0;
				}
				this.output(msg, l.reduce((p, [k, v]) => p + v + '\n', ""));
				return 0;
			case "c": case "clear":
				// clear timer id
				let timerid = Number(go.optarg);
				if (!this.timers.delTimer(msg.author.id, timerid))
				{
					this.error(msg, `Timer ${timerid} not found`);
					return 2;
				}
				this.output(msg, `Cleared timer ${timerid}`);
				return 0;
			}
		}
		let newargs = args.slice(go.optind);
		if (newargs.length < 1)
		{
			this.error(msg, "Missing duration argument.");
			return 3;
		}
		// number of ms to wait
		// specified as hours:minutes:seconds
		let duration = newargs[0].split(':').map(Number);
		if (duration.length > 3 || duration.some(v => Number.isNaN(v)))
		{
			this.error(msg, "Duration must be in hours:minutes:seconds format");
			return 3;
		}
		duration = duration.reverse().reduce(
			(a, v, i) => a + v * msFactors[i],
			0
		);

		let cb = newargs[1] || "mention Time\\'s up!";
		let tm = new Timer(
			Number(setTimeout(() => this.parser.exec(msg, cb), duration)),
			duration,
			cb
		);
		this.timers.addTimer(msg.author.id, tm);
		this.output(msg, tm.toString());
		msg.react('⏰'); // :alarm_clock:
		return 0;
	}
}

module.exports = TimerCmd;
