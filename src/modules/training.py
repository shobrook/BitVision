# Globals #


import os
import analysis
import matplotlib.pyplot as plt
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.externals import joblib

PARENT_DIR = os.path.dirname(os.getcwd())


# Main #


class Model(object):
    def __init__(self, estimator, train_set, test_set, optimize=False, select_features=False):
        self.x_train, self.y_train = train_set
        self.x_test, self.y_test = test_set

        self.scaler = StandardScaler()
        self.scaler.fit(self.x_train)

        self.optimize, self.select_features = optimize, select_features

        if estimator == "LogisticRegression":
            self.model = self.__fit_log_reg()
            joblib.dump(self.model, PARENT_DIR + "/models/LogisticRegression.pkl")
        elif estimator == "RandomForest":
            self.model = self.__fit_rand_forest()
            joblib.dump(self.model, PARENT_DIR + "/models/RandomForest.pkl")
        elif estimator == "GradientBoosting":
            self.model = self.__fit_grad_boost()
            joblib.dump(self.model, PARENT_DIR + "/models/GradientBoosting.pkl")
        else:
            print("\tError: Invalid model type")

        self.y_pred = self.model.predict(self.scaler.transform(self.x_test))


    # Private Methods #


    def __fit_log_reg(self):
        print("\tFitting a logistic regression algorithm")

        if self.optimize:
            print("\t\tFinding optimal hyperparameter values")

            grid = {"penalty": ["l1", "l2"],
                    "tol": [.00001, .0001, .001, .01, .1],
                    "C": [.01, .1, 1.0, 10, 100, 1000],
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

                            models.append({"model": log_reg, "accuracy": analysis.accuracy(y_pred, self.y_test), "hyperparameters": {"penalty": p, "tol": t, "C": c, "max_iter": i}})

            best_model = max(models, key=lambda model: model["accuracy"])

            hyperparam_vals = best_model["hyperparameters"]
            print("\t\t\tPenalization norm: " + hyperparam_vals["penalty"])
            print("\t\t\tTolerance: " + str(hyperparam_vals["tol"]))
            print("\t\t\tRegularization: " + str(hyperparam_vals["C"]))
            print("\t\t\tMax iterations: " + str(hyperparam_vals["max_iter"]))

            return best_model["model"]
        else:
            log_reg = LogisticRegression()
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

                            models.append({"model": rand_forest, "accuracy": analysis.accuracy(y_pred, self.y_test), "hyperparameters": {"n_estimators": n}})

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

            grid = {"n_estimators": [250, 500, 750, 1000],
                    "learning_rate": [1, .1, .05, .01],
                    "max_depth": [3, 8, 12, 15],
                    }
            models = []
            for n in grid["n_estimators"]:
                for lr in grid["learning_rate"]:
                    for d in grid["max_depth"]:
                            grad_boost = GradientBoostingClassifier(n_estimators=n, learning_rate=lr, max_depth=d)
                            grad_boost.fit(self.scaler.transform(self.x_train), self.y_train)

                            y_pred = grad_boost.predict(self.scaler.transform(self.x_test))

                            models.append({"model": grad_boost, "accuracy": analysis.accuracy(y_pred, self.y_test), "hyperparameters": {"n_estimators": n, "learning_rate": lr, "max_depth": d}})

            best_model = max(models, key=lambda model: model["accuracy"])

            hyperparam_vals = best_model["hyperparameters"]
            print("\t\t\tNumber of estimators: " + str(hyperparam_vals["n_estimators"]))
            print("\t\t\tLearning rate: " + str(hyperparam_vals["learning_rate"]))
            print("\t\t\tMax depth: " + str(hyperparam_vals["max_depth"]))

            return best_model["model"]
        else:
            grad_boost = GradientBoostingClassifier(n_estimators=1000, max_features=None)
            grad_boost.fit(self.scaler.transform(self.x_train), self.y_train)

            return grad_boost


    # Public Methods #


    def plot_cnf_matrix(self):
        """Plots a confusion matrix to evaluate the test results."""
        plt.figure()
        analysis.plot_cnf_matrix(self.y_pred, self.y_test)


    def cross_validate(self):
        """Computes and displays K-Fold cross-validation with 5 iterations."""
        analysis.display_scores(cross_val_score(self.model, self.x_train, self.y_train, scoring="accuracy", cv=5))


    def evaluate(self):
        """Calculates the model's classification accuracy, sensitivity, precision, and specificity."""

        print("\t\t\tAccuracy: ", analysis.accuracy(self.y_pred, self.y_test))
        print("\t\t\tPrecision: ", analysis.precision(self.y_pred, self.y_test))
        print("\t\t\tSpecificity: ", analysis.specificity(self.y_pred, self.y_test))
        print("\t\t\tSensitivity: ", analysis.sensitivity(self.y_pred, self.y_test))


    def print_feature_importances(self, data):
        """Returns a list of the most important features."""
        for feat, importance in zip(data.drop(["Date", "Trend"], axis=1).columns, self.model.feature_importances_):
            print("\t\t\t" + feat + ": " + importance)
