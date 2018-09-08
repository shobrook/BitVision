#########
# GLOBALS
#########


import sys
from engine import dataset, transformer, Model
from bitstamp import Trading


######
# MAIN
######


def train_and_predict():
    price_data = dataset("price_data")
    blockchain_data = dataset("blockchain_data")
    #coindesk_headlines = dataset("coindesk_headlines")
    #tweets = dataset("tweets")

    processed_data = (
        price_data.pipe(transformer("calculate_indicators"))
                  .pipe(transformer("merge_datasets"), other_sets=[blockchain_data])
                  .pipe(transformer("fix_null_vals"))
                  .pipe(transformer("add_lag_vars"))
                  .pipe(transformer("power_transform"))
                  .pipe(transformer("binarize_labels"))
    ).drop("Date", axis=1)

    feature_vector = processed_data.drop("Trend", axis=1).iloc[0]
    model = Model(processed_data.drop(processed_data.index[0]), hyperopt=False)

    return model.predict(feature_vector.values)[0]


def make_trade(client, payload):
    amount = int(payload["amount"])
    response = client.buy_instant_order(
        amount) if payload["type"] == "BUY" else client.sell_instant_order(amount)

    with open("../cache/data/trading_log.json") as old_trading_log:
        new_log = {
            "trades": [{
                "id": response["id"],
                "datetime": response["datetime"],
                "type": "SELL" if response["type"] else "BUY",
                "amount": response["amount"]
            }] + json.load(old_trading_log)["trades"]
        }
    with open("../cache/data/trading_log.json", 'w') as trading_log:
        trading_log.write(json.dumps(new_log, indent=2))
