#########
# GLOBALS
#########


import pandas as pd
import dateutil.parser as dp
from scipy.stats import boxcox
from realtime_talib import Indicator


#######################
# GENERAL PREPROCESSORS
#######################


def calculate_indicators(ohlcv_df):
    ohlcv_df = ohlcv_df.drop(["Volume (BTC)", "Weighted Price"], axis=1)
    ohlcv_df.columns = ["Date", "Open", "High", "Low", "Close", "Volume"]

    temp_ohlcv_df = ohlcv_df.copy()

    # Converts ISO 8601 timestamps to UNIX
    unix_times = [int(dp.parse(temp_ohlcv_df.iloc[index]["Date"]).strftime('%s')) for index in range(temp_ohlcv_df.shape[0])]
    temp_ohlcv_df["Date"] = pd.Series(unix_times).values

    # Converts column headers to lowercase and sorts rows in chronological order
    temp_ohlcv_df.columns = ["date", "open", "high", "low", "close", "volume"]
    temp_ohlcv_df = temp_ohlcv_df.iloc[::-1]

    # Rate of Change Ratio
    rocr3 = Indicator(temp_ohlcv_df, "ROCR", 3).getHistorical()[::-1]
    rocr6 = Indicator(temp_ohlcv_df, "ROCR", 6).getHistorical()[::-1]

    # Average True Range
    atr = Indicator(temp_ohlcv_df, "ATR", 14).getHistorical()[::-1]

    # On-Balance Volume
    obv = Indicator(temp_ohlcv_df, "OBV").getHistorical()[::-1]

    # Triple Exponential Moving Average
    trix = Indicator(temp_ohlcv_df, "TRIX", 20).getHistorical()[::-1]

    # Momentum
    mom1 = Indicator(temp_ohlcv_df, "MOM", 1).getHistorical()[::-1]
    mom3 = Indicator(temp_ohlcv_df, "MOM", 3).getHistorical()[::-1]

    # Average Directional Index
    adx14 = Indicator(temp_ohlcv_df, "ADX", 14).getHistorical()[::-1]
    adx20 = Indicator(temp_ohlcv_df, "ADX", 20).getHistorical()[::-1]

    # Williams %R
    willr = Indicator(temp_ohlcv_df, "WILLR", 14).getHistorical()[::-1]

    # Relative Strength Index
    rsi6 = Indicator(temp_ohlcv_df, "RSI", 6).getHistorical()[::-1]
    rsi12 = Indicator(temp_ohlcv_df, "RSI", 12).getHistorical()[::-1]

    # Moving Average Convergence Divergence
    macd, macd_signal, macd_hist = Indicator(
        temp_ohlcv_df, "MACD", 12, 26, 9).getHistorical()
    macd, macd_signal, macd_hist = macd[::-
                                        1], macd_signal[::-1], macd_hist[::-1]

    # Exponential Moving Average
    ema6 = Indicator(temp_ohlcv_df, "MA", 6, 1).getHistorical()[::-1]
    ema12 = Indicator(temp_ohlcv_df, "MA", 12, 1).getHistorical()[::-1]

    # Append indicators to the input datasets
    min_length = min(len(mom1), len(mom3), len(adx14), len(adx20), len(willr),
                     len(rsi6), len(rsi12), len(macd), len(
                         macd_signal), len(macd_hist),
                     len(ema6), len(ema12), len(rocr3), len(rocr6), len(atr), len(obv), len(trix))
    ohlcv_df = ohlcv_df[:min_length].drop(["Open", "High", "Low"], axis=1)

    ohlcv_df["MOM (1)"] = pd.Series(mom1[:min_length]).values
    ohlcv_df["MOM (3)"] = pd.Series(mom3[:min_length]).values
    ohlcv_df["ADX (14)"] = pd.Series(adx14[:min_length]).values
    ohlcv_df["ADX (20)"] = pd.Series(adx20[:min_length]).values
    ohlcv_df["WILLR"] = pd.Series(willr[:min_length]).values
    ohlcv_df["RSI (6)"] = pd.Series(rsi6[:min_length]).values
    ohlcv_df["RSI (12)"] = pd.Series(rsi12[:min_length]).values
    ohlcv_df["MACD"] = pd.Series(macd[:min_length]).values
    ohlcv_df["MACD (Signal)"] = pd.Series(macd_signal[:min_length]).values
    ohlcv_df["MACD (Historical)"] = pd.Series(macd_hist[:min_length]).values
    ohlcv_df["EMA (6)"] = pd.Series(ema6[:min_length]).values
    ohlcv_df["EMA (12)"] = pd.Series(ema12[:min_length]).values
    ohlcv_df["ROCR (3)"] = pd.Series(rocr3[:min_length]).values
    ohlcv_df["ROCR (6)"] = pd.Series(rocr6[:min_length]).values
    ohlcv_df["ATR (14)"] = pd.Series(atr[:min_length]).values
    ohlcv_df["OBV"] = pd.Series(obv[:min_length]).values
    ohlcv_df["TRIX (20)"] = pd.Series(trix[:min_length]).values

    return ohlcv_df

