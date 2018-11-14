#########
# GLOBALS
#########


import pandas as pd
import dateutil.parser as dp
from itertools import islice
from scipy.stats import boxcox
from realtime_talib import Indicator
#from nltk import word_tokenize
#from nltk.corpus import stopwords
#from nltk.stem.porter import *
#from scipy.integrate import simps
#from sklearn.model_selection import train_test_split
#from sklearn.utils import resample
#from selenium import webdriver

RANDOM_STATE = 42


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
    # df = df.drop(df.index[0])

    return df

def recursive_feature_elim(df):
    return df


####################
# TEXT PREPROCESSORS
####################


# def remove_special_chars(headline_list):
# 	"""
# 	Returns list of headlines with all non-alphabetical characters removed.
# 	"""
# 	rm_spec_chars = [re.sub('[^ A-Za-z]+', "", headline) for headline in headline_list]
# 	return rm_spec_chars
#
# def tokenize(headline_list):
# 	"""
# 	Takes list of headlines as input and returns a list of lists of tokens.
# 	"""
# 	tokenized = []
# 	for headline in headline_list:
# 		tokens = word_tokenize(headline)
# 		tokenized.append(tokens)
#
# 	return tokenized
#
# def remove_stop_words(tokenized_headline_list):
# 	"""
# 	Takes list of lists of tokens as input and removes all stop words.
# 	"""
# 	filtered_tokens = []
# 	for token_list in tokenized_headline_list:
# 		filtered_tokens.append([token for token in token_list if token not in set(stopwords.words('english'))])
# 	# print("stop words")
# 	# pprint(filtered_tokens)
# 	return filtered_tokens
#
# def stem(token_list_of_lists):
# 	"""
# 	Takes list of lists of tokens as input and stems every token.
# 	Returns a list of lists of stems.
# 	"""
# 	stemmer = PorterStemmer()
# 	stemmed = []
# 	for token_list in token_list_of_lists:
# 		# print(token_list)
# 		stemmed.append([stemmer.stem(token) for token in token_list])
# 	# print("stem")
# 	# pprint(stemmed)
# 	return stemmed
#
#
# def make_bag_of_words(df, stemmed):
# 	"""
# 	Create bag of words model.
# 	"""
# 	print("\tCreating Bag of Words Model...")
#
# 	very_pos = set()
# 	slightly_pos = set()
# 	neutral = set()
# 	slightly_neg = set()
# 	very_neg = set()
#
# 	# Create sets that hold words in headlines categorized as "slightly_neg" or "slightly_pos" or etc
#
# 	for stems, sentiment in zip(stemmed, df["Sentiment"].tolist()):
# 		if sentiment == -2:
# 			very_neg.update(stems)
# 		elif sentiment == -1:
# 			slightly_neg.update(stems)
# 		elif sentiment == 0:
# 			neutral.update(stems)
# 		elif sentiment == 1:
# 			slightly_pos.update(stems)
# 		elif sentiment == 2:
# 			very_pos.update(stems)
#
# 	# Count number of words in each headline in each of the sets and encode it as a list of counts for each headline.
#
# 	bag_count = []
# 	for x in stemmed:
# 		x = set(x)
# 		bag_count.append(list((len(x & very_neg), len(x & slightly_neg), len(x & neutral), len(x & slightly_pos), len(x & very_pos))))
#
# 	df["sentiment_class_count"] = bag_count
# 	return df
#
# def sentiment_preprocessing(df):
# 	"""
# 	Takes a dataframe, removes special characters, tokenizes
# 	the headlines, removes stop-tokens, and stems the remaining tokens.
# 	"""
#
# 	specials_removed = remove_special_chars(df["Headline"].tolist())
# 	tokenized = tokenize(specials_removed)
# 	tokenized_filtered = remove_stop_words(tokenized)
# 	stemmed = stem(tokenized_filtered)
#
# 	return df, stemmed


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
    elif name == "select_features":
        return recursive_feature_elim
