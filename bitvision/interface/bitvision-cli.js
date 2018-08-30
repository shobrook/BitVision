// NPM IMPORTS
"use strict";
let os = require("os");
let fs = require("fs");
let cli = require("commander");
let colors = require("colors");
let openBrowser = require("opn");
let blessed = require("blessed");
let contrib = require("blessed-contrib");
let spawn = require('child-process-promise').spawn;

// LOCAL IMPORTS
// TODO: Restructure imports like this.
// import { paths } from "./constants"
let constants = require("./constants");
let login = require("./popups/login");
let help = require("./popups/help");
let transaction = require("./popups/transaction");
let autotrading = require("./popups/autotrading");
let VERSION = require("../package.json").version

// GLOBALS
var helpActiveStatus = false


// Display version with CLI args
cli
  .version(VERSION, '-v, --version')
  .parse(process.argv)

// ------------------
// UTILITY FUNCTIONS
// ------------------

/**
 * Read JSON file and return the data if it exists, false otherwise
 */
function readJsonFile(path) {
  // logs.log("Reading " + path);
  let jsonFile = fs.readFileSync(path, "utf8");
  while (!jsonFile) {
    jsonFile = fs.readFileSync(path, "utf8");
  }
  return JSON.parse(jsonFile)
}

/**
 * Writes data to file at path.
 */
function writeJsonFile(path, data) {
  // logs.log(`WRITING: at ${path}`);
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Execute shell command.
 **/
function executeShellCommand(command) {
  // console.log(`Executing: ${command}`);
  // Extract first element
  let args = command.split(" ");
  let program = args.splice(0, 1)[0];

  // logs.log(args);
  // console.log(program);
  var promise = spawn(program, args);
  var childProcess = promise.childProcess;

  promise.then(function() {
      // console.log('[spawn] done!');
    })
    .catch(function(err) {
      // console.log('[spawn] ERROR: ', err);
    });
}

/**
 * Pass a trade to the backend
 * @param  {Number} amount Amount to trade in BTC
 * @param  {String} type   Either "BUY" or "SELL"
 * @return {None}
 */
function executeTrade(amount, type) {
  let payload = {
    "amount": amount,
    "type": type
  };
  let cmd = `${constants.commands.transaction}${payload}`;
  logs.log(`Executing: ${cmd}`);
  // executeShellCommand(cmd)
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

// -------------------
// CONFIG/CREDENTIALS
// -------------------

/**
 * Returns config file in dictionary form.
 */
function getConfig() {
  return readJsonFile(constants.paths.configPath);
}

function saveCredentials(newCreds) {
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

/**
 * Checks for credentials in the config file.
 * @return {Bool} Returns true if all creds exist, false otherwise.
 */
function credentialsExist() {
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
    writeJsonFile(constants.paths.configPath, constants.baseConfig);
  }
}

// -------------------
// BLESSED FUNCTIONS
// -------------------
/**
 * Creates a new list table.
 * @param  {Boolean} isInteractive   True to make the ListTable interactive.
 * @return {blessed.ListTable}       blessed ListTable
 */
function createTable(alignment, isInteractive, padding) {
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
      cfg.autotrade["next-trade-timestamp-UTC"] = getTimeXHoursFromNow(24);
    }

    // Store updated configuration
    writeJsonFile(constants.paths.configPath, cfg);
  });
}

//--------------------------
// DATA FETCHING FUNCTIONS
//--------------------------

/**
 * Fetches new data and refreshes frontend displays.
 */
function refreshData(type) {
  // console.log("Getting new JSON data from the interwebs.")
  switch (type) {
    case "NETWORK":
      executeShellCommand(constants.commands.refresh_network);
      break;
    case "HEADLINES":
      executeShellCommand(constants.commands.refresh_headlines);
      break;
    case "PRICE":
      executeShellCommand(constants.commands.refresh_price);
      break;
    case "PORTFOLIO":
      executeShellCommand(constants.commands.refresh_portfolio);
      break;
  }
}

/**
 * Gets updated data for blockchain, technical indicators, headlines and price.
 */
