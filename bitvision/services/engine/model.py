#########
# GLOBALS
#########


from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


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

    def _random_undersampling(dataset):
    	"""
    	Randomly deleting rows that contain the majority class until the number
    	in the majority class is equal with the number in the minority class.
    	"""

    	minority_set = dataset[dataset.Trend == -1.0]
    	majority_set = dataset[dataset.Trend == 1.0]

    	# If minority set larger than majority set, swap
    	if len(minority_set) > len(majority_set):
    		minority_set, majority_set = majority_set, minority_set

    	# Downsample majority class
    	majority_downsampled = resample(majority_set,
    	                                replace=False,  # sample without replacement
    	                                n_samples=len(minority_set),  # to match minority class
    	                                random_state=123)  # reproducible results

    	# Combine minority class with downsampled majority class
    	return pd.concat([majority_downsampled, minority_set])

    ## Public Methods ##

    def predict(self, vector):
        return self.model.predict(self.scaler.transform(vector.reshape(1, -1)))
