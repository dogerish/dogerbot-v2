const BaseCmd = require("../cmd-types/basecmd.js");
const fs      = require("fs");
const utils   = require("../utils/utils.js");
const cfg     = require("../config/cfg.json");

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
		if (!args[1])
		{
			msg.channel.send(utils.ferr(args[0], "No command specified."));
			return 1;
		}
		let [cmdname, cmd] = this.parser.deAliasCmd(args[1]);
		if (!cmd)
		{
			msg.channel.send(utils.ferr(args[0], `Unknown command: \`${cmdname}\``));
			return 1;
		}
		let embed = { fields: [] }, curField;
		let data;
		try { data = String(fs.readFileSync(cmd.manpage)).split('\n'); }
		catch (e)
		{
			if (e.code == "ENOENT")
			{
				msg.channel.send(utils.ferr(
					args[0],
					`Sorry, \`${cmdname}\` is undocumented so far.`
				));
				return 1;
			}
			console.error(`Error (${args[0]}, ${e.code}):`, e);
			msg.channel.send(utils.ferr(
				args[0],
				`Internal error (code ${e.code}). Please make a bug report.`
			));
		}
		let subit = str => ManCmd.subKeys(msg, cmdname, cmd, str);
		for (let line of data)
		{
			switch (line[0])
			{
			case '#':
				let pre = line.substr(1, 5);
				switch (pre)
				{
				case "TITLE": embed.title       = subit(line.substr(7)); continue;
				case "DESCR": embed.description = subit(line.substr(7)); continue;
				default:
					curField = embed.fields.push(
						{ name: line.substr(1), value: "" }
					) - 1;
					continue;
				}
			case '\t':
				let tabcount = line.match(/^\t+/);
				    tabcount = tabcount && tabcount[0].length;
				line = "|--> ".repeat(tabcount) + line.substr(tabcount);
				break;
			}
			embed.fields[curField].value += subit(line) + '\n';
		}
		embed.fields.forEach((f, i) => {
			if (!f.value) { f.value = "empty"; embed.fields[i] = f; }
		});
		msg.channel.send({ embed: embed }).catch(e =>
		{
			console.error(`Error (${args[0]}, ${e.code}):`, e);
			msg.channel.send(utils.ferr(
				args[0],
				`Internal error (code ${e.code}). Please make a bug report.`
			))
		}
		);
		return 0;
	}
}

module.exports = ManCmd;
