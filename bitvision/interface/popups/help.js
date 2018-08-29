let blessed = require("blessed");
let contrib = require("blessed-contrib");
let constants = require("../constants")

let helpMenuData = [
  ["Keybinding", "Action"],
  // ["---", "---"],
  ["A", "Autotrading Toggle"],
  ["F", "Focus on headlines"],
  ["L", "Bitstamp Login"],
  ["K", "Logout"],
  ["T", "Trade BTC"],
  ["O", "Open article."],
  ["R", "Refresh data"],
  ["C-c", "Exit"]
];

let helpStrings = {
  autotrading: "## Automatic Trading\n\n 1. Login to Bitstamp and press \`A\` and enable autotrading.\n 2. Watch our algorithm trade BTC for you.\n 3. ???\n 4. Profit (or deep regret and resentment)",
  authors: "\n\n## Authors\n\n Written by Jon Shobrook and Aaron Lichtman.\n -> https://www.github.com/shobrook\n -> https://www.github.com/alichtman",
  warning: "\n\n## Warning\n\n Use this software to trade bitcoin at your own risk.\n We are not responsible if our algorithm misbehaves.",
  source: "\n\n## Source Code\n\n -> https://github.com/shobrook/BitVision"
};

var helpMenuLayout = null;

module.exports = {
  /**
   * Creates a help screen.
   * @param  {[type]} screen Parent screen
   */
  createHelpScreen: function(screen, version, callback) {
    helpMenuLayout = blessed.layout({
      parent: screen,
      top: "center",
      left: "center",
      width: 80,
      height: 34,
      // border: "line",
      style: {
        border: {
          // fg: "blue",
          bg: constants.colors.background,
        },
        bg: constants.colors.background,
      },
    });

    var keybindingsTable = blessed.ListTable({
      parent: helpMenuLayout,
      interactive: false,
      top: "center",
      left: "center",
      data: helpMenuData,
      border: "line",
      align: "center",
      pad: 2,
      width: 53,
      height: 12,
      style: {
        bg: constants.colors.background,
        border: {
          fg: "bright-blue",
          bg: constants.colors.background,
        },
        header: {
          fg: "bright-red",
          bg: constants.colors.background,
          bold: true,
          // underline: true,
        },
        cell: {
          fg: "yellow",
          bg: constants.colors.background,
        }
      }
    });

    var exitTextBox = blessed.box({
      parent: helpMenuLayout,
      width: 24,
      height: 5,
      left: "right",
      top: "center",
      padding: {
        left: 4,
        right: 4,
      },
      border: "line",
      style: {
        fg: "white",
        bg: constants.colors.background,
        border: {
          fg: "red",
          bg: constants.colors.background,
        }
      },
      content: `Press Q to close.\n\nVersion: ${version}`
    });

    var largeTextBox = blessed.box({
      parent: helpMenuLayout,
      width: 78,
      height: 21,
      left: "center",
      top: "center",
      padding: {
        left: 10,
        right: 2,
      },
      // border: "line",
      style: {
        fg: "orange",
        bg: constants.colors.background,
        border: {
          // fg: "bright-blue",
          bg: constants.colors.background,
        }
      },
      content: helpStrings["autotrading"] + helpStrings["authors"] + helpStrings["warning"] + helpStrings["source"]
    });

    screen.key(["q", "Q"], function(ch, key) {
      helpMenuLayout.destroy();
      screen.render();
    });
  }
};
