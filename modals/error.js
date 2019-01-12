// GLOBALS //

const blessed = require("blessed");
const { colorScheme } = require("../constants");

const errorStrings = {
  label: " {bold}{red-fg}Error{/bold}{/red-fg} ",
  hint: " {bold}Check your connection or credentials.{/bold} "
};

// MAIN //

module.exports.createErrorScreen = screen => {
  let errorForm = null;
  errorForm = blessed.form({
    parent: screen,
    keys: true,
    type: "overlay",
    top: "center",
    left: "center",
    width: 45,
    height: 8,
    bg: colorScheme.background,
    color: "white"
  });

  let label = blessed.box({
    parent: errorForm,
    top: 1,
    left: "center",
    width: 6,
    height: 1,
    content: errorStrings.label,
    style: { bg: colorScheme.background, fg: "white", bold: true },
    tags: true
  });

  let hint = blessed.box({
    parent: errorForm,
    top: 2,
    left: "center",
    width: 38,
    height: 3,
    shrink: true,
    content: errorStrings.hint,
    style: { bg: colorScheme.background, fg: "black" },
    tags: true
  });

  // Buttons
  let okayButton = blessed.button({
    parent: errorForm,
    mouse: true,
    keys: true,
    shrink: true,
    right: 5,
    bottom: 1,
    padding: { left: 4, right: 4, top: 1, bottom: 1 },
    name: "okay",
    content: "okay",
    style: {
      bg: colorScheme.confirmLight,
      fg: "black",
      focus: { bg: colorScheme.confirmDark, fg: "black" },
      hover: { bg: colorScheme.confirmDark, fg: "black" }
    }
  });

  okayButton.on("press", () => errorForm.destroy());
  screen.key(["q", "Q"], (ch, key) => errorForm.destroy());

  okayButton.focus();
  screen.render();
};
