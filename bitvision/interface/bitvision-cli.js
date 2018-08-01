// GLOBALS
"use strict";
let fs = require("fs");
let blessed = require("blessed");
let contrib = require("blessed-contrib");
let childProcess = require("child_process");
let Gdax = require("gdax");
let writeJsonFile = require("write-json-file");

// ----------
// MODULES
// ----------

let login = require("./login");
let help = require("./help");

// ----------
// CONSTANTS
// ----------

let VERSION = "v0.1a"
let MAX_HEADLINE_LENTH = 35;
var helpOpenCloseCount = 0;
// TODO: Figure out how to write to home directory.
// const dotfilePath = "~/.bitvision";
const dotfilePath = ".bitvision.json";
var gdaxClient = new Gdax.PublicClient();

// ---------
// Bless up
// ---------

var screen = blessed.screen({
  smartCSR: true,
  title: "Bitvision",
  cursor: {
    artificial: true,
    shape: "line",
    blink: true,
    color: "red"
  }
});

// Quit
screen.key(["escape", "C-c"], function(ch, key) {
  return process.exit(0);
});

const log = (text) => {
  logs.pushLine(text);
  screen.render();
}

// -------------------------
// DOTFILE RELATED FUNCTIONS
// -------------------------

function writeDotfile(config) {
  log("WRITING DOTFILE")
  writeJsonFile(dotfilePath, config).then(() => {
    log('File Saved');
  });
}

/**
 * Read dotfile and do something with the data
 */
function readDotfile(callback) {
  fs.readFile(dotfilePath, "utf8", function(err, data) {
    if (err) {
      console.log(err);
    }
    callback(data);
  });
}

/**
 * Gets config file in dictionary form.
 */
function getConfig(callback) {
  log("GETTING CONFIG");
  readDotfile((data) => {
    let cfg = JSON.parse(data);
    callback(cfg);
  })
}

/**
 * Checks for credentials in the config file.
 *
 * @return {Bool} Returns true if all creds exist, false otherwise.
 */
function checkForCredentials() {
  getConfig( (cfg) => {
    let creds = cfg.credentials;
    if (creds.key == "" || creds.secret !== "" || passphrase !== "") {
      return false;
    } else {
      return true;
    }
  });
}

/**
 * Creates dotfile with default values if it doesn't exist.
 */
function createDotfileIfNeeded() {
  log("CHECKING FOR DOTFILE");
  fs.stat(dotfilePath, function(err, stat) {
    if (err == null) {
      log("Exists");
      return
    } else if (err.code == "ENOENT") {
      log("No dotfile found. Creating DEFAULT.");
      // Create file
      let emptyConfig = {
        "credentials": {
          "key": "",
          "secret": "",
          "passphrase": ""
        },
        "autotrade": {
          "enabled": false,
          "next-trade-timestamp-UTC": 0,
          "next-trade-amount": 0,
          "next-trade-side": "",
        },
      }
      writeDotfile(emptyConfig);
    }
  });
}

function saveCredentials(newCreds) {
  log("SAVING CREDENTIALS");
  getConfig((cfg) => {
    cfg.credentials = newCreds;
    writeDotfile(cfg);
  })
}

/**
 * Clear credentials by removing the dotfile.
 */
function clearCredentials() {
  fs.unlink(dotfilePath, (err) => {
    if (err) throw err;
    log(`${dotfilePath} was deleted.`);
  });
}

// ----------------------
// LOGIN SCREEN FUNCTIONS
// ----------------------

/**
 * Display login screen, allowing user to replace credentials.
 */
function displayLoginScreen() {
  log("DISPLAY LOGIN SCREEN");
  login.createLoginScreen(screen, (creds) => {
    // console.log("callback");
    if (creds != null) {
      log("New creds, saving.");
      saveCredentials(creds);
      log("Login success.")
    } else {
      log("No creds, abort.");
    }
  });
}

// ----------------------
// HELP SCREEN FUNCTIONS
// ----------------------

function displayHelpScreen() {
  help.createHelpScreen(screen, VERSION);
}

// ------------------------------
// HEADLINE INTERACTION FUNCTIONS
// ------------------------------

