# Globals #


import numpy as np
import pandas as pd
import dateutil.parser as dp
from itertools import islice
from scipy.stats import boxcox
from scipy.integrate import simps
from realtime_talib import Indicator
from scipy.optimize import curve_fit
from sklearn.model_selection import train_test_split
from sklearn.utils import resample
from pprint import pprint
from selenium import webdriver


# Helpers #

def sliding_window(seq, n=2):
	"""Returns a sliding window (of width n) over data from the iterable. https://stackoverflow.com/a/6822773/8740440"""
	"s -> (s0,s1,...s[n-1]), (s1,s2,...,sn), ..."
	it = iter(seq)
	result = tuple(islice(it, n))
	if len(result) == n:
		yield result
	for elem in it:
		result = result[1:] + (elem,)
		yield result


def integrate(avg_daily_sentiment, interval):
	"""Takes a list of average daily sentiment scores and returns a list of definite integral estimations calculated
	with Simpson's method. Each integral interval is determined by the `interval` variable. Shows accumulated sentiment."""

	# Split into sliding window list of lists
	sentiment_windows = sliding_window(avg_daily_sentiment, interval)

	integral_simpson_est = []

	# https://stackoverflow.com/a/13323861/8740440
	for x in sentiment_windows:
		# Estimate area using composite Simpson's rule. dx indicates the spacing of the data on the x-axis.
		integral_simpson_est.append(simps(x, dx=1))

	dead_values = list([None] * interval)
	dead_values.extend(integral_simpson_est)
	dead_values.reverse()
	return dead_values


def random_undersampling(dataset):
	"""Randomly deleting rows that contain the majority class until the number in the majority class is equal with
	the number in the minority class."""

	minority_set = dataset[dataset.Trend == -1.0]
	majority_set = dataset[dataset.Trend == 1.0]

	# print(dataset.Trend.value_counts())

	# If minority set larger than majority set, swap
	if len(minority_set) > len(majority_set):
		minority_set, majority_set = majority_set, minority_set

	# Downsample majority class
	majority_downsampled = resample(majority_set,
	                                replace=False,  # sample without replacement
	                                n_samples=len(minority_set),  # to match minority class
	                                random_state=123)  # reproducible results

	# Combine minority class with downsampled majority class
	return pd.concat([majority_downsampled, minority_set])


def get_popularity(headlines):
	# TODO: Randomize user-agents OR figure out how to handle popups
	if "Tweets" not in headlines.columns:
		counts = []
		driver = webdriver.Chrome()

		for index, row in headlines.iterrows():
			try:
				driver.get(row["URL"])
				time.sleep(3)

				twitter_containers = driver.find_elements_by_xpath("//li[@class='twitter']")
				count = twitter_containers[0].find_elements_by_xpath("//span[@class='count']")

				if count[0].text == "":
					counts.append(1)
				else:
					counts.append(int(count[0].text))
			except:
				counts.append(1)  # QUESTION: Should it be None?

		headlines["Tweets"] = (pd.Series(counts)).values
		print(counts)

	return headlines


# Main #


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

	# Rate of Change Ratio
	# roc3 = ((Indicator(temp_ohlcv, "ROCR", 3)).getHistorical(lag=1))[::-1]
	# roc6 = ((Indicator(temp_ohlcv, "ROCR", 6)).getHistorical(lag=1))[::-1]

	# Average True Range
	# atr = ((Indicator(temp_ohlcv, "ATR", 14)).getHistorical(lag=1))[::-1]

	# On-Balance Volume
	# obv = ((Indicator(temp_ohlcv, "OBV", 6)).getHistorical(lag=1))[::-1]

	# Triple Exponential Moving Average
	# trix = ((Indicator(temp_ohlcv, "TRIX", 30)).getHistorical(lag=1))[::-1]

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
	min_length = min(len(mom1), len(mom3), len(adx14), len(adx20), len(willr), len(rsi6), len(rsi12), len(macd),
	                 len(macd_signal), len(macd_hist), len(ema6), len(ema12))
	ohlcv = ohlcv[:min_length].drop(["Open", "High", "Low"], axis=1)

	ohlcv["MOM (1)"], ohlcv["MOM (3)"], ohlcv["ADX (14)"] = (pd.Series(mom1[:min_length])).values, (
		pd.Series(mom3[:min_length])).values, (pd.Series(adx14[:min_length])).values
	ohlcv["ADX (20)"], ohlcv["WILLR"], ohlcv["RSI (6)"] = (pd.Series(adx20[:min_length])).values, (
		pd.Series(willr[:min_length])).values, (pd.Series(rsi6[:min_length])).values
	ohlcv["RSI (12)"], ohlcv["MACD"], ohlcv["MACD (Signal)"] = (pd.Series(rsi12[:min_length])).values, (
		pd.Series(macd[:min_length])).values, (pd.Series(macd_signal[:min_length])).values
	ohlcv["MACD (Historical)"], ohlcv["EMA (6)"], ohlcv["EMA (12)"] = (pd.Series(macd_hist[:min_length])).values, (
		pd.Series(ema6[:min_length])).values, (pd.Series(ema12[:min_length])).values

	return ohlcv


def calculate_sentiment(headlines):
	sentiment_scores = {}

	numer, denom = 0.0, 0.0
	for index, currRow in headlines.iterrows():
		print(currRow)
		currDate = currRow["Date"]
		if currDate in sentiment_scores:
			pass
		else:
			numer = currRow["Sentiment"] * currRow["Tweets"]
			denom = currRow["Tweets"]
			for index, nextRow in headlines.iloc[index + 1:].iterrows():
				if nextRow["Date"] == currDate:
					numer += (nextRow["Sentiment"] * nextRow["Tweets"])
					denom += nextRow["Tweets"]
				else:
					break

			sentiment_scores[currDate] = numer / denom
			numer, denom = 0.0, 0.0

	sentiment_scores_df = pd.DataFrame(list(sentiment_scores.items()), columns=["Date", "Sentiment"])

	return sentiment_scores_df


