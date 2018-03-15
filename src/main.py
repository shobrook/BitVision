# Globals #


import sys

sys.path.insert(0, "modules")

# Project modules
from training import Model
import preprocessing as ppc
import analysis
import scraper

# System modules
import os.path
import json
import csv
import time
import pandas as pd


# Data Bus #


print("Fetching data")

price_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/price_data.csv")
blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_data.csv")
#coindesk_headlines = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/test_scores.csv", sep=",")


# Preprocessing #


print("Preprocessing")

data = (price_data.pipe(ppc.calculate_indicators)
        .pipe(ppc.merge_datasets, set_b=blockchain_data)
        .pipe(ppc.binarize_labels)
        .pipe(ppc.fix_null_vals)
        .pipe(ppc.power_transform)
        )

"""
x_train, x_test, y_train, y_test = (price_data.pipe(ppc.calculate_indicators)
	.pipe(ppc.merge_datasets, set_b=blockchain_data, set_c=(coindesk_headlines.pipe(scraper.get_popularity)
		.pipe(ppc.calculate_sentiment)))
	.pipe(ppc.fix_null_vals)
	.pipe(ppc.binarize_labels)
	.pipe(ppc.fix_outliers)
	.pipe(ppc.unbalanced_split, test_size=.2)
)
"""


# Analysis #


print("Analyzing features")

#print(data.describe())
analysis.plot_corr_matrix(data) # Demonstrate that there is little interdependence between features


# Training and Testing #


print("Fitting models")

# Generate training and testing data
x_train, x_test, y_train, y_test = (data.pipe(ppc.fix_outliers).pipe(ppc.balanced_split, test_size=.2))

# Fit models
log_reg = Model(estimator="LogisticRegression", train_set=(x_train, y_train), test_set=(x_test, y_test), grid_search=True)
rand_forest = Model(estimator="RandomForest", train_set=(x_train, y_train), test_set=(x_test, y_test), grid_search=True)
grad_boost = Model(estimator="GradientBoosting", train_set=(x_train, y_train), test_set=(x_test, y_test), grid_search=True)


# Evaluation #


print("Evaluating")

# Logistic Regression
print("\tLogistic Regression Estimator")
log_reg.plot_cnf_matrix()
print("\t\tTest Results:")
log_reg.evaluate()
print("\t\tCross Validation Results:")
log_reg.cross_validate()

# Random Forest
print("\tRandom Forest Classifier")
rand_forest.plot_cnf_matrix()
print("\t\tTest Results:")
rand_forest.evaluate()
print("\t\tCross Validation Results:")
rand_forest.cross_validate()
#rand_forest.print_feature_importances(data)

# Gradient Boosting
print("\tGradient Boosting Classifier")
grad_boost.plot_cnf_matrix()
print("\t\tTest Results:")
grad_boost.evaluate()
print("\t\tCross Validation Results:")
grad_boost.cross_validate()
