#########
# GLOBALS
#########


from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
# from sklearn.externals import joblib


######
# MAIN
######


class Model(object):
    def __init__(self, training_data, hyperopt=False):
        self.scaler = StandardScaler()
        self.scaler.fit(training_data.drop("Trend", axis=1))

        self.model = RandomForestClassifier(n_estimators=500)
        self.model.fit(self.scaler.transform(
            training_data.drop("Trend", axis=1)), training_data["Trend"])

    ## Private Methods ##

    def _train(self, x_train, y_train, x_test, y_test):
        if self.hyperopt:
            grid = {"n_estimators": [250, 500, 750, 1000]}
            models = []
            for n in grid["n_estimators"]:
                rand_forest = RandomForestClassifier(n_estimators=n)
                rand_forest.fit(self.scaler.transform(x_train), y_train)

                y_pred = rand_forest.predict(self.scaler.transform(x_test))

                models.append({
                    "model": rand_forest,
                    "accuracy": analysis.accuracy(y_pred, y_test)
                })

            return max(models, key=lambda m: m["accuracy"])["model"]

        rand_forest = RandomForestClassifier(n_estimators=500)
        rand_forest.fit(self.scaler.transform(x_train), y_train)

        return rand_forest

    def _holdout_test(self):
        pass

    # def __rolling_window_test(self, data, window_size, test_size, step=1):
	# 	print("\t\tRolling Window Validation Results:")
    #
	# 	windows = [data.loc[idx * step:(idx * step) + round(window_size * len(data))] for idx in
	# 			   range(int((len(data) - round(window_size * len(data))) / step))]
	# 	decoupled_windows = [pp.split(window, test_size=test_size, balanced=False) for window in
	# 						 windows]  # TODO: Do a nonrandom split to respect the temporal order of observations
    #
	# 	results = {"accuracy": [], "precision": [], "specificity": [], "sensitivity": []}
	# 	for feature_set in decoupled_windows:
	# 		self.x_train, self.x_test, self.y_train, self.y_test = feature_set
    #
	# 		self.scaler = StandardScaler()
	# 		self.scaler.fit(self.x_train)
    #
	# 		self.__fit_model()
    #
	# 		self.y_pred = self.model.predict(self.scaler.transform(self.x_test))
    #
	# 		results["accuracy"].append(analysis.accuracy(self.y_pred, self.y_test))
	# 		results["precision"].append(analysis.precision(self.y_pred, self.y_test))
	# 		results["specificity"].append(analysis.specificity(self.y_pred, self.y_test))
	# 		results["recall"].append(analysis.recall(self.y_pred, self.y_test))
    #
	# 	print("\t\t\tAccuracy: ", str(sum(results["accuracy"]) / float(len(results["accuracy"]))))
	# 	print("\t\t\tPrecision: ", str(sum(results["precision"]) / float(len(results["precision"]))))
	# 	print("\t\t\tSpecificity: ", str(sum(results["specificity"]) / float(len(results["specificity"]))))
	# 	print("\t\t\tRecall: ", str(sum(results["recall"]) / float(len(results["recall"]))))

    ## Public Methods ##

    def predict(self, vector):
        return self.model.predict(self.scaler.transform(vector.reshape(1, -1)))