// TODO: Figure out how to do this.
function openArticle() {
  log("OPEN ARTICLE");
}

// ------------------
// COINBASE FUNCTIONS
// ------------------

// TODO: FINISH THINKING ABOUT THIS
function toggleTrading() {
  log("Toggle Trading");
  getConfig((cfg) => {
    // If autotrade was enabled, disable it and reset all properties to default.
    if (cfg.autotrade.enabled) {
      cfg.autotrade.enabled = false;
      cfg.autotrade["next-trade-timestamp-UTC"] = 0;
      cfg.autotrade["next-trade-amount"] = 0;
      cfg.autotrade["next-trade-side"] = "";
    } else {
      // If autotrade was disabled, enable and set next trade timestamp for +24 hr from now.
      cfg.autotrade.enabled = true;
      cfg.autotrade["next-trade-timestamp-UTC"] = 0; // TODO:
      cfg.autotrade["next-trade-amount"] = 0;
      cfg.autotrade["next-trade-side"] = "";
    }

    // Store updated configuration
    writeDotfile(cfg)
  })
}

/**
 * Replaces public Coinbase client with authenticated client so trades can be placed.
 */
function authenticateWithCoinbase() {
  console.log("AUTHENTICATE WITH COINBASE")
  let credentials = getConfig().credentials;
  let key = credentials.key;
  let secret = btoa(credentials.secret); // base64 encoded secret
  let passphrase = credentials.passphrase;

  // DO NOT USE
  // let apiURI = "https://api.pro.coinbase.com";
  let sandboxURI = "https://api-public.sandbox.pro.coinbase.com";

  gdaxClient = new Gdax.AuthenticatedClient(key,
    secret,
    passphrase,
    sandboxURI);
}

/**
 * Returns the current BTC price in USD.
 *
 * @return {Double} Current bitcoin price
 */
function getUpdatedBitcoinPrice() {
  gdaxClient.getProductTicker("ETH-USD", (error, response, data) => {
    if (error) {
      console.log("ERROR");
    } else {
      return data["price"];
    }
  });
}

/**
 * Creates a buy order.
 * @param  {Double} price In this format: "100.00"
 * @param  {Double} size  [description]
 */
function createBuyOrder(price, size, callback) {
  // Buy 1 BTC @ 100 USD
  let buyParams = {
    price: `${price}`, // USD
    size: `${size}`, // BTC
    product_id: "BTC-USD"
  };
  authedClient.buy(buyParams, callback);
}

/**
 * Creates a sell order.
 * @param  {Double} price
 * @param  {Double} size  [description]
 */
function createSellOrder(price, size, callback) {
  let sellParams = {
    price: `${price}`, // USD
    size: `${size}`, // BTC
    product_id: "BTC-USD"
  };
  authedClient.sell(sellParams, callback);
};

// ----------------------
// PYTHON CONTROL METHODS
// ----------------------

function refreshData() {
  executeShellCommand("python3 refresh_data.py")
}

function retrainModel() {
  executeShellCommand("python3 retrain_model.py")
}

// --------------------
// TEST DATA GENERATION
// --------------------

function getRandomInteger(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)

  return Math.floor(Math.random() * (max - min)) + min
}

function getRandomSentiment() {
  return String(Math.random().toFixed(2))
}

function getRandomDate() {
  let month = Math.floor(Math.random() * 12) + 1
  let day = Math.floor(Math.random() * 30) + 1
  return `${month}/${day}`
}

function getRandomHeadline() {
  let possiblities = ["Zerocoin's widget promises Bitcoin privacy",
    "Bitcoin is bad news for stability",
    "WikiLeaks' Assange hypes bitcoin in secret talk",
    "Butterfly Labs' Jalapeno aims to spice up bitcoin mining",
    "Are alternative Ecoins 'anti-bitcoins'?",
    "Canada to tax bitcoin users",
    "Google Ventures invests in Bitcoin competitor OpenCoin",
    "Economists wrestle with Bitcoin's 'narrative problem'"
  ]
  return possiblities[Math.floor(Math.random() * possiblities.length)]
}

// ------------------
// UTILITY FUNCTIONS
// ------------------

/**
 * Execute shell command.
 **/
