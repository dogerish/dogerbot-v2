const BaseCmd = require("../cmd-types/basecmd.js");
const fs      = require("fs");
const GetOpt  = require("../utils/getopt.js");
const utils   = require("../utils/utils.js");
const cfg     = require("../config/cfg.json");

class CookieCmd extends BaseCmd
{
	// listcfg: filename of the blacklist config
	constructor(/*String*/ listcfg, /*String*/ ...hearts)
	{
		super();
		this.listcfg = `config/user/${listcfg}`;
		this.blacklist = new Map();
		for (let id of require("../" + this.listcfg)) this.blacklist.set(id);
		this.hearts = hearts;
		if (!this.hearts.length) this.hearts = [":heart:"];
	}

	// blacklist the user id
	blist(/*Discord.Snowflake*/ id) { this.blacklist.set(String(id)); }
	// whitelist the user id
	wlist(/*Discord.Snowflake*/ id) { this.blacklist.delete(String(id)); }
	// user wants to be DM'd?
	/*Boolean*/ wantsDMs(/*Discord.Snowflake*/ id) { return !this.blacklist.has(String(id)); }

	// saves the blacklist
	savebl()
	{
		fs.writeFile(
			this.listcfg,
			JSON.stringify(Array.from(this.blacklist.keys())),
			utils.fsErrHand
		);
	}

	// gets the message embed to send to each user
	/*Discord.MessageEmbed*/ getMsg(/*Discord.Message*/ msg, /*String*/ arg0, /*String*/ m)
	{
		m = m ? m : msg.author.username + " sent you a cookie!";
		return {
			embed:
			{
				title      : ":cookie:",
				description: m,
				color      : 0x8a4b38,
				fields     :
				[
					{ name: "From",    value: msg.author.tag, inline: true },
					{ name: "User ID", value: msg.author.id,  inline: true },
					{
						name : "Return To Sender",
						value: `${cfg.prefix}${arg0} -i ${msg.author.id}`
					}
				]
			}
		};
	}

	/*
	send cookies to the users
	Return: Object.
		fails => Array<String>  - Array of the usernames that it failed for
		gotck => Boolean        - true if the client recieved a cookie
	*/
	/*Object*/ async sendCookies(
		/*Discord.Message*/     msg,
		/*Array<Discord.User>*/ users,
		/*String*/              arg0,
		/*Boolean*/             quiet,
		/*String*/              m
	)
	{
		let ret = { fails: [], gotck: false };
		// nothing to do
		if (!users.length) { msg.react('🍪'); return ret; }
		let promises = [];
		let tosend   = this.getMsg(msg, arg0, m);
		// starting to send
		msg.react('🛫');
		for (let user of users)
		{
			if (user === user.client.user)
			{
				ret.gotck = true;
				ret.fails.push(user.username);
				continue;
			}
			if (quiet || !this.wantsDMs(user.id))
				{ ret.fails.push(user.username); continue; }
			promises.push(user.send(tosend).catch(err =>
				{
					// can't send messages to this user
					if (err.code == 50007) ret.fails.push(user.username);
					else console.error(err);
				})
			);
		}
		await Promise.all(promises);
		return ret;
	}

	// 0 on success
	/*Number*/ async call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		// parse options
		const go = new GetOpt(
			"i:b,w,l,q,m:" +
			"id:blacklist,whitelist,list,quiet,message:",
			args
		);
		let quiet = false, done = false;
		let ids = [], m;
		while (go.next())
		{
			if (go.opterr)
				{ msg.channel.send(utils.ferr(args[0], go.opterr)); return 1; }
			switch (go.opt)
			{
			case 'b': case "blacklist":
				this.blist(msg.author.id); this.savebl();
				msg.react('👌'/*ok_hand*/);
				done = true; break;
			case 'w': case "whitelist":
				this.wlist(msg.author.id); this.savebl();
				msg.react('👍'/*+1*/);
				done = true; break;
			case 'l': case "list":
				msg.react(this.wantsDMs(msg.author.id) ? '⬜' : '⬛');
				done = true; break;
			case 'q': case "quiet"  : quiet = true;        break;
			case 'i': case "id"     : ids.push(go.optarg); break;
			case 'm': case "message": m = go.optarg;       break;
			}
		}
		if (!quiet && !ids.length && done) return 0;
		// the users to send cookies to
		let users = Array.from(msg.mentions.users.values());
		// resolve IDs into user objects
		for (let id of ids)
		{
			let user = msg.client.users.resolve(id);
			if (user) { users.unshift(user); continue; }
			msg.channel.send(
				utils.ferr(args[0], `Failed to resolve \`${id}\`. Bad ID.`)
			);
			return 1;
		}
		let { fails, gotck } = await this.sendCookies(msg, users, args[0], quiet, m);
		if (!fails.length) { msg.react('✅'); return 0; }
		// send fails the boring way
		msg.channel.send(
			  `Cookies for \`${fails.join("`, `")}\`: ${"🍪 ".repeat(fails.length)}\n`
			+ (m ? `*"${m}"*\n` : "")
			+ (gotck ? `Thanks ${msg.author.username} ${this.hearts.random()}` : "")
		);
		return 1;
	}
}

module.exports = CookieCmd;
