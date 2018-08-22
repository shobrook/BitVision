from engine import Dataset, Fetch, Transformer, Model

def fit_model():
    """
    Pipeline for training the machine learning model.

    @return: Model object fitted with price, blockchain, and headline data
    """

    price_data = Dataset("PRICE_DATA")
    blockchain_data = Dataset("BLOCKCHAIN_DATA")
    coindesk_headlines = Dataset("COINDESK_HEADLINES")
    # tweets = Dataset("TWEETS")

    processed_data = (
        price_data.pipe(Transformer("CALCULATE_INDICATORS"))
                  .pipe(Transformer("MERGE_DATASETS"), other_sets=[
                    blockchain_data,
                    coindesk_headlines.pipe(Transformer("TOKENIZE")) # TODO: Replace this placeholder pipeline with the actual BoWs pipeline
                                      .pipe(Transformer("LEMMATIZE"))
                                      .pipe(Transformer("TAG_POS"))
                                      .pipe(Transformer("VECTORIZE"))
                  ])
                  .pipe(Transformer("FIX_NULL_VALS"))
                  .pipe(Transformer("ADD_LAG_VARS"))
                  .pipe(Transformer("POWER_TRANSFORM"))
                  .pipe(Transformer("BINARIZE_LABELS"))
                  .pipe(Transformer("SELECT_FEATURES"))
    )

    processed_data.drop("Trend", axis=1).to_csv("cache/features.csv", sep=',', index=False) # QUESTION: Is it processed_data.drop("Trend") or processed_data["Trend"]?
    processed_data = processed_data.drop(df.index[0])

    return Model(processed_data, hyperopt=False)

def make_trade(payload, auto=True):
    return
