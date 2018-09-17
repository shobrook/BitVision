let path = require("path");
let colors = require("colors");

let cachePath = path.join(__dirname, "..", "cache");
let controllerPath = path.join(__dirname, "..", "controller");

module.exports = {
  colors: {
    // Main
    border: "cyan",
    tableText: "light-blue",
    tableHeader: "red",
    background: "#54757c",

    // Popups
    textFieldBorderFocused: "green",
    textFieldBorderUnfocused: "#f0f0f0",
    confirmLight: "light-blue",
    confirmDark: "blue",
    cancelLight: "light-red",
    cancelDark: "red"
  },
  paths: {
    "configPath": path.join(cachePath, "config.json"),
    "blockchainDataPath": path.join(cachePath, "data", "blockchain.json"),
    "headlineDataPath": path.join(cachePath, "data", "headlines.json"),
    "technicalDataPath": path.join(cachePath, "data", "indicators.json"),
    "priceDataPath": path.join(cachePath, "data", "ticker.json"),
    "graphDataPath": path.join(cachePath, "data", "graph.json"),
    "portfolioDataPath": path.join(cachePath, "data", "portfolio.json"),
    "transactionsDataPath": path.join(cachePath, "data", "transactions.json"),
  },
  commands: {
    "transaction": `python3 ${controllerPath} `,
    "refresh_network": `python3 ${controllerPath} monitor_network`,
    "refresh_ticker": `python3 ${controllerPath} monitor_price`,
    "refresh_headlines": `python3 ${controllerPath} monitor_opinions`,
    "refresh_portfolio": `python3 ${controllerPath} monitor_portfolio`,
    // "retrain_model": `python3 ${controllerPath} retrain_model`
    "check_login": `python3 ${controllerPath} authenticate`,
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
    authors: "Written by:\n - Jon Shobrook (@shobrook)\n - Aaron Lichtman (@alichtman)\n\n"
      .red.bold,
    stalling: "Fetching data... \n(This may take a few seconds)\n\n".blue.bold
  }
};
