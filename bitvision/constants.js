const path = require("path");
const colors = require("colors");

let cachePath = String.raw`${path.join(__dirname, "cache")}`;
let controllerPath = String.raw`${path.join(__dirname, "controller")}`;

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
    checkLogin: ["python3", [controllerPath, "authenticate"]],
    toggleAlgo: ["python3", [controllerPath, "toggle_algo"]],
    makeTrade: ["python3", [controllerPath, "make_trade"]],
    // withdraw: ["python3", [controllerPath, "withdraw"]],
    refreshNetwork: ["python3", [controllerPath, "retrieve_network_data"]],
    refreshTicker: ["python3", [controllerPath, "retrieve_price_data"]],
    refreshHeadlines: ["python3", [controllerPath, "retrieve_headline_data"]],
    refreshPortfolio: ["python3", [controllerPath, "retrieve_portfolio_stats"]]
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
    logo: "\n\n    ██████╗ ██╗████████╗██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗\n\
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
