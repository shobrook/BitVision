/* NOW DEPRECATED */

// GLOBALS //

const blessed = require("blessed");
const { colorScheme } = require("../constants");

// MAIN //

module.exports.createToggleScreen = (screen, callback) => {
  let toggleForm = null;
  toggleForm = blessed.form({
    parent: screen,
    keys: true,
    type: "overlay",
    top: "center",
    left: "center",
    width: 35,
    height: 5,
    bg: colorScheme.background,
    color: "white"
  });

  let label = blessed.box({
    parent: toggleForm,
    top: 1,
    left: 2,
    width: 33,
    height: 1,
    content: " Set automatic trading status. ",
    style: { bg: colorScheme.background, fg: "white", bold: true },
    tags: true
  });

  // Buttons
  let enable = blessed.button({
    parent: toggleForm,
    mouse: true,
    keys: true,
    shrink: true,
    right: 3,
    bottom: 1,
    padding: { left: 2, right: 2 },
    name: "enable",
    content: "enable",
    style: {
      bg: colorScheme.confirmLight,
      focus: { bg: colorScheme.confirmDark, fg: "black" },
      hover: { bg: colorScheme.confirmDark, fg: "black" }
    }
  });

  let disable = blessed.button({
    parent: toggleForm,
    mouse: true,
    keys: true,
    shrink: true,
    left: 3,
    bottom: 1,
    padding: { left: 2, right: 2 },
    name: "disable",
    content: "disable",
    style: {
      bg: colorScheme.cancelLight,
      focus: { bg: colorScheme.cancelDark, fg: "black" },
      hover: { bg: colorScheme.cancelDark, fg: "black" }
    }
  });

  screen.on("tab", text => toggleForm.focusNext());

  enable.on("press", () => {
    callback(true);
    toggleForm.destroy();
  });

  disable.on("press", () => {
    callback(false);
    toggleForm.destroy();
  });

  screen.key(["q", "Q"], (ch, key) => toggleForm.destroy());

  toggleForm.focus();
  screen.render();
};
