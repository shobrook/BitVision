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
let VERSION = require("../package.json").version

let MAX_HEADLINE_LENTH = 28;
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

const colors = {
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
  // log(listOfArticles)
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
  // log("Reading " + path);
  return JSON.parse(fs.readFileSync(path, "utf8"));
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
  // log(`CurrentTime: ${currentTime.toJSON()}`)
  // log(`FutureTime : ${futureTime.toJSON()}`)
  return futureTime.toJSON()
}

// -----------------------
// PYTHON CONTROL METHODS
// -----------------------

function transactionPayload(amount, type) {
  return {
    "amount": amount,
    "type": type
  }
}

function buyBTCCommand(amount) {
  let cmd = `${commands.transaction}${transactionPayload(amount, "BUY")}`
  log(`Executing: ${cmd}`)
  // executeShellCommand(cmd)
}

function sellBTCCommand(amount) {
  let cmd = `${commands.transaction}${transactionPayload(amount, "SELL")}`
  log(`Executing: ${cmd}`)
  // executeShellCommand(cmd)
}

function refreshDataCommand() {
  log(`Executing: ${commands.refresh}`)
  // executeShellCommand(commands.refresh);
}

function retrainModelCommand() {
  log(`Executing: ${commands.retrain_model}`)
  // executeShellCommand(commands.retrain_model);
}

// -------------------------
// CONFIG/CREDENTIALS FUNCTIONS
// -------------------------

function writeConfig(config) {
  // log(`WRITING FILE at ${paths.configPath}`);
  fs.writeFile(paths.configPath, JSON.stringify(config), "utf8", () => {
    // log("File Saved.");
  });
}

/**
 * Gets config file in dictionary form.
 */
function getConfig() {
  // log("GETTING CONFIG");
  return readJsonFile(paths.configPath);
}

/**
 * Checks for credentials in the config file.
 * @return {Bool} Returns true if all creds exist, false otherwise.
 */
function hasCredentialsInConfig() {
  // log("Checking for credentials in config...");
  let creds = getConfig().credentials;
  return !(creds.key === "" || creds.secret !== "" || creds.passphrase !== "");
}

/**
 * Creates dotfile with default values if it doesn't exist.
 */
function createConfigIfNeeded() {
  // log("CHECKING FOR DOTFILE");
  if (fs.existsSync(paths.configPath)) {
    return
  } else {
    // log("No dotfile found. Creating DEFAULT.");
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
  // log("SAVING CREDENTIALS");
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
    } else {
      log("No creds, abort.");
    }
  });
}


function showAutotradingMenu() {
  log("Autotrading Menu");
  tradingToggle.createToggleScreen(screen, function(isEnabling) {
    let cfg = getConfig()
    // log(`Enabling: ${isEnabling}`)
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

// var headlinesTable = grid.set(0, 0, 4, 4, blessed.ListTable, createListTableParams(true, [10, 35, 10]));

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
  // columnWidth: [35, 10, 10]
});

var technicalIndicatorsGauge = grid.set(19, 0, 7, 13, contrib.gauge, {
  label: '{bold}{red-fg}Buy/Sell Gauge{/red-fg}{/bold}',
  style: {
    fg: "red",
    bold: true,
  },
  gaugeSpacing: 0,
  gaugeHeight: 1,
  showLabel: true
})

technicalIndicatorsGauge.setStack([{
  percent: 50,
  stroke: 'red'
}, {
  percent: 50,
  stroke: 'green'
}]);

var blockchainIndicatorsTable = grid.set(25, 0, 10, 13, blessed.ListTable, {
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
  // columnWidth: [20, 20]
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
  label: "Exchange Rate"
});

// Price table above countdown.

var priceTable = grid.set(26, 13, 7, 7, blessed.ListTable, {
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
  columnWidth: [25, 20]
});

// Countdown under price data.

// var countdown = grid.set(26, 20, 7, 5, contrib.lcd, {
//   segmentWidth: 0.06,
//   segmentInterval: 0.10,
//   strokeWidth: 0.1,
//   elements: 2,
//   display: "45",
//   elementSpacing: 4,
//   elementPadding: 2,
//   color: "white", // color for the segments
//   // label: "Min. Until Next Trade",
//   style: {
//     border: {
//       fg: colors.border
//     },
//   },
// })

var logs = grid.set(26, 20, 7, 15, blessed.box, {
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
    "Autotrading": {
      keys: ["a"],
      callback: () => {
        showAutotradingMenu();
      }
    },
    "Refresh Data": {
      keys: ["r"],
      callback: () => {
        log("Refresh Data");
        // fetchData()
      }
    },
    "Bitstamp Login": {
      keys: ["l"],
      callback: () => {
        log("Login")
        displayLoginScreen();
      }
    },
    "Logout": {
      keys: ["k"],
      callback: () => {
        clearCredentials();
      }
    },
    "Deposit BTC": {
      keys: ["d"],
      callback: () => {
        depositBTC();
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

function reformatPriceData(priceData) {
  return [
    ["Current Price", String(priceData[0].last)],
    ["24H High", String(priceData[0].high)],
    ["24H Low", String(priceData[0].low)],
    ["Open Price", String(priceData[0].open)],
    ["Volume", String(priceData[0].volume)],
    ["Timestamp", String(priceData[0].timestamp)]
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
  // log("SHORTENED", shortenedHeadlines);
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
  log("Fetching data...");
  let headlineData = trimHeadlines(getData(paths.headlineDataPath));
  URLs = extractUrlAndRemove(headlineData);
  let technicalData = getData(paths.technicalDataPath);
  let blockchainData = getData(paths.blockchainDataPath);
  let priceData = reformatPriceData(getData(paths.priceDataPath));
  log("Fetched all data...");

  while (!(headlineData && technicalData && blockchainData && priceData)) {
    log("waiting")
  }
  return [headlineData, technicalData, blockchainData, priceData]
}

/**
 * Set all tables with data.
 */
function setAllTables(headlines, technicals, blockchains, prices) {
  log("Set all tables...");
  // log("HEADLINES:", JSON.stringify(headlines, null, 2))
  // log(technicals)
  // log(blockchains)
  // log(prices)

  // Set headers for each table.
  headlines.splice(0, 0, headers.headline);
  technicals.splice(0, 0, headers.technical);
  blockchains.splice(0, 0, headers.blockchain)
  prices.splice(0, 0, headers.price);

  log("Setting headlines...");
  headlinesTable.setData(headlines);

  log("Setting technicals...");
  technicalIndicatorsTable.setData(technicals);

  log("Setting blockchain network table...");
  blockchainIndicatorsTable.setData(blockchains);

  log("Setting price table...")
  priceTable.setData(prices);

  screen.render();
  log("setAllTables COMPLETE");
}

/**
 * Set exchange rate chart with data.
 * TODO: Fix this.
 */
function setChart() {
  log("setChart CALLED");
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
  log("Fetch and refresh data.")
  let [headlineData, technicalData, blockchainData, priceData] = fetchData();
  setAllTables(headlineData, technicalData, blockchainData, priceData);
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
  screen.render();

  log("Initial data fetching done. Starting refresh loops.");

  setInterval(function() {
    fetchAndRefreshDataDisplay();
    headlinesTable.focus();
    screen.render();
  }, 3000)
}

doThings();
