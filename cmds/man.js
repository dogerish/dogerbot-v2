const BaseCmd = require("../cmd-types/basecmd.js");
const fs      = require("fs");
const utils   = require("../utils/utils.js");
const cfg     = require("../config/cfg.json");
const GetOpt  = require("../utils/getopt.js");

class ManCmd extends BaseCmd
{
	constructor(baseArgs, /*Parser*/ parser)
	{
		super(...baseArgs);
		this.parser = parser;
	}

	// substitute keys in with their values
	// text inside of {} will be evaluated with eval(),
	// and <INTERNAL ERROR> will be used if there is any error while evaluating
	// the only variable you can safely write to in eval's context is "tmp".
	/*String*/ static subKeys(
		/*Discord.Message*/ msg,
		/*String*/          cmdname,
		/*BaseCmd*/         cmd,
		/*String*/          str
	)
	{
		let matches = str.match(/\{.+?\}/g);
		if (!matches) return str;
		let tmp; // for inside the man page
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
		return str;
	}

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		// get options
		const go   = new GetOpt("f,whatis,", args);
		let whatis = false;
		while (go.next())
		{
			if (go.opterr)
			{
				msg.channel.send(utils.ferr(args[0], go.opterr));
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
			msg.channel.send(utils.ferr(args[0], `Unknown command: \`${cmdname}\``));
			return 1;
		}
		// construct the embed
		let embed = { fields: [] }, curField;
		let data;
		// try reading and notify of failures
		try { data = String(fs.readFileSync(cmd.manpage)).split('\n'); }
		catch (e)
		{
			// file not there, undocumented (already logged this on startup)
			if (e.code == "ENOENT")
			{
				msg.channel.send(utils.ferr(
					args[0],
					`Sorry, \`${cmdname}\` is undocumented so far.`
				));
				return 1;
			}
			// unexpected error, log it
			console.error(`Error (${args[0]}, ${e.code}):`, e);
			msg.channel.send(utils.ferr(
				args[0],
				`Internal error (code ${e.code}). Please make a bug report.`
			));
		}
		// shortcut to sub the keys of a string in this context
		let subit = str => ManCmd.subKeys(msg, cmdname, cmd, str);
		// parse lines
		for (let line of data)
		{
			switch (line[0])
			{
			// header/field name
			case '#':
				let pre = line.substr(1, 5);
				switch (pre)
				{
				case "TITLE": embed.title = subit(line.substr(7)); continue;
				case "DESCR":
					embed.description = subit(line.substr(7));
					if (whatis)
					{
						msg.channel.send(embed.description || "<UNDEFINED>");
						return 0;
					}
					continue;
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
		msg.channel.send({ embed: embed })
		.catch(e => {
			console.error(`Error (${args[0]}, ${e.code}):`, e);
			msg.channel.send(utils.ferr(
				args[0],
				`Internal error (code \`${e.code}\`). Please make a bug report.`
			))
		});
		return 0;
	}
}

module.exports = ManCmd;
