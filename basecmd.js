// base for a command
class BaseCmd
{
	// child classes should override this
	call(/*Discord.Message*/ msg, /*String*/ ...args) {}
}

module.exports = BaseCmd;
