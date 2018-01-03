# Determine the type of distribution for each feature
# Determine the type of noise for each feature (?)
# Identify outliers (anomaly detection)

import seaborn as sns
import numpy as np
import matplotlib.pyplot as plt
import itertools
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix

def plot_corr_matrix(dataset):
	sns.set(style="white")
	matrix = dataset.corr(method="pearson")

	mask = np.zeros_like(matrix, dtype=np.bool)
	mask[np.triu_indices_from(mask)] = True

	fig, ax = plt.subplots(figsize=(7, 7))
	cmap = sns.diverging_palette(220, 10, as_cmap=True)

	sns.heatmap(matrix, mask=mask, cmap=cmap, vmax=.3, center=0,
	            square=True, linewidths=.5, cbar_kws={"shrink": .5})

	plt.show()

def plot_cnf_matrix(y_pred, y_test):
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

	plt.show()


# Calculate each model's accuracy, prevalance, F1 score, TPR, FPR, FNR, TNR, PPV, FDR, FOR, NPV, LR+, LR-, and DOR