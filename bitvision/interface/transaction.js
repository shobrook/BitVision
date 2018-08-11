var blessed = require("blessed");

let transactionStrings = {
  "buyLabel": " Buy BTC ",
  "sellLabel": " Sell BTC ",
  "buyText": "{bold}How much BTC do you want to buy?{/bold}\n Please enter a {bold}number{/bold}.",
  "sellText": "{bold}How much BTC do you want to sell?{/bold}\n Please enter a {bold}number{/bold}.",
  "invalid": "Invalid input. Press Enter to exit."
};

// FUNCTIONS

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

/**
 * Create prompt for buy and sell orders. Returns prompt.
 * @param  {[type]} screen     [description]
 * @param  {[type]} popupLabel [description]
 */
function createPrompt(screen, popupLabel) {
  return blessed.prompt({
    parent: screen,
    border: "line",
    height: 9,
    width: 45,
    top: "center",
    left: "center",
    label: popupLabel,
    tags: true,
    keys: true,
    style: {
      fg: "blue",
      border: {
        fg: "light-green"
      }
    }
  });
}

module.exports = {

  createBuyTransactionPopup: function(screen, callback) {
    var prompt = createPrompt(screen, transactionStrings.buyLabel);

    prompt.input(transactionStrings.buyText, "", function(err, value) {
      if (!isValidInput(value)) {
        // console.log("INVALID INPUT");
        prompt.setInput(transactionStrings.buyText, transactionStrings.invalid, () => {
          prompt.destroy();
        });
      } else {
        // Do something with the trade amount.
        callback(value);
        prompt.destroy();
      }
    });

    screen.key(["q", "C-c"], () => {
      screen.destroy();
    });

    screen.render();
  },

  createSellTransactionPopup: function(screen, callback) {
    var prompt = createPrompt(screen, transactionStrings.sellLabel);

    prompt.input(transactionStrings.sellText, "", function(err, value) {
      if (!isValidInput(value)) {
        // console.log("INVALID INPUT");
        prompt.setInput(transactionStrings.sellText, transactionStrings.invalid, () => {
          prompt.destroy();
        });
      } else {
        // Do something with the trade amount.
        callback(value);
        prompt.destroy();
      }
    });

    screen.key(["q", "C-c"], () => {
      screen.destroy();
    });

    screen.render();
  }
};
