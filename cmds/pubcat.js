const CatCmd = require("./cat.js");
const fs     = require("fs");
const utils  = require("../utils/utils.js");
const cfg    = require("../config/cfg.json");

class PublicCatCmd extends CatCmd
{
	constructor(baseArgs)
	{
		let namef = "pubcat";
		super(baseArgs, "Community Cat", null, 0, namef);
		this.pre = "[Request] ";
		this.appfile = `resources/${namef}apps.txt`;
		this.apps = fs.readFileSync(this.appfile).toString().split('\n')
			.filter(app => app.length != 0);
	}

	// writes the url list to the file
	saveapps() { fs.writeFile(this.appfile, this.apps.join('\n') + '\n', utils.fsErrHand); }
	// applies application
	applyapp(/*Discord.Message*/ msg, /*String*/ app)
	{
		let url = app.substr(1);
		if (app[0] == '+')
		{
			super.add([url]);
			this.output(msg, `Added ${url}`);
		}
		else if (app[0] == '-' && this.urls.indexOf(url) >= 0)
		{
			this.output(msg, `Deleting ${url}`);
			super.del(this.urls.indexOf(url));
		}
		else this.error(msg, "Rejecting invalid application: `" + app + "`");
	}
	notifyroot(/*String*/ ...apps)
	{
		this.client.users.fetch(cfg.rootusers[0]).then(
			user => user.send(`New public cat applications:\n${apps.join('\n')}`)
		);
	}
	// puts urls up for approval
	add(/*Array<String>*/ urls)
	{
		let apps = urls.map(url => '+' + url);
		this.apps.push(...apps);
		this.saveapps();
		this.notifyroot(...apps);
	}
	// deletes URL n and then saves
	del(/*Number*/ n)
	{
		let app = '-' + this.urls[n];
		this.apps.push(app);
		this.saveapps();
		this.notifyroot(app);
	}

	// checks that user ID is allowed to manage
	canManage(/*Discord.Snowflake*/ snowflake) { return true; }
}

module.exports = PublicCatCmd;
