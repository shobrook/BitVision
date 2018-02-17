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
import preprocessing as ppc


### Data Bus ###


print("Fetching data")

price_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/price_data.csv")
blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_data.csv")


### Preprocessing ###


print("Preprocessing")

data = (price_data.pipe(ppc.calculate_indicators)
	.pipe(ppc.merge_datasets, set_b=blockchain_data)
	.pipe(ppc.fix_null_vals)
	.pipe(ppc.calculate_labels)
)

"""
x_train, x_test, y_train, y_test = (price_data.pipe(ppc.calculate_indicators)
	.pipe(ppc.merge_datasets, set_b=blockchain_data, set_c=(coindesk_headlines.pipe(scraper.get_popularity)
		.pipe(ppc.calculate_sentiment)))
	.pipe(ppc.fix_null_vals)
	.pipe(ppc.calculate_labels)
	.pipe(ppc.fix_outliers)
	.pipe(ppc.unbalanced_split, test_size=.2)
)
"""


### Analysis ###


#print("Analyzing features")

#print(data.describe())
#analysis.plot_corr_matrix(data)


### Training and Testing ###


print("Fitting models")

# Generate training and testing data
x_train, x_test, y_train, y_test = (data.pipe(ppc.fix_outliers).pipe(ppc.unbalanced_split, test_size=.2))

# Logistic Regression
log_reg = training.Model(estimator="LogisticRegression", x_train=x_train, y_train=y_train)
log_reg.test(x_test, y_test)

# Random Forest
rand_forest = training.Model(estimator="RandomForest", x_train=x_train, y_train=y_train)
rand_forest.test(x_test, y_test)

"""
# Support Vector Machine
svc = training.Model(estimator="SVC", x_train=x_train, y_train=y_train)
svc.test(x_test, y_test)
"""

# Gradient Boosting Machine
gbc = training.Model(estimator="GBC", x_train=x_train, y_train=y_train)
gbc.test(x_test, y_test)


### Evaluation ###


print("Evaluating")

# Logistic Regression
print("\tLogistic Regression Estimator")
log_reg.plot_cnf_matrix()
print("\t\tCross Validation Results:")
log_reg.cross_validate(x_train, y_train)
print("\t\tTest Results:")
log_reg.evaluate()

# Random Forest
print("\tRandom Forest Classifier")
rand_forest.plot_cnf_matrix()
print("\t\tCross Validation Results:")
rand_forest.cross_validate(x_train, y_train)
print("\t\tTest Results:")
rand_forest.evaluate()
#rand_forest.print_feature_importances(data)

"""
# Support Vector Classifier
print("\tSupport Vector Classifier")
svc.plot_cnf_matrix()
print("\t\tCross Validation Results:")
log_reg.cross_validate(x_train, y_train)
print("\t\tTest Results:")
svc.evaluate()
"""

# Gradient Boosting
print("\tGradient Boosting Classifier")
gbc.plot_cnf_matrix()
print("\t\tCross Validation Results:")
gbc.cross_validate(x_train, y_train)
print("\t\tTest Results:")
gbc.evaluate()