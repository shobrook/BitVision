import pandas as pd
import dateutil.parser as dp
from realtime_talib import Indicator
from sklearn.model_selection import train_test_split

def calculate_indicators(ohlcv):
	"""Extracts technical indicators from OHLCV data."""
	print("\tCalculating technical indicators")

	ohlcv = ohlcv.drop(["Volume (BTC)", "Weighted Price"], axis=1)
	ohlcv.columns = ["Date", "Open", "High", "Low", "Close", "Volume"]

	temp_ohlcv = ohlcv.copy()

	# Converts ISO 8601 timestamps to UNIX
	unix_times = [int((dp.parse(temp_ohlcv.iloc[index]["Date"])).strftime("%s")) for index in range(temp_ohlcv.shape[0])]
	temp_ohlcv["Date"] = (pd.Series(unix_times)).values

	# Converts column headers to lowercase and sorts rows in chronological order
	temp_ohlcv.columns = ["date", "open", "high", "low", "close", "volume"]
	temp_ohlcv = temp_ohlcv.iloc[::-1]

	"""
	# Rate of Change Ratio
	roc3 = ((Indicator(temp_ohlcv, "ROCR", 3)).getHistorical(lag=1))[::-1]
	roc6 = ((Indicator(temp_ohlcv, "ROCR", 6)).getHistorical(lag=1))[::-1]

	# Average True Range
	atr = ((Indicator(temp_ohlcv, "ATR", 14)).getHistorical(lag=1))[::-1]

	# On-Balance Volume
	obv = ((Indicator(temp_ohlcv, "OBV", 6)).getHistorical(lag=1))[::-1]

	# Triple Exponential Moving Average
	trix = ((Indicator(temp_ohlcv, "TRIX", 30)).getHistorical(lag=1))[::-1]
	"""

	# Momentum
	mom1 = ((Indicator(temp_ohlcv, "MOM", 1)).getHistorical(lag=1))[::-1]
	mom3 = ((Indicator(temp_ohlcv, "MOM", 3)).getHistorical(lag=1))[::-1]

	# Average Directional Index
	adx14 = ((Indicator(temp_ohlcv, "ADX", 14)).getHistorical(lag=1))[::-1]
	adx20 = ((Indicator(temp_ohlcv, "ADX", 20)).getHistorical(lag=1))[::-1]

	# Williams %R
	willr = ((Indicator(temp_ohlcv, "WILLR", 14)).getHistorical(lag=1))[::-1]

	# Relative Strength Index
	rsi6 = ((Indicator(temp_ohlcv, "RSI", 6)).getHistorical(lag=1))[::-1]
	rsi12 = ((Indicator(temp_ohlcv, "RSI", 12)).getHistorical(lag=1))[::-1]

	# Moving Average Convergence Divergence
	macd, macd_signal, macd_hist = (Indicator(temp_ohlcv, "MACD", 12, 26, 9)).getHistorical(lag=1)
	macd, macd_signal, macd_hist = macd[::-1], macd_signal[::-1], macd_hist[::-1]
	
	# Exponential Moving Average
	ema6 = ((Indicator(temp_ohlcv, "MA", 6, 1)).getHistorical(lag=1))[::-1]
	ema12 = ((Indicator(temp_ohlcv, "MA", 12, 1)).getHistorical(lag=1))[::-1]

	# Append indicators to the input datasets
	min_length = min(len(mom1), len(mom3), len(adx14), len(adx20), len(willr), len(rsi6), len(rsi12), len(macd), len(macd_signal), len(macd_hist), len(ema6), len(ema12))
	ohlcv = ohlcv[:min_length].drop(["Open", "High", "Low"], axis=1)

	ohlcv["MOM (1)"], ohlcv["MOM (3)"], ohlcv["ADX (14)"]  = (pd.Series(mom1[:min_length])).values, (pd.Series(mom3[:min_length])).values, (pd.Series(adx14[:min_length])).values
	ohlcv["ADX (20)"], ohlcv["WILLR"], ohlcv["RSI (6)"] = (pd.Series(adx20[:min_length])).values, (pd.Series(willr[:min_length])).values, (pd.Series(rsi6[:min_length])).values
	ohlcv["RSI (12)"], ohlcv["MACD"], ohlcv["MACD (Signal)"] = (pd.Series(rsi12[:min_length])).values, (pd.Series(macd[:min_length])).values, (pd.Series(macd_signal[:min_length])).values
	ohlcv["MACD (Historical)"], ohlcv["EMA (6)"], ohlcv["EMA (12)"] = (pd.Series(macd_hist[:min_length])).values, (pd.Series(ema6[:min_length])).values, (pd.Series(ema12[:min_length])).values

	return ohlcv

