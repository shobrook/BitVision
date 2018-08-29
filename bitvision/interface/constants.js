let path = require("path");

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
    cancelDark: "red",
  },
  paths: {
    "configPath": path.join(__dirname, "..", "cache", "config.json"),
    "blockchainDataPath": path.join(__dirname, "..", "cache", "data", "blockchain.json"),
    "headlineDataPath": path.join(__dirname, "..", "cache", "data", "headlines.json"),
    "technicalDataPath": path.join(__dirname, "..", "cache", "data", "indicators.json"),
    "priceDataPath": path.join(__dirname, "..", "cache", "data", "ticker.json")
  },
  commands: {
    "transaction": `python3 ${path.join(__dirname, "..", "controller")} `,
    "refresh_network": "python3 ../controller monitor_network",
    "refresh_headlines": "python3 ../controller monitor_opinions",
    "refresh_portfolio": "python3 ../controller monitor_portfolio",
    // "retrain_model": "python3 ../controller.py RETRAIN"
  }
}
