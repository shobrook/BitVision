# alichtman

import sys
import os.path
import pandas as pd
from pprint import pprint

# Project modules
sys.path.insert(0, "modules")
from sentimentmodel import SentimentModel
import preprocessing as pp
import analysis


def main():
	# Data Bus #

	print("\nReading headlines dataset...")

	headlines = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/scored_headlines.csv",
	                        usecols=["Headline", "Sentiment"], sep=",")

	# Preprocessing #

	print("\nPreprocessing...")

	headlines, tokenized_filtered, stemmed = pp.preprocessing(headlines)
	lens, feature_df, pos_tags = pp.feature_extraction(headlines["Headline"].tolist(),
	                                                   tokenized_filtered,
	                                                   stemmed, headlines)

	# pprint(bag_of_words)

	# Merge bag of words model into dataframe.
	# combined = pp.merge_headline_dataset(headlines, bag_of_words)
	# print(combined.columns)

	print("\nCompleted preprocessing...")

	sentiment = feature_df["Sentiment"].tolist()
	# pprint(type(feature_df["sentiment_class_count"][0]))


	print("\nHEADLINE SENTIMENT DATA STATISTICS\n")
	very_neg = len([x for x in sentiment if x == -2])
	slight_neg = len([x for x in sentiment if x == -1])
	neutral = len([x for x in sentiment if x == 0])
	slight_pos = len([x for x in sentiment if x == 1])
	very_pos = len([x for x in sentiment if x == 2])
	total = len(sentiment)

	print("\tVERY NEG:  ", very_neg, "({}%)".format(round(very_neg / total * 100, 2)))
	print("\tSLIGHT NEG:", slight_neg, "({}%)".format(round(slight_neg / total * 100, 2)))
	print("\tNEUTRAL:   ", neutral, "({}%)".format(round(neutral / total * 100, 2)))
	print("\tSLIGHT POS:", slight_pos, "({}%)".format(round(slight_pos / total * 100, 2)))
	print("\tVERY POS:  ", very_pos, "({}%)".format(round(very_pos / total * 100, 2)))

	x_train, x_test, y_train, y_test = pp.split(feature_df, test_size=.2, balanced=True)

	# Analysis #

	# pprint(feature_df)

	print("\nAnalyzing features...\n")

	# Fitting Models #

	print("\nFitting models...\n")

	rand_forest = SentimentModel(
		estimator="RandomForest",
		train_set=(x_train, y_train),
		test_set=(x_test, y_test)
	)

	grad_boost = SentimentModel(
		estimator="GradientBoosting",
		train_set=(x_train, y_train),
		test_set=(x_test, y_test)
	)

	support_vec = SentimentModel(
		estimator="SupportVectorClassifier",
		train_set=(x_train, y_train),
		test_set=(x_test, y_test)
	)

	# Evaluation #


	print("\nEvaluating models...\n")

	conf_matrix_counter = 0

	# Random Forest Classifier
	print("\tRandom Forest Classifier")
	analysis.plot_cnf_matrix(rand_forest.y_pred, rand_forest.y_test)
	rand_forest.cross_validate(method="Holdout")

	# Gradient Boosting Classifier
	print("\tGradient Boosting Classifier")
	analysis.plot_cnf_matrix(grad_boost.y_pred, grad_boost.y_test)
	grad_boost.cross_validate(method="Holdout")

	# Support Vector Classifier
	print("\tSupport Vector Classifier")
	analysis.plot_cnf_matrix(support_vec.y_pred, support_vec.y_test)
	support_vec.cross_validate(method="Holdout")


if __name__ == '__main__':
	main()
