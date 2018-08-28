let blessed = require("blessed");
let constants = require("../constants.js");

var toggleForm = null;


module.exports = {
  /**
   * Creates a toggle settings screen for enabling or disabling trading.
   */
  createToggleScreen: function(screen, callback) {
    var toggleForm = blessed.form({
      parent: screen,
      keys: true,
      type: "overlay",
      top: "center",
      left: "center",
      width: 35,
      height: 5,
      bg: constants.colors.background,
      color: "white",
    });

    let label = blessed.box({
      parent: toggleForm,
      top: 1,
      left: 2,
      width: 33,
      height: 1,
      content: " Set automatic trading status. ",
      style: {
        bg: constants.colors.background,
        fg: "white",
        bold: true
      },
      tags: true
    });

    // Buttons
    var enable = blessed.button({
      parent: toggleForm,
      mouse: true,
      keys: true,
      shrink: true,
      right: 3,
      bottom: 1,
      padding: {
        left: 2,
        right: 2,
      },
      name: "enable",
      content: "enable",
      style: {
        bg: constants.colors.confirmLight,
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

    var disable = blessed.button({
      parent: toggleForm,
      mouse: true,
      keys: true,
      shrink: true,
      left: 3,
      bottom: 1,
      padding: {
        left: 2,
        right: 2
      },
      name: "disable",
      content: "disable",
      style: {
        bg: constants.colors.cancelLight,
        focus: {
          bg: constants.colors.cancelDark,
          fg: "black"
        },
        hover: {
          bg: constants.colors.cancelDark,
          fg: "black"
        }
      }
    });

    screen.on("tab", (text) => {
      toggleForm.focusNext();
    })

    enable.on("press", function() {
      console.log("Trading enabled.");
      callback(true);
      toggleForm.destroy();
    });

    disable.on("press", function() {
      console.log("Trading disabled.");
      callback(false);
      toggleForm.destroy();
    });

    screen.key(["q", "Q"], function(ch, key) {
      toggleForm.destroy();
    });

    toggleForm.focus();
    screen.render();
  }
}
