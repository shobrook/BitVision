# BitVision

BitVision is a real-time charting and trading platform for Bitstamp that lives entirely in the terminal. It comes with an automated trading algorithm that uses machine learning to forecast price movements and place risk-adjusted daily trades.

<p align="center"><img src="img/demo.png" width="90%" /></p>

BitVision also provides real-time monitoring of Bitcoin-related news, technical indicators, and blockchain data (i.e. hash rate, avg. block size, etc.). And once you start making trades, either manually or automatically, BitVision will monitor your transaction history in real-time and calculate important portfolio statistics, such as your sharpe ratio, buy and sell accuracy, net profit, and returns. Think CryptoWatch but as a CLI.

Unlike other systems, there's no need to run BitVision on localhost or host a database – simply install and run `$ bitvision` to get started.

## Usage

> Requires Node v10+ and Python 3.

Install `BitVision` with npm:

```
$ npm install bitvision
```

Then run:

```
$ bitvision
```

And that's it. If you want to enable trading, follow these instructions to acquire a Bitstamp API key and secret:

1.  Login to your Bitstamp account
2.  Click on Security -> API Access
3.  Select permissions for your access key.
4.  Click on the Generate Key button and make sure to store your secret in a secure place.
5.  Click Activate.
6.  Go to your email and click on link sent by Bitstamp to activate the API key.

Once activated, just press `L` in the dashboard and a modal will pop-up asking you for your username, API key, and secret.

#### Keybindings

| Keybinding | Action             |
| ---------- | ------------------ |
| A          | Autotrading Toggle |
| L          | Bitstamp Login     |
| K          | Logout             |
| T          | Trade BTC          |
| ESC        | Exit               |

## How it Works

Who ever said it works?

## Authors

The BitVision "frontend" was built by [@alichtman](http://github.com/alichtman), and runs on the Blessed.js library. The "backend" was built by [@shobrook](http://github.com/shobrook), and runs on the SciPy stack.

If you happen to make any money using BitVision, please consider donating a small portion of your earnings to our poor souls so we can continue making cool stuff:

```
113VcufvK4UEvMNbSMRxJ7L418KL2U4wpb
```
