const Discord = require("discord.js");
// basic utilities
const mex = module.exports;

// standard callback handler for fs functions
mex.fsErrHand = (err) => { if (err) console.error(err) };
// standard for formatting an error response
mex.ferr = (/*String*/ ctx, /*String*/ brief) => `:x: \`${ctx}\`: ${brief}`;
// clean up string pings
/*String*/ mex.cleanString = (/*String*/ str, /*Discord.Message*/ msg) =>
{
	str =  Discord.Util.cleanContent(str, msg);
	str =  str.replace(/@+here/g, "here");
	return str.replace(/@+everyone/g, "everyone");
};

// add random() method to Array
Array.prototype.random = function() { return this[Math.floor(Math.random() * this.length)]; };
