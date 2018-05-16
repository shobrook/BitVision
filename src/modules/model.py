# Globals #


import os
import analysis
import preprocessing as pp
import matplotlib.pyplot as plt
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.externals import joblib
from sklearn.feature_selection import RFE

PARENT_DIR = os.path.dirname(os.getcwd())


# Main #


class Model(object):
	def __init__(self, estimator, train_set, test_set, select_features=None, optimize=False):
		self.x_train, self.y_train = train_set
		self.x_test, self.y_test = test_set

		self.scaler = StandardScaler()
		self.scaler.fit(self.x_train)

		self.optimize, self.estimator = optimize, estimator

		self.__fit_model()

		self.y_pred = self.model.predict(self.scaler.transform(self.x_test))

	# Private Methods #

	def __fit_log_reg(self):
		print("\tFitting a logistic regression algorithm")

		if self.optimize:
			print("\t\tFinding optimal hyperparameter values")

			grid = {"penalty" : ["l1", "l2"],
					"tol"     : [.00001, .0001, .001, .01, .1],
					"C"       : [.01, .1, 1.0, 10, 100, 1000],
					"max_iter": [100, 150, 175, 200, 300, 500]
					}
			models = []
			for p in grid["penalty"]:
				for t in grid["tol"]:
					for c in grid["C"]:
						for i in grid["max_iter"]:
							log_reg = LogisticRegression(penalty=p, tol=t, C=c, max_iter=i)
							log_reg.fit(self.scaler.transform(self.x_train), self.y_train)

							y_pred = log_reg.predict(self.scaler.transform(self.x_test))

							models.append({"model"          : log_reg,
										   "accuracy"       : analysis.accuracy(y_pred, self.y_test),
										   "hyperparameters": {"penalty": p, "tol": t, "C": c, "max_iter": i}})

			best_model = max(models, key=lambda model: model["accuracy"])

			hyperparam_vals = best_model["hyperparameters"]
			print("\t\t\tPenalization norm: " + hyperparam_vals["penalty"])
			print("\t\t\tTolerance: " + str(hyperparam_vals["tol"]))
			print("\t\t\tRegularization: " + str(hyperparam_vals["C"]))
			print("\t\t\tMax iterations: " + str(hyperparam_vals["max_iter"]))

			return best_model["model"]
		else:
			log_reg = LogisticRegression(penalty="l2", tol=.01, C=10, max_iter=100)
			log_reg.fit(self.scaler.transform(self.x_train), self.y_train)

			return log_reg

	def __fit_rand_forest(self):
		print("\tFitting a random forest algorithm")

		if self.optimize:
			print("\t\tFinding optimal hyperparameter values")

			grid = {"n_estimators": [250, 500, 750, 1000]}
			models = []
			for n in grid["n_estimators"]:
				rand_forest = RandomForestClassifier(n_estimators=n)
				rand_forest.fit(self.scaler.transform(self.x_train), self.y_train)

				y_pred = rand_forest.predict(self.scaler.transform(self.x_test))

				models.append({"model"          : rand_forest, "accuracy": analysis.accuracy(y_pred, self.y_test),
							   "hyperparameters": {"n_estimators": n}})

			best_model = max(models, key=lambda model: model["accuracy"])

			print("\t\t\tNumber of estimators: " + str(best_model["hyperparameters"]["n_estimators"]))

			return best_model["model"]
		else:
			rand_forest = RandomForestClassifier(n_estimators=500)
			rand_forest.fit(self.scaler.transform(self.x_train), self.y_train)

			return rand_forest

	def __fit_grad_boost(self):
		print("\tFitting a gradient boosting machine")

		if self.optimize:
			print("\t\tFinding optimal hyperparameter values")

			grid = {"n_estimators" : [250, 500, 750, 1000],
					"learning_rate": [1, .1, .05, .01],
					"max_depth"    : [3, 8, 12, 15],
					}
			models = []
			for n in grid["n_estimators"]:
				for lr in grid["learning_rate"]:
					for d in grid["max_depth"]:
						grad_boost = GradientBoostingClassifier(n_estimators=n, learning_rate=lr, max_depth=d)
						grad_boost.fit(self.scaler.transform(self.x_train), self.y_train)

						y_pred = grad_boost.predict(self.scaler.transform(self.x_test))

						models.append({"model"          : grad_boost,
									   "accuracy"       : analysis.accuracy(y_pred, self.y_test),
									   "hyperparameters": {"n_estimators": n, "learning_rate": lr, "max_depth": d}})

			best_model = max(models, key=lambda model: model["accuracy"])

			hyperparam_vals = best_model["hyperparameters"]
			print("\t\t\tNumber of estimators: " + str(hyperparam_vals["n_estimators"]))
			print("\t\t\tLearning rate: " + str(hyperparam_vals["learning_rate"]))
			print("\t\t\tMax depth: " + str(hyperparam_vals["max_depth"]))

			return best_model["model"]
		else:
			grad_boost = GradientBoostingClassifier(n_estimators=1000, learning_rate=.01, max_depth=8)
			grad_boost.fit(self.scaler.transform(self.x_train), self.y_train)

			return grad_boost

	def __fit_model(self):
		if self.estimator == "LogisticRegression":
			self.model = self.__fit_log_reg()
			joblib.dump(self.model, PARENT_DIR + "/models/LogisticRegression.pkl")
		elif self.estimator == "RandomForest":
			self.model = self.__fit_rand_forest()
			joblib.dump(self.model, PARENT_DIR + "/models/RandomForest.pkl")
		elif self.estimator == "GradientBoosting":
			self.model = self.__fit_grad_boost()
			joblib.dump(self.model, PARENT_DIR + "/models/GradientBoosting.pkl")
		else:
			print("\tError: Invalid model type")

	def __holdout_test(self):
		"""Calculates the model's classification accuracy, sensitivity, precision, and specificity."""
		print("\t\tHoldout Validation Results:")

		print("\t\t\tAccuracy: ", analysis.accuracy(self.y_pred, self.y_test))
		print("\t\t\tPrecision: ", analysis.precision(self.y_pred, self.y_test))
		print("\t\t\tSpecificity: ", analysis.specificity(self.y_pred, self.y_test))
		print("\t\t\tRecall: ", analysis.recall(self.y_pred, self.y_test))

	def __rolling_window_test(self, data, window_size, test_size, step=1):
		print("\t\tRolling Window Validation Results:")

		# TODO: Hide the STDOUT of pp.split() and __fit_model(), and prevent __fit_model() from saving a .pkl on each run

		windows = [data.loc[idx * step:(idx * step) + round(window_size * len(data))] for idx in
				   range(int((len(data) - round(window_size * len(data))) / step))]
		decoupled_windows = [pp.split(window, test_size=test_size, balanced=False) for window in
							 windows]  # TODO: Do a nonrandom split to respect the temporal order of observations

		results = {"accuracy": [], "precision": [], "specificity": [], "sensitivity": []}
		for feature_set in decoupled_windows:
			self.x_train, self.x_test, self.y_train, self.y_test = feature_set

			self.scaler = StandardScaler()
			self.scaler.fit(self.x_train)

			self.__fit_model()

			self.y_pred = self.model.predict(self.scaler.transform(self.x_test))

			results["accuracy"].append(analysis.accuracy(self.y_pred, self.y_test))
			results["precision"].append(analysis.precision(self.y_pred, self.y_test))
			results["specificity"].append(analysis.specificity(self.y_pred, self.y_test))
			results["recall"].append(analysis.recall(self.y_pred, self.y_test))

		print("\t\t\tAccuracy: ", str(sum(results["accuracy"]) / float(len(results["accuracy"]))))
		print("\t\t\tPrecision: ", str(sum(results["precision"]) / float(len(results["precision"]))))
		print("\t\t\tSpecificity: ", str(sum(results["specificity"]) / float(len(results["specificity"]))))
		print("\t\t\tRecall: ", str(sum(results["recall"]) / float(len(results["recall"]))))

	# Public Methods #

	def plot_cnf_matrix(self):
		"""Plots a confusion matrix to evaluate the test results."""
		plt.figure()
		analysis.plot_cnf_matrix(self.y_pred, self.y_test)

	def cross_validate(self, method, data=None, window_size=.9, test_size=.1, step=1):
		if method == "Holdout":
			self.__holdout_test()
		elif method == "RollingWindow":
			self.__rolling_window_test(data, window_size, test_size, step)
		else:
			print("\t\tError: Invalid cross-validation method")

	"""
	def print_feature_importances(self, data):
		for feat, importance in zip(data.drop(["Date", "Trend"], axis=1).columns, self.model.feature_importances_):
			print("\t\t\t" + feat + ": " + importance)
	"""
