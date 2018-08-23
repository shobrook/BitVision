// GLOBALS
"use strict";
let os = require("os");
let fs = require("fs");
let path = require("path");
let openBrowser = require("opn");
let cli = require("commander");
let blessed = require("blessed");
let contrib = require("blessed-contrib");
let childProcess = require("child_process");
let writeJsonFile = require("write-json-file");
let VERSION = require("../package.json").version

let MAX_HEADLINE_LENTH = 25;
var LOGGED_IN = false;

cli
  .version(VERSION, '-v, --version')
  .parse(process.argv)

// ----------
// MODULES
// ----------

let login = require("./login");
let help = require("./help");
let transaction = require("./transaction");
let tradingToggle = require("./autotrading-toggle");

// ----------
// CONSTANTS
// ----------

const paths = {
  "configPath": path.join(os.homedir(), ".bitvision"),
  "blockchainDataPath": "../cache/data/blockchain.json",
  "headlineDataPath": "../cache/data/headlines.json",
  "technicalDataPath": "../cache/data/indicators.json",
  "priceDataPath": "../cache/data/price_data.json"
}

// TODO: Sync up with Jon about these commands.
const commands = {
  "login": "python3 ../services/trader.py LOGIN",
  "buy": "python3 ../services/trader.py -b ",
  "sell": "python3 ../services/trader.py -s ",
  "refresh": "python3 ../services/controller.py REFRESH",
  "retrain_model": "python3 ../services/controller.py RETRAIN"
}

const colors = {
  "border": "cyan",
  "tableText": "light-blue",
  "tableHeader": "red"
}

const headers = {
  "headline": ["Date", "Headline", "Senti"],
  "technical": ["Technical Indicator", "Value", "Signal"],
  "blockchain": ["Blockchain Network", "Value"],
  "price": ["Price Data", "Value"]
}

// ------------------
// UTILITY FUNCTIONS
// ------------------

/**
 * Takes a list of lists and returns an array with the last element in every row.
 * Removes the last element of each list from the original array.
 *
 * [[1,2,3]
 *  [a,b,c] returns [3,c,#] and removes it from the original list of lists.
 *  [!,@,#]]
 */
function extractURLsAndTrim(listOfArticles) {
  let urls = [];
  let index = 3;
  for (var i = 0; i < listOfArticles.length; i++) {
    urls.push(listOfArticles[i][3]);
    listOfArticles[i].splice(index, 1);
  }

  return urls;
}

/**
 * Truncates text if longer than len, otherwise does nothing.
 * @param  {String} text Text to be length checked and modified.
 * @param  {Number} len  Integer for longest allowable length.
 * @return {String}      Modified or unmodified input string.
 */
function trimIfLongerThan(text, len) {
  if (text.length > len) {
    return text.slice(0, len);
  } else {
    return text;
  }
}

/**
 * Read JSON file and do something with the data
 */
function readJsonFile(path, callback) {
  fs.readFile(path, "utf8", function(err, data) {
    if (err) {
      console.log(err);
    }
    callback(data);
  });
}

/**
 * Execute shell command.
 **/
function executeShellCommand(command) {
  log(command);
  let args = command.split(" ");
  // Remove first element
  let program = args.splice(0, 1)[0];
  log(args);
  log(program);
  let cmd = childProcess.spawn(program, args);

  cmd.stdout.on("data", function(data) {
    log("OUTPUT: " + data);
  });

  cmd.on("close", function(code, signal) {
    log("command finished...");
  });
}

/**
 * Returns a Date object set with the current time + x hours.
 * @param  {Number} hours
 * @return {String} UTC Representation
 */
function getTimeXHoursFromNow(hours) {
  let currentTime = new Date();
  let futureTime = new Date(currentTime);
  futureTime.setHours(currentTime.getHours() + hours);
  console.log(`CurrentTime: ${currentTime.toJSON()}`)
  console.log(`FutureTime : ${futureTime.toJSON()}`)
  return futureTime.toJSON()
}

// -----------------------
// PYTHON CONTROL METHODS
// -----------------------

function loginCommand() {
  console.log(`Executing: ${commands.login}`)
  // executeShellCommand(commands.login)
}

function buyBTCCommand(amount) {
  if (LOGGED_IN) {
    console.log(`Executing: ${commands.buyBTC + amount}`)
    // executeShellCommand(commands.buyBTC + amount)
  } else {
    console.log("TRADE ERROR: NOT LOGGED IN. SHOULD BE IMPOSSIBLE.")
  }
}

