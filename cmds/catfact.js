const BaseCmd     = require("../cmd-types/basecmd.js");
const { request } = require("https");

class CatFactCmd extends BaseCmd
{
	constructor(baseArgs) { super(...baseArgs); }

	// 0 on success
	/*Promise<Number>*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let self = this;
		return new Promise((resolve, reject) =>
		{
			let req = request("https://catfact.ninja/fact", res =>
			{
				let data = "";
				res.on("data", chunk => data += chunk);
				res.on("end", () =>
				{
					try
					{
						self.output(msg, JSON.parse(data).fact);
						resolve(0);
					}
					catch (e) { reject(e); }
				});
			});
			req.on("error", reject);
			req.end();
		});
	}
}

module.exports = CatFactCmd;
