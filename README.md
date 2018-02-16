BitVision
======
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()
[![Coverage Status](https://coveralls.io/repos/github/shobrook/BitVision/badge.svg?branch=master)](https://coveralls.io/github/shobrook/BitVision?branch=master)
[![Scikit-Learn](https://img.shields.io/badge/Sklearn-0.19.1-yellow.svg)](http://scikit-learn.org/stable/)


**The goal of this project is to predict daily Bitcoin price movements using machine learning.** Unlike other approaches we've seen, our feature set is comprehensive and includes technical indicators, blockchain-related data (hash rate, miner's revenue, etc.), and sentiment ratings of Bitcoin-related news articles.


Four machine learning models are trained and evaluated: logistic regression, random forest classifier, support vector machine, and gradient boosting machine. Experimental results suggest a **55-60% prediction accuracy** for the direction of next-day price change.

## Features

We collect historical OHLCV data from Bitstamp, transactional data from Blockchain.info, and news headlines from Coindesk, starting from 2013, and derive the following features.

**Blockchain-Related Data**

(Talk about how this is the closest thing to fundamental analysis)

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

The selection of these features was inspired by [price prediction research](https://pdfs.semanticscholar.org/e065/3631b4a476abf5276a264f6bbff40b132061.pdf?_ga=2.213991569.764097240.1515916169-1482452711.1513173539) from Stanford University, which claims a 98.7% classification accuracy for daily price movements using only Bitcoin network and market data. However, their research methods involves models that are trained and evaluated on imbalanced data, and cross-validation is never performed, so it's likely the results are misleading.

**Technical Indicators**

Technical indicators typically eliminate noise in price data and may improve an algorithm's ability to learn price patterns, if any exist. These particular indicators are selected to provide insight into price momentum, volatility, volume, potential trends, and potential buy/sell signals.

| Feature|  Description	|
| --- | --- |
| Rate of Change Ratio | $\frac{Close(t)}{Close(t - n)} \cdot 100$ |
| Momentum | $Close(t) - Close(t - n)$ |
| Average Directional Index | $\frac{\Sigma\frac{DI - (-DI)}{DI + (-DI)}}{n}$ |
| Williams %R | $\frac{High - Close}{High - Low} \cdot 100$ |
| Relative Strength Index | $\frac{Avg(PriceUp)}{Avg(PriceUp) + Avg(PriceDown)} \cdot 100$ |
| Moving Average Convergence Divergence | $(EMA_1(t) - EMA_2(t)) - EMA_osc(t)$ |
| Average True Range | $ATR(t) = ((n - 1) \cdot ATR(t - 1) + max(Abs(High - Low), Abs(High - Close(t - 1)), Abs(Low - Close(t - 1)))$ |
| On-Balance Volume | $OBV(t) = OBV(t - 1) \pm Volume(t)$ |
| Triple Exponential Moving Average | $(EMA(EMA(EMA(Close(t)))))/(EMA(EMA(EMA(Close(t - 1)))))$ |

According to the Random Walk Hypothesis, the future price of a publicly traded asset is not statistically dependent on past prices, and thus technical analysis cannot be leveraged reliably for price prediction. However, many traders still apply technical analysis to their trading strategies, and a relationship may exist between buy/sell signals from technical indicators and executed trades.

**Sentiment of Bitcoin-Related News Headlines**

We manually rate the sentiment of historical news headlines on a scale from -2 to 2 based on the content's perceived effect on public opinion, rather than its potential effect on price. As multiple articles could be published in a day, each with different sentiment ratings, a daily weighted average is calculated. The weights are derived from the number of tweets an article has, an indicator of the article's popularity.

## Method

As the price of Bitcoin is generally increasing over time, we balance our feature set to ensure that the classification accuracy can be benchmarked against a random coin toss. A multitude of feature selection and scaling algorithms are then applied before training the learning models. We determine each model's optimal hyperparameter values using Scikit-learn's GridSearchCV package and a custom scoring function.

<br />

![BitVision Pipeline](img/flowchart.png)

## Results

(See confusion matrices in img/)

## Contributing

To test the system, clone the repo and run: `python3 main.py`. To make a contribution, create a new branch: `$ git checkout -b [name_of_your_new_branch]`.


Some potential directions of this research:
* Understanding which features have the most predictive power using the Granger Causality test
* Exploring other feature engineering and dimensionality reduction techniques
* Testing some potential features:
	* Since most Bitcoin traders are probably 12 yrs old, there may be a correlation between price change and predictions made by popular Bitcoin forecasting websites
	* Bitcoin Core's Github activity is another possibility
* If the prediction accuracy reaches 60%+, we may build an automated trading algorithm
