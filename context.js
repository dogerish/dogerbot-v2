class Context
{
	constructor(
		/*Function(Object data)*/ output, /*Function(Object data)*/ error,
		/*Boolean*/ outIsAsync, /*Boolean*/ errIsAsync
	)
	{
		this.output = Context.forceAsync(output, outIsAsync);
		this.error  = Context.forceAsync(error,  errIsAsync);
	}

	static forceAsync(/*Function(...args)*/ f, /*Boolean*/ isAsync)
	{ return (isAsync || !f) ? f : Context.mockAsync(f); }

	static mockAsync(/*Function(...args)*/ f)
	{ return (...args) => { f(...args); return new Promise((res, rej) => res()); }; }
}

module.exports = Context;