def merge_datasets(origin_df, other_sets):
    merged = origin_df
    for set in other_sets:
        merged = pd.merge(merged, set, on="Date")

    return merged

def fix_null_vals(df):
    if not df.isnull().any().any():
        return df
    else:
        return df.fillna(method="ffill")

def add_lag_vars(df, lag=3):
    new_df_dict = {}
    for col_header in df.drop("Date", axis=1):
        new_df_dict[col_header] = df[col_header]
        for lag in range(1, lag + 1):
            new_df_dict["%s_lag%d" %
                        (col_header, lag)] = df[col_header].shift(-lag)

    new_df = pd.DataFrame(new_df_dict, index=df.index)
    new_df["Date"] = df["Date"]

    return new_df.dropna()

def power_transform(df):
    for header in df.drop("Date", axis=1).columns:
        if not any(df[header] < 0) and not any(df[header] == 0):
            df[header] = boxcox(df[header])[0]

    return df

def binarize_labels(df):
    trends = [None]
    for idx in range(df.shape[0] - 1):
        diff = df.iloc[idx]["Close"] - df.iloc[idx + 1]["Close"]

        if diff < 0:
            trends.append(-1)
        else:
            trends.append(1)

    df["Trend"] = pd.Series(trends).values

    return df

def random_undersampling(dataset):
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

def balanced_split(dataset, test_size):
	x_train, x_test, y_train, y_test = train_test_split(dataset.drop(["Date", "Trend"], axis=1).values, dataset["Trend"].values, test_size=test_size, random_state=RANDOM_STATE)

	# Combine x_train and y_train into a single df, with column labels
	train = pd.DataFrame(data=x_train, columns=dataset.columns[1:-1])
	train["Trend"] = pd.Series(y_train)

	# Do the same for x_test and y_test
	test = pd.DataFrame(data=x_test, columns=dataset.columns[1:-1])
	test["Trend"] = pd.Series(y_test)

	# Apply random undersampling to both data frames
	train_downsampled = random_undersampling(train)
	test_downsampled = random_undersampling(test)

	train_trend = train_downsampled["Trend"].values
	test_trend = test_downsampled["Trend"].values
	train_trimmed = train_downsampled.drop(["Trend"], axis=1).values
	test_trimmed = test_downsampled.drop(["Trend"], axis=1).values

	return train_trimmed, test_trimmed, train_trend, test_trend


######
# MAIN
######


def transformer(name):
    if name == "calculate_indicators":
        return calculate_indicators
    elif name == "merge_datasets":
        return merge_datasets
    elif name == "binarize_labels":
        return binarize_labels
    elif name == "fix_null_vals":
        return fix_null_vals
    elif name == "add_lag_vars":
        return add_lag_vars
    elif name == "power_transform":
        return power_transform
