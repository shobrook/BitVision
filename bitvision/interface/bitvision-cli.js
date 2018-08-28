// GLOBALS
"use strict";
let os = require("os");
let fs = require("fs");
let path = require("path");
let openBrowser = require("opn");
let cli = require("commander");
let colors = require("colors");
let blessed = require("blessed");
let contrib = require("blessed-contrib");
let childProcess = require("child_process");

let constants = require("./constants");
let VERSION = require("../package.json").version

let MAX_HEADLINE_LENTH = 35;
var LOGGED_IN = false;

cli
  .version(VERSION, '-v, --version')
  .parse(process.argv)

// ----------
// MODULES
// ----------

let login = require("./popups/login");
let help = require("./popups/help");
let transaction = require("./popups/transaction");
let autotrading = require("./popups/autotrading");

// ----------
// CONSTANTS
// ----------

const paths = {
  "configPath": path.join(__dirname, "..", "cache", "config.json"),
  "blockchainDataPath": path.join(__dirname, "..", "cache", "data", "blockchain.json"),
  "headlineDataPath": path.join(__dirname, "..", "cache", "data", "headlines.json"),
  "technicalDataPath": path.join(__dirname, "..", "cache", "data", "indicators.json"),
  "priceDataPath": path.join(__dirname, "..", "cache", "data", "ticker.json")
}

// TODO: Sync up with Jon about these commands.
const commands = {
  "transaction": `python3 ${path.join(__dirname, "..", "controller")} `,
  "refresh": "python3 ../services/controller.py REFRESH",
  "retrain_model": "python3 ../services/controller.py RETRAIN"
}

const colorConstants = {
  "border": "cyan",
  "tableText": "light-blue",
  "tableHeader": "red"
}

