# Globals #


import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt
import itertools
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_curve
import os.path

global COUNTER

COUNTER = 0
PARENT_DIR = os.path.dirname(os.getcwd())


# Helpers #


def increment_counter():
	global COUNTER
	COUNTER = COUNTER + 1

# Data descriptor

def sentiment_data_description(df):
	"""
	Print description of headline dataset.
	"""
	print("\n----------------------------------\
	      \nHEADLINE SENTIMENT DATA STATISTICS\
	      \n----------------------------------\n")
	sentiment = df["Sentiment"].tolist()

	very_neg = len([x for x in sentiment if x == -2])
	slight_neg = len([x for x in sentiment if x == -1])
	neutral = len([x for x in sentiment if x == 0])
	slight_pos = len([x for x in sentiment if x == 1])
	very_pos = len([x for x in sentiment if x == 2])
	total = len(sentiment)

	print("\tVERY NEG:  ", very_neg, "({}%)".format(round(very_neg / total * 100, 2)))
	print("\tSLIGHT NEG:", slight_neg, "({}%)".format(round(slight_neg / total * 100, 2)))
	print("\tNEUTRAL:   ", neutral, "({}%)".format(round(neutral / total * 100, 2)))
	print("\tSLIGHT POS:", slight_pos, "({}%)".format(round(slight_pos / total * 100, 2)))
	print("\tVERY POS:  ", very_pos, "({}%)".format(round(very_pos / total * 100, 2)))

	return None


# Main #


def plot_corr_matrix(dataset):
	"""
	Plots a Pearson correlation matrix between features.
	"""
	print("\tGenerating correlation matrix")

	sns.set(style="white")
	matrix = dataset.corr(method="pearson")

	mask = np.zeros_like(matrix, dtype=np.bool)
	mask[np.triu_indices_from(mask)] = True

	plt.subplots(figsize=(7, 7))
	cmap = sns.diverging_palette(220, 10, as_cmap=True)

	sns.heatmap(matrix, mask=mask, cmap=cmap, vmax=.3, center=0, square=True, linewidths=.5, cbar_kws={"shrink": .5})

	plt.savefig(PARENT_DIR + "/img/correlation_matrix.png", bbox_inches='tight')


def plot_cnf_matrix(y_pred, y_test):
	"""
	Plots a confusion matrix.
	"""
	print("\t\tGenerating confusion matrix")

	matrix = confusion_matrix(y_test, y_pred)
	classes = ["0", "1"]

	plt.imshow(matrix, interpolation="nearest", cmap=plt.cm.Blues)
	plt.title("Confusion Matrix")
	plt.colorbar()

	tick_marks = np.arange(len(classes))

	plt.xticks(tick_marks, classes, rotation=45)
	plt.yticks(tick_marks, classes)

	thresh = matrix.max() / 2.0
	for i, j in itertools.product(range(matrix.shape[0]), range(matrix.shape[1])):
		plt.text(j, i, format(matrix[i, j], "d"), horizontalalignment="center",
		         color="white" if matrix[i, j] > thresh else "black")

	plt.tight_layout()
	plt.ylabel("True Label")
	plt.xlabel("Predicted Label")

	filename = ""

	# Save the image in the current directory
	if COUNTER == 0:
		filename = "/img/log_reg_confusion_matrix.png"
	elif COUNTER == 1:
		filename = "/img/rand_forest_confusion_matrix.png"
	else:
		filename = "/img/gbm_confusion_matrix.png"

	plt.savefig(PARENT_DIR + filename, bbox_inches='tight')
	increment_counter()


def accuracy(y_test, y_pred):
	"""
	Returns classification accuracy. Measures correct classification.
	"""
	return accuracy_score(y_test, y_pred)


def precision(y_test, y_pred, weighted_avg=False):
	"""
	Returns positive prediction value. How good is the classifier at identifying
	uptrends. Set weighted_avg to true for sentiment analysis.
	"""
	if weighted_avg:
		return precision_score(y_test, y_pred, average="weighted")
	else:
		return precision_score(y_test, y_pred)


def specificity(y_test, y_pred):
	"""
	Returns the True Negative Rate.
	"""
	matrix = confusion_matrix(y_test, y_pred)
	return matrix[1][1] / (matrix[1][1] + matrix[1][0])


def recall(y_test, y_pred, weighted_avg=False):
	"""
	Returns the True Positive Rate. Set weighted_avg to true for sentiment analysis.
	"""
	if weighted_avg:
		return recall_score(y_test, y_pred, average="weighted")
	else:
		return recall_score(y_test, y_pred)


def f1(y_test, y_pred):
	"""
	Returns the F1 score.
	"""
	return f1_score(y_test, y_pred, average="weighted")


def display_scores(scores):
	"""
	Displays cross-validation scores, the mean, and standard deviation
	"""

	# print("\t\t\tScores: ", list(scores))
	print("\t\t\tMean: ", scores.mean())
	print("\t\t\tStandard Deviation: ", scores.std())
