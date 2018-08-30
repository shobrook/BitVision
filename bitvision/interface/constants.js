let path = require("path");

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
    cancelDark: "red",
  },
  paths: {
    "configPath": path.join(cachePath, "config.json"),
    "blockchainDataPath": path.join(cachePath, "data", "blockchain.json"),
    "headlineDataPath": path.join(cachePath, "data", "headlines.json"),
    "technicalDataPath": path.join(cachePath, "data", "indicators.json"),
    "priceDataPath": path.join(cachePath, "data", "ticker.json")
  },
  commands: {
    "transaction": `python3 ${controllerPath} `,
    "refresh_network": `python3 ${controllerPath} monitor_network`,
    "refresh_price": `python3 ${controllerPath} monitor_price`,
    "refresh_headlines": `python3 ${controllerPath} monitor_opinions`,
    "refresh_portfolio": `python3 ${controllerPath} monitor_portfolio`,
    // "retrain_model": `python3 ${controllerPath} RETRAIN`
  }
}
