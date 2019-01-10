<h1 align="center">
  <img src="resources/logo.png" width="40%" />
  <br />
</h1>

[![npm](https://img.shields.io/npm/v/:package.svg)](https://www.npmjs.com/package/bitvision)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/94e2435117de4078b0d8974eea4b6cf1)](https://www.codacy.com/app/alichtman/BitVision?utm_source=github.com&utm_medium=referral&utm_content=shobrook/BitVision&utm_campaign=Badge_Grade)
![node (scoped)](https://img.shields.io/node/v/@stdlib/stdlib.svg)
[![Scikit-Learn](https://img.shields.io/badge/Sklearn-0.19.1-yellow.svg)](http://scikit-learn.org/stable/)

`BitVision` is a real-time charting and trading dashboard for Bitstamp that works entirely in the terminal. It comes with an automated trading bot that uses machine learning to forecast price movements and place risk-adjusted daily trades.

Unlike other systems, there's no need to host a server or <!--spin up a Docker container-->edit tedious setup files. After installing, simply run `$ bitvision` to start using the dashboard.

<p align="center"><img src="resources/demo.png" width="95%" /></p>

Besides automated trading, BitVision's key features are:

- An exchange rate graph
- Real-time monitoring of Bitcoin-related news, technical indicators, and blockchain network data
- Logging of previous transactions and your current account balance
- Portfolio metrics, including your Sharpe Ratio, buy and sell accuracy, net profit, and returns *[UNDER CONSTRUCTION]*
- Easy toggling of automated trading and the ability to manually place orders

**Disclaimer:** BitVision is still in alpha. Some of the trading features are buggy and not fully tested; see all known bugs [here.](http://github.com/shobrook/BitVision/issues) Use at your own risk!

## Usage

> Requires `Node v10+` and `Python 3+`

Install `bitvision` with `npm`:

```bash
$ npm install bitvision
```

And run `$ bitvision` to boot up the dashboard.

If you want to enable trading, follow these instructions to acquire a Bitstamp API key and secret:

1.  Login to your Bitstamp account
2.  Click on Security -> API Access
3.  Select the following permissions for your access key:
    * Account Balance
    * User Transactions
    * Open Orders
    * Buy Instant/Limit Order
    * Sell Instant/Limit Order
4.  Click on the Generate Key button and make sure to store your secret in a secure place
5.  Click Activate
6.  Go to your email and click on link sent by Bitstamp to activate the API key

Once activated, just press `L` in the dashboard and a modal will pop-up asking you for your username, API key, and secret. **These will be stored locally on your machine, so be sure to keep them safe.**

<br />
<p align="center"><img src="resources/demo.gif" width="80%" /></p>
<p align="center"><i>You can download the color profile used in this demo <a href="https://github.com/shobrook/BitVision/raw/master/resources/BitVision-terminal-profile.terminal">here.</a></i></p>

## How it Works

The command-line interface runs on the Blessed.js library. The trading and charting architecture runs on the SciPy stack. An overview of the BitVision setup is shown below:

<br />
<p align="center"><img src="resources/architecture.png" width="65%" /></p>
<br />

The BitVision architecture revolves around the *Store*, which is a local directory of JSON files used to achieve persistence of the application state (Bitstamp credentials, autotrading status, etc.) and data to be displayed on the dashboard. When a user triggers an event, like placing an order or refreshing the charts, a child process is spawned to execute the appropriate service (a Python module), which then updates the store with new data or an error flag.

Services are organized into three modules: the retriever, trader, and automated trading engine. The *retriever* fetches ticker and portfolio data from Bitstamp, blockchain network data (hash rate, difficulty, etc.) from Quandl, and Bitcoin-related headlines from Coindesk. The *trader* wraps the Bitstamp REST API and serves to authenticate the user's credentials, fetch portfolio data and transaction history, place buy or sell orders, and toggle autotrading. The *automated trading engine* is a little more complicated.

### Automated Trading Engine

BitVision has a built-in trading bot that uses a Random Forest classifier to predict the next-day directional change of Bitcoin price. The model is trained on historical candlestick data, technical indicators, and blockchain network data. When the engine is toggled on, a daily cron job is scheduled that generates a price change prediction and places a buy or sell order accordingly. <!--Kelly Criterion for risk-adjustment.-->

#### Technical Indicators

Technical indicators were chosen as a feature set because they help reduce noise in candlestick data and may improve an model's ability to learn price patterns, if any exist. The particular indicators used are chosen to give insight into price momentum, volatility, trends, and potential buy/sell signals.

#### Blockchain Data

Unlike other publicly traded assets, all Bitcoin-related fundamental data is available online. The following Blockchain network attributes are considered:

| Feature                  | Description                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Confirmation Time        | Median time for a transaction to be accepted into a mined block and added to the public ledger. |
| Block Size               | Average block size in MB.                                                                       |
| Average Transaction Cost | Total miner revenue divided by number of transactions.                                          |
| Difficulty               | How difficult it is to find a new block.                                       |
| Transaction Value        | Total estimated value of transactions on the blockchain.                                        |
| Hash Rate                | Estimated number of giga-hashes per second the BTC network is performing.                       |
| Transactions per Block   | Average number of transactions per block.                                                       |
| Unique Addresses         | Total number of unique addresses used on the blockchain.                                        |
| Total BTC                | Total number of Bitcoins that have already been mined.                                          |
| Transaction Fees         | Total value of all transaction fees paid to miners.                                             |
| Transactions per Day     | Total number of unique Bitcoin transactions per day.                                            |

#### Preprocessing

A number of standard preprocessing steps are taken before training the model:

1. The Last Observation Carried Forward (LOCF) method is used to fill missing values in the dataset
2. Lag variables (spanning back three days) are created for each feature
3. A power transform is applied to each feature to convert it into something which more closely resembles a normal distribution

Additionally, as the price of Bitcoin has generally increased over time, the training set is balanced (using the random undersampling method) to ensure the model doesn't learn a bias towards positive predictions, and so that the classification accuracy can be benchmarked against a random coin toss.

Lastly, during training, a grid search is performed to find optimal hyperparameter values for the Random Forest.

#### Evaluation


## An Obligatory Note

> "The reason the stock market is hard to predict is because it is a prediction." – Andrew Critch, *Research Scientist at UC Berkeley*

In a perfectly efficient market, the future price of a publicly traded asset is not statistically dependent on past prices; in other words, the price follows a "random walk," and it's impossible to reliably leverage technical analysis to beat the market. Now, efficient market theory suggests that the stock market is a semi-efficient market, and so we still consider this feature set because many traders utilize technical analysis in their trading strategies, and there may exist a relationship between buy/sell signals from indicators and executed trades, regardless of their actual effectiveness.

Nevertheless, this trading engine serves more as a proof of concept rather than something you should trust to make money. <!--It needs to be backtested-->I personally think an interesting avenue of research is in text analysis of Bitcoin-related news, tweets, and Reddit activity. I have yet to see a system that combines these features.

A number of other improvements should be made to the trading system before it's used:
1. Trades should be adjusted for risk using the Kelly Criterion.
2. An LSTM network should be used instead of a Random Forest. Price prediction is fundamentally a sequence learning task, which LSTMs are designed for. LSTMs have what's called memory cells, which can store information that lies dozens of time-steps in the past. This is important because, in the market, cause and effect can be quite far apart.