def merge_datasets(set_a, set_b):
	"""Merges set A and set B into a single dataset, organized by date."""

	if type(set_b) == list:
		merged = set_a
		for attr in set_b:
			merged = pd.merge(merged, attr, on="Date")
		# for attr in set_c: merged = pd.merge(merged, attr, on="Date")
	else:
		print("\tMerging datasets")
		merged = pd.merge(set_a, set_b, on="Date")

	return merged


def fix_null_vals(dataset):
	"""Implements the Last Observation Carried Forward (LOCF) method to fill missing values."""
	print("\tFixing null values")

	if not dataset.isnull().any().any():
		return dataset
	else:
		return dataset.fillna(method="ffill")


def binarize_labels(dataset):
	"""Transforms daily price data into binary values indicating price change."""
	print("\tCalculating price movements")

	trends = [None]
	for index in range(dataset.shape[0] - 1):
		difference = dataset.iloc[index]["Close"] - dataset.iloc[index + 1]["Close"]

		if difference < 0:
			trends.append(-1)
		else:
			trends.append(1)

	dataset["Trend"] = (pd.Series(trends)).values
	dataset = dataset.drop(dataset.index[0])

	return dataset


def fix_outliers(dataset):
	"""Fixes (either normalizes or removes) outliers."""
	print("\tFixing outliers")

	return dataset


def add_lag_variables(dataset, lag=3):
	print("\tAdding lag variables")

	new_df_dict = {}
	for col_header in dataset.drop(["Date", "Trend"], axis=1):
		new_df_dict[col_header] = dataset[col_header]
		for lag in range(1, lag + 1):
			new_df_dict["%s_lag%d" % (col_header, lag)] = dataset[col_header].shift(lag)

	new_df = pd.DataFrame(new_df_dict, index=dataset.index)
	new_df["Date"], new_df["Trend"] = dataset["Date"], dataset["Trend"]

	return new_df.dropna()


def power_transform(dataset):
	print("\tApplying a box-cox transform to selected features")

	for header in dataset.drop(["Date", "Trend"], axis=1).columns:
		if not (dataset[header] < 0).any() and not (dataset[header] == 0).any():
			dataset[header] = boxcox(dataset[header])[0]

	return dataset


def balanced_split(dataset, test_size):
	"""Randomly splits dataset into balanced training and test sets."""
	print("\tSplitting data into *balanced* training and test sets")

	# Use sklearn.train_test_split to split original dataset into x_train, y_train, x_test, y_test numpy arrays

	x_train, x_test, y_train, y_test = train_test_split(dataset.drop(["Date", "Trend"], axis=1).values,
	                                                    dataset["Trend"].values,
	                                                    test_size=test_size,
	                                                    random_state=25)

	# Combine x_train and y_train (numpy arrays) into a single dataframe, with column labels
	train = pd.DataFrame(data=x_train, columns=dataset.columns[1:-1])
	train["Trend"] = pd.Series(y_train)

	# Do the same for x_test and y__test
	test = pd.DataFrame(data=x_test, columns=dataset.columns[1:-1])
	test["Trend"] = pd.Series(y_test)

	# Apply random undersampling to both data frames
	train_downsampled = random_undersampling(train)
	test_downsampled = random_undersampling(test)

	train_trend = train_downsampled["Trend"].values
	test_trend = test_downsampled["Trend"].values
	train_trimmed = train_downsampled.drop(["Trend"], axis=1).values
	test_trimmed = test_downsampled.drop(["Trend"], axis=1).values

	# TODO: Set a random seed so results can be reproduced

	return train_trimmed, test_trimmed, train_trend, test_trend


def unbalanced_split(dataset, test_size):
	"""Randomly splits dataset into unbalanced training and test sets."""
	print("\tSplitting data into *unbalanced* training and test sets")

	dataset = dataset.drop("Date", axis=1)
	output = train_test_split(dataset.drop("Trend", axis=1).values, dataset["Trend"].values, test_size=test_size, random_state=25)

	# TODO: Set a random seed so results can be reproduced

	return output


def integral_transform(dataset, interval):
	integral = integrate(list(dataset["Sentiment"]), interval)
	dataset["Sentiment_integrals"] = pd.Series(integral)


def func(x, a, b, c):
	"""https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.curve_fit.html"""
	return a * np.exp(-b * x) + c


def best_fit_curve(xdata):
	"""Takes list of sentiment scores as input and returns a function of best fit.
	https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.curve_fit.html"""

	# Fit for the parameters a, b, c of the function func
	popt, pcov = curve_fit(func, xdata, ydata)

	# Constrain the optimization to the region of 0 <= a <= 3, 0 <= b <= 1 and 0 <= c <= 0.5:
	popt, pcov = curve_fit(func, xdata, ydata, bounds=(0, [3., 1., 0.5]))


def derivative(avg_daily_sentiment, interval):
	"""Takes list of average daily sentiment scores and returns a list of average derivatives."""

	# Split into sliding window list of lists
	sentiment_windows = sliding_window(avg_daily_sentiment, interval)

	# Fit a function to each of the lists in the list.
	best_fit_funcs = []
	for window in sentiment_windows:
		best_fit_funcs.extend(best_fit_curve(window))

	# Take derivative at each day in the interval and average them.
	# -> Transform each function into a list of days-in-interval-many derivatives.
	# -> Then take one average for each list in sentiment_windows.

	# Return list of avg_derivatives
