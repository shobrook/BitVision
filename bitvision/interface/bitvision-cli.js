// GLOBALS
"use strict";
let os = require("os");
let fs = require("fs");
let cli = require("commander");
let colors = require("colors");
let openBrowser = require("opn");
let blessed = require("blessed");
let contrib = require("blessed-contrib");
let exec = require('child-process-promise').exec;

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

// ------------------
// UTILITY FUNCTIONS
// ------------------

/**
 * Read JSON file and do something with the data
 */
function readJsonFile(path) {
  // logs.log("Reading " + path);
  let jsonFile = fs.readFileSync(path, "utf8")
  if (jsonFile) {
    return JSON.parse(jsonFile);
  }
  return false
}

/**
 * Execute shell command.
 **/
function executeShellCommand(command) {
  logs.log(`Executing: ${command}`);
  exec(command).then(function(result) {
      var stdout = result.stdout;
      var stderr = result.stderr;
      // logs.log('stdout: ', stdout);
      // logs.log('stderr: ', stderr);
    })
    .catch(function(err) {
      console.error('ERROR: ', err);
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
  let cmd = `${constants.commands.transaction}${payload}`;
  logs.log(`Executing: ${cmd}`);
  // executeShellCommand(cmd)
}

function refreshDataCommand() {
  executeShellCommand(constants.commands.refresh_network);
  executeShellCommand(constants.commands.refresh_headlines);
  // executeShellCommand(constants.commands.refresh_portfolio);
}

function retrainModelCommand() {
  logs.log(`Executing: ${constants.commands.retrain_model}`)
  // executeShellCommand(constants.commands.retrain_model);
}

// -------------------------
// CONFIG/CREDENTIALS FUNCTIONS
// -------------------------

function writeJsonFile(path, data) {
  logs.log(`WRITING FILE at ${path}`);
  // logs.log(JSON.stringify(data) + "\n")
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Gets config file in dictionary form.
 */
function getConfig() {
  // logs.log("GETTING CONFIG");
  return readJsonFile(constants.paths.configPath);
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
  if (fs.existsSync(constants.paths.configPath)) {
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
    writeJsonFile(constants.paths.configPath, emptyConfig);
  }
}

function saveCredentials(newCreds) {
  // logs.log("SAVING CREDENTIALS");
  let cfg = getConfig()
  cfg.credentials = newCreds;
  writeJsonFile(constants.paths.configPath, cfg);
}

/**
 * Clear credentials by removing the dotfile.
 */
function clearCredentials() {
  fs.unlink(constants.paths.configPath, (err) => {
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
    writeJsonFile(constants.paths.configPath, cfg);
  });
}

// Placing widgets

var grid = new contrib.grid({
  rows: 36,
  cols: 36,
  screen: screen
})

/**
 * Creates a new list table.
 * @param  {Boolean} isInteractive   True to make the ListTable interactive.
 * @return {blessed.ListTable}       blessed ListTable
 */
function createListTable(alignment, isInteractive, padding) {
  return {
    parent: screen,
    keys: true,
    align: alignment,
    selectedFg: "white",
    selectedBg: "blue",
    interactive: isInteractive,
    padding: padding,
    style: {
      fg: constants.colors.tableText,
      border: {
        fg: constants.colors.border
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
    columnSpacing: 1,
  };
}

let padding = {
  left: 1,
  right: 1
}

// Place 3 tables and a gauge on the left side of the screen, stacked vertically.

var headlinesTable = grid.set(0, 0, 11, 13, blessed.ListTable, createListTable("center", true, null));
var technicalIndicatorsTable = grid.set(11, 0, 8, 13, blessed.ListTable, createListTable("left", false, padding));

var technicalIndicatorsGauge = grid.set(19, 0, 6.5, 13, contrib.gauge, {
  label: ' Buy/Sell Gauge '.bold.red,
  gaugeSpacing: 0,
  gaugeHeight: 1,
  showLabel: true
})

var blockchainIndicatorsTable = grid.set(25, 0, 10, 13, blessed.ListTable, createListTable("left", false, padding)); // {

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

// Price table

var priceTable = grid.set(25, 13, 6.5, 6, blessed.ListTable, createListTable("left", false, padding));

var logs = grid.set(15, 19, 20, 20, contrib.log, {
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
        fetchAndRefreshDataDisplay();
      }
    },
    "Login": {
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

/**
 * Wait until data.fetching is false and then return the data
 * @param  {String} path File path
 * @return {Dict}        Data
 */
function getData(path) {
  let file = readJsonFile(path);
  while (file.fetching || !file) {
    file = readJsonFile(path);
  }

  return file.data;
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

var URLs = null

function setFetching(path, value) {
  let json = readJsonFile(path);
  json.fetching = value;
  writeJsonFile(path, json);
}

/**
 * Gets updated data for blockchain, technical indicators, headlines and price.
 */
function fetchData() {
  logs.log("Fetching data...");
  let headlineData = trimHeadlines(getData(constants.paths.headlineDataPath));
  URLs = extractUrlAndRemove(headlineData);
  let technicalData = getData(constants.paths.technicalDataPath);
  let gaugeData = calculateGaugePercentages(technicalData);
  let blockchainData = getData(constants.paths.blockchainDataPath);
  let priceData = reformatPriceData(getData(constants.paths.priceDataPath));
  logs.log("Fetched all data...");

  // BUG: Fetch data is behaving asynchronously even though it isn't...
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
  // logs.log(technicals)
  // logs.log(blockchains)
  // logs.log(prices)
  // logs.log(gaugeData)

  // Set headers for each table.
  headlines.splice(0, 0, ["Date", "Headline", "Sentiment"]);
  technicals.splice(0, 0, ["Technical Indicator", "Value", "Signal"]);
  blockchains.splice(0, 0, ["Blockchain Network", "Value"]);
  prices.splice(0, 0, ["Price Data", "Value"]);

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

  logs.log("Setting fetching status...\n");
  setFetching(constants.paths.headlineDataPath, true);
  setFetching(constants.paths.technicalDataPath, true);
  setFetching(constants.paths.blockchainDataPath, true);
  setFetching(constants.paths.priceDataPath, true);

  refreshDataCommand();
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

  // // TODO: Fix headline refocusing bug.
  // setInterval(function() {
  //   fetchAndRefreshDataDisplay();
  // }, 3000)
}

doThings();
