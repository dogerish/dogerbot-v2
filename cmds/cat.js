const fs      = require("fs");
const utils   = require("../utils/utils.js");
const BaseCmd = require("../cmd-types/basecmd.js");
const GetOpt  = require("../utils/getopt.js");
const cfg     = require("../config/cfg.json");

// cat command
class CatCmd extends BaseCmd
{
	constructor(
		baseArgs,
		/*String*/ name,
		/*String*/ owner,
		/*NumberResolvable*/ color,
		/*String*/ namef,
		/*String*/ bday // birthday, specify as M-D format (January 2 -> 1-2)
	)
	{
		super(baseArgs);
		this.name  = name;
		this.file  = `resources/${namef || name.toLowerCase()}pics.txt`;
		this.urls  = String(fs.readFileSync(this.file)).split('\n')
			.filter(url => url.length);
		this.managers = [...cfg.rootusers, owner];
		this.color = Number(color);
		this.bday = bday;
		this.pre = "";
	}

	// returns true if today is the cat's birthday
	/*Boolean*/ isBday()
	{
		let today = new Date();
		return `${today.getMonth() + 1}-${today.getDate()}` == this.bday;
	}
	// returns string depending on whether or not it's the cat's birthday
	/*String*/ getBdayString()
	{
		return this.isBday()
			? `:partying_face: Happy birthday ${this.name}!`
			: `${this.name}`;
	}

	// writes the url list to the file
	save() { fs.writeFile(this.file, this.urls.join('\n') + '\n', utils.fsErrHand); }
	// adds urls and then saves
	add(/*Array<String>*/ urls)
	{
		this.urls.push(...urls);
		this.save();
	}
	// deletes URL n and then saves
	del(/*Number*/ n)
	{
		this.urls.splice(n, 1);
		this.save();
	}

	// checks that user ID is allowed to manage
	canManage(/*Discord.Snowflake*/ snowflake) { return this.managers.includes(snowflake); }

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let self = this;
		const err = (/*String*/ brief) =>
		{
			self.error(msg, brief);
			return 1;
		};
		const getopt = new GetOpt("n,neg,a,add,d,del,", args);
		let neg = false, add = false, del = false;
		while (getopt.next())
		{
			switch (getopt.opt)
			{
			case 'n': case "neg": neg = true; break;
			case 'a': case "add": add = true; break;
			case 'd': case "del": del = true; break;
			// quit on any error
			default: return err(getopt.opterr);
			}
		}
		if ((add || del) && !this.canManage(msg.author.id))
			return err(`You don't own ${this.name}.`);
		if (add)
		{
			let urls = [...args.slice(getopt.optind)];
			for (let at of msg.attachments) urls.push(at[1].url);
			if (!urls.length) return err("No attachments or arguments found.");
			this.add(urls);
			this.output(
				msg,
				this.pre + "Added URLs\n```\n" + urls.join('\n') + "\n```"
			);
			return 0;
		}
		let n = args[getopt.optind];
		// get pic n or random as long as we aren't deleting
		if (!n && !del) n = Math.floor(Math.random() * this.urls.length);
		else
		{
			n = n || 0;
			n *= (neg * -2 + 1);
			n += (n <= 0) * this.urls.length - 1;
		}
		let url = this.urls[n++];
		if (del)
		{
			if (n <= 0 || n > this.urls.length) return err(`#${n} is out of bounds.`);
			this.del(n - 1);
			this.output(msg, this.pre + "Deleted URL\n```\n" + url + "\n```");
			return 0;
		}
		n = '#' + n;

		switch (url)
		{
		case undefined: err(n + " doesn't exist."); break;
		case "":        err(n + " is empty.");      break;
		default:
			// don't try to embed a video
			let match = url.match(/\.[^\.]*$/);
			if (match && [".mp4", ".mov"].includes(match[0].toLowerCase()))
			{
				this.output(msg, `**${n}**\n${url}`);
				break;
			}
			this.output(msg,
				{
					embeds:
					[{
						title: `${this.getBdayString()} ${n}`,
						image: { url: url },
						color: this.color
					}]
				}
			).catch(() => err(`**${n}** is invalid.\n\`\`\`\n${url}\n\`\`\``));
			break;
		}
		return 0;
	}
}

module.exports = CatCmd;
