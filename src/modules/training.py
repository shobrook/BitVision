"""
TODO:
	- Handle outliers (either normalize or remove them)
	- Calculate each model's classification accuracy, prevalance, F1 score, TPR, FPR, FNR, TNR, PPV, FDR, FOR, NPV, LR+, LR-, and DOR
	- Define a SVM class
	- Randomize the balanced train/test splitting
	- Create a "models" superclass that LogRegression and RandForest inherit from
	- Create a custom GridSearchCV scoring function
	- Find out why feature scaling causes the balanced data to behave so differently
	- Fix the "Numerical issues were encountered" error thrown during feature scaling
"""

import analysis
import pandas as pd
import matplotlib.pyplot as plt
from sklearn import preprocessing
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, make_scorer

def fix_outliers(dataset):
	print("\tFixing outliers")

	return dataset

def balanced_split(dataset):
	print("\tSplitting data into *balanced* training and test sets")

	groups = {str(label): group for label, group in dataset.groupby("Trend")}

	min_length = min(len(groups["1.0"]), len(groups["-1.0"]))
	groups["1.0"], groups["-1.0"] = groups["1.0"][:min_length], groups["-1.0"][:min_length]

	train_set = pd.concat([groups["1.0"][0:int(.8*min_length)], groups["-1.0"][0:int(.8*min_length)]], axis=0)
	test_set = pd.concat([groups["1.0"][int(.8*min_length):], groups["-1.0"][int(.8*min_length):]], axis=0)

	return (train_set.drop(["Date", "Trend"], axis=1).values, test_set.drop(["Date", "Trend"], axis=1).values, 
		train_set["Trend"].values, test_set["Trend"].values)

def unbalanced_split(dataset):
	print("\tSplitting data into unbalanced training and test sets")

	dataset = dataset.drop("Date", axis=1)
	return train_test_split(dataset.drop("Trend", axis=1).values, dataset["Trend"].values, test_size=.2, random_state=25)

class LogRegression(object):
	def __init__(self, x_train, y_train):
		self.model = self.generate_model(x_train, y_train)

	"""
	def select_features(self):

	def score_function(y_true, y_pred):
	"""

	def generate_model(self, x_train, y_train):
		print("\tFitting a logistic regression model")

		score_function = make_scorer(score_func=accuracy_score, greater_is_better=True)
		grid = {"penalty": ["l1", "l2"],
			"tol": [.00001, .0001, .001, .01, .1],
			"C": [.01, .1, 1.0, 10, 100, 1000],
			"max_iter": [100, 150, 175, 200, 300, 500]
		}

		log_reg = LogisticRegression()
		#optimized_log_reg = GridSearchCV(estimator=log_reg, param_grid=grid, scoring=score_function, n_jobs=4)
		#optimized_log_reg.fit(preprocessing.scale(x_train), y_train)

		#print(optimized_rand_forest.best_params_)

		#return optimized_log_reg.best_estimator_

		log_reg.fit(preprocessing.scale(x_train), y_train)
		return log_reg

	def test(self, x_test, y_test):
		print("\tTesting")

		self.y_test = y_test
		self.y_pred = self.model.predict(preprocessing.scale(x_test))

	def plot_cnf_matrix(self):
		plt.figure()
		analysis.plot_cnf_matrix(self.y_pred, self.y_test)

	def calculate_metrics(self):
		return accuracy_score(self.y_test, self.y_pred)

	def get_feature_importances(self):
		return self.model.feature_importances_

class RandForest(object):
	def __init__(self, x_train, y_train):
		self.model = self.generate_model(x_train, y_train)

	"""
	def select_features(self):

	def score_function(y_true, y_pred):
	"""

	def generate_model(self, x_train, y_train):
		print("\tFitting a random forest classifier")

		score_function = make_scorer(score_func=accuracy_score, greater_is_better=True)
		grid = {"n_estimators": [10, 100, 150, 200, 250, 300, 400, 500, 525, 550, 575, 1000]}

		rand_forest = RandomForestClassifier(n_estimators=1000, max_features=None)
		#optimized_rand_forest = GridSearchCV(estimator=rand_forest, param_grid=grid, scoring=score_function, n_jobs=4)
		#optimized_rand_forest.fit(preprocessing.scale(x_train), y_train)

		#print(optimized_rand_forest.best_params_)

		#return optimized_rand_forest.best_estimator_

		rand_forest.fit(preprocessing.scale(x_train), y_train)
		return rand_forest

	def test(self, x_test, y_test):
		print("\tTesting")

		self.y_test = y_test
		self.y_pred = self.model.predict(preprocessing.scale(x_test))

	def plot_cnf_matrix(self):
		plt.figure()
		analysis.plot_cnf_matrix(self.y_pred, self.y_test)

	def calculate_metrics(self):
		return accuracy_score(self.y_test, self.y_pred)

	def get_feature_importances(self):
		return self.model.feature_importances_