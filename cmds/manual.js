const BaseCmd      = require("../cmd-types/basecmd.js");
const { readFile } = require("fs/promises");
const cfg          = require("../config/cfg.json");
const GetOpt       = require("../utils/getopt.js");

class ManCmd extends BaseCmd
{
	// substitute keys in with their values
	// text inside of matching {} will be evaluated with eval(),
	// and <INTERNAL ERROR> will be used if there is any error while evaluating
	// the only variable you can safely write to in eval's context is "tmp".
	// returns the new string and tmp in that order in an array.
	/*Array<String, tmp>*/ static subKeys(
		/*Discord.Message*/ msg,
		/*String*/          cmdname,
		/*BaseCmd*/         cmd,
		/*String*/          str,
		                    tmp
	)
	{
		let matches = [];
		for (let idx = 0; idx < str.length;)
		{
			// find start and end index (first '{' and matching '}')
			let sdx = idx = str.indexOf('{', idx);
			if (sdx < 0) break;
			idx++;
			// skip over matching curly braces within
			let e, s;
			do
			{
				s = str.indexOf('{', idx);
				e = str.indexOf('}', idx);
				idx = e + 1;
			// keep going while there is a { before a }
			} while (s >= 0 && e >= 0 && s < e)
			if (e < 0)
			{
				str += '}';
				idx = e = str.length;
			}
			matches.push(str.substr(sdx, e - sdx + 1));
		}
		if (!matches.length) return [str, tmp];
		for (let m of matches)
		{
			try { str = str.replace(m, eval(m.substr(1, m.length - 2))); }
			catch (e)
			{
				console.error(
					`Error (${m}:${cmd.manpage}):`,
					e
				);
				str = str.replace(m, "<INTERNAL ERROR>");
			}
		}
		return [str, tmp];
	}

	// 0 on success
	async /*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		// get options
		const go   = new GetOpt("f,whatis,", args);
		let whatis = false;
		while (go.next())
		{
			if (go.opterr)
			{
				this.error(msg, go.opterr);
				return 1;
			}
			switch (go.opt) { case 'f': case "whatis": whatis = true; }
		}

		// trim args down to omit options
		args = [args[0], ...args.slice(go.optind)];
		// default name to this command name and dealias it
		let [cmdname, cmd] = this.parser.deAliasCmd(args[1] || args[0]);
		// unknown command
		if (!cmd)
		{
			this.error(msg, `Unknown command: \`${cmdname}\``);
			return 1;
		}
		// construct the embed
		let embed = { fields: [] }, curField;
		let data;
		// try reading and notify of failures
		try { data = (await readFile(cmd.manpage)).toString().split('\n'); }
		catch (e)
		{
			// file not there, undocumented (already logged this on startup)
			if (e.code == "ENOENT")
			{
				this.error(msg, `Sorry, \`${cmdname}\` is undocumented so far.`);
				return 1;
			}
			// unexpected error, log it
			console.error(`Error (${args[0]}, ${e.code}):`, e);
			this.error(
				msg,
				`Internal error (code ${e.code}). Please make a bug report.`
			);
		}
		// shortcut to sub the keys of a string in this context
		let tmp;
		let subit = str =>
		{
			let r = ManCmd.subKeys(msg, cmdname, cmd, str, tmp);
			tmp = r[1];
			return r[0];
		};
		// parse lines
		for (let line of data)
		{
			switch (line[0])
			{
			// header/field name
			case '#':
				let pre = line.substr(1, 5);
				let post = subit(line.substr(7));
				switch (pre)
				{
				case "TITLE": embed.title = post; continue;
				case "DESCR":
					if (whatis)
					{
						this.output(msg, post || "<UNDEFINED>");
						return 0;
					}
					embed.description = post;
					continue;
				case "COLOR": embed.color = Number(post); continue;
				default:
					curField = embed.fields.push(
						{ name: line.substr(1), value: "" }
					) - 1;
					continue;
				}
			// replace all tabs since they aren't supported
			case '\t': line = line.replace(/\t/g, "|--> "); break;
			}
			// add the line to the current field if both the current field is defined
			// and line isn't empty
			if (curField !== undefined && line.length)
				embed.fields[curField].value += subit(line) + '\n';
		}
		// don't send empty field values
		embed.fields.forEach((f, i) => {
			if (!f.value) { f.value = "<UNDEFINED>"; embed.fields[i] = f; }
		});
		// send the embed and log unexpected errors
		let self = this;
		this.output(msg, { embeds: [embed] })
		.catch(e => {
			console.error(`Error (${args[0]}, ${e.code}):`, e);
			self.error(
				msg,
				`Internal error (code \`${e.code}\`). Please make a bug report.`
			)
		});
		return 0;
	}
}

module.exports = ManCmd;
