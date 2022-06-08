const   DMCmd               = require("../cmd-types/dmcmd.js");
const   GetOpt              = require("../utils/getopt.js");
const { createCanvas      } = require("canvas");
const { MessageAttachment } = require("discord.js");

class FractalTreeCmd extends DMCmd
{
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
				this.error(msg, go.opterr);
				return 1;
			}
			let n = Number(go.optarg);
			switch (go.opt)
			{
			case 'c': case "coef"    : coef     = n;                            break;
			case 'a': case "angInc"  : angInc   = n * Math.PI/180;              break;
			case 'm': case "maxdepth": maxdepth = Math.max(1, Math.min(n, 17)); break;
			case 'l': case "startlen": startlen = Math.max(1, n);               break;
			case 'b': case "bgcolor" : bgcolor  = go.optarg;                    break;
			case 's': case "stroke"  : stroke   = go.optarg;                    break;
			}
		}
		// calculate the bounding box this will use (upside down)
		let x  = 0,
		    y  = 0,
		    sy = 0, // starting y, lowest point of the fractal
		    sl = startlen,
		    ax = Math.PI / 2,
		    ay = Math.PI / 2;
		for (let d = 0; d < maxdepth; d++)
		{
			// follow the branches straight up
			y  += ((d % 2) ? Math.sin(Math.PI / 2 + angInc) : 1) * sl;
			sy += Math.sin(ay) * sl;
			x  += Math.cos(ax) * sl;
			// angle for x, try to stay horizontal
			ax += (ax > 0) ? -angInc : angInc;
			ay += (ay > -Math.PI / 2) ? -angInc : angInc;
			sl *= coef;
		}
		if (sy > 0) sy = 0;
		let cv;
		try { cv  = createCanvas(x * 2 + 1, y - sy); }
		catch (e)
		{
			this.error(msg, "Failed to create canvas. Area likely too big.");
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
		branch(x, y + sy, startlen, Math.PI / -2, 0);
		ctx.closePath();
		ctx.stroke();
		try {
			this.output(msg, {
				content: `${Date.now() - start}ms`,
				files: [cv.toBuffer()]
			});
		}
		catch (e)
		{
			this.error(msg, "Failed to send canvas.");
			return 1;
		}
		return 0;
	}
}

module.exports = FractalTreeCmd;
