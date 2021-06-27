const   BaseCmd             = require("../cmd-types/basecmd.js");
const   GetOpt              = require("../utils/getopt.js");
const   utils               = require("../utils/utils.js");
const { createCanvas      } = require("canvas");
const { MessageAttachment } = require("discord.js");

class FractalTreeCmd extends BaseCmd
{
	constructor(baseArgs) { super(...baseArgs); }

	// 0 on success
	/*Number*/ call(/*Discord.Message*/ msg, /*Array<String>*/ args)
	{
		if (super.call(msg, args)) return 1;
		let coef     = 0.75,
		    angInc   = Math.PI / 6,
		    maxdepth = 15,
		    startlen = 150,
		    bgcolor  = "rgba(0, 0, 0, 0)",
		    stroke   = "black";
		let go = new GetOpt(
			"c:a:m:l:b:s:" +
			"coef:angInc:maxdepth:startlen:bgcolor:stroke:",
			args
		);
		while (go.next())
		{
			if (go.opterr)
			{
				msg.channel.send(utils.ferr(args[0], go.opterr));
				return 1;
			}
			let n = Number(go.optarg);
			switch (go.opt)
			{
			case 'c': case "coef"    : coef     = n;               break;
			case 'a': case "angInc"  : angInc   = n * Math.PI/180; break;
			case 'm': case "maxdepth": maxdepth = Math.min(n, 17); break;
			case 'l': case "startlen": startlen = n;               break;
			case 'b': case "bgcolor" : bgcolor  = go.optarg;       break;
			case 's': case "stroke"  : stroke   = go.optarg;       break;
			}
		}
		// calculate the bounding box this will use (upside down)
		let x  = 0,
		    y  = 0,
		    sl = startlen,
		    a  = Math.PI / 2;
		for (let d = 0; d < maxdepth; d++)
		{
			// follow the branches straight up
			y  += ((d % 2) ? Math.sin(Math.PI / 2 + angInc) : 1) * sl;
			x  += Math.cos(a) * sl;
			// angle for x, try to stay horizontal
			a  += (a > 0) ? -angInc : angInc;
			sl *= coef;
		}
		let cv;
		try { cv  = createCanvas(x * 2, y); }
		catch (e)
		{
			msg.channel.send(utils.ferr(
				args[0],
				"Failed to create canvas. Area likely too big."
			));
			return 1;
		}
		let ctx = cv.getContext("2d");

		// recursively draw branches
		function branch(x, y, l, a, depth)
		{
			let nx = Math.cos(a) * l + x,
			    ny = Math.sin(a) * l + y;
			if (depth >= maxdepth) return;
			branch(nx, ny, l * coef, a + angInc, depth + 1);
			branch(nx, ny, l * coef, a - angInc, depth + 1);
			ctx.moveTo(x, y);
			ctx.lineTo(nx, ny);
		}

		let start = Date.now();
		ctx.strokeStyle = stroke;
		ctx.fillStyle   = bgcolor;
		ctx.fillRect(0, 0, cv.width, cv.height);
		// draw the tree
		ctx.beginPath();
		branch(x, y, startlen, Math.PI / -2, 0);
		ctx.closePath();
		ctx.stroke();
		try
		{
			msg.channel.send(
				`${Date.now() - start}ms`,
				new MessageAttachment(cv.toBuffer(), "tree.png")
			);
		}
		catch (e)
		{
			msg.channel.send(utils.ferr(
				args[0],
				"Failed to send canvas as buffer. Perhaps don't use zeroes."
			));
			return 1;
		}
		return 0;
	}
}

module.exports = FractalTreeCmd;
