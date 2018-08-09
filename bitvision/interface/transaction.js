var blessed = require("blessed");

let transactionStrings = {
  "text" : "{bold}How much BTC do you want to trade?{/bold}\n Please enter a {bold}number{/bold}."
}

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

  let num = parseFloat(n)
  return !isNaN(num) && isFinite(num) && num > 0;
}

module.exports = {

  createTransactionAmountPopup:function(screen, callback) {
    var prompt = blessed.prompt({
      parent: screen,
      border: 'line',
      height: 9,
      width: 45,
      top: 'center',
      left: 'center',
      label: ' {blue-fg}Autotrading{/blue-fg} ',
      tags: true,
      keys: true,
      style: {
        border: {
          fg: "light-green"
        }
      }
    });

    prompt.input(transactionStrings.text, '', function(err, value) {
      if (! isValidInput(value)) {
        // console.log("INVALID INPUT");
        prompt.setInput(transactionStrings.text, "Invalid input. Press Enter to exit.", () => {
          prompt.destroy();
        });
      } else {
        // Do something with the trade amount.
        callback(value)
        prompt.destroy();
      }
    });

    screen.key(["q", "C-c"], () => {
      screen.destroy();
    });

    screen.render();
  }
}