function sellBTCCommand(amount) {
  if (LOGGED_IN) {
    console.log(`Executing: ${commands.sellBTC + amount}`)
    // executeShellCommand(commands.sellBTC + amount)
  } else {
    console.log("TRADE ERROR: NOT LOGGED IN. SHOULD BE IMPOSSIBLE.")
  }
}

function refreshDataCommand() {
  console.log(`Executing: ${commands.refresh}`)
  // executeShellCommand(commands.refresh);
}

function retrainModelCommand() {
  console.log(`Executing: ${commands.retrain_model}`)
  // executeShellCommand(commands.retrain_model);
}

// -------------------------
// CONFIG/CREDENTIALS FUNCTIONS
// -------------------------

function writeConfig(config) {
  log(`WRITING FILE at ${paths.configPath}`);
  writeJsonFile(paths.configPath, config).then(() => {
    log("File Saved");
  });
}

/**
 * Gets config file in dictionary form.
 */
function getConfig(callback) {
  // log("GETTING CONFIG");
  readJsonFile(paths.configPath, (data) => {
    let cfg = JSON.parse(data);
    callback(cfg);
  });
}

/**
 * Checks for credentials in the config file.
 * @return {Bool} Returns true if all creds exist, false otherwise.
 */
function hasCredentialsInConfig() {
  console.log("Checking for credentials in config...")
  getConfig((cfg) => {
    let creds = cfg.credentials;
    if (creds.key === "" || creds.secret !== "" || creds.passphrase !== "") {
      return false;
    } else {
      return true;
    }
  });
}

/**
 * Creates dotfile with default values if it doesn't exist.
 */
function createConfigIfNeeded() {
  log("CHECKING FOR DOTFILE");
  fs.stat(paths.configPath, function(err, stat) {
    if (err == null) {
      log("Exists");
      return;
    } else if (err.code === "ENOENT") {
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
        },
      }
      writeConfig(emptyConfig);
    }
  });
}

function saveCredentials(newCreds) {
  log("SAVING CREDENTIALS");
  getConfig((cfg) => {
    cfg.credentials = newCreds;
    writeConfig(cfg);
  })
}

/**
 * Clear credentials by removing the dotfile.
 */
function clearCredentials() {
  fs.unlink(paths.configPath, (err) => {
    if (err) {
      throw err;
    }
    log("Login credentials cleared.");
  });
}

// ---------------------------------
// BUILDING INTERFACE
// ** Bless up -> 3x preach emoji **
// ---------------------------------

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

const log = (text) => {
  logs.pushLine(text);
  screen.render();
};

/**
 * Display login screen, allowing user to replace credentials.
 */
function displayLoginScreen() {
  log("DISPLAY LOGIN SCREEN");
  login.createLoginScreen(screen, (creds) => {
    if (creds != null) {
      log("New creds, saving.");
      saveCredentials(creds);
      log("Login success.");
    } else {
      log("No creds, abort.");
    }
  });
}


function showAutotradingMenu() {
  log("Autotrading Menu");
  tradingToggle.createToggleScreen(screen, function(isEnabling) {
    // log(`Enabling: ${isEnabling}`)
    getConfig((cfg) => {
      let isCurrentlyEnabled = cfg.autotrade.enabled;

      // Setting autotrading to the same state should do nothing.
      if ((isEnabling && isCurrentlyEnabled) || (!isEnabling && !isCurrentlyEnabled)) {
        log("Redundant autotrading change.");
        return;
      }

      // Autotrading disabled, so reset all properties to default
      if (!isEnabling) {
        log("Disabling autotrading.");
        cfg.autotrade.enabled = false;
        cfg.autotrade["next-trade-timestamp-UTC"] = 0;
      } else {
        // Autotrading enabled, so set next trade timestamp for +1 hr from now.
        log("Enabling autotrading.");
        cfg.autotrade.enabled = true;
        cfg.autotrade["next-trade-timestamp-UTC"] = getTimeXHoursFromNow(1);
      }

      // Store updated configuration
      writeConfig(cfg);
    })
  });
}

// Placing widgets

var grid = new contrib.grid({
  rows: 11,
  cols: 12,
  screen: screen
})

// TODO: Finish refactoring this out.

