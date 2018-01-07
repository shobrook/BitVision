"""
TODO:
	- Check Quandl for other candidate Blockchain-related datasets
	- Explore options for caching data set

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

import analysis
import training
import pandas as pd
import preprocessing

print("Fetching data...")

# Loads network-based datasets
CONF_TIME = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/ATRCT.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
BLOCK_SIZE = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/AVBLS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
TXN_COST = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/CPTRA.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
DIFFICULTY = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/DIFF.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
TXN_COUNT = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NTRAN.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
HASH_RATE = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/HRATE.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
MARKET_CAP = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/MKTCP.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
MINERS_REV = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/MIREV.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
BLOCK_TXN = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NTRBL.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
UNIQUE_ADDR = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NADDU.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
TOTAL_BTC = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/TOTBC.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
TXN_FEES = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/TRFUS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")

# Loads Bitstamp's OHLCV dataset
PRICES = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHARTS/BITSTAMPUSD.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")

# Assigns column names
CONF_TIME.columns, BLOCK_SIZE.columns = ["Date", "Conf. Time"], ["Date", "Block Size"]
TXN_COST.columns, DIFFICULTY.columns = ["Date", "TXN Cost"], ["Date", "Difficulty"]
TXN_COUNT.columns, HASH_RATE.columns = ["Date", "TXNs per Day"], ["Date", "Hash Rate (GH/s)"]
MARKET_CAP.columns, MINERS_REV.columns = ["Date", "Market Cap"], ["Date", "Miners Revenue"]
BLOCK_TXN.columns, UNIQUE_ADDR.columns = ["Date", "TXNs per Block"], ["Date", "Unique Addresses"]
TOTAL_BTC.columns, TXN_FEES.columns = ["Date", "Total BTC"], ["Date", "TXN Fees"]

NETWORK_DATA = [CONF_TIME, BLOCK_SIZE, TXN_COST, DIFFICULTY, TXN_COUNT, HASH_RATE, MARKET_CAP, MINERS_REV, BLOCK_TXN, UNIQUE_ADDR, TOTAL_BTC, TXN_FEES]


### Preprocessing ###


print("Preprocessing data...")

data = (PRICES.pipe(preprocessing.calculate_indicators)
	.pipe(preprocessing.merge_datasets, set_b=NETWORK_DATA)
	.pipe(preprocessing.fix_null_vals)
	.pipe(preprocessing.calculate_labels)
)


### Analysis ###


print("Analyzing features...\n")

#print(data.describe())
analysis.plot_corr_matrix(data)


### Training ###


print("Fitting models...")

# Generate training and testing data
x_train, x_test, y_train, y_test = (data.pipe(training.fix_outliers).pipe(training.unbalanced_split, test_size=.2))

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
log_reg.plot_cnf_matrix()
print(log_reg.evaluate())

# Random Forest
rand_forest.plot_cnf_matrix()
print(rand_forest.evaluate())

# Support Vector Classifier
svc.plot_cnf_matrix()
print(svc.evaluate())
