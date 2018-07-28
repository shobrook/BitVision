let blessed = require("blessed");

let loginSpacingConstants = {
	"height": 3,
	"width": 26,
	"left": 2,
	"apiKey": 4,
	"secret": 8,
	"passphrase": 12
}

let loginStrings = {
	"apiKey": " {bold}{blue-fg}API Key{/bold}{/blue-fg} ",
	"passphrase": " {bold}{blue-fg}Passphrase{/bold}{/blue-fg} ",
	"secret": " {bold}{blue-fg}Secret{/bold}{/blue-fg} "
}

// Global functions

var enteredCreds = {
	"apiKey": "DEFAULT",
	"secret": "DEFAULT",
	"passphrase": "DEFAULT"
}

/**
* Checks enteredCreds for DEFAULT or "" values.
* @return {Bool}   Returns true if all values have been changed, false if invalid.
*/
function validateEnteredLoginCreds() {
	for (var key in enteredCreds) {
		if (enteredCreds.hasOwnProperty(key)) {
			if (enteredCreds[key] == "DEFAULT" || enteredCreds[key] == "") {
				return false;
			}
		}
	}
	return true;
}

/**
* Takes key for loginStrings dict and returns the respective prompt box.
*/
function createPromptBox(key) {
	return blessed.textbox({
		parent: form,
		label: loginStrings[key],
		tags: true,
		keys: true,
		inputOnFocus: true,
		left: loginSpacingConstants["left"],
		top: loginSpacingConstants[key],
		border: {
			type: "line"
		},
		width: loginSpacingConstants["width"],
		height: loginSpacingConstants["height"],
		style: {
			focus: {
				border: {
					fg: "green",
				},
			},
			border: {
				fg: "#f0f0f0"
			},
		}
	})
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
})

// Add text to body (replacement for console.log)
const log = (text) => {
	body.pushLine(text);
	screen.render();
}

screen.append(body);

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
	width: 27,
	height: 1,
	shrink: true,
	content: " Press tab to start entry. ",
	style: {
		fg: "white",
	},
	tags: true
});

// Input Boxes for Key, Passphrase and Secret

var keyEntryBox = createPromptBox("apiKey");
var secretEntryBox = createPromptBox("secret");
var passphraseEntryBox = createPromptBox("passphrase");

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

screen.on("tab", (text) => {
	form.focusNext();
})

login.on("press", function() {
	log("Login Pressed.");
	enteredCreds.apiKey = keyEntryBox.content;
	enteredCreds.secret = secretEntryBox.content;
	enteredCreds.passphrase = passphraseEntryBox.content;

	console.log(enteredCreds.apiKey);
	console.log(enteredCreds.secret);
	console.log(enteredCreds.passphrase);

	if (validateEnteredLoginCreds()) {
		// TODO: Write values to credentials file and login.
	} else {
		log("Invalid input.");
		keyEntryBox.content = "";
		secretEntryBox.content = "";
		passphraseEntryBox.content = "";
		keyEntryBox.style.border.fg = "red";
		secretEntryBox.style.border.fg = "red";
		passphraseEntryBox.style.border.fg = "red";
	}
});

cancel.on("press", function() {
	process.exit(0);
});

// Quit
screen.key(["q", "C-c", "escape"], function() {
	process.exit(0);
});

form.focus();
screen.render();
