import os 
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.ensemble import RandomForestClassifier
# import word2vec
import pandas as pd
import nltk
import ftfy

print("TRAINING INPUT PATH:", os.path.dirname(os.path.dirname(os.getcwd())) + "/data/btc_training_data.csv")
print("TESTING INPUT PATH: ", os.path.dirname(os.path.dirname(os.getcwd())) + "/data/btc_testing_data.csv")

# Import training and testing data
training_data = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/btc_training_data.csv", sep=",")
testing_data = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/btc_testing_data.csv", sep=",")

print(training_data)

# Clean training data
print("Downloading text data sets...")
nltk.download()
print("Did this crash?")
cleaned_training_headlines = []
cleaned_testing_headlines = []

# Remove stop words
print("Cleaning testing headlines...")
# for index in range(len(training_data[1])):
#     cleaned_training_headlines.append(" ".join(word2vec.review(training_data[index][1], True)))

# print("Cleaning training headlines...")
# for index in range(len(testing_data[1])):
#     cleaned_testing_headlines.append(" ".join(word2vec.review(testing_data[index][1], True)))

# Create bag-of-words model. Dictionary of word frequency in a piece of text. Tokenization
vectorizer = CountVectorizer(analyzer = "word",tokenizer = None, preprocessor = None, stop_words = None, max_features = 5000)
training_data_features = vectorizer.fit_transform(cleaned_training_headlines).toArray()
testing_data_features = vectorizer.fit_transform(cleaned_testing_headlines).toArray()

# Train classifier
print("Training the random forest... This may take a bit...")
# print("Let's go on a magical adventure through the forest...")
forest = RandomForestClassifier(n_estimators = 100)
forest = forest.fit(training_data_features, training_data[1])

# Testing our sentiment analysis
print("Testing prediction algorithm...")
result = forest.predict(testing_data_features)
ouput = pd.DataFrame( data = {"title":testing_data_features[1], "sentiment":result } )
output.to_csv(os.path.join(os.path.dirname(__file__), "/data/bag_of_words_model.csv"))
