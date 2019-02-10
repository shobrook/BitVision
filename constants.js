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
    requirementsPath: path.join(storePath, "../requirements.txt"),
    configPath: path.join(storePath, "config.json"),
    blockchainDataPath: path.join(storePath, "blockchain.json"),
    headlineDataPath: path.join(storePath, "headlines.json"),
    technicalDataPath: path.join(storePath, "indicators.json"),
    priceDataPath: path.join(storePath, "ticker.json"),
    graphDataPath: path.join(storePath, "graph.json"),
    portfolioDataPath: path.join(storePath, "portfolio.json"),
    transactionsDataPath: path.join(storePath, "transactions.json")
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
    },
    lastRefresh: 0
  },
  splash: {
    logo: "\n\n    ██████╗ ██╗████████╗██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗\n\
    ██╔══██╗██║╚══██╔══╝██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║\n\
    ██████╔╝██║   ██║   ██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║\n\
    ██╔══██╗██║   ██║   ╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║\n\
    ██████╔╝██║   ██║    ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║\n\
    ╚═════╝ ╚═╝   ╚═╝     ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝\n\n"
      .yellow.bold,
    description: "    Real-time charting and algorithmic trading for Bitstamp.\n"
      .red.bold,
    fetchingData: data => `    Fetching ${data}...`.yellow
  }
};
