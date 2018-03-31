BitVision
======
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()
[![Coverage Status](https://coveralls.io/repos/github/shobrook/BitVision/badge.svg?branch=master)](https://coveralls.io/github/shobrook/BitVision?branch=master)
[![Scikit-Learn](https://img.shields.io/badge/Sklearn-0.19.1-yellow.svg)](http://scikit-learn.org/stable/)


**This study presents a novel system for predicting daily Bitcoin price movements using machine learning.** Unlike other approaches, the feature set combines technical indicators, network data (hash rate, miner’s revenue, etc.), and sentiment ratings of Bitcoin-related news headlines.


Four supervised learning algorithms are implemented: a gradient boosting machine (GBM), random forest classifier, and long short-term memory network (LSTM). Experimental results suggest a **classification accuracy exceeding 60%** for the direction of next-day price change, with the LSTM consistently outperforming other models.

## Features

We collect historical OHLCV data from Bitstamp, transactional data from Blockchain.info, and news headlines from Coindesk, starting from 2013, and derive the following features.

**Blockchain-Related Data**

Unlike many other publicly traded assets, all Bitcoin-related fundamental data, such as block size and the average transaction cost, is available online. This 

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

**Technical Indicators**

Technical indicators help reduce noise in price data and may improve an algorithm's ability to learn any existing price patterns. These particular indicators were selected to provide insight into price momentum, volatility, potential trends, and potential buy/sell signals.

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

According to the Random Walk Hypothesis, which states that the future price of a publicly traded asset is not statistically dependent on past prices, it's impossible to reliably leverage technical analysis to beat the market. But this feature set is still considered because, regardless of its effectiveness, many traders utilize technical analysis in their trading strategies, and there may exist a relationship between buy/sell signals from technical indicators and executed trades.

**Sentiment of Bitcoin-Related News Headlines**

Bitcoin price is (anecdotally) highly speculative. So we manually rated the sentiment of historical news headlines on a scale from -2 to 2 based on the content's perceived effect on public opinion, rather than its potential effect on price. As multiple articles could be published in a day, each with different sentiment ratings, a daily weighted average is calculated. The weights are derived from the number of tweets an article has, an indicator of the article's reach.

## Target



## Method

A number of data preprocessing techniques are applied to the feature set before passing it through a feature selection algorithm and training the models.

* Lag variables

A number of data preprocessing techniques are applied to the feature set before recursively eliminating the least predictive features and training the

A number of data preprocessing techniques are applied to the feature set, including the addition of lag variables, before recursively eliminating the least predictive features.

The Box-Cos transform is a configurable data transform method that supports a suite of transforms, and it can be configured to evaluate a suite of transforms automatically and select a best fit. The resulting series may be more linear and the resulting distribution more Guassian or Uniform, depending on the underlying process that generated it.

Box-Cox transform. Normalization. Null value treatment (interpolation?). Outlier treatment(?). Balancing. Lag variables.

Use the feature correlation matrix to demonstrate that there is little interdependency between features.

As the price of Bitcoin is generally increasing over time, we balance our feature set to ensure that the classification accuracy can be benchmarked against a random coin toss. A multitude of feature selection and scaling algorithms are then applied before training the learning models. We determine each model's optimal hyperparameter values using Scikit-learn's GridSearchCV package and a custom scoring function.

<br />

![BitVision Pipeline](img/flowchart.png)

## Results

(See confusion matrices in img/)

## How to Run

1. Clone repo
2. Run: `python3 main.py`

## How to Contribute

1. Clone repo and make a new branch: `$ git checkout https://github.com/shobrook/BitVision -b [name_for_new_branch]`.
2. Make changes and test
3. Pull Request with comprehensive description of changes


Some potential directions of this research:
* Understanding which features have the most predictive power using the Granger Causality test
* Exploring other feature engineering and dimensionality reduction techniques
* Testing some potential features:
	* Since most Bitcoin traders are probably 13 yrs old, there may be a correlation between price change and predictions made by popular Bitcoin forecasting websites
	* Bitcoin Core's Github activity is another possibility
* If the prediction accuracy reaches 60%+, we may build an automated trading algorithm
