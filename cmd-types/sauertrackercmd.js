const BaseCmd = require("../cmd-types/basecmd.js");

class SauerTrackerCmd extends BaseCmd
{
	constructor(baseArgs)
	{
		super(...baseArgs);
		this.host = "sauertracker.net";
		this.url  = `https://${this.host}`;
	}
}

module.exports = SauerTrackerCmd;
