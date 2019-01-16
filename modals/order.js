// GLOBALS //

const blessed = require("blessed");
const { colorScheme } = require("../constants");

const spacing = { side: 4, top: 5 };
const transactionStrings = {
  label: "Trade BTC",
  hint: "Select an option and enter an amount."
};

// UTILITIES //

function isValidInput(n) {
  // Order amount must be numeric
  if (n === "") {
    return false;
  }

  // Order amount must be positive
  let num = parseFloat(n);
  return !isNaN(num) && isFinite(num) && num > 0;
}

// MAIN //

module.exports.createOrderScreen = (screen, callback) => {
  let transactionForm = null;
  transactionForm = blessed.form({
    parent: screen,
    keys: true,
    type: "overlay",
    top: "center",
    left: "center",
    width: 45,
    height: 14,
    bg: colorScheme.background,
    color: "white"
  });

  let label = blessed.box({
    parent: transactionForm,
    top: 1,
    left: 18,
    width: 16,
    height: 1,
    content: transactionStrings.label,
    style: { bg: colorScheme.background, fg: "white", bold: true },
    tags: true
  });

  let hint = blessed.box({
    parent: transactionForm,
    top: 2,
    left: 1,
    width: 42,
    height: 1,
    shrink: true,
    content: transactionStrings.hint,
    style: { bg: colorScheme.background, fg: "white" },
    tags: true
  });

  // Buy/Sell Options

  var radioSet = blessed.radioset({
    parent: transactionForm,
    left: "center",
    width: 28,
    top: 3,
    shrink: true,
    padding: 1,
    style: { bg: colorScheme.background /*fg: 'red'*/ }
  });

  var buyRadio = blessed.radiobutton({
    parent: radioSet,
    mouse: true,
    keys: true,
    shrink: true,
    style: { bg: colorScheme.background },
    height: 1,
    left: 0,
    top: 0,
    name: "Buy BTC",
    content: "Buy BTC"
  });

  var sellRadio = blessed.radiobutton({
    parent: radioSet,
    mouse: true,
    keys: true,
    shrink: true,
    style: { bg: colorScheme.background },
    height: 1,
    left: 14,
    top: 0,
    name: "Sell BTC",
    content: "Sell BTC"
  });

  // Input Field

  var amountEntryBox = blessed.textbox({
    parent: transactionForm,
    label: " {bold}{blue-fg}BTC Amount{/bold}{/blue-fg} ",
    tags: true,
    keys: true,
    inputOnFocus: true,
    left: spacing.side,
    top: 6,
    border: { type: "line" },
    width: 37,
    height: 3,
    style: {
      focus: { border: { fg: colorScheme.textFieldBorderFocused } },
      border: { fg: colorScheme.textFieldBorderUnfocused }
    }
  });

  // CTA

  let buttonPadding = { left: 4, right: 4, top: 1, bottom: 1 };

  var submit = blessed.button({
    parent: transactionForm,
    mouse: true,
    keys: true,
    shrink: true,
    right: spacing.side,
    bottom: 1,
    padding: buttonPadding,
    name: "submit",
    content: "submit",
    style: {
      bg: colorScheme.confirmLight,
      fg: "black",
      focus: { bg: colorScheme.confirmDark, fg: "black" },
      hover: { bg: colorScheme.confirmDark, fg: "black" }
    }
  });

  var cancel = blessed.button({
    parent: transactionForm,
    mouse: true,
    keys: true,
    shrink: true,
    left: spacing.side,
    bottom: 1,
    padding: buttonPadding,
    name: "cancel",
    content: "cancel",
    style: {
      bg: colorScheme.cancelLight,
      fg: "black",
      focus: { bg: colorScheme.cancelDark, fg: "black" },
      hover: { bg: colorScheme.cancelDark, fg: "black" }
    }
  });

  // Event Handlers

  submit.on("press", () => {
    let amount = amountEntryBox.content;
    let type = buyRadio.checked ? "BUY" : "SELL";

    if (isValidInput(amount)) {
      callback(amount, type);
      transactionForm.destroy();
    } else {
      amountEntryBox.setValue("");
      amountEntryBox.style.border.fg = "red";
    }
  });

  cancel.on("press", () => transactionForm.destroy());
  screen.on("tab", text => transactionForm.focusNext());
  screen.key(["escape"], (ch, key) => transactionForm.destroy());

  buyRadio.check();
  transactionForm.focus();
  screen.render();
};
