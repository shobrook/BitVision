let blessed = require("blessed");
let constants = require("../constants.js");

let errorStrings =  {
    label: " {bold}{red-fg}Error{/bold}{/red-fg} ",
    hint: " {bold}Check your connection or credentials.{/bold} "
  }

var errorForm = null;

module.exports = {
  /**
   * Creates error screen.
   * @param  {[type]} screen Parent screen
   */
  createErrorScreen: function(screen) {
    var errorForm = blessed.form({
      parent: screen,
      keys: true,
      type: "overlay",
      top: "center",
      left: "center",
      width: 45,
      height: 8,
      bg: constants.colors.background,
      color: "white",
    });

    let label = blessed.box({
      parent: errorForm,
      top: 1,
      left: "center",
      width: 6,
      height: 1,
      content: errorStrings.label,
      style: {
        bg: constants.colors.background,
        fg: "white",
        bold: true
      },
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
      style: {
        bg: constants.colors.background,
        fg: "black",
      },
      tags: true
    });

    // Buttons
    var okayButton = blessed.button({
      parent: errorForm,
      mouse: true,
      keys: true,
      shrink: true,
      right: 5,
      bottom: 1,
      padding: {
        left: 4,
        right: 4,
        top: 1,
        bottom: 1
      },
      name: "okay",
      content: "okay",
      style: {
        bg: constants.colors.confirmLight,
        fg: "black",
        focus: {
          bg: constants.colors.confirmDark,
          fg: "black"
        },
        hover: {
          bg: constants.colors.confirmDark,
          fg: "black"
        }
      }
    });

    okayButton.on("press", function() {
      errorForm.destroy();
    });

    screen.key(["q"], function(ch, key) {
      errorForm.destroy();
    });

    okayButton.focus();
    screen.render();
  }
}
