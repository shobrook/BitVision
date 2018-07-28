let blessed = require("blessed");
let contrib = require("blessed-contrib");

let helpMenuData = [ [ "Keybinding",  "Action" ],
[ "---", "---"],
[ "H", "Open help menu"],
[ "I", "Focus on headlines"],
[ "K", "Logout"],
[ "L", "Login"],
[ "O", "Open, changes depending on focus."],
[ "T", "Toggle automatic trading"],
[ "V", "Show version and author info"] ];

let strings = {
	autotrading: "## Automatic Trading\n\n 1. Enter account credentials \n 2. Press \`T\` to toggle this option.\n 3. Enter the max amount you\"d like to trade.\n 3.5. Watch our algorithm trade BTC for you.\n 4. Profit",
	authors: "\n\n## Authors\n\n Written by Jon Shobrook and Aaron Lichtman.\n -> https://www.github.com/shobrook\n -> https://www.github.com/alichtman",
	warning: "\n\n## Warning\n\n Use this software to trade bitcoin at your own risk.\n We are not responsible if our algorithm misbehaves.",
	source: "\n\n## Source Code\n\n -> https://github.com/shobrook/BitVision"
};

let screen = blessed.screen()

var layout = blessed.layout({
	parent: screen,
	top: "center",
	left: "center",
	width: 80,
	height: 36,
	border: "line",
	style: {
		border: {
			fg: "blue"
		}
	}
});

var table = blessed.listtable({
	parent: layout,
	interactive: false,
	top: "center",
	left: "center",
	data: helpMenuData,
	border: "line",
	pad: 2,
	width: 60,
	height: 10,
	style: {
		border: {
			fg: "blue"
		},
		header: {
			fg: "red",
			bold: true,
			underline: true,
		},
		cell: {
			fg: "green",
		}
	}
});

var textBox = blessed.box({
	parent: layout,
	width: 78,
	height: 24,
	left: "center",
	top: "center",
	padding: {
		left: 2,
		right: 2,
	},
	border: "line",
	style: {
		fg: "white",
		border: {
			fg: "blue",
		}
	},
	content: strings["autotrading"] + strings["authors"] + strings["warning"] + strings["source"]
});

// Quit
screen.key(["q", "C-c", "escape"], function() {
	process.exit(0);
});

screen.render();
