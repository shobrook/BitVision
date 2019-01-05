<h1 align="center">
  <img src="img/logo.png" width="40%" />
  <br />
</h1>

[![npm](https://img.shields.io/npm/v/:package.svg)](https://www.npmjs.com/package/bitvision)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/94e2435117de4078b0d8974eea4b6cf1)](https://www.codacy.com/app/alichtman/BitVision?utm_source=github.com&utm_medium=referral&utm_content=shobrook/BitVision&utm_campaign=Badge_Grade)
![node (scoped)](https://img.shields.io/node/v/@stdlib/stdlib.svg)
[![Scikit-Learn](https://img.shields.io/badge/Sklearn-0.19.1-yellow.svg)](http://scikit-learn.org/stable/)

`BitVision` is a real-time charting and trading dashboard for Bitstamp that works entirely in the terminal. It comes with an automated trading bot that uses machine learning to forecast price movements and place risk-adjusted daily trades.

Unlike other systems, there's no need to host a server or <!--spin up a Docker container-->create tedious setup files. After installing, simply run `$ bitvision` to start using the dashboard.

<!--<p align="center"><img src="demo.png" width="95%" /></p>-->
<p align="center"><img src="demo.gif" width="65%" /></p>
<p align="center"><i>You can download the color profile in this demo <a href="https://github.com/shobrook/BitVision/raw/master/img/BitVision-terminal-profile.terminal">here.</a></i></p>

<p align="center"><img src="demo.gif" width="80%" /></p>

Besides automated trading, BitVision's key features are:

- An exchange rate graph
- Real-time monitoring of Bitcoin-related news, technical indicators, and blockchain network data
- Logging of previous transactions and your current account balance
- Portfolio metrics, including your Sharpe Ratio, buy and sell accuracy, net profit, and returns [UNDER CONSTRUCTION]
- Easy toggling of automated trading and the ability to manually place orders

**DISCLAIMER:** BitVision is still in alpha, and some features are buggy and not fully tested. See all known bugs here. Use at your own risk!

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
  -
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
