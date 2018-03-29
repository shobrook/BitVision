# Globals #


import sys

sys.path.insert(0, "modules")

# Project modules
from training import Model
import preprocessing as pp
import analysis
import scraper

# System modules
import os.path
import json
import csv
import time
import pandas as pd

OPTIMIZE, SELECT_FEATURES = False, False
if sys.argv[1] == "-o" and sys.argv[3] == "-fs":
    OPTIMIZE, SELECT_FEATURES = sys.argv[2] == True, sys.argv[4] == True
else:
    print("Invalid arguments.")
    sys.exit()


# Data Bus #


print("Fetching data")

price_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/price_data.csv")
blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_data.csv")
#coindesk_headlines = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/test_scores.csv", sep=",")


# Preprocessing #


print("Preprocessing")

x_train, x_test, y_train, y_test = (
        price_data.pipe(pp.calculate_indicators)
        .pipe(pp.merge_datasets, set_b=blockchain_data)
        .pipe(pp.binarize_labels)
        .pipe(pp.fix_null_vals)
        .pipe(pp.fix_outliers)
        .pipe(pp.add_lag_variables, lag=3)
        .pipe(pp.power_transform)
        .pipe(pp.balanced_split, test_size=.2)
        )


# Analysis #


#print("Analyzing features")

#print(data.describe())
#analysis.plot_corr_matrix(data)


# Training and Testing #


print("Fitting models")

# Fit models
log_reg = Model(estimator="LogisticRegression", train_set=(x_train, y_train), test_set=(x_test, y_test), optimize=OPTIMIZE, select_features=SELECT_FEATURES)
rand_forest = Model(estimator="RandomForest", train_set=(x_train, y_train), test_set=(x_test, y_test), optimize=OPTIMIZE, select_features=SELECT_FEATURES)
grad_boost = Model(estimator="GradientBoosting", train_set=(x_train, y_train), test_set=(x_test, y_test), optimize=OPTIMIZE, select_features=SELECT_FEATURES)


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
