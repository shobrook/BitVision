# Fix outliers, if necessary
# Balance the dataset
# Split dataset into training and test sets
# Normalize both sets
# Implement a feature selection algorithm for each model
# Automate model evaluation and try at least three different algorithms
# Plot confusion matrices for each model
# Calculate each model's accuracy, prevalance, F1 score, TPR, FPR, FNR, TNR, PPV, FDR, FOR, NPV, LR+, LR-, and DOR

import analysis
import matplotlib.pyplot as plt
from sklearn.model_selection import GridSearchCV
from sklearn.linear_model import LogisticRegression

def fix_outliers(dataset):
	"""Detects and transforms (or removes) outliers."""

def balance(dataset):

def split(dataset):
	groups = {str(label): group for label, group in dataset.groupby("Trend")}

	min_length = min(len(groups["1.0"]), len(groups["-1.0"]))
	groups["1.0"], groups["-1.0"] = groups["1.0"][:min_length], groups["-1.0"][:min_length]

	train_set = pd.concat([groups["1.0"][0:int(.8*min_length)], groups["-1.0"][0:int(.8*min_length)]], axis=0)
	test_set = pd.concat([groups["1.0"][int(.8*min_length):], groups["-1.0"][int(.8*min_length):]], axis=0)

	return (train_set, test_set)

class LogisticRegression(object):
	def __init__(self, train_set):
		x_train, y_train = train_set.drop("Trend", axis=1), train_set["Trend"]
		self.model = self.generate_model(x_train, y_train)

	"""
	def select_features(self):
	"""

	def normalize(self, dataset):

	def generate_model(self, x_train, y_train):
		grid = {"penalty": ["l1", "l2"],
			"dual": [True, False],
			"tol": [.00001, .0001, .001, .01, .1],
			"C": [.01, .1, 1.0, 10, 100, 1000],
			"max_iter": [100, 150, 175, 200, 300, 500]
		}

		log_reg = LogisticRegression()
		optimized_log_reg = GridSearchCV(estimator=log_reg, param_grid=grid, scoring=) # Implement a custom scoring function
		optimized_log_reg.fit(x_train, y_train)

		return optimized_log_reg.best_estimator_ # Check if this returns a fitted model

	def test(self, test_set):
		self.y_test = test_set["Trend"]
		self.y_pred = self.model.predict(test_set.drop("Trend", axis=1))

	def plot_cnf_matrix(self):
		plt.figure()
		analysis.plot_cnf_matrix(self.y_pred, self.y_test)

	def calculate_metrics(self):

"""
class RandomForest(object):
	def __init__(train_set, test_set):



from sklearn.feature_selection import RFE
from sklearn import metrics
from sklearn.ensemble import ExtraTreesClassifier

def rank_features(data):
	X = data.drop(["Trend", "Date"], axis=1)
	Y = data["Trend"]
	model = ExtraTreesClassifier()
	model.fit(X, Y)

	return model.feature_importances_

def feature_selection(data):
	X = data.drop(["Trend", "Date"], axis=1)
	Y = data["Trend"]
	model = LogisticRegression()
	rfe = RFE(model, 12)
	rfe = rfe.fit(X, Y)

	return {"Support": rfe.support_, "Ranking": rfe.ranking_}

data = data.drop("Date", axis=1)
x_train, x_test, y_train, y_test = train_test_split(data.drop("Trend", axis=1).values, data["Trend"].values, test_size=.2, random_state=25)

### Training the Model ###

#from pylab import rcParams
#from sklearn import preprocessing
from sklearn.linear_model import LogisticRegression
#from sklearn.pipeline import Pipeline
#from sklearn.base import BaseEstimator, TransformerMixin
#from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.grid_search import GridSearchCV
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix

log_reg = LogisticRegression() # {'penalty': ['l1','l2'], 'C': [0.001,0.01,0.1,1,10,100,1000]}
log_reg.fit(x_train, y_train)

y_pred = log_reg.predict(x_test)

print(accuracy_score(y_test, y_pred))

# Random Forest

rand_forest = RandomForestClassifier(n_estimators=520)
rand_forest.fit(x_train, y_train)

y_pred = rand_forest.predict(x_test)

print(accuracy_score(y_test, y_pred))
"""