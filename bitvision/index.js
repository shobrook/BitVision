// GLOBALS //

const fs = require("fs");
const colors = require("colors");
const openBrowser = require("opn");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
// const spawn = require("child-process-promise").spawn;
const { spawn, spawnSync, fork, exec } = require("child_process");

const {
  colorScheme,
  filePaths,
  pyCommands,
  baseConfig,
  splash
} = require("./constants");
const { createLoginScreen } = require("./modals/login");
const { createHelpScreen } = require("./modals/help");
const { createTransactionScreen } = require("./modals/transaction");
const { createToggleScreen } = require("./modals/autotrading");
const error = require("./modals/error");

const VERSION = "1.0.0";

var helpActiveStatus = false;
var tradeEntryStatus = false;
var loginEntryStatus = false;
var errorEntryStatus = false;

// GENERAL UTILITIES //

function readJSONFile(path, waitForSuccess = true) {
  if (!fs.existsSync(path)) {
    // setTimeout(() => readJSONFile(path), 2000);
    return null;
  } else {
    let JSONFile = fs.readFileSync(path, "utf8");
    while (!JSONFile && waitForSuccess) {
      JSONFile = fs.readFileSync(path, "utf8");
    }

    return JSON.parse(JSONFile);
  }
}

function writeJSONFile(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

function execShellCommand(command) {
  spawn(command[0], command[1], { stdio: "ignore", detached: true });
}

// CONFIG HELPERS //

function getConfig() {
  // QUESTION: Can this be called once and made a global?
  return readJSONFile(filePaths.configPath);
}

function saveCredentials(newCreds) {
  writeJSONFile(filePaths.configPath, {
    ...getConfig(),
    credentials: newCreds
  });
}

function clearCredentials() {
  // BUG: This shouldn't remove the dotfile, it should just reset it
  fs.unlinkSync(filePaths.configPath);
}

function isLoggedIn() {
  return getConfig().logged_in;
}

function createConfig() {
  // NOTE: Kinda redundant since only used once...
  if (!fs.existsSync(filePaths.configPath)) {
    writeJSONFile(filePaths.configPath, baseConfig);
  }
}

// BLESSED HELPERS //

function createListTable(alignment, padding, isInteractive = false) {
  return {
    parent: screen,
    keys: true,
    align: alignment,
    selectedFg: "white",
    selectedBg: "blue",
    interactive: isInteractive, // Makes the list table scrollable
    padding: padding,
    style: {
      fg: colorScheme.tableText,
      border: {
        fg: colorScheme.border
      },
      cell: {
        selected: {
          fg: "black",
          bg: "light-yellow"
        }
      },
      header: {
        fg: "red",
        bold: true
      }
    },
    columnSpacing: 1
  };
}

function displayLoginScreen() {
  createLoginScreen(screen, creds => {
    if (creds) {
      saveCredentials(creds);
      execShellCommand(pyCommands.checkLogin);

      // TODO: In backend, add a failed login flag to config that the frontend
      // can check instead of waiting for 1s

      setTimeout(() => {
        if (!getConfig().logged_in) {
          errorEntryStatus = true;
          error.createErrorScreen(screen);
          errorEntryStatus = false;
        }

        loginEntryStatus = false;
      }, 1000);
    }
  });
}

function showAutotradingMenu() {
  createToggleScreen(screen, function(isEnabling) {
    let config = getConfig();
    let isAutotradingEnabled = config.autotrade.enabled;

    // Setting autotrading to the same state should do nothing
    if (
      (isEnabling && isAutotradingEnabled) ||
      (!isEnabling && !isAutotradingEnabled)
    ) {
      return;
    }

    // Autotrading disabled, so reset all properties to default
    if (!isEnabling) {
      config.autotrade = { enabled: false, "next-trade-timestamp-UTC": 0 };
    } else {
      // Autotrading enabled, so set next trade timestamp for +1 hr from now
      let currentTime = new Date();
      let futureTime = new Date(currentTime);
      futureTime.setHours(currentTime.getHours() + 24);

      config.autotrade = {
        enabled: true,
        "next-trade-timestamp-UTC": futureTime.toJSON()
      };
    }

    // Store updated configuration
    writeJSONFile(filePaths.configPath, config);
  });
}

// DATA RETRIEVAL AND FORMATTING HELPERS //

function updateData(type) {
  switch (type) {
    case "NETWORK":
      execShellCommand(pyCommands.refreshNetwork);
      break;
    case "HEADLINES":
      execShellCommand(pyCommands.refreshHeadlines);
      break;
    case "TICKER":
      execShellCommand(pyCommands.refreshTicker);
      break;
    case "PORTFOLIO":
      execShellCommand(pyCommands.refreshPortfolio);
      break;
  }
}

function reformatPriceData(priceData) {
  return [
    ["Price ($)", String(priceData.last)],
    ["Volume", String(priceData.volume)],
    ["24H Low ($)", String(priceData.low)],
    ["24H High ($)", String(priceData.high)],
    ["Open Price ($)", String(priceData.open)]
  ];
}

function reformatPortfolioData(portfolioData, titles) {
  let autotradingConfig = getConfig().autotrade;
  let enabled = ["Autotrading Enabled", autotradingConfig.enabled];
  // BUG: idk why this doesn't ever seem to work
  let nextTradeTime = ["Next Trade Time", autotradingConfig.nextTradeTime];

  let formattedData = titles.map((title, idx) => {
    return [title, Object.values(portfolioData)[idx]];
  });

  formattedData.push(enabled);
  formattedData.push(nextTradeTime);

  return formattedData;
}

function extractAndRemoveUrls(listOfArticles) {
  let urls = [];
  for (let idx = 0; idx < listOfArticles.length; idx++) {
    urls.push(listOfArticles[idx][3]);
    listOfArticles[idx].splice(3, 1); // Removes last element of each list from original array
  }

  return urls;
}

/**
 * Returns an array with 2 elements, [0] -> Sell Indicator %, [1] -> Buy Indicator %
 * Must be done without headers in the technicalIndicators structure.
 */
function calculateGaugePercentages(technicalIndicators) {
  let totalBuy = 0;
  let totalSell = 0;
  let total = technicalIndicators.length;

  for (let idx = 0; idx < total; idx++) {
    let lower = technicalIndicators[idx][2].toLowerCase().trim();
    if (lower === "buy") {
      totalBuy++;
    } else {
      totalSell++;
    }
  }

  let sellPercentage = (totalSell / total) * 100;
  let buyPercentage = (totalBuy / total) * 100;
  return [sellPercentage, buyPercentage];
}

/**
 * Returns a dictionary with chart data.
 */
function buildChartData(priceData) {
  let lastTwoMonths = priceData.slice(0, 60).reverse();
  let convertedTimestamps = lastTwoMonths.map(x => x.date);
  let prices = lastTwoMonths.map(x => x.price);

  return {
    title: "Exchange Rate",
    x: convertedTimestamps,
    y: prices
  };
}

// ---------------------------------
// BUILDING BLESSED INTERFACE
// [insert obligatory "bless up" reference]
// ---------------------------------

// Globals
var screen = null;
var grid = null;
var headlinesTable = null;
var technicalIndicatorsTable = null;
var technicalIndicatorsGauge = null;
var blockchainIndicatorsTable = null;
var portfolioTable = null;
var priceTable = null;
var exchangeRateChart = null;
var transactionsTable = null;
var menubar = null;
var URLs = null;

/**
 * Replacing globals with blessed widgets.
 * @return {None}
 */
function buildInterface() {
  screen = blessed.screen({
    smartCSR: true,
    title: "BitVision",
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
  });

  let padding = {
    left: 1,
    right: 1
  };

  // Place 3 tables and a gauge on the left side of the screen, stacked vertically

  headlinesTable = grid.set(
    0,
    0,
    10,
    13,
    blessed.ListTable,
    createListTable("center", null, true)
  );
  headlinesTable.focus();
  technicalIndicatorsTable = grid.set(
    10,
    0,
    9,
    13,
    blessed.ListTable,
    createListTable("left", padding)
  );

  technicalIndicatorsGauge = grid.set(19, 0, 6.5, 13, contrib.gauge, {
    label: " Buy/Sell Gauge ".bold.red,
    gaugeSpacing: 0,
    gaugeHeight: 1,
    showLabel: true
  });

  blockchainIndicatorsTable = grid.set(
    26,
    0,
    10,
    13,
    blessed.ListTable,
    createListTable("left", padding)
  );

  // Line chart on the right of the tables

  exchangeRateChart = grid.set(0, 13, 25, 23, contrib.line, {
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

  // Price table and console under chart.

  priceTable = grid.set(
    26,
    29,
    10,
    7,
    blessed.ListTable,
    createListTable("left", padding)
  );

  portfolioTable = grid.set(
    26,
    13,
    10,
    7,
    blessed.ListTable,
    createListTable("left", padding)
  );

  transactionsTable = grid.set(
    26,
    20,
    10,
    9,
    blessed.ListTable,
    createListTable("left", padding)
  );

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
      }
    },
    commands: {
      Login: {
        keys: ["l"],
        callback: () => {
          loginEntryStatus = true;
          displayLoginScreen();
        }
      },
      "Toggle Autotrading": {
        keys: ["a"],
        callback: () => {
          if (isLoggedIn()) {
            showAutotradingMenu();
          } else {
            displayLoginScreen();
          }
        }
      },
      "Make a Trade": {
        keys: ["t"],
        callback: () => {
          if (isLoggedIn()) {
            tradeEntryStatus = true;
            createTransactionScreen(screen, function(amount, type) {
              let makeTradeCommand = Array.from(pyCommands.makeTrade);
              makeTradeCommand[1].push(`${{ amount, type }}`);

              execShellCommand(makeTradeCommand);
              tradeEntryStatus = false;
            });
          } else {
            displayLoginScreen();
          }
        }
      },
      Help: {
        keys: ["h"],
        callback: () => {
          if (!helpActiveStatus) {
            helpActiveStatus = true;
            createHelpScreen(screen, VERSION, () => {
              helpActiveStatus = false;
            });
          }
        }
      },
      Logout: {
        keys: ["k"],
        callback: () => {
          clearCredentials();
        }
      },
      Exit: {
        keys: ["C-c", "escape"],
        callback: () => process.exit(0)
      }
    }
  });

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

  // Open article
  screen.key(["enter"], function(ch, key) {
    if (!tradeEntryStatus && !loginEntryStatus && !errorEntryStatus) {
      let selectedArticleURL = URLs[headlinesTable.selected - 1];
      openBrowser(selectedArticleURL);
    }
  });

  // Quit
  screen.key(["escape", "C-c"], function(ch, key) {
    return process.exit(0);
  });
}

