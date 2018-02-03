### Setup ###


import sys

sys.path.insert(0, "modules")

import os.path
import json
import csv
import time
import scraper
import analysis
import training
import pandas as pd
import preprocessing
#import sentiment


### Data Bus ###


print("Fetching data...")

price_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/price_data.csv")
blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_data.csv")
coindesk_headlines, bitcoin_news_headlines = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/")
headline


### Preprocessing ###


print("Preprocessing data...")

data = (price_data.pipe(preprocessing.calculate_indicators)
	.pipe(preprocessing.merge_datasets, set_b=blockchain_data)
	.pipe(preprocessing.fix_null_vals)
	.pipe(preprocessing.calculate_labels)
)


### Analysis ###


print("Analyzing features...")

#print(data.describe())
analysis.plot_corr_matrix(data)


### Training ###


print("Fitting models...")

# Generate training and testing data
x_train, x_test, y_train, y_test = (data.pipe(training.fix_outliers).pipe(training.unbalanced_split, test_size=.2))

# Logistic Regression
log_reg = training.Model(estimator="LogisticRegression", x_train=x_train, y_train=y_train)
log_reg.test(x_test, y_test)

# Random Forest
rand_forest = training.Model(estimator="RandomForest", x_train=x_train, y_train=y_train)
rand_forest.test(x_test, y_test)

# Support Vector Classifier
svc = training.Model(estimator="SVC", x_train=x_train, y_train=y_train)
svc.test(x_test, y_test)


### Evaluation ###


print("Evaluating models...")

# Logistic Regression
print("\tLogistic Regression Estimator")
log_reg.plot_cnf_matrix()
print("\t\tCross Validation: ", json.dumps(log_reg.cross_validate(x_train, y_train), indent=25))
print("\t\tEvaluation: ", json.dumps(log_reg.evaluate(), indent=25))

# Random Forest
print("\tRandom Forest Classifier")
rand_forest.plot_cnf_matrix()
print("\t\tCross Validation: ", json.dumps(rand_forest.cross_validate(x_train, y_train), indent=25))
print("\t\tEvaluation: ", json.dumps(rand_forest.evaluate(), indent=25))

# Support Vector Classifier
print("\tSupport Vector Classifier")
svc.plot_cnf_matrix()
print("\t\tCross Validation: ", json.dumps(log_reg.cross_validate(x_train, y_train), indent=25))
print("\t\tEvaluation: ", json.dumps(svc.evaluate(), indent=25))