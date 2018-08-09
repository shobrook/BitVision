let blessed = require("blessed");
let contrib = require("blessed-contrib");

let helpMenuData = [
  ["Keybinding", "Action"],
  ["---", "---"],
  // ["A", "Show account information."],
  ["L", "Login"],
  ["H", "Show help menu"],
  ["F", "Focus on headlines"],
  ["C", "Clear Credentials"],
  ["O", "Open article."],
  ["T", "Toggle automatic trading"],
];

let helpStrings = {
  autotrading: "## Automatic Trading\n\n 1. Enter account credentials \n 2. Press \`T\` to toggle this option.\n 3. Enter the max amount you\"d like to trade.\n 3.5. Watch our algorithm trade BTC for you.\n 4. Profit",
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
      height: 36,
      border: "line",
      style: {
        border: {
          fg: "blue"
        }
      },
    });

    var keybindingsTable = blessed.listtable({
      parent: helpMenuLayout,
      interactive: false,
      top: "center",
      left: "center",
      data: helpMenuData,
      border: "line",
      pad: 2,
      width: 53,
      height: 10,
      style: {
        border: {
          fg: "bright-blue"
        },
        header: {
          fg: "bright-green",
          bold: true,
          underline: true,
        },
        cell: {
          fg: "yellow",
        }
      }
    });

    var exitTextBox = blessed.box({
      parent: helpMenuLayout,
      width: 25,
      height: 5,
      left: "right",
      top: "center",
      padding: {
        left: 2,
        right: 2,
      },
      border: "line",
      style: {
        fg: "white",
        border: {
          fg: "red",
        }
      },
      content: `Press Q to close.\n\nVersion: ${version}`
    });

    var largeTextBox = blessed.box({
      parent: helpMenuLayout,
      width: 78,
      height: 24,
      left: "center",
      top: "center",
      padding: {
        left: 2,
        right: 2,
      },
      border: "line",
      style: {
        fg: "bright-green",
        border: {
          fg: "bright-blue",
        }
      },
      content: helpStrings["autotrading"] + helpStrings["authors"] + helpStrings["warning"] + helpStrings["source"]
    });

    screen.key(["q", "Q"], function(ch, key) {
      // console.log("destroy")
      helpMenuLayout.destroy();
      screen.render();
    });
  }
};
