"""
Name: BitVision
Version: 2.0.0
Authors: @shobrook and @alichtman
Description: Bitcoin price prediction based on network data, technical
indicators, and sentiment of relevant news headlines.
"""


##########
## GLOBALS
##########


import sys

sys.path.insert(0, "modules")

# Project modules
from model import Model
import preprocessing as pp
import analysis
import scraper

# System modules
import os.path
import pandas as pd

try:
    if sys.argv[1] == "-o" and sys.argv[3] == "-fs":
        OPTIMIZE, SELECT_FEATURES = sys.argv[2] == "True", sys.argv[4] == "True"
    else:
        print("Invalid arguments.")
        sys.exit()
except IndexError:
    print("Missing arguments.")
    sys.exit()


###########
## DATA BUS
###########


print("Fetching data")

price_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/price_data.csv")
blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_data.csv")
#coindesk_headlines = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/test_scores.csv", sep=",")


################
## PREPROCESSING
################


print("Preprocessing")

data = (
    price_data.pipe(pp.calculate_indicators)
    .pipe(pp.merge_datasets, other_sets=[blockchain_data]) # [blockchain_data, coindesk_headlines]
    .pipe(pp.binarize_labels)
    .pipe(pp.fix_null_vals)
    .pipe(pp.add_lag_variables, lag=3)
    .pipe(pp.power_transform)
)


###########
## ANALYSIS
###########


print("Analyzing features")

#print(data.describe())
analysis.plot_corr_matrix(data)


#################
## FITTING MODELS
#################


print("Fitting models")

log_reg = Model(
    estimator="LogisticRegression",
    features=data,
    balanced=True,
    select_features=SELECT_FEATURES,
    optimize=OPTIMIZE
)
rand_forest = Model(
    estimator="RandomForest",
    features=data,
    balanced=True,
    select_features=SELECT_FEATURES,
    optimize=OPTIMIZE
)
grad_boost = Model(
    estimator="GradientBoosting",
    features=data,
    balanced=True,
    select_features=SELECT_FEATURES,
    optimize=OPTIMIZE
)


#############
## EVALUATION
#############


print("Evaluating")

# Logistic Regression
print("\tLogistic Regression Estimator")
log_reg.plot_cnf_matrix()
log_reg.cross_validate(method="Holdout")
log_reg.cross_validate(
    method="RollingWindow",
    data=data,
    window_size=.9,
    test_size=.1
)

# Random Forest
print("\tRandom Forest Classifier")
rand_forest.plot_cnf_matrix()
rand_forest.cross_validate(method="Holdout")
rand_forest.cross_validate(
    method="RollingWindow",
    window_size=.9,
    test_size=.1
)

# Gradient Boosting
print("\tGradient Boosting Classifier")
grad_boost.plot_cnf_matrix()
grad_boost.cross_validate(method="Holdout")
grad_boost.cross_validate(
    method="RollingWindow",
    window_size=.9,
    test_size=.1
)
