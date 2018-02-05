BitVision
======
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()
[![Coverage Status](https://coveralls.io/repos/github/shobrook/BitVision/badge.svg?branch=master)](https://coveralls.io/github/shobrook/BitVision?branch=master)
[![Scikit-Learn](https://img.shields.io/badge/Sklearn-0.19.1-yellow.svg)](http://scikit-learn.org/stable/)


**The goal of this project is to predict daily Bitcoin price movements using machine learning.** Unlike other approaches we've seen, our feature set is comprehensive and includes technical indicators, blockchain-related data (hash rate, miner's revenue, etc.), and sentiment ratings of Bitcoin-related news articles.


Three machine learning models are trained and evaluated: a logistic regressor, random forest classifier, and support vector classifier. Experimental results suggest a **55-60% prediction accuracy** for the direction of next-day price change.

<br />

![BitVision Pipeline](img/flowchart.png "BitVision Pipeline")


## Features

Daily historical OHLCV data from Bitstamp, transactional data from Blockchain.info, and news headlines from Coindesk are collected and used to derive the following features.

**Blockchain-Related Data**

The selection of these features was inspired by [price prediction research](https://pdfs.semanticscholar.org/e065/3631b4a476abf5276a264f6bbff40b132061.pdf?_ga=2.213991569.764097240.1515916169-1482452711.1513173539) from Stanford University, which claimed a 98.7% classification accuracy for daily price movements using only Bitcoin network and market data.

| Feature|  Description	|
| --- | --- |
| Confirmation Time | Median time for a transaction to be accepted into a mined block and added to the public ledger. |
| Block Size | Average block size in MB. |
| Average Transaction Cost | Total miner revenue divided by number of transactions. |
| Difficulty | How difficult it is to find a new block, measured in... |
| Transaction Value | Total estimated value of transactions on the blockchain. |
| Hash Rate | Estimated number of giga-hashes per second the BTC network is performing. |
| Transactions per Block | Average number of transactions per block. |
| Unique Addresses | Total number of unique addresses used on the blockchain. |
| Total BTC | Total number of Bitcoins that have already been mined. |
| Transaction Fees | Total value of all transaction fees paid to miners. |
| Transactions per Day | Total number of unique Bitcoin transactions per day. |

However, their research methods involved models that were trained and evaluated on imbalanced data, and cross-validation was never performed, so it's likely the results are misleading.

**Technical Indicators**

The following indicators were selected to provide insight into price momentum, volatility, volume, potential trends, and potential buy/sell signals.

| Feature|  Description	|
| --- | --- |
| Rate of Change Ratio | (Close(t) / Close(t - n)) x 100 |
| Momentum | Close(t) - Close(t - n) |
| Average Directional Index | Sum((+DI - (-DI))/(+DI + (-DI)))/n |
| Williams %R | (High - Close)/(High - Low) x 100 |
| Relative Strength Index | Avg(PriceUp)/(Avg(PriceUp) + Avg(PriceDown)) x 100 |
| Moving Average Convergence Divergence | (EMA_1(t) - EMA_2(t)) - EMA_osc(t) |
| Average True Range | ATR(t) = ((n - 1) x ATR(t - 1) + max(Abs(High - Low), Abs(High - Close(t - 1)), Abs(Low - Close(t - 1))) |
| On-Balance Volume | OBV(t) = OBV(t - 1) +/- Volume(t) |
| Triple Exponential Moving Average | (EMA(EMA(EMA(Close(t)))))/(EMA(EMA(EMA(Close(t - 1))))) |

**Sentiment of Bitcoin-Related News Headlines**

We manually rated the sentiment of historical news headlines on a scale from -2 to 2 based on the content's perceived effect on public opinion, rather than its potential effect on price. As multiple articles could be published per day, each with different sentiment ratings, a weighted average is calculated for each day. The weights are derived from the number of tweets an article has, an indicator of the article's popularity.