function executeShellCommand(command) {
  console.log(command)
  let args = command.split(" ")
  // Remove first element
  let program = args.splice(0, 1)[0];
  console.log(args)
  console.log(program)
  let cmd = childProcess.spawn(program, args);

  cmd.stdout.on("data", function(data) {
    console.log("OUTPUT: " + data);
  });

  cmd.on("close", function(code, signal) {
    console.log("command finished...");
  });
}

function trimIfLongerThan(text, len) {
  if (text.length > len) {
    return text.slice(0, len)
  } else {
    return text
  }
}

function setLineData(mockData, line) {
  for (var i = 0; i < mockData.length; i++) {
    var last = mockData[i].y[mockData[i].y.length - 1]
    mockData[i].y.shift()
    var num = Math.max(last + Math.round(Math.random() * 10) - 5, 10)
    mockData[i].y.push(num)
  }

  line.setData(mockData)
}

/**
 * Takes three arrays and zips them into a list of lists like this:
 *
 * [1,2,3]
 * [a,b,c] -> [ [1,a,!], [2,b,@], [3,c,#] ]
 * [!,@,#]
 */
function zipThreeArrays(a, b, c) {
  let zipped = []
  for (var i = 0; i < a.length; i++) {
    zipped.push([a[i], b[i], c[i]])
  }
  return zipped
}

// Takes dictionary with key -> list pairs and returns a list of lists.
function unpackData(dict) {
  var listOfIndicatorData = []
  Object.keys(dict["data"]).forEach(function(key) {
    listOfIndicatorData.push([key, dict["data"][key]["value"], dict["data"][key]["signal"]])
  });

  return listOfIndicatorData
}

var signalEnum = Object.freeze({
  buy: "BUY",
  sell: "SELL"
});

let networkIndicatorData = {
  "name": "NETWORK_DATA",
  "data": {
    "Confirmation Time": {
      value: "42ms",
      signal: signalEnum.buy
    },
    "Block Size": {
      value: "129MB",
      signal: signalEnum.sell
    },
    "Avg Transaction Cost": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Difficulty": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Transaction Value": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Hash Rate": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Transactions per Block": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Unique Addresses": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Total BTC": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Transaction Fees": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Transactions per Day": {
      value: "Val",
      signal: signalEnum.sell
    }
  }
}

let technicalIndicatorData = {
  "name": "TECHNICAL_INDICATORS",
  "data": {
    "Rate of Change Ratio": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Momentum": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Avg Directional Index": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Williams %R": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Relative Strength Index": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Moving Avg Convergence Divergence": {
      value: "Val",
      signal: signalEnum.sell
    },
    "Avg True Range": {
      value: "Val",
      signal: signalEnum.sell
    },
    "On-Balance Volume": {
      value: "Val",
      signal: signalEnum.buy
    },
    "Triple Exponential Moving Avg": {
      value: "Val",
      signal: signalEnum.sell
    }
  }
}

// Placing widgets

var grid = new contrib.grid({
  rows: 12,
  cols: 12,
  screen: screen
})

// Place tables on the left side of the screen.

var headlineTable = grid.set(0, 0, 3.5, 4, contrib.table, {
  keys: true,
  fg: "green",
  label: "Headlines",
  interactive: true,
  columnSpacing: 1,
  columnWidth: [7, 38, 10]
})

var technicalTable = grid.set(3.5, 0, 3.5, 4, contrib.table, {
  keys: true,
  fg: "green",
  label: "Technical Indicators",
  interactive: false,
  columnSpacing: 1,
  columnWidth: [35, 10, 10]
});

var networkTable = grid.set(7, 0, 4, 4, contrib.table, {
  keys: true,
  interactive: true,
  fg: "green",
  label: "Network Indicators",
  interactive: false,
  columnSpacing: 1,
  columnWidth: [35, 10, 10]
});

// Line chart on the right of the tables

var exchangeRateCurve = grid.set(0, 4, 6, 6, contrib.line, {
  style: {
    line: "yellow",
    text: "green",
    baseline: "black"
  },
  xLabelPadding: 3,
  xPadding: 5,
  showLegend: true,
  wholeNumbersOnly: false,
  label: "Exchange Rate"
});

