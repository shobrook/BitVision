let blessed = require("blessed");

// Global functions

function validateInput(value) {
	if (value != "") {
		return true;
	}
	return "You must enter some value here.";
}

// Coinbase Login Interface

let styleConstants = {
	"borderUnfocused": "#f0f0f0",
	"borderFocused": "green",
}

let spacingConstants = {
	"height": 3,
	"width": 26,
	"left": 2,
	"apiKey": 4,
	"secret": 8,
	"passphrase": 12
}

let promptConstants = {
	"apiKey": " {bold}{blue-fg}API Key{/bold}{/blue-fg} ",
	"passphrase": " {bold}{blue-fg}Passphrase{/bold}{/blue-fg} ",
	"secret": " {bold}{blue-fg}Secret{/bold}{/blue-fg} "
}

// Custom cursor
var screen = blessed.screen({
	smartCSR: true,
	cursor: {
		artificial: true,
		shape: "line",
		blink: true,
		color: "red"
	}
});

var body = blessed.box({
	top: 0,
	left: 0,
	height: "100%-1",
	width: "100%",
	// keys: true
})

// Add text to body (replacement for console.log)
const log = (text) => {
	body.pushLine(text);
	screen.render();
}

screen.append(body)

var form = blessed.form({
	parent: screen,
	keys: true,
	type: "overlay",
	top: "center",
	left: "center",
	width: 30,
	height: 18,
	bg: "black",
	color: "white",
});

let label = blessed.box({
	parent: form,
	top: 1,
	left: "center",
	width: 16,
	height: 1,
	content: " Coinbase Login ",
	style: {
		fg: "green",
		bold: true
	},
	tags: true
});

let hint = blessed.box({
	parent: form,
	top: 2,
	left: "center",
	width: 28,
	height: 1,
	content: " (Press tab to start entry) ",
	style: {
		fg: "white",
	},
	tags: true
});

// Input Boxes for Key, Passphrase and Secret

var keyEntryBox = blessed.textbox({
	parent: form,
	label: promptConstants["apiKey"],
	tags: true,
	keys: true,
	inputOnFocus: true,
	left: spacingConstants["left"],
	top: spacingConstants["apiKey"],
	border: {
		type: "line"
	},
	width: spacingConstants["width"],
	height: spacingConstants["height"],
	style: {
		focus: {
			border: {
				fg: styleConstants["borderFocused"],
			},
		},
		border: {
			fg: styleConstants["borderUnfocused"]
		},
	}
})

var secretEntryBox = blessed.textbox({
	parent: form,
	label: promptConstants["secret"],
	tags: true,
	keys: true,
	inputOnFocus: true,
	left: spacingConstants["left"],
	top: spacingConstants["secret"],
	border: {
		type: "line"
	},
	width: spacingConstants["width"],
	height: spacingConstants["height"],
	style: {
		focus: {
			border: {
				fg: styleConstants["borderFocused"],
			},
		},
		border: {
			fg: styleConstants["borderUnfocused"]
		},
	}
})

var passphraseEntryBox = blessed.textbox({
	parent: form,
	label: promptConstants["passphrase"],
	tags: true,
	keys: true,
	inputOnFocus: true,
	left: spacingConstants["left"],
	top: spacingConstants["passphrase"],
	border: {
		type: "line"
	},
	width: spacingConstants["width"],
	height: spacingConstants["height"],
	style: {
		focus: {
			border: {
				fg: styleConstants["borderFocused"],
			},
		},
		border: {
			fg: styleConstants["borderUnfocused"]
		},
	}
})

// Buttons

var login = blessed.button({
	parent: form,
	mouse: true,
	keys: true,
	shrink: true,
	right: 2,
	bottom: 1,
	padding: {
		left: 2,
		right: 2,
	},
	name: "login",
	content: "login",
	style: {
		bg: "blue",
		focus: {
			bg: "green",
			fg: "black"
		},
		hover: {
			bg: "green",
			fg: "black"
		}
	}
});

var cancel = blessed.button({
	parent: form,
	mouse: true,
	keys: true,
	shrink: true,
	left: 2,
	bottom: 1,
	padding: {
		left: 2,
		right: 2
	},
	name: "cancel",
	content: "cancel",
	style: {
		bg: "blue",
		focus: {
			bg: "red",
			fg: "black"
		},
		hover: {
			bg: "red",
			fg: "black"
		}
	}
});

// Set up credentials

var credentials = {
	"apiKey": "DEFAULT",
	"secret": "DEFAULT",
	"passphrase": "DEFAULT"
}

// TODO: Click Focus Actions

// keyEntryBox.on("click", function(data) {
// 	keyEntryBox.focus()
// });

// secretEntryBox.on("click", function(data) {
// 	secretEntryBox.focus()
// });

// passphraseEntryBox.on("click", function(data) {
// 	passphraseEntryBox.focus()
// });

// Tab Actions

keyEntryBox.on("submit", (text) => {
	log(text);
	credentials["apiKey"] = text;
	secretEntryBox.focus();
});

secretEntryBox.on("submit", (text) => {
	credentials["secret"] = text;
	passphraseEntryBox.focus();
});

passphraseEntryBox.on("submit", (text) => {
	credentials["passphrase"] = text;
	login.focus();
});

login.on("press", function() {
	log("Login Pressed.");
	credentials["apiKey"] = keyEntryBox.text;
	credentials["secret"] = secretEntryBox.text;
	credentials["passphrase"] = passphraseEntryBox.text;

	log(credentials["apiKey"]);
	log(credentials["secret"]);
	log(credentials["passphrase"]);
});

cancel.on("press", function() {
	process.exit(0);
});

// Quit
screen.key(["q", "C-c", "escape"], function() {
	process.exit(0);
});

form.focus();
// keyEntryBox.focus()
screen.render();
