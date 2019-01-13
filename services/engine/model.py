#########
# GLOBALS
#########


from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler


######
# MAIN
######


class Model(object):
    def __init__(self, training_data, hyperopt=False):
        self.scaler = StandardScaler()
        self.scaler.fit(training_data.drop("Trend", axis=1))
        self.model = LogisticRegression(penalty="l1", tol=.001, C=1000, max_iter=150)

        normalized_training_data = self.scaler.transform(training_data.drop("Trend", axis=1))
        self.model.fit(normalized_training_data, training_data["Trend"])

    ## Public Methods ##

    def predict(self, vector):
        return self.model.predict(self.scaler.transform(vector.reshape(1, -1)))
