// GLOBALS //

const fs = require("fs");
const colors = require("colors");
const figures = require('figures');
const openBrowser = require("opn");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
const { spawnSync } = require("child_process");

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
      border: { fg: colorScheme.border },
      cell: { selected: { fg: "black", bg: "light-yellow" } },
      header: { fg: "red", bold: true }
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
  createToggleScreen(screen, isEnabling => {
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
  }
}

function reformatPriceData(priceData) {
	let price_str = null;
	if (priceData.last_incr) {
		price_str = `${String(priceData.last)} ${figures.arrowUp.green}`;
	} else {
		price_str = `${String(priceData.last)} ${figures.arrowDown.red}`;
	}
	let vol_str = null;
	if (priceData.vol_incr) {
		vol_str = `${String(priceData.volume)} ${figures.arrowUp.green}`;
	} else {
		vol_str = `${String(priceData.volume)} ${figures.arrowDown.red}`;
	}

  return [
    ["Price ($)", price_str],
    ["Volume", vol_str],
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

  return { title: "Exchange Rate", x: convertedTimestamps, y: prices };
}

// BLESSED INTERFACE HELPERS //
/* [insert obligatory "bless up" reference] */

var screen = null;
var grid = null;
var headlinesTable = null;
var technicalIndicatorsTable = null;
var technicalIndicatorsGauge = null;
var blockchainIndicatorsTable = null;
var constructionLabel = null;
var portfolioTable = null;
var priceTable = null;
var exchangeRateChart = null;
var transactionsTable = null;
var menubar = null;
var URLs = null;

function createInterface() {
  let padding = { left: 1, right: 1 };

  screen = blessed.screen({
    smartCSR: true,
    title: "BitVision",
    cursor: { artificial: true, shape: "line", blink: true, color: "red" }
  });

  grid = new contrib.grid({ rows: 36, cols: 36, screen: screen });

  // Create dashboard widgets
  headlinesTable = grid.set(
    0,
    0,
    10,
    13,
    blessed.ListTable,
    createListTable("center", null, true)
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
    style: { line: "yellow", text: "green", baseline: "black" },
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

	constructionLabel = grid.set(28, 16, 7, 9, blessed.box, {
		parent: screen,
    keys: true,
    align: "center",
    selectedFg: "white",
    selectedBg: "blue",
    padding: {
			top: 2,
			bottom: 3,
		},
    content: "Panels under construction.",
    style: { fg: "yellow", bold: true },
    tags: true
  });

  headlinesTable.focus();

  // Create menu
  menubar = blessed.listbar({
    parent: screen,
    keys: true,
    bottom: 0,
    left: 0,
    height: 1,
    style: { item: { fg: "yellow" }, selected: { fg: "yellow" } },
    commands: {
      Login: {
        keys: ["l", "L"],
        callback: () => {
          loginEntryStatus = true;
          displayLoginScreen();
        }
      },
      "Toggle Autotrading": {
        keys: ["a", "A"],
        callback: () => {
          if (isLoggedIn()) {
            showAutotradingMenu();
          } else {
            displayLoginScreen();
          }
        }
      },
      "Make a Trade": {
        keys: ["t", "T"],
        callback: () => {
          if (isLoggedIn()) {
            tradeEntryStatus = true;
            createOrderScreen(screen, (amount, type) => {
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
        keys: ["h", "H"],
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
        keys: ["o", "O"],
        callback: () => clearCredentials()
      },
      Exit: {
        keys: ["C-c", "escape"],
        callback: () => process.exit(0)
      }
    }
  });

  // Resizing
  screen.on("resize", () => {
    technicalIndicatorsTable.emit("attach");
    blockchainAttributesTable.emit("attach");
    headlinesTable.emit("attach");
    exchangeRateChart.emit("attach");
    technicalIndicatorsGauge.emit("attach");
		constructionLabel.emit("attach");
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
    article[1] = headline.length > 35 ? headline.slice(0, 35) + "..." : headline + "...";

		// Color sentiment labels
		let sentiment = article[2].toLowerCase().trim();
		if (sentiment == "pos") {
			article[2] = `${article[2]} ${figures.tick}`.green;
		} else if (sentiment == "neg") {
			article[2] = `${article[2]} ${figures.cross}`.red;
		} else {
			article[2] = article[2].yellow;
		}
    return article;
  });

  let technicalData = technicalIndicatorJSON.data.map(indicator => {
		// Color signal labels
    let signal = indicator[2].toLowerCase().trim();
		if (signal == "buy") {
			indicator[2] = `${indicator[2]} ${figures.tick}`.green;
		} else if (signal == "sell") {
			indicator[2] = `${indicator[2]} ${figures.cross}`.red;
		} else {
			indicator[2] = indicator[2].yellow;
		}
    return indicator;
  });

  let gaugeData = calculateGaugePercentages(technicalData);
  let blockchainData = blockchainJSON.data;
  let tickerData = reformatPriceData(tickerJSON.data);
  let chartData = buildChartData(graphJSON.data);
  let transactionData = transactionsJSON.data;
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
  transactionData.splice(0, 0, ["Transaction", "Amount", "Date"]);

  if (transactionData.length == 1) {
    transactionData.splice(1, 0, ["–", "–", "–"]);
  }

  headlinesTable.setData(headlineData);
  technicalIndicatorsTable.setData(technicalData);
  technicalIndicatorsGauge.setStack([
    { percent: gaugeData[0], stroke: "red" },
    { percent: gaugeData[1], stroke: "green" }
  ]);
  blockchainAttributesTable.setData(blockchainData);
  priceTable.setData(tickerData);
  portfolioTable.setData(portfolioData);
  transactionsTable.setData(transactionData);
  exchangeRateChart.setData(chartData);

  screen.render();
}

function loadSplashScreen() {
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
}

// MAIN //

function main(refreshRate = 120000) {
  loadSplashScreen();
  createInterface();
  refreshInterface();

  setInterval(() => refreshInterface(), refreshRate);
  setInterval(() => updateData("TICKER"), refreshRate);
  setInterval(() => updateData("PORTFOLIO"), refreshRate);
  setInterval(() => updateData("NETWORK"), refreshRate);
  setInterval(() => updateData("HEADLINES"), refreshRate);
}

main();
