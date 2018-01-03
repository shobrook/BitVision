import pandas as pd
import dateutil.parser as dp
from realtime_talib import Indicator

def calculate_indicators(ohlcv):
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
	print("Calculating MOM...")
	mom1 = ((Indicator(temp_ohlcv, "MOM", 1)).getHistorical(lag=1))[::-1]
	mom3 = ((Indicator(temp_ohlcv, "MOM", 3)).getHistorical(lag=1))[::-1]

	# Average Directional Index
	print("Calculating ADX...")
	adx14 = ((Indicator(temp_ohlcv, "ADX", 14)).getHistorical(lag=1))[::-1]
	adx20 = ((Indicator(temp_ohlcv, "ADX", 20)).getHistorical(lag=1))[::-1]

	# Williams %R
	print("Calculating WILLR...")
	willr = ((Indicator(temp_ohlcv, "WILLR", 14)).getHistorical(lag=1))[::-1]

	# Relative Strength Index
	print("Calculating RSI...")
	rsi6 = ((Indicator(temp_ohlcv, "RSI", 6)).getHistorical(lag=1))[::-1]
	rsi12 = ((Indicator(temp_ohlcv, "RSI", 12)).getHistorical(lag=1))[::-1]

	# Moving Average Convergence Divergence
	print("Calculating MACD...")
	macd, macd_signal, macd_hist = (Indicator(temp_ohlcv, "MACD", 12, 26, 9)).getHistorical(lag=1)
	macd, macd_signal, macd_hist = macd[::-1], macd_signal[::-1], macd_hist[::-1]
	
	# Exponential Moving Average
	print("Calculating EMA...")
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

def merge_datasets(set_a, set_b):
	"""Merges set A and set B into a single dataset, organized by date."""
	print("Merging datasets...")

	merged = set_a
	for attr in set_b: merged = pd.merge(merged, attr, on="Date")

	return merged

def fix_null_vals(dataset):
	"""Implements the Last Observation Carried Forward (LOCF) method to fill missing values."""
	if dataset.isnull().any().any() == False: 
		print("No null values found...")
		return dataset
	else:
		print("Fixing null values...") 
		return dataset.fillna(method="ffill")

def calculate_labels(dataset):
	"""Transforms daily price data into binary values indicating price change."""
	trends = [None]
	for index in range(dataset.shape[0] - 1):
		difference = dataset.iloc[index]["Close"] - dataset.iloc[index + 1]["Close"]

		if difference < 0: trends.append(-1)
		else: trends.append(1)

	dataset["Trend"] = (pd.Series(trends)).values
	dataset = dataset.drop(dataset.index[0])

	return dataset