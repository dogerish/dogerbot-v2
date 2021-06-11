// basic utilities
const mex = module.exports;

// standard callback handler for fs functions
mex.fsErrHand = (err) => { if (err) console.error(err) };
// standard for formatting an error response
mex.ferr = (/*String*/ ctx, /*String*/ brief) => `:x: \`${ctx}\`: ${brief}`;