// Countdown under chart

var countdown = grid.set(6, 4, 3, 3, contrib.lcd, {
  segmentWidth: 0.06,
  segmentInterval: 0.10,
  strokeWidth: 0.1,
  elements: 4,
  display: "0000",
  elementSpacing: 4,
  elementPadding: 2,
  color: "white", // color for the segments
  label: "Minutes Until Next Trade"
})

var logs = grid.set(6, 7, 5, 4, blessed.box, {
  label: "DEBUGGING LOG",
  top: 0,
  left: 0,
  height: "100%-1",
  width: "100%",
})

let menubar = blessed.listbar({
  parent: screen,
  mouse: true,
  keys: true,
  bottom: 0,
  left: 0,
  height: 1,
  commands: {
    "Toggle Trading": {
      keys: ["t", "T"],
      callback: () => {
        toggleTrading()
      }
    },
    "Refresh Data": {
      keys: ["r", "R"],
      callback: () => {
        log("Refresh Data")
        // refreshData()
      }
    },
    "Coinbase Login": {
      keys: ["l", "L"],
      callback: () => {
        log("Login")
        displayLoginScreen()
        // login()
      }
    },
    "Clear Credentials": {
      keys: ["c", "C"],
      callback: () => {
        log("Clear Credentials")
        clearCredentials()
      }
    },
    "Buy BTC": {
      keys: ["b", "B"],
      callback: () => {
        log("Buy BTC")
        // buyBitcoin()
      }
    },
    "Sell BTC": {
      keys: ["s", "S"],
      callback: () => {
        log("Sell BTC")
        // sellBitcoin()
      }
    },
    "Focus on Headlines": {
      keys: ["f", "F"],
      callback: () => {
        headlineTable.focus()
      }
    },
    "Open": {
      keys: ["o", "O"],
      callback: () => {
        openArticle()
      }
    },
    "Show Help": {
      keys: ["h", "H"],
      callback: () => {
        log("Help Menu Opened")
        displayHelpScreen()
      }
    },
    "Exit": {
      keys: ["C-c", "escape"],
      callback: () => process.exit(0)
    }
  }
})

// Resizing
screen.on("resize", function() {
  technicalTable.emit("attach");
  networkTable.emit("attach");
  headlineTable.emit("attach");
  exchangeRateCurve.emit("attach");
  countdown.emit("attach");
  menubar.emit("attach");
});

// ------------
// TESTING DATA
// ------------

let headlineDates = [...Array(16).keys()].map((key) => {
  return getRandomDate()
})

let headlines = [...Array(16).keys()].map((key) => {
  return getRandomHeadline()
})

let headlineSentiment = [...Array(16).keys()].map((key) => {
  return getRandomSentiment()
})

let headlinesTrimmed = headlines.map(str => trimIfLongerThan(str, MAX_HEADLINE_LENTH));
let headlinesZipped = zipThreeArrays(headlineDates, headlinesTrimmed, headlineSentiment)

let networkIndicators = unpackData(networkIndicatorData)
let technicalIndicators = unpackData(technicalIndicatorData)

headlineTable.setData({
  headers: ["Date", "Title", "Sentiment"],
  data: headlinesZipped
})

// headlineTable.on("select", function() {
//   log("DEBUG ME")
// })
//
// // If box is focused, handle `enter`/`return` and give us some more content.
// headlineTable.key('o', function(ch, key) {
//   log("HSA");
// });

technicalTable.setData({
  headers: ["Name", "Value", "Signal"],
  data: technicalIndicators
})

networkTable.setData({
  headers: ["Name", "Value", "Signal"],
  data: networkIndicators
})

let exchangeRateSeries = {
  title: "Exchange Rate",
  x: [...Array(24).keys()].map((key) => {
    return String(key) + ":00"
  }),
  y: [...Array(24).keys()].map((key) => {
    return key * getRandomInteger(1000, 1200)
  })
}

setLineData([exchangeRateSeries], exchangeRateCurve)

setInterval(function() {
  setLineData([exchangeRateSeries], exchangeRateCurve)
  screen.render()
}, 500)

// START DOING THINGS
createDotfileIfNeeded()
headlineTable.focus()

screen.render()
