import analysis
import pandas as pd
from sklearn.svm import SVC
import matplotlib.pyplot as plt
# from sklearn import preprocessing
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, make_scorer


class Model(object):
    def __init__(self, estimator, x_train, y_train):
        if estimator == "LogisticRegression":
            self.model = self.fit_log_reg(x_train, y_train)
        elif estimator == "RandomForest":
            self.model = self.fit_rand_forest(x_train, y_train)
        elif estimator == "SVC":
            self.model = self.fit_svc(x_train, y_train)
        elif estimator == "GBC":
            self.model = self.fit_grad_boost(x_train, y_train)
        else:
            print("\tError: Invalid model type")

    def fit_log_reg(self, x_train, y_train):
        """Trains a Logistic Regression estimator and performs a grid search
           to find optimal hyperparameter values."""
        print("\tFitting a logistic regression estimator")

        self.scaler = StandardScaler()
        self.scaler.fit(x_train)

        score_function = make_scorer(score_func=accuracy_score, greater_is_better=True)
        grid = {"penalty": ["l1", "l2"],
                "tol": [.00001, .0001, .001, .01, .1],
                "C": [.01, .1, 1.0, 10, 100, 1000],
                "max_iter": [100, 150, 175, 200, 300, 500]
                }

        log_reg = LogisticRegression()
        # optimized_log_reg = GridSearchCV(estimator=log_reg, param_grid=grid, scoring=score_function, n_jobs=4)
        # optimized_log_reg.fit(self.scaler.transform(x_train), y_train)

        # return optimized_log_reg.best_estimator_

        log_reg.fit(self.scaler.transform(x_train), y_train)

        return log_reg

    def fit_rand_forest(self, x_train, y_train):
        """Trains a Random Forest classifier and performs a grid search to find
           optimal hyperparameter values."""
        print("\tFitting a random forest classifier")

        self.scaler = StandardScaler()
        self.scaler.fit(x_train)

        # score_function = make_scorer(score_func=accuracy_score, greater_is_better=True)
        # grid = {"n_estimators": [10, 100, 150, 200, 250, 300, 400, 500, 525, 550, 575, 1000]}

        rand_forest = RandomForestClassifier(n_estimators=1000, max_features=None)
        # optimized_rand_forest = GridSearchCV(estimator=rand_forest, param_grid=grid, scoring=score_function, n_jobs=4)
        # optimized_rand_forest.fit(self.scaler.transform(x_train), y_train)

        # return optimized_rand_forest.best_estimator_

        rand_forest.fit(self.scaler.transform(x_train), y_train)

        return rand_forest

    def fit_svc(self, x_train, y_train):
        """Trains a Support Vector Classifier and performs a grid search to find
           optimal hyperparameter values."""
        print("\tFitting a support vector classifier")

        self.scaler = StandardScaler()
        self.scaler.fit(x_train)

        svc = SVC(kernel="rbf")

        svc.fit(self.scaler.transform(x_train), y_train)

        return svc

    def fit_grad_boost(self, x_train, y_train):
        print("\tFitting a gradient boosting classifier")

        self.scaler = StandardScaler()
        self.scaler.fit(x_train)

        gdc = GradientBoostingClassifier(n_estimators=1000)

        gdc.fit(self.scaler.transform(x_train), y_train)

        return gdc

    def test(self, x_test, y_test):
        """Tests the model on the test set."""
        print("\t\tTesting")

        self.y_test, self.y_pred = y_test, self.model.predict(self.scaler.transform(x_test))

    def plot_cnf_matrix(self):
        """Plots a confusion matrix to evaluate the test results."""
        plt.figure()
        analysis.plot_cnf_matrix(self.y_pred, self.y_test)

    def cross_validate(self, x_train, y_train):
        """Computes and displays K-Fold cross-validation with 5 iterations."""
        return analysis.display_scores(cross_val_score(self.model, x_train, y_train, scoring="accuracy", cv=5))

    def evaluate(self):
        """Calculates the model's classification accuracy, sensitivity, precision,
           and specificity."""

        print("\t\t\tAccuracy: ", analysis.accuracy(self.y_pred, self.y_test))
        print("\t\t\tPrecision: ", analysis.precision(self.y_pred, self.y_test))
        print("\t\t\tSpecificity: ", analysis.specificity(self.y_pred, self.y_test))
        print("\t\t\tSensitivity: ", analysis.sensitivity(
            analysis.specificity(self.y_pred, self.y_test)))

    def print_feature_importances(self, data):
        """Returns a list of the most important features."""
        for feat, importance in zip(data.drop(["Date", "Trend"], axis=1).columns, self.model.feature_importances_):
            print("\t\t\t" + feat + ": " + importance)
