#!/usr/bin/env node

// GLOBALS //

const fs = require("fs");
const colors = require("colors");
const figures = require("figures");
const openBrowser = require("opn");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
const inquirer = require("inquirer");
const moment = require("moment");
const { spawnSync, execSync } = require("child_process");

const {
  colorScheme,
  filePaths,
  pyCommands,
  baseConfig,
  splash
} = require("./constants");
const { createLoginScreen } = require("./modals/login");
const { createHelpScreen } = require("./modals/help");
const { createOrderScreen } = require("./modals/order");
const { createNotificationModal } = require("./modals/notification");

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

function execShellCommand(command, inclStdout = false) {
  let spawnedProcess = spawnSync(command[0], command[1], {
    stdio: "ignore",
    detached: true
  });

  // spawnedProcess.unref();
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
  fs.unlinkSync(filePaths.configPath);
  createConfig();
}

function isLoggedIn() {
  return getConfig().logged_in;
}

function storeLastSync(lastRefresh = +new Date()) {
  writeJSONFile(filePaths.configPath, {
    ...getConfig(),
    lastRefresh
  });
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
          createNotificationModal(screen, {
            label: " {bold}{red-fg}Error{/bold}{/red-fg} ",
            hint: " {bold}Check your connection or credentials.{/bold} "
          });
          errorEntryStatus = false;
        }

        loginEntryStatus = false;
      }, 1000);
    }
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
  }
  storeLastSync();
}

function reformatPriceData(priceData) {
  // let price = `${String(priceData.last)} ${figures.arrowUp.green}`;
  // let volume = `${String(priceData.volume)} ${figures.arrowUp.green}`;

  let price = `${String(priceData.last)}`;
  let volume = `${String(priceData.volume)}`;

  return [
    ["Price ($)", price],
    ["Volume", volume],
    ["24H Low ($)", String(priceData.low)],
    ["24H High ($)", String(priceData.high)],
    ["Open Price ($)", String(priceData.open)]
  ];
}