const headers = {
  "headline": ["Date", "Headline", "Sentiment"],
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
function extractUrlAndRemove(listOfArticles) {
  // logs.log(listOfArticles)
  let urls = [];
  let index = 3;
  for (var i = 0; i < listOfArticles.length; i++) {
    urls.push(listOfArticles[i][3]);
    listOfArticles[i].splice(index, 1);
  }

  return urls;
}

/**
 * Read JSON file and do something with the data
 */
function readJsonFile(path) {
  // logs.log("Reading " + path);
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

/**
 * Execute shell command.
 **/
function executeShellCommand(command) {
  logs.log(command);
  let args = command.split(" ");
  // Remove first element
  let program = args.splice(0, 1)[0];
  logs.log(args);
  logs.log(program);
  let cmd = childProcess.spawn(program, args);

  cmd.stdout.on("data", function(data) {
    logs.log("OUTPUT: " + data);
  });

  cmd.on("close", function(code, signal) {
    logs.log("command finished...");
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
  // logs.log(`CurrentTime: ${currentTime.toJSON()}`)
  // logs.log(`FutureTime : ${futureTime.toJSON()}`)
  return futureTime.toJSON()
}

// -----------------------
// PYTHON CONTROL METHODS
// -----------------------

function transactionCommand(amount, type) {
  let payload = {
    "amount": amount,
    "type": type
  };
  let cmd = `${commands.transaction}${payload}`;
  logs.log(`Executing: ${cmd}`);
  // executeShellCommand(cmd)
}

function refreshDataCommand() {
  logs.log(`Executing: ${commands.refresh}`)
  // executeShellCommand(commands.refresh);
}

function retrainModelCommand() {
  logs.log(`Executing: ${commands.retrain_model}`)
  // executeShellCommand(commands.retrain_model);
}

// -------------------------
// CONFIG/CREDENTIALS FUNCTIONS
// -------------------------

function writeConfig(config) {
  // logs.log(`WRITING FILE at ${paths.configPath}`);
  fs.writeFile(paths.configPath, JSON.stringify(config), "utf8", () => {
    // logs.log("File Saved.");
  });
}

/**
 * Gets config file in dictionary form.
 */
function getConfig() {
  // logs.log("GETTING CONFIG");
  return readJsonFile(paths.configPath);
}

/**
 * Checks for credentials in the config file.
 * @return {Bool} Returns true if all creds exist, false otherwise.
 */
function hasCredentialsInConfig() {
  // logs.log("Checking for credentials in config...");
  let creds = getConfig().credentials;
  return !(creds.key === "" || creds.secret !== "" || creds.passphrase !== "");
}

/**
 * Creates dotfile with default values if it doesn't exist.
 */
function createConfigIfNeeded() {
  // logs.log("CHECKING FOR DOTFILE");
  if (fs.existsSync(paths.configPath)) {
    return
  } else {
    // logs.log("No dotfile found. Creating DEFAULT.");
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
}

function saveCredentials(newCreds) {
  // logs.log("SAVING CREDENTIALS");
  let cfg = getConfig()
  cfg.credentials = newCreds;
  writeConfig(cfg);
}

/**
 * Clear credentials by removing the dotfile.
 */
function clearCredentials() {
  fs.unlink(paths.configPath, (err) => {
    if (err) {
      throw err;
    }
    logs.log("Login credentials cleared.");
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

/**
 * Display login screen, allowing user to replace credentials.
 */
function displayLoginScreen() {
  logs.log("DISPLAY LOGIN SCREEN");
  login.createLoginScreen(screen, (creds) => {
    if (creds != null) {
      logs.log("New creds, saving.");
      saveCredentials(creds);
    } else {
      logs.log("No creds, abort.");
    }
  });
}


function showAutotradingMenu() {
  logs.log("Autotrading Menu");
  autotrading.createToggleScreen(screen, function(isEnabling) {
    let cfg = getConfig()
    // logs.log(`Enabling: ${isEnabling}`)
    let isCurrentlyEnabled = cfg.autotrade.enabled;

    // Setting autotrading to the same state should do nothing.
    if ((isEnabling && isCurrentlyEnabled) || (!isEnabling && !isCurrentlyEnabled)) {
      logs.log("Redundant autotrading change.");
      return;
    }

    // Autotrading disabled, so reset all properties to default
    if (!isEnabling) {
      logs.log("Disabling autotrading.");
      cfg.autotrade.enabled = false;
      cfg.autotrade["next-trade-timestamp-UTC"] = 0;
    } else {
      // Autotrading enabled, so set next trade timestamp for +1 hr from now.
      logs.log("Enabling autotrading.");
      cfg.autotrade.enabled = true;
      cfg.autotrade["next-trade-timestamp-UTC"] = getTimeXHoursFromNow(1);
    }

    // Store updated configuration
    writeConfig(cfg);
  });
}

// Placing widgets

var grid = new contrib.grid({
  rows: 36,
  cols: 36,
  screen: screen
})

// TODO: Finish refactoring this out.

// /**
//  * Creates a new list table.
//  * @param  {Boolean} isInteractive   True to make the ListTable interactive.
//  * @return {blessed.ListTable}       blessed ListTable
//  */
// function createListTableParams(isInteractive) {
//   return {
//     parent: screen,
//     keys: true,
//     fg: "green",
//     align: "center",
//     selectedFg: "white",
//     selectedBg: "blue",
//     interactive: isInteractive,
//     style: {
//       fg: colorConstants.tableText,
//       border: {
//         fg: colorConstants.border
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
//     columnSpacing: 1
//   };
// }

// var headlinesTable = grid.set(0, 0, 4, 4, blessed.ListTable, createListTableParams(true));

// Place 3 tables on the left side of the screen, stacked vertically.

var headlinesTable = grid.set(0, 0, 11, 13, blessed.ListTable, {
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
    fg: colorConstants.tableText,
    border: {
      fg: colorConstants.border
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
  // columnSpacing: 1,
});

var technicalIndicatorsTable = grid.set(11, 0, 8, 13, blessed.ListTable, {
  parent: screen,
  keys: true,
  align: "left",
  padding: {
    left: 1,
    right: 1
  },
  style: {
    fg: colorConstants.tableText,
    border: {
      fg: colorConstants.border
    },
    header: {
      fg: colorConstants.tableHeader,
      bold: true
    },
  },
  interactive: false,
  columnSpacing: 1
});

var technicalIndicatorsGauge = grid.set(19, 0, 6.5, 13, contrib.gauge, {
  label: ' Buy/Sell Gauge '.bold.red,
  gaugeSpacing: 0,
  gaugeHeight: 1,
  showLabel: true
})

// technicalIndicatorsGauge.setStack([{
//   percent: 50,
//   stroke: 'red',
// }, {
//   percent: 50,
//   stroke: 'green'
// }]);

var blockchainIndicatorsTable = grid.set(25, 0, 10, 13, blessed.ListTable, {
  parent: screen,
  keys: true,
  align: "left",
  padding: {
    left: 1,
    right: 1
  },
  style: {
    fg: colorConstants.tableText,
    border: {
      fg: colorConstants.border
    },
    header: {
      fg: colorConstants.tableHeader,
      bold: true
    },
  },
  interactive: false,
  columnSpacing: 1
});

// Line chart on the right of the tables

var exchangeRateChart = grid.set(0, 13, 25, 20, contrib.line, {
  style: {
    line: "yellow",
    text: "green",
    baseline: "black"
  },
  xLabelPadding: 3,
  xPadding: 5,
  // showLegend: true,
  wholeNumbersOnly: true,
  label: " Exchange Rate ".bold.red
});

// Price table above countdown.

var priceTable = grid.set(25, 13, 6.5, 6, blessed.ListTable, {
  parent: screen,
  keys: true,
  align: "left",
  padding: {
    left: 1,
    right: 1
  },
  style: {
    fg: colorConstants.tableText,
    border: {
      fg: colorConstants.border
    },
    header: {
      fg: colorConstants.tableHeader,
      bold: true
    },
  },
  interactive: false,
  columnSpacing: 1,
  columnWidth: [25, 20]
});

var logs = grid.set(25, 20, 10, 15, contrib.log, {
  label: " DEBUGGING LOGS ".bold.red,
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
    "Autotrading": {
      keys: ["a"],
      callback: () => {
        showAutotradingMenu();
      }
    },
    "Refresh Data": {
      keys: ["r"],
      callback: () => {
        logs.log("Refresh Data");
        // fetchData()
      }
    },
    "Bitstamp Login": {
      keys: ["l"],
      callback: () => {
        logs.log("Login")
        displayLoginScreen();
      }
    },
    "Logout": {
      keys: ["k"],
      callback: () => {
        clearCredentials();
      }
    },
    "Trade BTC": {
      keys: ["t"],
      callback: () => {
        logs.log("Buy/Sell BTC");
        if (LOGGED_IN) {
          transaction.createTransactionScreen(screen, function(amount, type) {
            // Pass order to backend
            transactionCommand(amount, type)
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
        logs.log("Help Menu Opened");
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
  technicalIndicatorsGauge.emit("attach");
  priceTable.emit("attach");
  menubar.emit("attach");
});

// Quit
screen.key(["escape", "C-c"], function(ch, key) {
  return process.exit(0);
});

// -----------------------
// DATA FETCHING FUNCTIONS
// -----------------------

function getData(path) {
  let data = readJsonFile(path)
  // TODO: Uncomment this.
  // while (!data.fetching) {
  // data = readJsonFile(path)
  // }

  return data.data
}

/**
 * Returns an array with 2 elements, [0] -> Sell Indicator %, [1] -> Buy Indicator %
 * Must be done without headers in the technicalIndicators structure.
 */
function calculateGaugePercentages(technicalIndicators) {
  let totalBuy = 0;
  let totalSell = 0;
  let total = technicalIndicators.length

  for (let idx = 0; idx < total; idx++) {
    let lower = technicalIndicators[idx][2].toLowerCase().trim();
    if (lower == "buy") {
      totalBuy++;
    } else {
      totalSell++;
    }
  }

  let sellPercentage = totalSell / total * 100;
  let buyPercentage = totalBuy / total * 100;
  return [sellPercentage, buyPercentage];
}

function reformatPriceData(priceData) {
  return [
    ["Price", String(priceData[0].last)],
    ["Volume", String(priceData[0].volume)],
    ["24H Low", String(priceData[0].low)],
    ["24H High", String(priceData[0].high)],
    // ["Timestamp", String(priceData[0].timestamp)],
    ["Open Price", String(priceData[0].open)],
  ]
}

function trimHeadlines(headlines) {
  // Trim headlines if too long.
  let shortenedHeadlines = [];
  for (let idx = 0; idx < headlines.length; idx++) {
    let article = headlines[idx]
    let headline = article[1]
    article[1] = headline.length > MAX_HEADLINE_LENTH ? headline.slice(0, MAX_HEADLINE_LENTH) + "..." : headline + "..."
    shortenedHeadlines.push(article);
  }
  // logs.log("SHORTENED", shortenedHeadlines);
  return shortenedHeadlines;
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

var URLs = null

/**
 * Gets updated data for blockchain, technical indicators, headlines and price.
 */
function fetchData() {
  logs.log("Fetching data...");
  let headlineData = trimHeadlines(getData(paths.headlineDataPath));
  URLs = extractUrlAndRemove(headlineData);
  let technicalData = getData(paths.technicalDataPath);
  let gaugeData = calculateGaugePercentages(technicalData);
  let blockchainData = getData(paths.blockchainDataPath);
  let priceData = reformatPriceData(getData(paths.priceDataPath));
  logs.log("Fetched all data...");

  while (!(headlineData && technicalData && gaugeData && blockchainData && priceData)) {
    logs.log("waiting")
  }
  return [headlineData, technicalData, gaugeData, blockchainData, priceData]
}

/**
 * Set all tables with data.
 */
function setAllTables(headlines, technicals, gaugeData, blockchains, prices) {
  logs.log("Set all tables...");
  // logs.log("HEADLINES:", JSON.stringify(headlines, null, 2))
  // console.log(technicals)
  // console.log(blockchains)
  // console.log(prices)
  // console.log(gaugeData)

  // Set headers for each table.
  headlines.splice(0, 0, headers.headline);
  technicals.splice(0, 0, headers.technical);
  blockchains.splice(0, 0, headers.blockchain);
  prices.splice(0, 0, headers.price);

  // Set data
  headlinesTable.setData(headlines);
  technicalIndicatorsTable.setData(technicals);
  technicalIndicatorsGauge.setStack([{
    percent: gaugeData[0],
    stroke: 'red',
  }, {
    percent: gaugeData[1],
    stroke: 'green'
  }]);
  technicalIndicatorsGauge.setData()
  blockchainIndicatorsTable.setData(blockchains);
  priceTable.setData(prices);

  screen.render();
  logs.log("setAllTables COMPLETE");
}

/**
 * Set exchange rate chart with data.
 * TODO: Fix this.
 */
function setChart() {
  logs.log("setChart CALLED");
  setLineData([exchangeRateSeries], exchangeRateChart);

  setInterval(function() {
    setLineData([exchangeRateSeries], exchangeRateChart);
    screen.render();
  }, 500)
}

/**
 * Fetches new data and refreshes frontend displays.
 */
function fetchAndRefreshDataDisplay() {
  logs.log("Fetch and refresh data.")
  let [headlineData, technicalData, gaugeData, blockchainData, priceData] = fetchData();
  setAllTables(headlineData, technicalData, gaugeData, blockchainData, priceData);
  setChart();
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

  LOGGED_IN = true

  fetchAndRefreshDataDisplay();
  headlinesTable.focus();

  logs.log("Initial data fetching done. Starting refresh loops.");

  // TODO: Fix headline refocusing bug.
  setInterval(function() {
    fetchAndRefreshDataDisplay();
  }, 3000)
}

doThings();
