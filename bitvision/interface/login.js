let blessed = require("blessed");

// CONSTANTS
let loginSpacingConstants = {
  height: 3,
  width: 36,
  left: 4,
  right: 5,
  top: 1,
  "apiKey": 4,
  "secret": 8,
  "passphrase": 12
};

let loginStrings = {
  apiKey: " {bold}{blue-fg}API Key{/bold}{/blue-fg} ",
  passphrase: " {bold}{blue-fg}Passphrase{/bold}{/blue-fg} ",
  secret: " {bold}{blue-fg}Secret{/bold}{/blue-fg} ",
  label: " Bitstamp Login ",
  hint: " Press tab to start entry. "
};

let colors = {
  textFieldBorderFocused: "green",
  textFieldBorderUnfocused: "#f0f0f0",
  background: "#27474e",
  confirmDark: "light-blue",
  confirmLight: "blue",
  cancelDark: "light-red",
  cancelLight: "red",
}

// GLOBALS

var enteredCreds = {
  "apiKey": "",
  "secret": "",
  "passphrase": ""
};

//  FUNCTIONS

/**
 * Checks enteredCreds for DEFAULT or "" values.
 * @return {Bool}   Returns true if all values have been changed, false if invalid.
 */
function validateEnteredLoginCreds() {
  for (var key in enteredCreds) {
    if (enteredCreds.hasOwnProperty(key)) {
      if (enteredCreds[key] === "") {
        return false;
      }
    }
  }
  return true;
}

/**
 * Takes key for loginStrings dict and returns the respective prompt box.
 */
function createPromptBox(form, key) {
  return blessed.textbox({
    parent: form,
    label: loginStrings[key],
    tags: true,
    keys: true,
    inputOnFocus: true,
    left: loginSpacingConstants.left,
    top: loginSpacingConstants[key],
    border: {
      type: "line"
    },
    width: loginSpacingConstants.width,
    height: loginSpacingConstants.height,
    style: {
      focus: {
        border: {
          fg: colors.textFieldBorderFocused,
        },
      },
      border: {
        fg: colors.textFieldBorderUnfocused
      },
    }
  });
};

var loginForm = null;

module.exports = {
  /**
   * Creates a login screen. Returns dict of creds, or null if no creds entered.
   * @param  {[type]} screen Parent screen
   * @return {Dict}        Dict of creds, or null if no creds entered
   */
  createLoginScreen: function(screen, callback) {
    var loginForm = blessed.form({
      parent: screen,
      keys: true,
      type: "overlay",
      top: "center",
      left: "center",
      width: 45,
      height: 20,
      bg: colors.background,
      color: "white",
    });

    let label = blessed.box({
      parent: loginForm,
      top: 1,
      left: "center",
      width: 16,
      height: 1,
      content: loginStrings.label,
      style: {
        bg: "#27474e",
        fg: "green",
        bold: true
      },
      tags: true
    });

    let hint = blessed.box({
      parent: loginForm,
      top: 2,
      left: "center",
      width: 27,
      height: 1,
      shrink: true,
      content: loginStrings.hint,
      style: {
        bg: "#27474e",
        fg: "white",
      },
      tags: true
    });

    // Input Boxes
    var keyEntryBox = createPromptBox(loginForm, "apiKey");
    var secretEntryBox = createPromptBox(loginForm, "secret");
    var passphraseEntryBox = createPromptBox(loginForm, "passphrase");

    // Buttons
    var login = blessed.button({
      parent: loginForm,
      mouse: true,
      keys: true,
      shrink: true,
      right: loginSpacingConstants.right,
      bottom: 1,
      padding: {
        left: 4,
        right: 4,
        top: 1,
        bottom: 1
      },
      name: "login",
      content: "login",
      style: {
        bg: colors.confirmDark,
        fg: "white",
        focus: {
          bg: colors.confirmLight,
          fg: "white"
        },
        hover: {
          bg: colors.confirmLight,
          fg: "white"
        }
      }
    });

    var cancel = blessed.button({
      parent: loginForm,
      mouse: true,
      keys: true,
      shrink: true,
      left: loginSpacingConstants.left,
      bottom: 1,
      padding: {
        left: 4,
        right: 4,
        top: 1,
        bottom: 1
      },
      name: "cancel",
      content: "cancel",
      style: {
        bg: colors.cancelDark,
        fg: "black",
        focus: {
          bg: colors.cancelLight,
          fg: "black"
        },
        hover: {
          bg: colors.cancelLight,
          fg: "black"
        }
      }
    });

    screen.on("tab", (text) => {
      loginForm.focusNext();
    })

    login.on("press", function() {
      // console.log("Login Pressed.");
      enteredCreds.apiKey = keyEntryBox.content;
      enteredCreds.secret = secretEntryBox.content;
      enteredCreds.passphrase = passphraseEntryBox.content;

      if (validateEnteredLoginCreds()) {
        callback(enteredCreds);
        loginForm.destroy();
      } else {
        // console.log("Invalid input.");
        keyEntryBox.setValue("");
        secretEntryBox.setValue("");
        passphraseEntryBox.setValue("");
        keyEntryBox.style.border.fg = "red";
        secretEntryBox.style.border.fg = "red";
        passphraseEntryBox.style.border.fg = "red";
      }
    });

    cancel.on("press", function() {
      loginForm.destroy();
    });

    screen.key(["q", "Q"], function(ch, key) {
      loginForm.destroy();
    });

    loginForm.focus();
    screen.render();
  }
}
