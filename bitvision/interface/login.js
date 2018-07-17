// Bitvision -- login.js
// Written by Aaron Lichtman <@alichtman>
// This file contains code for the splash screen and user login.

let figlet = require('figlet')
let chalk = require('chalk')
let inquirer = require('inquirer')
let fs = require('fs')
let yaml = require('js-yaml')

const dotfilePath = '~/.bitvision'

// TODO: If the ".bitvision" file doesn't exist, create it and run the login flow.
// If it does, authenticate and run the CLI.

// TODO: Support Windows.

/**
 * Returns true if dotfile exists, false otherwise.
 *
 * @return {Boolean} File exists.
 */
 function checkForDotFile() {
  fs.stat(dotfilePath, function(err, stat) {
    if (err == null) {
      return true
    } else if (err.code == 'ENOENT') {
      return false
    }
  });
}

function readLoginInfo() {
  try {
    let config = yaml.safeLoad(fs.readFileSync(dotfilePath, 'utf8'));
    let indentedJson = JSON.stringify(config, null, 4);
    console.log(indentedJson);

    let key = config.credentials.key
    let secret = config.credentials.secret
    let passphrase = config.credentials.passphrase
  } catch (e) {
    console.log(e);
  }
}

function printSplashScreen(callback) {
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
    callback()
  })
}

// Authentication prompt

function validateInput(value) {
  if (value != "") {
    return true;
  }
  return 'You must enter some value here.';
}

function getLoginInfo() {
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
}

// TODO: WHY DOES THIS RETURN UNDEFINED AKSDJFALKJDFALKD
var x = checkForDotFile()
console.log(x)

// If config exists, log in and start CLI. Otherwise, show onboarding.
if (checkForDotFile()) {
  // TODO
} else {
  printSplashScreen(getLoginInfo)
}

