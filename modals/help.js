// GLOBALS //

const blessed = require("blessed");
const contrib = require("blessed-contrib");

const helpMenuData = [
  ["Keybinding", "Action"],
  ["---", "---"],
  ["A", "Autotrading Toggle"],
  ["L", "Bitstamp Login"],
  ["K", "Logout"],
  ["T", "Trade BTC"],
  ["C-c", "Exit"]
];

const helpStrings = {
  autotrading:
    "## Automatic Trading\n\n 1. Login to Bitstamp and press `A` and enable autotrading.\n 2. Watch our algorithm trade BTC for you.\n 3. ???\n 4. Profit (or deep regret and resentment)",
  authors:
    "\n\n## Authors\n\n Written by Jon Shobrook and Aaron Lichtman.\n -> https://www.github.com/shobrook\n -> https://www.github.com/alichtman",
  warning:
    "\n\n## Warning\n\n Use this software to trade bitcoin at your own risk.\n We are not responsible if our algorithm misbehaves.",
  source: "\n\n## Source Code\n\n -> https://github.com/shobrook/BitVision"
};

// MAIN //

module.exports.createHelpScreen = (screen, version, callback) => {
  let helpMenuLayout = null;
  helpMenuLayout = blessed.layout({
    parent: screen,
    top: "center",
    left: "center",
    width: 80,
    height: 34,
    border: "line",
    style: { border: { fg: "blue" } }
  });

  let keybindingsTable = blessed.listtable({
    parent: helpMenuLayout,
    interactive: false,
    top: "center",
    left: "center",
    data: helpMenuData,
    border: "line",
    align: "center",
    pad: 2,
    width: 53,
    height: 9,
    style: {
      border: { fg: "bright-blue" },
      header: { fg: "bright-green", bold: true, underline: true },
      cell: { fg: "yellow" }
    }
  });

  let exitTextBox = blessed.box({
    parent: helpMenuLayout,
    width: 25,
    height: 5,
    left: "right",
    top: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "red", border: { fg: "bright-blue" } },
    content: `Press Q to close.\n\nVersion: ${version}`
  });

  let largeTextBox = blessed.box({
    parent: helpMenuLayout,
    width: 78,
    height: 23,
    left: "center",
    top: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "bright-green", border: { fg: "bright-blue" } },
    content:
      helpStrings["autotrading"] +
      helpStrings["warning"] +
      helpStrings["authors"] +
      helpStrings["source"]
  });

  screen.key(["escape"], (ch, key) => {
    helpMenuLayout.destroy();
    callback();
  });
};
