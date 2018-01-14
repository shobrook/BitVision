"""
Blockchain Network Attributes:
	- CONF_TIME: Median time for a TXN to be accepted into a mined block and added to the public ledger [USED]
	- BLOCK_SIZE: Average block size in MB [USED]
	- TXN_COST: Miners revenue divided by number of TXNs [USED]
	- DIFFICULTY: How difficult it is to find a new block [USED]
	- TXN_VAL: Total estimated value of transactions on the blockchain
	- HASH_RATE: Estimated num. of giga-hashes per second the BTC network is performing [USED]
	- MARKET_CAP: Total USD value of BTC supply in circulation [USED]
	- MINERS_REV: Total value of coinbase block rewards and TXN fees paid to miners [USED]
	- ORPHANS: Total num. of blocks mined but not attached to the main blockchain
	- BLOCK_TXN: Average num. of TXNs per block [USED]
	- TXN_NUM: Num. of daily confirmed BTC TXNs
	- UNIQUE_ADDR: Total num. of unique addresses used on the blockchain [USED]
	- TOTAL_BTC: Total num. of BTCs that have already been mined [USED]
	- TXN_FEES: Total value of all TXN fees paid to miners [USED]
	- TRADE_VOL: Total USD value of trading volume on major BTC exchanges
	- MEMPOOL: Aggregate size of TXNs waiting to be confirmed
	- TXN_COUNT: Total number of unique BTC transactions per day [USED]

Technical Indicators:
	- ROCR: Rate of Change Ratio
	- MOM: Momentum
	- ADX: Average Directional Index
	- WILLR: Williams %R
	- RSI: Relative Strength Index
	- MACD: Moving Average Convergence Divergence
	- ATR: Average True Range
	- OBV: On-Balance Volume
	- TRIX: Triple Exponential Moving Average
	- EMA: Exponential Moving Average
"""


### Setup ###


import sys

sys.path.insert(0, "modules")

import os.path
import json
import csv
import time
import scraper
import analysis
import training
import pandas as pd
import preprocessing
#import sentiment


### Data Bus ###


def preprocessor(prices, network_data):
	"""Runs the OHLCV and blockchain datasets through a preprocessing pipeline."""
	print("Preprocessing data...")

	return (prices.pipe(preprocessing.calculate_indicators)
		.pipe(preprocessing.merge_datasets, set_b=network_data)
		.pipe(preprocessing.fix_null_vals)
		.pipe(preprocessing.calculate_labels)
	)

blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_network_data.csv", preprocessor)
headline_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/", preprocessor)


### Analysis ###


print("Analyzing features...")

#print(data.describe())
analysis.plot_corr_matrix(blockchain_data)


### Training ###


print("Fitting models...")

# Generate training and testing data
x_train, x_test, y_train, y_test = (blockchain_data.pipe(training.fix_outliers).pipe(training.unbalanced_split, test_size=.2))

# Logistic Regression
log_reg = training.Model(estimator="LogisticRegression", x_train=x_train, y_train=y_train)
log_reg.test(x_test, y_test)

# Random Forest
rand_forest = training.Model(estimator="RandomForest", x_train=x_train, y_train=y_train)
rand_forest.test(x_test, y_test)

# Support Vector Classifier
svc = training.Model(estimator="SVC", x_train=x_train, y_train=y_train)
svc.test(x_test, y_test)


### Evaluation ###


print("Evaluating models...")

# Logistic Regression
print("\tLogistic Regression Estimator")
log_reg.plot_cnf_matrix()
print("\t\tCross Validation: ", json.dumps(log_reg.cross_validate(x_train, y_train), indent=25))
print("\t\tEvaluation: ", json.dumps(log_reg.evaluate(), indent=25))

# Random Forest
print("\tRandom Forest Classifier")
rand_forest.plot_cnf_matrix()
print("\t\tCross Validation: ", json.dumps(rand_forest.cross_validate(x_train, y_train), indent=25))
print("\t\tEvaluation: ", json.dumps(rand_forest.evaluate(), indent=25))

# Support Vector Classifier
print("\tSupport Vector Classifier")
svc.plot_cnf_matrix()
print("\t\tCross Validation: ", json.dumps(log_reg.cross_validate(x_train, y_train), indent=25))
print("\t\tEvaluation: ", json.dumps(svc.evaluate(), indent=25))