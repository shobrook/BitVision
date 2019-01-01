<h1 align="center">
  <img src="img/logo.png" width="40%" />
  <br />
</h1>

[![npm](https://img.shields.io/npm/v/:package.svg)](https://www.npmjs.com/package/bitvision)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/94e2435117de4078b0d8974eea4b6cf1)](https://www.codacy.com/app/alichtman/BitVision?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=shobrook/BitVision&amp;utm_campaign=Badge_Grade)
[![](https://img.shields.io/github/commit-activity/y/shobrook/BitVision.svg)](https://github.com/shobrook/BitVision)
![node (scoped)](https://img.shields.io/node/v/@stdlib/stdlib.svg)
[![Scikit-Learn](https://img.shields.io/badge/Sklearn-0.19.1-yellow.svg)](http://scikit-learn.org/stable/)


`BitVision` is a real-time charting and trading dashboard for Bitstamp that works entirely in the terminal. It comes with an automated trading bot that uses machine learning to forecast price movements and place risk-adjusted daily trades.

Unlike other systems, there's no need to host a server or spin up a Docker container. After a simple install command, run `$ bitvision` to start using the dashboard.

<p align="center"><img src="img/demo.png" width="95%" /></p>
<p align="center"><i>If you want your dashboard to look exactly like this demo, you can download the </i><code>Terminal.app</code><i> profile <a href=https://github.com/shobrook/BitVision/raw/master/img/BitVision-terminal-profile.terminal>here</a>.</i></p>


Besides automated trading, BitVision's key features are:

- An exchange rate graph
- Real-time monitoring of Bitcoin-related news, technical indicators, and blockchain network data
- Logging of previous transactions and your current account balance
- Portfolio metrics, including your Sharpe Ratio, buy and sell accuracy, net profit, and returns
- Easy toggling of automated trading and the ability to manually place orders

<!-- The trading algorithm was based on some research... -->

## Usage

> Requires `Node v10+` and `Python 3.7`

Install `bitvision` with `npm`:

```bash
$ npm install bitvision
$ bitvision
```

And that's it! If you want to enable trading, first follow these instructions to acquire a Bitstamp API key and secret:

1.  Login to your Bitstamp account
2.  Click on Security -> API Access
3.  Select permissions for your access key
4.  Click on the Generate Key button and make sure to store your secret in a secure place
5.  Click Activate
6.  Go to your email and click on link sent by Bitstamp to activate the API key

Once activated, just press `L` in the dashboard and a modal will pop-up asking you for your username, API key, and secret. **These will be stored locally on your machine, so make sure to keep them safe.**

## How it Works

`BitVision` is split into two main components.

1. The **backend** is reponsible for all the data retrieval and processing. It's written in `Python` and leverages the `SciPy` stack.
2. The **frontend** displays all the data passed to it by the backend. To build a graphical interface in the terminal, we used `Node.js` with the `Blessed.js` library.

<!-- TODO: Add information about how the trading works. -->

**Machine Learning Pipeline**

The Machine Learning pipeline is a part of the backend. It informs decisions about what BTC trades to make based on a combination of technical indicators, network data and headline sentiment trends.

<h1 align="center">
  <img src="img/flowchart.png" width="100%" />
  <br />
</h1>

## Authors

`BitVision` was built by [@alichtman](http://github.com/alichtman) and [@shobrook](http://github.com/shobrook).

## Disclaimer

`BitVision` is currently in an alpha/development stage. The charting functionality works as intended, however, the trading module is not yet complete. If you're a developer and would like to contribute to this project, there is plenty of work left to be done. Head on over to the [issues](http://www.github.com/shobrook/BitVision/issues) section and see what looks interesting to you! If you run into any bugs that don't already have issues open, please [open a new one](http://www.github.com/shobrook/BitVision/issues/new) and we'll take a look.
