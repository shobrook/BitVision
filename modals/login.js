// GLOBALS //

const blessed = require("blessed");
const { colorScheme } = require("../constants");

const spacing = {
  height: 3,
  width: 36,
  left: 4,
  right: 5,
  top: 1,
  key: 8,
  secret: 12,
  username: 4
};

const loginStrings = {
  username: " {bold}{blue-fg}Username{/bold}{/blue-fg} ",
  key: " {bold}{blue-fg}API Key{/bold}{/blue-fg} ",
  secret: " {bold}{blue-fg}Secret{/bold}{/blue-fg} ",
  label: " Bitstamp Login ",
  hint: " Press tab to start entry. "
};

var enteredCreds = { key: "", secret: "", username: "" };

// UTILITIES //

function nonEmptyLoginCreds() {
  for (let key in enteredCreds) {
    if (enteredCreds.hasOwnProperty(key)) {
      // Checks for empty values
      if (!enteredCreds[key]) {
        return false;
      }
    }
  }

  return true;
}

function createPromptBox(form, key) {
  // Creates input field for a given key of loginStrings
  return blessed.textbox({
    parent: form,
    label: loginStrings[key],
    tags: true,
    keys: true,
    inputOnFocus: true,
    left: spacing.left,
    top: spacing[key],
    border: { type: "line" },
    width: spacing.width,
    height: spacing.height,
    style: {
      focus: { border: { fg: colorScheme.textFieldBorderFocused } },
      border: { fg: colorScheme.textFieldBorderUnfocused }
    }
  });
}

// MAIN //

module.exports.createLoginScreen = (screen, callback) => {
  let loginForm = null;
  loginForm = blessed.form({
    parent: screen,
    keys: true,
    type: "overlay",
    top: "center",
    left: "center",
    width: 45,
    height: 20,
    bg: colorScheme.background,
    color: "white"
  });

  let label = blessed.box({
    parent: loginForm,
    top: 1,
    left: "center",
    width: 16,
    height: 1,
    content: loginStrings.label,
    style: { bg: colorScheme.background, fg: "white", bold: true },
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
    style: { bg: colorScheme.background, fg: "white" },
    tags: true
  });

  // Input Boxes

  let usernameEntryBox = createPromptBox(loginForm, "username");
  let keyEntryBox = createPromptBox(loginForm, "key");
  let secretEntryBox = createPromptBox(loginForm, "secret");

  function destroyModal() {
    keyEntryBox.destroy();
    secretEntryBox.destroy();
    usernameEntryBox.destroy();
    loginForm.destroy();
  }

  // Buttons
  let login = blessed.button({
    parent: loginForm,
    mouse: true,
    keys: true,
    shrink: true,
    right: spacing.right,
    bottom: 1,
    padding: { left: 4, right: 4, top: 1, bottom: 1 },
    name: "login",
    content: "login",
    style: {
      bg: colorScheme.confirmLight,
      fg: "black",
      focus: { bg: colorScheme.confirmDark, fg: "black" },
      hover: { bg: colorScheme.confirmDark, fg: "black" }
    }
  });

  let cancel = blessed.button({
    parent: loginForm,
    mouse: true,
    keys: true,
    shrink: true,
    left: spacing.left,
    bottom: 1,
    padding: { left: 4, right: 4, top: 1, bottom: 1 },
    name: "cancel",
    content: "cancel",
    style: {
      bg: colorScheme.cancelLight,
      fg: "black",
      focus: { bg: colorScheme.cancelDark, fg: "black" },
      hover: { bg: colorScheme.cancelDark, fg: "black" }
    }
  });

  screen.on("tab", text => loginForm.focusNext());

  // keyEntryBox.on("click", function(data) {
  //   secretEntryBox.unfocus;
  //   keyEntryBox.focus();
  // });
  // secretEntryBox.on("click", data => secretEntryBox.focus());
  // usernameEntryBox.on("click", data => usernameEntryBox.focus());

  login.on("press", () => {
    enteredCreds = {
      key: keyEntryBox.content,
      secret: secretEntryBox.content,
      username: usernameEntryBox.content
    };

    if (nonEmptyLoginCreds()) {
      callback(enteredCreds);
      destroyModal();
    } else {
      keyEntryBox.setValue("");
      secretEntryBox.setValue("");
      usernameEntryBox.setValue("");
      keyEntryBox.style.border.fg = "red";
      secretEntryBox.style.border.fg = "red";
      usernameEntryBox.style.border.fg = "red";
    }
  });

  cancel.on("press", () => destroyModal());
  screen.key(["escape"], () => destroyModal());

  loginForm.focus();
  screen.render();
};
