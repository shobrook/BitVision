from .bitstamp_client import Trading
from engine import Dataset, Fetch, Transformer, Model


def fit_model():
    """
    Pipeline for training the machine learning model.

    @return: Model object fitted with price, blockchain, and headline data
    """

    price_data = Dataset("PRICE_DATA")
    blockchain_data = Dataset("BLOCKCHAIN_DATA")
    coindesk_headlines = Dataset("COINDESK_HEADLINES")
    #tweets = Dataset("TWEETS")

    processed_data = (
        price_data.pipe(Transformer("CALCULATE_INDICATORS"))
                  .pipe(Transformer("MERGE_DATASETS"), other_sets=[
                      blockchain_data,
                      # TODO: Replace this placeholder pipeline with the actual BoWs pipeline
                      coindesk_headlines.pipe(Transformer("TOKENIZE"))
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

    # QUESTION: Is it processed_data.drop("Trend") or processed_data["Trend"]?
    processed_data.drop("Trend", axis=1).to_csv(
        "cache/features.csv", sep=',', index=False)
    processed_data = processed_data.drop(df.index[0])

    return Model(processed_data, hyperopt=False)


def make_trade(payload):
    # TODO: Pull credentials from dotfile
    trading_client = Trading(
        username="test",
        key="test",
        secret="test"
    )

    amount = int(payload["amount"])
    if payload["type"] == "BUY":
        response = trading_client.buy_instant_order(amount)
    else:
        response = trading_client.sell_instant_order(amount)

    with open("../cache/data/trading_log.json") as old_trading_log:
        new_log = {
            "fetching": False,
            "trades": [{
                "id": response["id"],
                "datetime": response["datetime"],
                "type": "SELL" if response["type"] else "BUY",
                "amount": response["amount"]
            }] + json.load(old_trading_log)["trades"]
        }
    with open("../cache/data/trading_log.json", 'w') as trading_log:
        trading_log.write(json.dumps(new_log, indent=2))

    return True
