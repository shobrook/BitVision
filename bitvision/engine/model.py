#########
# GLOBALS
#########


import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.externals import joblib


# PARENT_DIR = os.path.dirname(os.getcwd())


#########
# HELPERS
#########


######
# MAIN
######


class Model(object):
	def __init__(self, training_data, hyperparameterize=False):
		self.x_train, self.y_train = self.__split(training_data, balanced=True)

		self.scaler = StandardScaler()
		self.scaler.fit(training_data)

		self.model = RandomForestClassifier(n_estimators=500)
		self.model.fit(self.scaler.transform(self.x_train), self.y_train)

		joblib.dump(self.model, "../cache/model.pkl")

	def __split(self, df, balanced):
		pass

	def predict(self, vector):
		return self.model.predict(self.scaler.transform(vector))
