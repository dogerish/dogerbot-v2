// use to parse options in arguments
class GetOpt
{
	/*
	optstr: String containing possible options
		each option should be separated by a colon (:), semicolon (;), or comma (,)
		this changes how arguments are viewed
			: - required
			; - optional
			, - ignored
		ex: "r:o;i|"
	*/
	constructor(/*String*/ optstr, /*Array(String)*/ args)
	{
		this.opts = {};
		let opt = "";
		for (let ci = 0; ci < optstr.length; ci++)
		{
			let c = optstr[ci];
			let tmp;
			if ((tmp = ",;:".indexOf(c)) < 0) opt += c;
			else
			{
				this.opts[opt] = tmp;
				opt = "";
			}
		}
		if (opt) opts[opt] = 0;

		this.args   = args;
		this.opt    = "";   // what option was gotten, set by next()
		this.optarg = "";   // argument for the option
		this.opterr = "";   // the error, if any, that was encountered by next()
		this.optind = 1;    // the index of args that this is on
		this.subind = 0;    // the index of the current character of the arg this is on
	}

	// evaluate next argument, returns 0 if it's done; otherwise returns optind
	/*Number*/ next()
	{
		if (this.optind >= this.args.length) return 0;
		// clear optarg and opterr
		this.optarg = this.opterr = "";
		let arg = this.args[this.optind];
		// already within the arg
		if (this.subind)                        this.opt = arg[this.subind++];
		else if (arg.startsWith("--"))          this.opt = arg.substr(2);
		else if (!this.subind && arg[0] == '-')
		{
			this.opt = arg[this.subind = 1];
			this.subind++;
		}
		else /* found a plain argument, done */ return 0;

		// reset to 0 if end of arg is reached
		this.subind *= (this.subind < arg.length);

		if (this.opts[this.opt])
		{
			// at the end of a sequence and have an additional argument
			if (!this.subind && this.optind + 1 < this.args.length)
				this.optarg = this.args[++this.optind];
			// keep an error if the arg was required (2)
			else if (this.opts[this.opt] == 2)
				this.opterr = `Option '${this.opt}' requires an argument`;
		}
		// unknown option
		else if (this.opts[this.opt] == undefined)
			this.opterr = `Unknown option '${this.opt}'`;

		return this.optind += !this.subind;
	}
}

module.exports = GetOpt;