def calculate_sentiment(headlines):
	sentiment_scores = {}

	numer, denom = 0, 0
	for index, row in headlines.iterrows():
		currDate = row["Date"]
		if currDate in sentiment_scores: pass
		else:
			numer = currRow["Sentiment"] * currRow["Tweets"]
			denom = currRow["Tweets"]
			for index, nextRow in headlines.iloc[index:].iterrows():
				if nextRow["Date"] == currDate:
					numer += nextRow["Sentiment"] * nextRow["Tweets"]
					denom += nextRow["Tweets"]
				else: break
			sentiment_scores[currDate] = numer / denom
			numer, denom = 0, 0

	date_range = pd.date_range(headlines.iloc[0]["Date"], headlines.iloc[-1]["Date"])
	sentiment_scores_df = pd.Series(sentiment_scores)
	sentiment_scores_df.index = pd.DatetimeIndex(sentiment_scores_df.index)
	sentiment_scores_df = sentiment_scores_df.reindex(date_range, fill_value=0)

	sentiment_scores_df.columns = ["Date", "Sentiment"]

	return sentiment_scores_df

def merge_datasets(set_a, set_b):
	"""Merges set A and set B into a single dataset, organized by date."""

	if type(set_b) == list:
		merged = set_a
		for attr in set_b: merged = pd.merge(merged, attr, on="Date")
		#for attr in set_c: merged = pd.merge(merged, attr, on="Date")
	else:
		print("\tMerging datasets")
		merged = pd.merge(set_a, set_b, on="Date")

	return merged

def fix_null_vals(dataset):
	"""Implements the Last Observation Carried Forward (LOCF) method to fill missing values."""
	print("\tFixing null values")

	if dataset.isnull().any().any() == False: return dataset
	else: return dataset.fillna(method="ffill")

def calculate_labels(dataset):
	"""Transforms daily price data into binary values indicating price change."""
	print("\tCalculating price movements")

	trends = [None]
	for index in range(dataset.shape[0] - 1):
		difference = dataset.iloc[index]["Close"] - dataset.iloc[index + 1]["Close"]

		if difference < 0: trends.append(-1)
		else: trends.append(1)

	dataset["Trend"] = (pd.Series(trends)).values
	dataset = dataset.drop(dataset.index[0])

	return dataset

def fix_outliers(dataset):
	"""Fixes (either normalizes or removes) outliers."""
	print("\tFixing outliers")

	return dataset

def balanced_split(dataset, test_size):
	"""Randomly splits dataset into balanced training and test sets."""
	print("\tSplitting data into *balanced* training and test sets")

	groups = {str(label): group for label, group in dataset.groupby("Trend")}

	min_length = min(len(groups["1.0"]), len(groups["-1.0"]))
	groups["1.0"], groups["-1.0"] = groups["1.0"][:min_length], groups["-1.0"][:min_length]

	train_set = pd.concat([groups["1.0"][0:int((1-test_size)*min_length)], groups["-1.0"][0:int((1-test_size)*min_length)]], axis=0)
	test_set = pd.concat([groups["1.0"][int((1-test_size)*min_length):], groups["-1.0"][int((1-test_size)*min_length):]], axis=0)

	return (train_set.drop(["Date", "Trend"], axis=1).values, test_set.drop(["Date", "Trend"], axis=1).values, 
		train_set["Trend"].values, test_set["Trend"].values)

def unbalanced_split(dataset, test_size):
	"""Randomly splits dataset into unbalanced training and test sets."""
	print("\tSplitting data into *unbalanced* training and test sets")

	dataset = dataset.drop("Date", axis=1)
	return train_test_split(dataset.drop("Trend", axis=1).values, dataset["Trend"].values, test_size=test_size, random_state=25)