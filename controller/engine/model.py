#########
# GLOBALS
#########


from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
#from sklearn.externals import joblib


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

    def predict(self, vector):
        return self.model.predict(self.scaler.transform(vector.reshape(1, -1)))