function getDataFromJsonFiles() {
  // logs.log("getDataFromJson..");
  // TODO: Scale max headline length
  let maxHeadlineLength = 35;
  let headlineData = trimHeadlines(readJsonFile(constants.paths.headlineDataPath).data, maxHeadlineLength);
  URLs = extractUrlAndRemove(headlineData);
  let technicalData = readJsonFile(constants.paths.technicalDataPath).data;
  let gaugeData = calculateGaugePercentages(technicalData);
  let blockchainData = readJsonFile(constants.paths.blockchainDataPath).data;
  let priceData = reformatPriceData(readJsonFile(constants.paths.priceDataPath).data);
  let portfolioDataKeys = [
    "Account Balance",
    "Returns",
    "Net Profit",
    "Sharpe Ratio",
    "Buy Accuracy",
    "Sell Accuracy",
    "Total Trades"
  ]
  let portfolioData = reformatPortfolioData(readJsonFile(constants.paths.portfolioDataPath).data, portfolioDataKeys)
  let transactionsData = readJsonFile(constants.paths.transactionsDataPath).data

  return [headlineData, technicalData, gaugeData, blockchainData, priceData, portfolioData, transactionsData]
}

//--------------------------
// DATA FORMATTING FUNCTIONS
//--------------------------

function reformatPriceData(priceData) {
  return [
    ["Price", String(priceData[0].last)],
    ["Volume", String(priceData[0].volume)],
    ["24H Low", String(priceData[0].low)],
    ["24H High", String(priceData[0].high)],
    ["Open Price", String(priceData[0].open)],
  ]
}

