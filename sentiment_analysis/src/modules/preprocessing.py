# alichtman

import re

import pandas as pd
from nltk import word_tokenize
from nltk.corpus import stopwords
from nltk.stem.porter import *
from sklearn.model_selection import train_test_split
from textblob import TextBlob

RANDOM_STATE = 42

# Helpers #

def remove_special_chars(headline_list):
	"""
	Removes all punctuation from headline and returns list.
	"""

	rm_spec_chars = [re.sub('[^ A-Za-z]+', "", headline) for headline in headline_list]
	# print("rm spec chars")
	# pprint(rm_spec_chars)
	return rm_spec_chars


def tokenize(processing):
	"""
	Takes dataframe containing headlines as input and adds a column
	with all headlines tokenized by whitespace and stripped
	of all punctuation
	"""

	tokenized = []
	for headline in processing:
		# print("HEADLINE", headline)
		# print("TOKENS", word_tokenize(headline))
		tokens = word_tokenize(headline)
		tokenized.append(tokens)

	# print("tokenize")
	# pprint(tokenized)
	return tokenized


def remove_stop_words(processing):
	"""Takes dataframe as input and removes all stop words from the
	tokenized headlines."""

	# pprint(processing)
	rm_stopwords = []
	for token_list in processing:
		rm_stopwords.append([token for token in token_list if token not in set(stopwords.words('english'))])
	# print("stop words")
	# pprint(rm_stopwords)
	return rm_stopwords


def stem(processing):
	"""Takes dataframe as input and stems all remaining headline tokens."""

	stemmer = PorterStemmer()
	stemmed = []
	for token_list in processing:
		# print(token_list)
		stemmed.append([stemmer.stem(token) for token in token_list])
	# print("stem")
	# pprint(stemmed)
	return stemmed


# def build_word_list(df, min_occurrences=3):
# 	"""
# 	Creates word list from stemmed headlines. Only includes words if seen more than 3 times.
# 	"""
# 	words = Counter()
# 	for idx in df.index:
# 		words.update(df.loc[idx, "processing"])
#
# 	words_list = { word:count for word, count in words.items() if min_occurrences < count }
# 	pprint(words_list)
# 	return df


def bag_of_words_model(processing, df):
	"""
	Create bag of words model.
	"""

	print("\tCreating Bag of Words Model...")

	very_pos = set()
	slightly_pos = set()
	neutral = set()
	slightly_neg = set()
	very_neg = set()

	# Create sets that hold words in headlines categorized as "slightly_neg" or "slightly_pos" or etc

	for stems, sentiment in zip(processing, df["Sentiment"].tolist()):
		if sentiment == -2:
			very_neg.update(stems)
		elif sentiment == -1:
			slightly_neg.update(stems)
		elif sentiment == 0:
			neutral.update(stems)
		elif sentiment == 1:
			slightly_pos.update(stems)
		elif sentiment == 2:
			very_pos.update(stems)

	# Count number of words in each headline in each of the sets and encode it as a list of counts for each headline.

	sentiment_count = []
	for x in processing:
		x = set(x)
		sentiment_count.append(list((len(x & very_neg), len(x & slightly_neg), len(x & neutral), len(x & slightly_pos), len(x & very_pos))))

	df["sentiment_class_count"] = sentiment_count

	return df


def pos_tag_tokens(filtered_tokens):
	"""
	Takes list of tokens with stop words removed and returns list of
	list corresponding POS tags for each token in each headline
	"""

	print("\tGetting POS Tags...")

	pos_tag_list = []
	for token_list in filtered_tokens:
		pos_tag_list.append([x[1] for x in TextBlob(" ".join(token_list)).tags])

	return pos_tag_list


def calc_orig_headline_len(headlines):
	"""
	Takes list of headlines as input and calculates the length of each.
	"""

	return [len(x) for x in headlines]


def preprocessing(df):
	"""
	Takes a dataframe, removes punctuation and special characters, tokenizes
	the headlines, removes stop-tokens, and stems the remaining tokens.
	"""

	specials_removed = remove_special_chars(df["Headline"].tolist())
	tokenized = tokenize(specials_removed)
	tokenized_filtered = remove_stop_words(tokenized)
	stemmed = stem(tokenized_filtered)

	return df, tokenized_filtered, stemmed


def feature_extraction(orig_headlines, filtered_tokens, stemmed, df):
	"""
	Extract headline lengths, POS tags, and bag of words model.
	"""

	headline_lens = calc_orig_headline_len(orig_headlines)
	pos_tags = pos_tag_tokens(filtered_tokens)
	feature_df = bag_of_words_model(stemmed, df)

	return headline_lens, feature_df, pos_tags


def headlines_balanced_split(dataset, test_size):
	"""Randomly splits dataset into balanced training and test sets."""
	# print("\nSplitting headlines into *balanced* training and test sets...")
	# pprint(list(dataset.values))
	# pprint(dataset)

	# Use sklearn.train_test_split to split all features into x_train and x_test,
	# 		and all expected values into y_train and y_test numpy arrays
	x_train, x_test, y_train, y_test = train_test_split(dataset.drop(["Sentiment", "Headline"], axis=1).values,
	                                                    dataset["Sentiment"].values, test_size=test_size,
	                                                    random_state=RANDOM_STATE)

	x_train = [x[0] for x in x_train]
	x_test = [x[0] for x in x_test]

	# print("X TRAIN FIXED")
	# pprint(x_train)
	# print(len(x_train))
	# print(len(x_test))
	# print(len(y_train))
	# print(len(y_test))

	# Combine x_train and y_train (numpy arrays) into a single dataframe, with column labels
	train = pd.DataFrame(data=x_train, columns=["very_neg", "slightly_neg", "neutral", "slightly_pos", "very_pos"])
	train["Sentiment"] = pd.Series(y_train)

	# Do the same for x_test and y_test
	test = pd.DataFrame(data=x_test, columns=["very_neg", "slightly_neg", "neutral", "slightly_pos", "very_pos"])
	test["Sentiment"] = pd.Series(y_test)

	train_prediction = train["Sentiment"].values
	test_prediction = test["Sentiment"].values
	train_trimmed = train.drop(["Sentiment"], axis=1).values
	test_trimmed = test.drop(["Sentiment"], axis=1).values

	return train_trimmed, test_trimmed, train_prediction, test_prediction


# Main #


def merge_headline_dataset(origin, other_set):
	print("\tMerging datasets...")

	return pd.concat([origin, other_set], axis=1)


def split(dataset, test_size, balanced=True):
	if balanced:
		return headlines_balanced_split(dataset, test_size)
	else:
		# TODO: write imbalanced split function
		return headlines_balanced_split(dataset, test_size)