function reformatPortfolioData(portfolioData, titles) {
  let autotradingConfig = getConfig().autotrade;
  // BUG: idk why this doesn't ever seem to work
  let nextTradeTime = ["Next Trade Time", autotradingConfig.nextTradeTime];

  let formattedData = titles.map((title, idx) => {
    return [title, Object.values(portfolioData)[idx]];
  });

  // formattedData.push(nextTradeTime);

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

function calculateGaugePercentages(technicalIndicators) {
  let totalBuy = 0.0;
  let totalSell = 0.0;
  let ignoreCount = 0.0;

  technicalIndicators.forEach(indicator => {
    let signal = indicator[2].toLowerCase().trim();
    if (signal.includes("buy")) {
      totalBuy++;
    } else if (signal.includes("sell")) {
      totalSell++;
    } else {
      ignoreCount++;
    }
  });

  let sellPerc = (totalSell / (technicalIndicators.length - ignoreCount)) * 100;
  let buyPerc = (totalBuy / (technicalIndicators.length - ignoreCount)) * 100;

  return [Number(sellPerc.toFixed(2)), Number(buyPerc.toFixed(2))];
}

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

// BLESSED INTERFACE HELPERS //
/* [insert obligatory "bless up" comment] */

var screen = null;
var grid = null;
var headlinesTable = null;
var technicalIndicatorsTable = null;
var technicalIndicatorsGauge = null;
var blockchainIndicatorsTable = null;
// var constructionLabel = null;
var portfolioTable = null;
var priceTable = null;
var exchangeRateChart = null;
var transactionsTable = null;
var menubar = null;
var URLs = null;

function colorize(row) {
  const rawLabel = row[2].toString();
  let label = rawLabel
    .toString()
    .toLowerCase()
    .trim();

  if (label == "pos" || label == "buy") {
    return `${rawLabel}`.green;
  } else if (label == "neg" || label == "sell") {
    return `${rawLabel}`.red;
  }

  return rawLabel.yellow;
}

function buildMenuCommands() {
  let login = {
    " Login": {
      keys: ["L-l", "L", "l"],
      callback: () => {
        loginEntryStatus = true;
        displayLoginScreen();
      }
    }
  };
  let logout = {
    " Logout": {
      keys: ["O-o", "O", "o"],
      callback: () => clearCredentials()
    }
  };
  let makeTrade = {
    " Place an Order": {
      keys: ["P-p", "P", "p"],
      callback: () => {
        if (isLoggedIn()) {
          tradeEntryStatus = true;
          createOrderScreen(screen, (amount, type) => {
            execShellCommand(pyCommands.makeTrade(`${{ amount, type }}`));
            tradeEntryStatus = false;
          });
        } else {
          displayLoginScreen();
        }
      }
    }
  };

  let defaultCmds = {
    " Refresh": {
      keys: ["R-r", "R", "r"],
      callback: () => {
        createNotificationModal(
          screen,
          {
            label: " {bold}{red-fg}Refreshing...{/bold}{/red-fg} ",
            hint: " {bold}This may take a couple seconds.{/bold} "
          },
          false,
          notification => {
            updateData("TICKER");
            updateData("PORTFOLIO");
            updateData("NETWORK");
            updateData("HEADLINES");

            notification.destroy();

            refreshInterface();
          }
        );
      }
    },
    " Help": {
      keys: ["H-h", "H", "h"],
      callback: () => {
        if (!helpActiveStatus) {
          helpActiveStatus = true;
          createHelpScreen(screen, "1.1.5", () => {
            helpActiveStatus = false;
          });
        }
      }
    },
    " Exit": {
      keys: ["E-e", "E", "e", "escape"],
      callback: () => process.exit(0)
    }
  };

  let cfg = getConfig();
  let autotrading = cfg.logged_in
    ? {
        [` Autotrading ${
          cfg.autotrade.enabled ? "(ON)".green : "(OFF)".red
        }`]: {
          keys: ["A-a", "A", "a"],
          callback: () => {
            execShellCommand(pyCommands.toggleAlgo);
            // menubar = blessed.listbar({
            //   parent: screen,
            //   keys: true,
            //   bottom: 0,
            //   left: 0,
            //   height: 1,
            //   style: {
            //     item: {
            //       fg: "yellow"
            //     },
            //     selected: {
            //       fg: "yellow"
            //     }
            //   },
            //   commands: buildMenuCommands()
            // });
          }
        }
      }
    : {};

  // Store updated configuration
  writeJSONFile(filePaths.configPath, cfg);
  cmds = cfg.logged_in
    ? { ...logout, ...makeTrade, ...autotrading, ...defaultCmds }
    : { ...login, ...defaultCmds };

  return cmds;
}

function createInterface() {
  let padding = {
    left: 1,
    right: 1
  };

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

  // Create dashboard widgets
  headlinesTable = grid.set(
    0,
    0,
    10,
    13,
    blessed.ListTable,
    createListTable("left", null, true)
  );
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
  blockchainAttributesTable = grid.set(
    26,
    0,
    10,
    13,
    blessed.ListTable,
    createListTable("left", padding)
  );
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

  // constructionLabel = grid.set(28, 16, 7, 9, blessed.box, {
  //   parent: screen,
  //   keys: true,
  //   align: "center",
  //   selectedFg: "white",
  //   selectedBg: "blue",
  //   padding: {
  //     top: 2,
  //     bottom: 3
  //   },
  //   content: "Panels under construction.",
  //   style: {
  //     fg: "yellow",
  //     bold: true
  //   },
  //   tags: true
  // });

  headlinesTable.focus();

  // Create menu
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
    commands: buildMenuCommands()
  });

  // Resizing
  screen.on("resize", () => {
    technicalIndicatorsTable.emit("attach");
    blockchainAttributesTable.emit("attach");
    headlinesTable.emit("attach");
    exchangeRateChart.emit("attach");
    technicalIndicatorsGauge.emit("attach");
    // constructionLabel.emit("attach");
    priceTable.emit("attach");
    menubar.emit("attach");
  });

  // Open article
  screen.key(["enter"], (ch, key) => {
    if (!tradeEntryStatus && !loginEntryStatus && !errorEntryStatus) {
      let selectedArticleURL = URLs[headlinesTable.selected - 1];
      openBrowser(selectedArticleURL);
    }
  });

  // Quit
  screen.key(["escape", "C-c"], (ch, key) => process.exit(0));
}

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
    article[2] = colorize(article);

    return article;
  });

  let technicalData = technicalIndicatorJSON.data.map(indicator => {
    indicator[2] = colorize(indicator);
    return indicator;
  });

  let gaugeData = calculateGaugePercentages(technicalData);
  let blockchainData = blockchainJSON.data;
  let tickerData = reformatPriceData(tickerJSON.data);
  let chartData = buildChartData(graphJSON.data);
  let transactionData = transactionsJSON.data.map(txn => {
    txn[0] = moment(txn[0]).format("M/D H:mm");
    switch (txn[2]) {
      case "0":
        txn[2] = "D";
        break;
      case "1":
        txn[2] = "W";
        break;
      case "2":
        txn[2] = "MT";
        break;
      case "14":
        txn[2] = "SAT";
        break;
    }
    // txn[2] = colorize(txn);
    return txn;
  });
  let portfolioData = reformatPortfolioData(portfolioJSON.data, [
    "Account Balance",
    "Returns",
    "Net Profit",
    "Sharpe Ratio",
    "Buy Accuracy",
    "Sell Accuracy",
    "Total Trades"
  ]);

  URLs = extractAndRemoveUrls(headlineData);

  // Set headers for each table
  headlineData.splice(0, 0, ["Date", "Headline", "Sentiment"]);
  technicalData.splice(0, 0, ["Technical Indicator", "Value", "Signal"]);
  blockchainData.splice(0, 0, ["Blockchain Network", "Value"]);
  tickerData.splice(0, 0, ["Ticker Data", "Value"]);
  portfolioData.splice(0, 0, ["Portfolio Stats", "Value"]);
  transactionData.splice(0, 0, ["Date", "Amount", "Type"]);

  if (transactionData.length === 1) {
    transactionData.splice(1, 0, ["–", "–", "–"]);
  }

  headlinesTable.setData(headlineData);
  technicalIndicatorsTable.setData(technicalData);
  technicalIndicatorsGauge.setStack([
    {
      percent: gaugeData[1],
      stroke: "green"
    },
    {
      percent: gaugeData[0],
      stroke: "red"
    }
  ]);
  blockchainAttributesTable.setData(blockchainData);
  priceTable.setData(tickerData);
  portfolioTable.setData(portfolioData);
  transactionsTable.setData(transactionData);
  exchangeRateChart.setData(chartData);

  screen.render();
}

