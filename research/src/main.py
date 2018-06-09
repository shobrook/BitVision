# Globals #

import os.path
import sys
import pandas as pd
from pprint import pprint

sys.path.insert(0, "modules")
# Project modules
from model import Model
from sentiment_model import SentimentModel
import preprocessing as pp
import analysis
import scraper

# Command line argument

try:
    if sys.argv[1] == "-o":
        OPTIMIZE = sys.argv[2] == "True"
    else:
        print("Invalid arguments.")
        sys.exit()
except IndexError:
    print("No arguments.")
    pass


# Data Bus #

def main():

    print("Fetching data")

    price_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/price_data.csv")
    blockchain_data = scraper.fetch_data(os.path.dirname(os.getcwd()) + "/data/blockchain_data.csv")
    coindesk_headlines = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/scored_headlines_sentiment.csv", usecols=["Headline", "Sentiment"], sep=",")

    # Preprocessing #

    ####
    ## START Sentiment Analysis Block
    ####

    print("Sentiment Analysis")
    coindesk_headlines, stemmed = pp.sentiment_preprocessing(coindesk_headlines)

    # Create bag of words model.
    coindesk_headlines = pp.make_bag_of_words(coindesk_headlines, stemmed)

    x_train, x_test, y_train, y_test = pp.headlines_balanced_split(coindesk_headlines, test_size=.2)

    print("\nFitting sentiment models...\n")

    rand_forest = SentimentModel(
        estimator="RandomForest",
        train_set=(x_train, y_train),
        test_set=(x_test, y_test)
    )

    grad_boost = SentimentModel(
        estimator="GradientBoosting",
        train_set=(x_train, y_train),
        test_set=(x_test, y_test)
    )

    support_vec = SentimentModel(
        estimator="SupportVectorClassifier",
        train_set=(x_train, y_train),
        test_set=(x_test, y_test)
    )

    # Evaluation #

    print("\nEvaluating sentiment models...\n")

    conf_matrix_counter = 0

    # Random Forest Classifier
    print("\tRandom Forest Classifier")
    analysis.plot_cnf_matrix(rand_forest.y_pred, rand_forest.y_test)
    rand_forest.cross_validate(method="Holdout")

    # Gradient Boosting Classifier
    print("\tGradient Boosting Classifier")
    analysis.plot_cnf_matrix(grad_boost.y_pred, grad_boost.y_test)
    grad_boost.cross_validate(method="Holdout")

    # Support Vector Classifier
    print("\tSupport Vector Classifier")
    analysis.plot_cnf_matrix(support_vec.y_pred, support_vec.y_test)
    support_vec.cross_validate(method="Holdout")

    ####
    ## END Sentiment Analysis Block
    ####

    print("Preprocessing")

    data = (
        price_data.pipe(pp.calculate_indicators)
        .pipe(pp.merge_datasets, other_sets=[blockchain_data]) # [blockchain_data, coindesk_headlines]
        .pipe(pp.binarize_labels)
        .pipe(pp.fix_null_vals)
        .pipe(pp.add_lag_variables, lag=3)
        .pipe(pp.power_transform)
        )
    x_train, x_test, y_train, y_test = pp.split(data, test_size=.2, balanced=True)


    # Exploratory Analysis #

    print("Analyzing features")

    #print(data.describe())
    analysis.plot_corr_matrix(data)


    # Fitting Models #


    print("Fitting models")

    log_reg = Model(
        estimator="LogisticRegression",
        train_set=(x_train, y_train),
        test_set=(x_test, y_test),
        select_features="RecursiveFE",
        optimize=OPTIMIZE
        )
    rand_forest = Model(
        estimator="RandomForest",
        train_set=(x_train, y_train),
        test_set=(x_test, y_test),
        select_features="RecursiveFE",
        optimize=OPTIMIZE
        )
    grad_boost = Model(
        estimator="GradientBoosting",
        train_set=(x_train, y_train),
        test_set=(x_test, y_test),
        select_features="RecursiveFE",
        optimize=OPTIMIZE
        )


    # Evaluation #


    print("Evaluating")

    # Logistic Regression
    print("\tLogistic Regression Estimator")
    log_reg.plot_cnf_matrix()
    log_reg.cross_validate(method="Holdout")
    log_reg.cross_validate(
        method="RollingWindow",
        data=data,
        window_size=.9,
        test_size=.1
        )

    # Random Forest
    print("\tRandom Forest Classifier")
    rand_forest.plot_cnf_matrix()
    rand_forest.cross_validate(method="holdout")
    rand_forest.cross_validate(
        method="RollingWindow",
        data=data,
        window_size=.9,
        test_size=.1
        )

    # Gradient Boosting
    print("\tGradient Boosting Classifier")
    grad_boost.plot_cnf_matrix()
    grad_boost.cross_validate(method="holdout")
    grad_boost.cross_validate(
        method="RollingWindow",
        data=data,
        window_size=.9,
        test_size=.1
        )

if __name__ == '__main__':
    main()