// /**
//  * Creates a new list table.
//  * @param  {Boolean} isInteractive   True to make the ListTable interactive.
//  * @param  {[Number]}  columnWidthList List for col spacing.
//  * @return {blessed.ListTable}       blessed ListTable
//  */
// function createListTableParams(isInteractive, columnWidthList) {
//   return {
//     parent: screen,
//     keys: true,
//     fg: "green",
//     align: "center",
//     selectedFg: "white",
//     selectedBg: "blue",
//     interactive: isInteractive,
//     style: {
//       fg: colors.tableText,
//       border: {
//         fg: colors.border
//       },
//       cell: {
//         selected: {
//           fg: "black",
//           bg: "light-yellow"
//         },
//       },
//       header: {
//         fg: 'red',
//         bold: true
//       },
//     },
//     columnWidth: columnWidthList,
//     columnSpacing: 1
//   };
// }

// var headlinesTable = grid.set(0, 0, 4, 4, blessed.ListTable, {
// createListTableParams(true, [10, 35, 10])
// })

// Place 3 tables on the left side of the screen, stacked vertically.

var headlinesTable = grid.set(0, 0, 4, 4, blessed.ListTable, {
  parent: screen,
  keys: true,
  fg: "green",
  align: "left",
  padding: {
    left: 1,
    right: 1
  },
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true,
  style: {
    fg: colors.tableText,
    border: {
      fg: colors.border
    },
    cell: {
      selected: {
        fg: "black",
        bg: "light-yellow"
      },
    },
    header: {
      fg: 'red',
      bold: true
    },
  },
  // columnWidth: [10, 20, 25],
  columnSpacing: 1
});

var technicalIndicatorsTable = grid.set(4, 0, 3, 4, blessed.ListTable, {
  parent: screen,
  keys: true,
  align: "left",
  padding: {
    left: 1,
    right: 1
  },
  style: {
    fg: colors.tableText,
    border: {
      fg: colors.border
    },
    header: {
      fg: colors.tableHeader,
      bold: true
    },
  },
  interactive: false,
  columnSpacing: 1,
  columnWidth: [35, 10, 10]
});

var blockchainIndicatorsTable = grid.set(7, 0, 3.8, 4, blessed.ListTable, {
  parent: screen,
  keys: true,
  align: "center",
  style: {
    fg: colors.tableText,
    border: {
      fg: colors.border
    },
    header: {
      fg: colors.tableHeader,
      bold: true
    },
  },
  interactive: false,
  columnSpacing: 1,
  columnWidth: [25, 20]
});

// Line chart on the right of the tables

var exchangeRateChart = grid.set(0, 4, 6, 6, contrib.line, {
  style: {
    line: "yellow",
    text: "green",
    baseline: "black"
  },
  xLabelPadding: 3,
  xPadding: 5,
  // showLegend: true,
  wholeNumbersOnly: true,
  label: "Exchange Rate"
});

// Price table above countdown.

var priceTable = grid.set(6, 4, 2.3, 3, blessed.ListTable, {
  parent: screen,
  keys: true,
  align: "center",
  style: {
    fg: colors.tableText,
    border: {
      fg: colors.border
    },
    header: {
      fg: colors.tableHeader,
      bold: true
    },
  },
  interactive: false,
  columnSpacing: 1,
  columnWidth: [25, 20]
});

// Countdown under price data.

var countdown = grid.set(8.3, 4, 2.7, 2, contrib.lcd, {
  segmentWidth: 0.06,
  segmentInterval: 0.10,
  strokeWidth: 0.1,
  elements: 2,
  display: "60",
  elementSpacing: 4,
  elementPadding: 2,
  color: "white", // color for the segments
  label: "Minutes Until Next Trade",
  style: {
    border: {
      fg: colors.border
    },
  },
})

var logs = grid.set(6, 7, 4.5, 3, blessed.box, {
  label: "DEBUGGING LOG",
  top: 0,
  left: 0,
  height: "100%-1",
  width: "100%",
})