function checkDependencies(callback) {
  let uninstalledDeps = [];
  let requirements = fs.readFileSync(filePaths.requirementsPath, "utf8");
  let currDeps = spawnSync("pip3", ["list"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "pipe",
    encoding: "utf-8"
  }).output[1];

  for (let dependency of requirements.split("\n")) {
    dependency = dependency.split("=")[0];
    if (!currDeps.includes(dependency)) {
      uninstalledDeps.push(dependency);
    }
  }

  if (uninstalledDeps.length > 0) {
    inquirer
      .prompt([
        {
          type: "list",
          name: "installDeps",
          message: `You are missing the following dependencies: ${
            uninstalledDeps.join(", ").blue
          }. Would you like to install them?`,
          choices: ["Yes", "No"]
        }
      ])
      .then(answers => {
        for (let [key, val] of Object.entries(answers)) {
          if (val == "Yes") {
            console.log(
              "    Installing dependencies... (this may take a while)".blue
            );
            execShellCommand([
              "pip3",
              ["install", "-r", filePaths.requirementsPath]
            ]);
            callback();
            break;
          } else {
            console.log(
              "Sorry, all dependencies must be installed to use BitVision.".red
            );
            process.exit(0);
          }
        }
      });
  } else {
    callback();
  }
}

function fetchIntialData() {
  console.log(splash.fetchingData("price data from Bitstamp"));
  updateData("TICKER");

  console.log(splash.fetchingData("blockchain network data"));
  updateData("NETWORK");

  console.log(splash.fetchingData("Bitcoin-related headlines"));
  updateData("HEADLINES");

  console.log(splash.fetchingData("transaction history from Bitstamp"));
  updateData("PORTFOLIO");

  storeLastSync();
}

// MAIN //

function main(refreshRate = 1200000) {
  checkDependencies(() => {
    console.log(splash.logo);
    console.log(splash.description);

    createConfig();
    if (+new Date() - (getConfig().lastRefresh + 5 * 60 * 1000) >= 0) {
      // we already have quite accurate data, no need to fetch again on startup
      // 5 minutes
      fetchIntialData();
    }
    createInterface();
    refreshInterface();

    setInterval(() => refreshInterface(), refreshRate);
    setInterval(() => updateData("TICKER"), refreshRate + 10000);
    setInterval(() => updateData("PORTFOLIO"), refreshRate + 10000);
    setInterval(() => updateData("NETWORK"), refreshRate) + 10000;
    setInterval(() => updateData("HEADLINES"), refreshRate + 10000);
  });
}

main();
