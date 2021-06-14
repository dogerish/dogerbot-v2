// base for a command
class BaseCmd
{
	// child classes should call this first thing and fail if it returns non-zero
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args) { return 0; }
}

module.exports = BaseCmd;
