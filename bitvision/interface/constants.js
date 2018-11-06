const path = require("path");
const colors = require("colors");

let cachePath = String.raw`${path.join(__dirname, "..", "cache")}`;
let controllerPath = String.raw`${path.join(__dirname, "..", "controller")}`;

module.exports = {
  colorScheme: {
    // Main
    border: "cyan",
    tableText: "light-blue",
    tableHeader: "red",
    background: "#54757c",

    // Modals
    textFieldBorderFocused: "green",
    textFieldBorderUnfocused: "#f0f0f0",
    confirmLight: "light-blue",
    confirmDark: "blue",
    cancelLight: "light-red",
    cancelDark: "red"
  },
  filePaths: {
    configPath: path.join(cachePath, "config.json"),
    blockchainDataPath: path.join(cachePath, "data", "blockchain.json"),
    headlineDataPath: path.join(cachePath, "data", "headlines.json"),
    technicalDataPath: path.join(cachePath, "data", "indicators.json"),
    priceDataPath: path.join(cachePath, "data", "ticker.json"),
    graphDataPath: path.join(cachePath, "data", "graph.json"),
    portfolioDataPath: path.join(cachePath, "data", "portfolio.json"),
    transactionsDataPath: path.join(cachePath, "data", "transactions.json")
  },
  pyCommands: {
    makeTrade: ["python3", [controllerPath, "make_trade", "&"]],
    refreshNetwork: ["python3", [controllerPath, "monitor_network", "&"]],
    refreshTicker: ["python3", [controllerPath, "monitor_price", "&"]],
    refreshHeadlines: ["python3", [controllerPath, "monitor_opinions", "&"]],
    refreshPortfolio: ["python3", [controllerPath, "monitor_portfolio", "&"]],
    // "retrain_model": ["python3", [controllerPath, "retrain_model", "&"]]
    checkLogin: ["python3", [controllerPath, "authenticate", "&"]]
  },
  baseConfig: {
    logged_in: false,
    credentials: {
      username: "",
      key: "",
      secret: ""
    },
    autotrade: {
      enabled: false,
      "next-trade-timestamp-UTC": -1
    }
  },
  splash: {
    logo: "\n    ██████╗ ██╗████████╗██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗\n\
    ██╔══██╗██║╚══██╔══╝██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║\n\
    ██████╔╝██║   ██║   ██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║\n\
    ██╔══██╗██║   ██║   ╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║\n\
    ██████╔╝██║   ██║    ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║\n\
    ╚═════╝ ╚═╝   ╚═╝     ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝\n\n"
      .blue.bold,
    description: "    Real-time charting and algorithmic trading for Bitstamp.\n"
      .red.bold,
    fetchingData: data => `    Fetching ${data}...`.blue
  }
};