let menubar = blessed.listbar({
  parent: screen,
  keys: true,
  bottom: 0,
  left: 0,
  height: 1,
  style: {
    item: {
      fg: "yellow"
    },
    selected: {
      fg: "yellow"
    },
  },
  commands: {
    "Autotrading Settings": {
      keys: ["t"],
      callback: () => {
        showAutotradingMenu();
      }
    },
    "Refresh Data": {
      keys: ["r"],
      callback: () => {
        log("Refresh Data");
        // refreshData()
      }
    },
    "Bitstamp Login": {
      keys: ["l"],
      callback: () => {
        log("Login")
        displayLoginScreen();
      }
    },
    "Clear Credentials": {
      keys: ["c"],
      callback: () => {
        clearCredentials();
      }
    },
    "Buy BTC": {
      keys: ["b"],
      callback: () => {
        log("Buy BTC");
        if (LOGGED_IN) {
          transaction.createBuyTransactionPopup(screen, function(amount) {
            // Pass buy order to backend
            buyBTCCommand(amount)
          });
        } else {
          displayLoginScreen();
        }
      }
    },
    "Sell BTC": {
      keys: ["s"],
      callback: () => {
        log("Sell BTC");
        if (LOGGED_IN) {
          transaction.createSellTransactionPopup(screen, function(amount) {
            // Pass sell order to backend
            sellBTCCommand(amount)
          });
        } else {
          displayLoginScreen();
        }
      }
    },
    "Focus on Headlines": {
      keys: ["f"],
      callback: () => {
        headlinesTable.focus();
      }
    },
    "Open Article": {
      keys: ["o"],
      callback: () => {
        let selectedArticleURL = URLs[headlinesTable.selected - 1];
        openBrowser(selectedArticleURL);
      }
    },
    "Help": {
      keys: ["h"],
      callback: () => {
        log("Help Menu Opened");
        help.createHelpScreen(screen, VERSION);
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
  technicalIndicatorsTable.emit("attach");
  blockchainIndicatorsTable.emit("attach");
  headlinesTable.emit("attach");
  exchangeRateChart.emit("attach");
  countdown.emit("attach");
  priceTable.emit("attach");
  menubar.emit("attach");
});

// Quit
screen.key(["escape", "C-c"], function(ch, key) {
  return process.exit(0);
});

// -----------------
// WORKING WITH DATA
// -----------------

let headlineData = {
  "name": "HEADLINES",
  "data": [
    ["8/9", "Canada to tax bitcoin users", "0.10", "https://www.coindesk.com"],
    ["10/22", "Google Ventures invests in Bitcoin ", "0.21", "https://www.coindesk.com"],
    ["3/9", "Canada to tax bitcoin users", "0.23", "https://www.coindesk.com"],
    ["6/9", "Canada to tax bitcoin users", "0.08", "https://www.coindesk.com"],
    ["3/15", "Bitcoin is bad news for stability", "0.10", "https://www.coindesk.com"],
    ["4/15", "Google Ventures invests in Bitcoin ", "0.08", "https://www.coindesk.com"],
    ["10/7", "WikiLeaks\' Assange hypes bitcoin in", "0.36", "https://www.coindesk.com"],
    ["3/4", "Canada to tax bitcoin users", "0.54", "https://www.coindesk.com"],
    ["11/27", "Are alternative Ecoins \'anti-bitcoi", "0.07", "https://www.coindesk.com"],
    ["10/30", "Google Ventures invests in Bitcoin ", "0.68", "https://www.coindesk.com"],
    ["9/14", "Canada to tax bitcoin users", '0.74', "https://www.coindesk.com"],
    ["6/24", "Google Ventures invests in Bitcoin ", "0.55", "https://www.coindesk.com"],
    ["4/5", "Zerocoin\'s widget promises Bitcoin ", "0.47", "https://www.coindesk.com"],
    ["12/4", "WikiLeaks\' Assange hypes bitcoin in", "0.17", "https://www.coindesk.com"],
    ["7/30", "Google Ventures invests in Bitcoin ", "0.36", "https://www.coindesk.com"],
    ["5/4", "WikiLeaks\' Assange hypes bitcoin in", "0.19", "https://www.coindesk.com"]
  ]
}

let URLs = null;

let tempNameConst = {
  buy: "BUY ",
  sell: "SELL"
}

let technicalData = {
  "name": "TECHNICAL_INDICATORS",
  "data": [
    ['Momentum', 'Val', tempNameConst.sell],
    ['Williams %R', 'Val', tempNameConst.sell],
    ['Avg True Range', 'Val', tempNameConst.sell],
    ['On-Balance Volume', 'Val', tempNameConst.sell],
    ['Rate of Change Ratio', 'Val', tempNameConst.buy],
    ['Avg Directional Index', 'Val', tempNameConst.buy],
    ['Relative Strength Index', 'Val', tempNameConst.buy],
    ['Triple Exponential Moving Avg', 'Val', tempNameConst.sell],
    ['Moving Avg Convergence Divergence', 'Val', tempNameConst.sell],
  ]
}

let blockchainData = {
  "name": "BLOCKCHAIN_DATA",
  "data": [
    ["Block Size", "1.0509867022900001"],
    ["Difficulty", "5949437371610.0"],
    ["Total Bitcoin", "17194350.0"],
    ["Miners Revenue", "11517945.75"],
    ["Transaction Cost", "53.2590456155"],
    ["Unique Addresses", "452409.0"],
    ["Transaction Fees", "124854.43486300002"],
    ["Hash Rate (GH/s)", "38743005.8012"],
    ["Confirmation Time", "14.45"],
    ["Transactions per Day", "218607.0"],
    ["Market Capitalization", "120942650691.00003"],
    ["Transactions per Block", "1668.75572519"],
  ]
}

let priceData = {
  "fetching": false,
  "data": [
    ["Current Price", "6319.35"],
    ["24H High", "6494.13000000"],
    ["24H Low", "6068.52000000"],
    ["Open Price", "6240.49"],
    ["Volume", "6708.87922004"],
    ["Timestamp", "1534060816"]
  ]
}

// -----------------------
// DATA FETCHING FUNCTIONS
// -----------------------

function getBlockchainData() {
  readJsonFile(paths.blockchainDataPath, (blockchainData) => {
    // log(blockchainData)
    return blockchainData;
  });
}

function getHeadlineData() {
  readJsonFile(paths.headlineDataPath, (headlineData) => {
    // Trim headlines if too long.
    shortenedHeadlines = [];
    for (let i = 0; i < headlineData.length; i++) {
      shortenedHeadlines.splice(i, 0, trimIfLongerThan(str, MAX_HEADLINE_LENTH))
    }
    log(shortenedHeadlines);
    return shortenedHeadlines;
  });
}

function gettechnicalData() {
  readJsonFile(paths.technicalDataPath, (technicalData) => {
    // log(technicalData);
    return technicalData;
  });
}

function getPriceData() {
  readJsonFile(paths.priceDataPath, (data) => {
    // console.log(priceData);
    return priceData;
  });
}

function getRandomInteger(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

let exchangeRateSeries = {
  title: "Exchange Rate",
  x: [...Array(100).keys()].map((key) => {
    return String(key) + ":00"
  }),
  y: [...Array(100).keys()].map((key) => {
    return key * getRandomInteger(750, 1200)
  })
}


function setLineData(mockData, line) {
  for (var i = 0; i < mockData.length; i++) {
    var last = mockData[i].y[mockData[i].y.length - 1];
    mockData[i].y.shift();
    var num = Math.max(last + Math.round(Math.random() * 10) - 5, 10);
    mockData[i].y.push(num);
  }
  line.setData(mockData);
}

/**
 * Gets updated data for blockchain, technical indicators, headlines and price.
 */
function refreshData(callback) {
  headlineData = getHeadlineData();
  technicalData = gettechnicalData();
  blockchainData = getBlockchainData();
  priceData = getPriceData();
  console.log("Fetched all data")
  callback(headlineData, technicalData, blockchainData, priceData);
}


/**
 * Set all tables with data.
 */
function setAllTables(headlines, technicals, blockchains, prices) {
  console.log("setAllTables");
  // console.log(headlines);
  // console.log(technicals);
  // console.log(blockchains);
  console.log(prices);

  URLs = extractURLsAndTrim(headlines)

  // Set headers for each table.
  headlines.splice(0, 0, headers.headline);
  technicals.splice(0, 0, headers.technical);
  blockchains.splice(0, 0, headers.blockchain)
  prices.splice(0, 0, headers.price);

  console.log("Setting headlines...");
  headlinesTable.setData(headlines);

  console.log("Setting technicals...");
  technicalIndicatorsTable.setData(technicals);

  console.log("Setting blockchain network table...");
  blockchainIndicatorsTable.setData(blockchains);

  console.log("Setting price table...")
  priceTable.setData(prices);

  screen.render();
  console.log("setAllTables COMPLETE");
}

/**
 * Set exchange rate chart with data.
 * TODO: Fix this.
 */
function setChart() {
  console.log("setChart CALLED");
  setLineData([exchangeRateSeries], exchangeRateChart);

  setInterval(function() {
    setLineData([exchangeRateSeries], exchangeRateChart);
    screen.render();
  }, 500)
}

/**
 * Let's get this show on the road.
 * Start up sequence.
 */
function doThings() {
  createConfigIfNeeded();

  // Login if they have creds
  // TODO: Restructure this global setting.
  if (hasCredentialsInConfig()) {
    loginCommand();
    LOGGED_IN = true;
  } else {
    LOGGED_IN = false;
  }

  setAllTables(headlineData.data, technicalData.data, blockchainData.data, priceData.data);
  setChart();
  headlinesTable.focus();
  screen.render();

  // console.log("RESETTING")
  // // BUG: setAllTables in here causes everything to crash. No ideas.
  // setInterval(function() {
  //   refreshData(setAllTables)
  // }, 1500)
}

doThings();