function reformatPortfolioData(portfolioData, titles) {
  return titles.map((title, idx) => {
    return [title, Object.values(portfolioData)[idx]]
  })
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

/**
 * Trim headlines if longer than len.
 * @param  {[type]} headlines List of lists
 * @param  {Number} len       Length
 * @return {[type]}           [description]
 */
function trimHeadlines(headlines, len) {
  let shortenedHeadlines = [];
  for (let idx = 0; idx < headlines.length; idx++) {
    let article = headlines[idx]
    let headline = article[1]
    article[1] = headline.length > len ? headline.slice(0, len) + "..." : headline + "..."
    shortenedHeadlines.push(article);
  }
  // logs.log("SHORTENED", shortenedHeadlines);
  return shortenedHeadlines;
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

// ---------------------------------
// BUILDING BLESSED INTERFACE
// ** Bless up -> 3x preach emoji **
// ---------------------------------

// Placeholders
var screen = null;
var grid = null;
var logs = null;
var headlinesTable = null;
var technicalIndicatorsTable = null;
var technicalIndicatorsGauge = null;
var blockchainIndicatorsTable = null;
var portfolioTable = null;
var priceTable = null;
var exchangeRateChart = null;
var transactionsTable = null;
var menubar = null;
var skipTrace = null;
var URLs = null

/**
 * Replacing globals with blessed widgets.
 * @return {None}
 */
function buildInterface() {

  screen = blessed.screen({
    smartCSR: true,
    title: "Bitvision",
    cursor: {
      artificial: true,
      shape: "line",
      blink: true,
      color: "red"
    }
  });

  grid = new contrib.grid({
    rows: 36,
    cols: 36,
    screen: screen
  })

  let padding = {
    left: 1,
    right: 1
  }

  // Place 3 tables and a gauge on the left side of the screen, stacked vertically.

  headlinesTable = grid.set(0, 0, 11, 13, blessed.ListTable, createTable("center", true, null));
  headlinesTable.focus();
  technicalIndicatorsTable = grid.set(11, 0, 8, 13, blessed.ListTable, createTable("left", false, padding));

  technicalIndicatorsGauge = grid.set(18, 0, 7, 13, contrib.gauge, {
    label: ' Buy/Sell Gauge '.bold.red,
    gaugeSpacing: 0,
    gaugeHeight: 1,
    showLabel: true
  })

  blockchainIndicatorsTable = grid.set(25, 0, 10, 13, blessed.ListTable, createTable("left", false, padding));

  // Line chart on the right of the tables

  exchangeRateChart = grid.set(0, 13, 18, 23, contrib.line, {
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

  // Price table and logs under chart.

  priceTable = grid.set(18, 30, 7, 6, blessed.ListTable, createTable("left", false, padding));

  // @Jon, skipTrace goes here
  // volumeSkipTrace = grid(18, 22, 7, 6,

  portfolioTable = grid.set(25, 13, 10, 6, blessed.ListTable, createTable("left", false, padding));

  transactionsTable = grid.set(25, 19, 10, 8, blessed.ListTable, createTable("left", false, padding));

  logs = grid.set(25, 29, 10, 7, contrib.log, {
    label: " DEBUGGING LOGS ".bold.red,
    top: 0,
    left: 0,
    height: "100%-1",
    width: "100%",
  })

  menubar = blessed.listbar({
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
          if (credentialsExist) {
            showAutotradingMenu();
          } else {
            displayLoginScreen();
            showAutotradingMenu();
          }
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
          if (credentialsExist) {
            transaction.createTransactionScreen(screen, function(amount, type) {
              // Pass order to backend
              executeTrade(amount, type)
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
          logs.log(`Help Menu Opened, HAS: ${helpActiveStatus}`);
          if (!helpActiveStatus) {
            helpActiveStatus = true;
            logs.log(`HAS set to: ${helpActiveStatus}`);
            help.createHelpScreen(screen, VERSION, () => {
              helpActiveStatus = false;
              logs.log(`HAS set to: ${helpActiveStatus}`);
            })
          }
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
}

// ------------------------------
// BLESSED DATA SETTING FUNCTIONS
// ------------------------------

/**
 * Set all tables with data.
 */
function setAllTables(headlines, technicals, gaugeData, blockchains, prices, portfolio, transactions) {
  logs.log("SetAllTables");

  // Set headers for each table.
  headlines.splice(0, 0, ["Date", "Headline", "Sentiment"]);
  technicals.splice(0, 0, ["Technical Indicator", "Value", "Signal"]);
  blockchains.splice(0, 0, ["Blockchain Network", "Value"]);
  prices.splice(0, 0, ["Ticker Data", "Value"]);
  portfolio.splice(0, 0, ["Portfolio Stats", "Value"]);
  transactions.splice(0, 0, ["Transaction", "Amount", "Date"])

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
  blockchainIndicatorsTable.setData(blockchains);
  priceTable.setData(prices);
  portfolioTable.setData(portfolio);
  transactionsTable.setData(transactions);
  screen.render();
}

function getRandomInteger(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function setLineData(lineData, chart) {
  for (var i = 0; i < lineData.length; i++) {
    var last = lineData[i].y[lineData[i].y.length - 1];
    lineData[i].y.shift();
    var num = getRandomInteger(750, 800)
    lineData[i].y.push(num);
  }
  chart.setData(lineData);
}

let exchangeRateSeries = {
  title: "Exchange Rate",
  x: [...Array(700).keys()].map((key) => {
    return String(key) + ":00"
  }),
  y: [...Array(700).keys()].map((key) => {
    return key * getRandomInteger(10, 14)
  })
}

function refreshInterface() {
  let [headlineData, technicalData, gaugeData, blockchainData, priceData, portfolioData, transactionsData] = getDataFromJsonFiles();
  setAllTables(headlineData, technicalData, gaugeData, blockchainData, priceData, portfolioData, transactionsData);
  setLineData([exchangeRateSeries], exchangeRateChart);
}

//------
// MAIN
//------

function splashScreen() {
  console.log(constants.splash.logo);
  console.log(constants.splash.authors);
  console.log(constants.splash.stalling);
}

/**
 * Let's get this show on the road.
 */
function doThings() { // nice function name
  splashScreen();
  createConfigIfNeeded();

  setInterval(function() {
    refreshData("NETWORK");
  }, 15000) // 15 sec

  setInterval(function() {
    refreshData("HEADLINES");
  }, 900000) // 15 min

  setInterval(function() {
    refreshData("PRICE");
  }, 2000)

  // setInterval(function() {
  //   refreshData("PORTFOLIO");
  // }, 3000)

  // setInterval(function() {
  //   refreshData("TRANSACTIONS");
  // }, 3000)

  // setInterval(function() {
  //   refreshData("CHART");
  // }, 3000)

  // call the rest of the code and have it execute after 5 seconds
  setTimeout(function() {
    buildInterface();

    setInterval(function() {
      refreshInterface();
    }, 3000)

    // }, 5000)
  }, 2000)
}

doThings();
