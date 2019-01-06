const path = require("path");
const colors = require("colors");

let storePath = String.raw`${path.join(__dirname, "store")}`;
let servicesPath = String.raw`${path.join(__dirname, "services")}`;

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
    configPath: path.join(storePath, "config.json"),
    blockchainDataPath: path.join(storePath, "cache", "blockchain.json"),
    headlineDataPath: path.join(storePath, "cache", "headlines.json"),
    technicalDataPath: path.join(storePath, "cache", "indicators.json"),
    priceDataPath: path.join(storePath, "cache", "ticker.json"),
    graphDataPath: path.join(storePath, "cache", "graph.json"),
    portfolioDataPath: path.join(storePath, "cache", "portfolio.json"),
    transactionsDataPath: path.join(storePath, "cache", "transactions.json")
  },
  pyCommands: {
    checkLogin: ["python3", [servicesPath, "authenticate"]],
    toggleAlgo: ["python3", [servicesPath, "toggle_algo"]],
    makeTrade: payload => ["python3", [servicesPath, "make_trade", payload]],
    refreshNetwork: ["python3", [servicesPath, "retrieve_network_data"]],
    refreshTicker: ["python3", [servicesPath, "retrieve_price_data"]],
    refreshHeadlines: ["python3", [servicesPath, "retrieve_headline_data"]],
    refreshPortfolio: ["python3", [servicesPath, "retrieve_portfolio_stats"]]
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
