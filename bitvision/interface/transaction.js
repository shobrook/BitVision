var blessed = require("blessed");

// FUNCTIONS

/**
 * Checks for a currency sign, followed by a number.
 *
 * @return {Bool} True if valid, or false otherwise.
 */
function isInputValid(input) {
  return input.length != 0 && input.match(/\$[0-9]+\b/g)
}

// LAYOUT

var screen = blessed.screen({
  tput: true,
  smartCSR: true,
  autoPadding: true,
  warnings: true
});

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
});

prompt.input('{bold}How much do you want to trade?{/bold}\n Please enter a {bold}${/bold} followed by a {bold}number{/bold}.', '', function(err, value) {
  if (isInputValid(value)) {
    console.log("VALID")
    // callback(value)
    screen.destroy();
  } else {
    // TODO: What do I do if the user enters the wrong thing? This doesn't work like the form did...
    // console.log('INVALID')
  }
});

screen.key(["q", "C-c"], () => {
  screen.destroy();
});

screen.render();
