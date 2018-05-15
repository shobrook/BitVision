### Term Project
---

For my term project, I developed and trained three supervised learning algorithms to classify the sentiment of Bitcoin-related news headlines. I did preprocessing of the data with Pandas and Numpy, and tested three models: a Random Forest Classifier, a Gradient Boosting Classifier and a Support Vector Machine. All models were implemented with SciKit learn, in a Python3 environment.

## How to run this program

1. `cd src`
2. `$ python3 main.py`
4. Check out `img/` for confusion matrices and watch the terminal for output.


## What does this code do?

This program generates three models, a Random Forest Classifier, a Gradient Boosting Classifier and a Support Vector Machine, after preprocessing the headline data I'd scraped and cleaned with `filter_headlines.py`, using a regex filtering technique to remove headlines that were unrelated to the bticoin data set I wanted to analyze. Any headline published by Coindesk that didn't contain Bitcoin (as differentiated from Bitcoin Cash) was removed.

To preprocess the data, I remove invalid characters like numbers or symbols. Then I tokenize and stem the words after removing stop words.

To extract features, I POS tag the set and vectorize the POS tags, as well as create 5 feature vectors from a Bag Of Words model to represent each headline. I extract the number of words contained in each headline that was also contained in the "very negative" sentiment set, or the "slightly positive" sentiment set, etc, and used this set to predict the overall sentiment behind the sentence.

I then train many different versions of each model and display the performance statistics for the highest performing model within each category.

Evaluation statistics are printed after every model runs to completion, and the models are saved in the `models` directory.

Confusion matrices are populated in the `img/` directory.
