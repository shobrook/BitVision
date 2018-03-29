# Globals #


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

if sys.argv[1] == "-o" and sys.argv[3] == "-fs":
    OPTIMIZE, SELECT_FEATURES = sys.argv[2] == "True", sys.argv[4] == "True"
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

data = (
    price_data.pipe(pp.calculate_indicators)
    .pipe(pp.merge_datasets, other_sets=[blockchain_data]) # [blockchain_data, coindesk_headlines]
    .pipe(pp.binarize_labels)
    .pipe(pp.fix_null_vals)
    .pipe(pp.add_lag_variables, lag=3)
    .pipe(pp.power_transform)
    .pipe(pp.select_features, method="RecursiveFE", skip=SELECT_FEATURES)
    )
x_train, x_test, y_train, y_test = pp.split(data, test_size=.2, balanced=True)


# Exploratory Analysis #


#print("Analyzing features")

#print(data.describe())
#analysis.plot_corr_matrix(data)


# Fitting Models #


print("Fitting models")

log_reg = Model(
    estimator="LogisticRegression",
    train_set=(x_train, y_train),
    test_set=(x_test, y_test),
    optimize=OPTIMIZE
    )
rand_forest = Model(
    estimator="RandomForest",
    train_set=(x_train, y_train),
    test_set=(x_test, y_test),
    optimize=OPTIMIZE
    )
grad_boost = Model(
    estimator="GradientBoosting",
    train_set=(x_train, y_train),
    test_set=(x_test, y_test),
    optimize=OPTIMIZE
    )


# Evaluation #


print("Evaluating")

# Logistic Regression
print("\tLogistic Regression Estimator")
log_reg.plot_cnf_matrix()
log_reg.cross_validate(method="holdout")
log_reg.cross_validate(
    method="RollingWindow",
    data=data,
    window_size=.9,
    test_size=.1
    )

# Random Forest
print("\tRandom Forest Classifier")
rand_forest.plot_cnf_matrix()
rand_forest.cross_validate(method="holdout")
rand_forest.cross_validate(
    method="RollingWindow",
    data=data,
    window_size=.9,
    test_size=.1
    )

# Gradient Boosting
print("\tGradient Boosting Classifier")
grad_boost.plot_cnf_matrix()
grad_boost.cross_validate(method="holdout")
grad_boost.cross_validate(
    method="RollingWindow",
    data=data,
    window_size=.9,
    test_size=.1
    )
