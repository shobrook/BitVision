let blessed = require("blessed");

var toggleForm = null;

let colors = {
  background: "#54757c",
  confirmDark: "light-blue",
  confirmLight: "blue",
  cancelDark: "light-red",
  cancelLight: "red",
}

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
      bg: colors.background,
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
        bg: colors.background,
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
        bg: colors.confirmDark,
        focus: {
          bg: colors.confirmLight,
          fg: "black"
        },
        hover: {
          bg: colors.confirmLight,
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
        bg: colors.cancelDark,
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
