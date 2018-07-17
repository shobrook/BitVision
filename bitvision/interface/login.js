// Bitvision -- login.js
// Written by Aaron Lichtman <@alichtman>
// This file contains code for the splash screen and user login.

let figlet = require('figlet')
let chalk = require('chalk')
let inquirer = require('inquirer')

// TODO: If the ".bitvision" file doesn't exist, create it and run the login flow.
// If it does, authenticate and run the CLI.

figlet.text('Bitvision', {
  font: 'Univers',
  horizontalLayout: 'default',
  verticalLayout: 'default'
}, function(err, data) {
  if (err) {
    console.log('Something went wrong...');
    console.dir(err);
    return;
  }
  console.log(chalk.blue.bold(data));
  console.log(chalk.red.bold("Written by Jon Shobrook"), chalk.blue("(https://github.com/shobrook)"), chalk.red.bold("and Aaron Lichtman"), chalk.blue("(https://github.com/alichtman)"))
  console.log(chalk.red.bold("Source code:"), chalk.blue("https://github.com/shobrook/BitVision"), "\n")
});

// Authentication prompt

function validateInput(value) {
  if (value != "") {
    return true;
  }
  return 'You must enter some value here.';
}

// TODO: Figure out how to make this prompt after the splash screen has finished printing. I know that sleep is not the right answer.
// JS can fuck right off zkfglkdjffladksfjlask

inquirer.prompt([
  {
    type: 'input',
    name: 'key',
    message: "What's your Coinbase Pro key?",
    validate: function(value) {
      return validateInput(value)
    }
  },
  {
    type: 'input',
    name: 'secret',
    message: "What's your Coinbase Pro secret?",
    validate: function(value) {
      return validateInput(value)
    }
  },
  {
    type: 'input',
    name: 'passphrase',
    message: "What's your Coinbase Pro passphrase?",
    validate: function(value) {
      return validateInput(value)
    }
  }
]).then(answers => {
  // TODO: Store answers["key"], answers["secret"], answers["passphrase"] in "~/.BitVision"
  console.log(answers)
});