// ------------------------------
// BLESSED DATA SETTING FUNCTIONS
// ------------------------------

function refreshInterface() {
  const headlinesJSON = readJSONFile(filePaths.headlineDataPath);
  const technicalIndicatorJSON = readJSONFile(filePaths.technicalDataPath);
  const blockchainJSON = readJSONFile(filePaths.blockchainDataPath);
  const tickerJSON = readJSONFile(filePaths.priceDataPath);
  const graphJSON = readJSONFile(filePaths.graphDataPath);
  const portfolioJSON = readJSONFile(filePaths.portfolioDataPath);
  const transactionsJSON = readJSONFile(filePaths.transactionsDataPath);

  let headlineData = headlinesJSON.data.map(article => {
    // Truncates each headline by 35 characters
    let headline = article[1];
    article[1] =
      headline.length > 35 ? headline.slice(0, 35) + "..." : headline + "...";

    return article;
  });
  let technicalData = technicalIndicatorJSON.data;
  let gaugeData = calculateGaugePercentages(technicalData);
  let blockchainData = blockchainJSON.data;
  let tickerData = reformatPriceData(tickerJSON.data);
  let chartData = buildChartData(graphJSON.data);
  let portfolioData = reformatPortfolioData(portfolioJSON.data, [
    "Account Balance",
    "Returns",
    "Net Profit",
    "Sharpe Ratio",
    "Buy Accuracy",
    "Sell Accuracy",
    "Total Trades"
  ]);
  let transactionData = transactionsJSON.data;

  URLs = extractAndRemoveUrls(headlineData);

  // Set headers for each table
  headlineData.splice(0, 0, ["Date", "Headline", "Sentiment"]);
  technicalData.splice(0, 0, ["Technical Indicator", "Value", "Signal"]);
  blockchainData.splice(0, 0, ["Blockchain Network", "Value"]);
  tickerData.splice(0, 0, ["Ticker Data", "Value"]);
  portfolioData.splice(0, 0, ["Portfolio Stats", "Value"]);
  transactionData.splice(0, 0, ["Transaction", "Amount", "Date"]);

  if (transactionData.length == 1) {
    transactionData.splice(1, 0, ["NO", "TRANSACTION", "DATA"]);
  }

  headlinesTable.setData(headlineData);
  technicalIndicatorsTable.setData(technicalData);
  technicalIndicatorsGauge.setStack([
    {
      percent: gaugeData[0],
      stroke: "red"
    },
    {
      percent: gaugeData[1],
      stroke: "green"
    }
  ]);
  blockchainIndicatorsTable.setData(blockchainData);
  priceTable.setData(tickerData);
  portfolioTable.setData(portfolioData);
  transactionsTable.setData(transactionData);
  exchangeRateChart.setData(chartData);

  screen.render();
}

//------
// MAIN
//------

/**
 * Let's get this show on the road.
 */
function main() {
  // Display splash screen
  console.log(splash.logo);
  console.log(splash.description);

  createConfig();

  console.log(splash.fetchingData("price data from Bitstamp"));
  updateData("TICKER");

  console.log(splash.fetchingData("blockchain network attributes"));
  updateData("NETWORK");

  console.log(splash.fetchingData("Bitcoin-related headlines"));
  updateData("HEADLINES");

  console.log(splash.fetchingData("transaction history from Bitstamp"));
  updateData("PORTFOLIO");

  setInterval(function() {
    updateData("NETWORK");
  }, 15000); // 15 sec

  setInterval(function() {
    // console.log("HEADLINES REFRESH");
    updateData("HEADLINES");
  }, 900000); // 15 min

  setInterval(function() {
    updateData("TICKER");
  }, 2000);

  setInterval(function() {
    updateData("PORTFOLIO");
  }, 3000);

  // call the rest of the code and have it execute after 8 seconds
  setTimeout(function() {
    buildInterface();

    setInterval(function() {
      refreshInterface();
    }, 3000);
  }, 8000);
}

main();
