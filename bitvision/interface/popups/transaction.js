var blessed = require("blessed");
let constants = require("../constants");

// CONSTANTS
let spacing = {
  side: 4,
  top: 5,
};

let transactionStrings = {
  label: "Trade BTC",
  hint: "Select an option and enter an amount."
}

//  FUNCTIONS

/**
 * Checks if n is a valid, tradable BTC amount.
 * Must be numeric and positive.
 *
 * @return {Bool} True if valid, or false otherwise.
 */
function isValidInput(n) {
  if (n === "") {
    return false;
  }

  let num = parseFloat(n);
  return !isNaN(num) && isFinite(num) && num > 0;
}

var transactionForm = null;

module.exports = {
  /**
   * Creates a transaction screen.
   * @param  {[type]} screen Parent screen
   * @return {Dict}        Dict of creds, or null if no creds entered
   */
  createTransactionScreen: function(screen, callback) {
    var transactionForm = blessed.form({
      parent: screen,
      keys: true,
      type: "overlay",
      top: "center",
      left: "center",
      width: 45,
      height: 14,
      bg: constants.colors.background,
      color: "white",
    });

    let label = blessed.box({
      parent: transactionForm,
      top: 1,
      left: 18,
      width: 16,
      height: 1,
      content: transactionStrings.label,
      style: {
        bg: constants.colors.background,
        fg: "white",
        bold: true
      },
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
      style: {
        bg: constants.colors.background,
        fg: "white",
      },
      tags: true
    });

    // Radio buttons
    var radioSet = blessed.radioset({
      parent: transactionForm,
      left: "center",
      width: 28,
      top: 3,
      shrink: true,
      padding: 1,
      style: {
        bg: constants.colors.background,
        // fg: 'red'
      }
    });

    var buyRadio = blessed.radiobutton({
      parent: radioSet,
      mouse: true,
      keys: true,
      shrink: true,
      style: {
        bg: constants.colors.background
      },
      height: 1,
      left: 0,
      top: 0,
      name: 'Buy BTC',
      content: 'Buy BTC'
    });

    var sellRadio = blessed.radiobutton({
      parent: radioSet,
      mouse: true,
      keys: true,
      shrink: true,
      style: {
        bg: constants.colors.background
      },
      height: 1,
      left: 14,
      top: 0,
      name: 'Sell BTC',
      content: 'Sell BTC'
    });

    // Input Box
    var amountEntryBox = blessed.textbox({
      parent: transactionForm,
      label: " {bold}{blue-fg}BTC Amount{/bold}{/blue-fg} ",
      tags: true,
      keys: true,
      inputOnFocus: true,
      left: spacing.side,
      top: 6,
      border: {
        type: "line"
      },
      width: 37,
      height: 3,
      style: {
        focus: {
          border: {
            fg: constants.colors.textFieldBorderFocused,
          },
        },
        border: {
          fg: constants.colors.textFieldBorderUnfocused
        },
      }
    });

    // Submit/Cancel Buttons
    var submit = blessed.button({
      parent: transactionForm,
      mouse: true,
      keys: true,
      shrink: true,
      right: spacing.side,
      bottom: 1,
      padding: {
        left: 4,
        right: 4,
        top: 1,
        bottom: 1
      },
      name: "submit",
      content: "submit",
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

    var cancel = blessed.button({
      parent: transactionForm,
      mouse: true,
      keys: true,
      shrink: true,
      left: spacing.side,
      bottom: 1,
      padding: {
        left: 4,
        right: 4,
        top: 1,
        bottom: 1
      },
      name: "cancel",
      content: "cancel",
      style: {
        bg: constants.colors.cancelLight,
        fg: "black",
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
      transactionForm.focusNext();
    })

    submit.on("press", function() {
      // console.log("Submit Pressed.");
      let amount = amountEntryBox.content;
      let type = buyRadio.checked ? "BUY" : "SELL";

      if (isValidInput(amount)) {
        callback(amount, type);
        transactionForm.destroy();
      } else {
        // console.log("Invalid input.");
        amountEntryBox.setValue("");
        amountEntryBox.style.border.fg = "red";
      }
    });

    cancel.on("press", function() {
      transactionForm.destroy();
    });

    screen.key(["q", "Q"], function(ch, key) {
      transactionForm.destroy();
    });

    buyRadio.check();
    transactionForm.focus();
    screen.render();
  }
}
