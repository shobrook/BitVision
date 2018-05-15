# Globals #


import os.path
from sklearn.metrics import confusion_matrix
import numpy as np
import matplotlib.pyplot as plt
import itertools

global CONF_MATRIX_COUNTER

CONF_MATRIX_COUNTER = 0
PARENT_DIR = os.path.dirname(os.getcwd())


# Main #

# def test_classifier(x_train, y_train, x_test, y_test, classifier):
#     print("\n------------------------------------------")
#     print("CLASSIFIER: " + str(type(classifier).__name__)
#     label_list = sorted(list(set(y_train)))
#     model = classifier.fit(x_train, y_train)
#     predictions = model.predict(x_test)
# 	accuracy = accuracy_score(y_test, predictions)
#     precision = precision_score(y_test, predictions, average=None, pos_label=None, labels=label_list)
#     recall = recall_score(y_test, predictions, average=None, pos_label=None, labels=label_list)
# 	f1 = f1_score(y_test, predictions, average=None, pos_label=None, labels=label_list)
#
#     print("---------------- Results --------------------")
#     print("            Negative     Neutral     Positive")
# 	print("Accuracy " + str(accuracy))
# 	print("F1       " + str(f1))
#     print("Precision" + str(precision))
#     print("Recall   " + str(recall))
#     print("\n-------------------------------------------")
#     return precision, recall, accuracy, f1

def increment_counter():
	global CONF_MATRIX_COUNTER
	CONF_MATRIX_COUNTER += 1


def plot_cnf_matrix(y_pred, y_test):
	# Plots a confusion matrix.
	print("\t\tGenerating confusion matrix")

	global CONF_MATRIX_COUNTER

	matrix = confusion_matrix(y_test, y_pred)
	classes = ["-2", "-1", "0", "1", "2"]

	plt.imshow(matrix, interpolation="nearest", cmap=plt.cm.Blues)
	plt.title("Confusion Matrix")
	plt.colorbar()

	tick_marks = np.arange(len(classes))

	plt.xticks(tick_marks, classes, rotation=45)
	plt.yticks(tick_marks, classes)

	thresh = matrix.max() / 2.0
	for i, j in itertools.product(range(matrix.shape[0]), range(matrix.shape[1])):
		plt.text(j, i, format(matrix[i, j], "d"), horizontalalignment="center", color="white" if matrix[i, j] > thresh else "black")

	plt.tight_layout()
	plt.ylabel("True Label")
	plt.xlabel("Predicted Label")

	filename = ""

	# Save the image in the current directory
	if CONF_MATRIX_COUNTER == 0:
		filename = "/img/rand_forest_confusion_matrix.png"
		increment_counter()
	elif CONF_MATRIX_COUNTER == 1:
		filename = "/img/gradient_boosting_confusion_matrix.png"
		increment_counter()
	else:
		filename = "/img/support_vector_confusion_matrix.png"

	plt.savefig(PARENT_DIR + filename, bbox_inches='tight')


def display_scores(scores):
	"""Displays cross-validation scores, the mean, and standard deviation"""

	# print("\t\t\tScores: ", list(scores))
	print("\t\t\tMean: ", scores.mean())
	print("\t\t\tStandard Deviation: ", scores.std())
