#########
# GLOBALS
#########


import os
import json
import requests
import moment
from bs4 import BeautifulSoup
from textblob import TextBlob

# Local
from engine import dataset, transformer

DIR_PATH = os.path.dirname(os.path.abspath(__file__))


#########
# HELPERS
#########


def fetch_price_data():
    with open(os.path.join(DIR_PATH, "../store/ticker.json"), 'w') as price_data:
        try:
            response = requests.get("https://www.bitstamp.net/api/ticker/").json()

            price_data.write(json.dumps({
                "error": False,
                "data": {
                    "last": round(float(response["last"]), 2),
                    "high": round(float(response["high"]), 2),
                    "low": round(float(response["low"]), 2),
                    "open": round(float(response["open"]), 2),
                    "volume": round(float(response["volume"]), 2)
                }
            }, indent=2))
        except:
            price_data.write(json.dumps({
                "error": True,
                "data": json.loads(price_data)["data"]
            }))

    with open(os.path.join(DIR_PATH, "../store/graph.json"), 'w') as graph_data:
        try:
            data = []
            for index, row in dataset("price_data").iterrows():
                data.append({
                    "date": moment.date(row["Date"]).format("MM/DD/YY"),
                    "price": row["Close"],
                    "volume": row["Volume (BTC)"]
                })

            graph_data.write(json.dumps({
                "error": False,
                "data": data
            }, indent=2))
        except:
            graph_data.write(json.dumps({
                "error": True,
                "data": json.loads(graph_data)["data"]
            }))

def fetch_tech_indicators():
    with open(os.path.join(DIR_PATH, "../store/indicators.json"), 'w') as indicators_json:
        try:
            price_data = dataset("price_data")
            indicators = transformer("calculate_indicators")(price_data)
            get_signal = {
                "MOM (1)": lambda v: "BUY" if v >= 0 else "SELL",
                "ADX (14)": lambda v: "BUY" if v >= 25 else "SELL",  # Not sure about this
                "WILLR": lambda v: "SELL" if v <= -50 else "BUY",
                "RSI (6)": lambda v: "SELL" if v >= 50 else "BUY",
                "ATR (14)": lambda v: "N/A",
                "OBV": lambda v: "N/A",
                "TRIX (20)": lambda v: "N/A",
                "EMA (6)": lambda v: "N/A"
            }

            data = []
            for indicator, signal in get_signal.items():
                val = round(indicators[indicator][0], 2)
                data.append([indicator, str(val), signal(val)])

            indicators_json.write(json.dumps({
                "error": False,
                "data": list(sorted(data, key=lambda i: len(i[0])))
            }, indent=2))
        except:
            indicators_json.write(json.dumps({
                "error": True,
                "data": []
            }, indent=2))

def fetch_blockchain_data():
    with open(os.path.join(DIR_PATH, "../store/blockchain.json"), 'w') as blockchain_data_json:
        try:
            blockchain_data = dataset("blockchain_data")

            data = [
                ["Confirmation Time", str(
                    round(blockchain_data["Conf. Time"][0], 2))],
                ["Block Size", str(round(blockchain_data["Block Size"][0], 2))],
                ["Transaction Cost", str(
                    round(blockchain_data["TXN Cost"][0], 2))],
                ["Difficulty", str(round(blockchain_data["Difficulty"][0], 2))],
                ["Transactions per Day", str(round(
                    blockchain_data["TXNs per Day"][0], 2))],
                ["Hash Rate (GH/s)",
                 str(round(blockchain_data["Hash Rate (GH/s)"][0], 2))],
                ["Market Capitalization", str(round(
                    blockchain_data["Market Cap"][0], 2))],
                ["Miners Revenue", str(
                    round(blockchain_data["Miners Revenue"][0], 2))],
                ["Transactions per Block", str(round(
                    blockchain_data["TXNs per Block"][0], 2))],
                ["Unique Addresses", str(round(
                    blockchain_data["Unique Addresses"][0], 2))],
                ["Total Bitcoin", str(
                    round(blockchain_data["Total BTC"][0], 2))],
                ["Transaction Fees", str(
                    round(blockchain_data["TXN Fees"][0], 2))]
            ]

            blockchain_data_json.write(json.dumps({
                "error": False,
                "data": list(sorted(data, key=lambda i: len(i[0])))
            }, indent=2))
        except:
            blockchain_data_json.write(json.dumps({
                "error": True,
                "data": []
            }, indent=2))

def fetch_coindesk_stats():
    with open(os.path.join(DIR_PATH, "../store/headlines.json"), 'w') as headlines_json:
        try:
            html = requests.get("https://www.coindesk.com/")
            soup = BeautifulSoup(html.text, "html.parser")

            top_container = soup.find('a', class_="top-article")
            featured_containers = soup.find_all('a', class_="feature")
            other_containers = soup.find_all('a', class_="stream-article")

            headlines = []
            for article in [top_container] + featured_containers + other_containers:
                date_container = article.find("time")["datetime"]
                headline_container = article.find("h3") if article.find("h3") else article.find("h1")

                date_published = moment.date(date_container).format("M-D")
                headline = headline_container.get_text().strip()

                headlines.append((headline, date_published, article["href"]))

            ordered_headlines = sorted(headlines, key=lambda h: h[1], reverse=True)
            processed_headlines = []
            for headline in ordered_headlines:
                headline_str = headline[0].split('\n')[0]
                date_published = headline[1]
                sentiment = TextBlob(headline_str).sentiment.polarity

                if sentiment > 0:
                    sentiment = "POS"
                elif int(sentiment) == 0:
                    sentiment = "NEUT"
                else:
                    sentiment = "NEG"

                processed_headlines += [[
                    date_published,
                    headline_str,
                    sentiment,
                    headline[2]
                ]]

            headlines_json.write(json.dumps({
                "error": False,
                "data": processed_headlines
            }, indent=2))
        except:
            headlines_json.write(json.dumps({
                "error": True,
                "data": []
            }, indent=2))

def fetch_portfolio_stats(client):
    with open(os.path.join(DIR_PATH, "../store/portfolio.json"), 'w') as portfolio_json:
        default_data = {
            "account_balance": "$0.00",
            "returns": "0.00%",
            "net_profit": "$0.00",
            "sharpe_ratio": "0.00",
            "buy_accuracy": "0.00%",
            "sell_accuracy": "0.00%",
            "total_trades": "0"
        }

        try:
            portfolio_json.write(json.dumps({
                "error": False,
                "data": {**default_data, **{
                    "account_balance": ''.join(['$', str(client.account_balance()["usd_available"])])
                }}
            }, indent=2))
        except:
            portfolio_json.write(json.dumps({
                "error": True,
                "data": default_data
            }))

def fetch_transaction_data(client):
    with open(os.path.join(DIR_PATH, "../store/transactions.json"), 'w') as transactions:
        try:
            transactions.write(json.dumps({
                "error": False,
                "data": [[txn["datetime"], txn["btc"], txn["type"]] for txn in client.user_transactions()]
            }, indent=2))
        except:
            transactions.write(json.dumps({
                "error": True,
                "data": []
            }, indent=2))


######
# MAIN
######


def retrieve(names, client=None):
    for name in names:  # TODO: Parallelize
        if name == "price_data":
            fetch_price_data()
        elif name == "tech_indicators":
            fetch_tech_indicators()
        elif name == "blockchain_data":
            fetch_blockchain_data()
        elif name == "coindesk_headlines":
            fetch_coindesk_stats()
        elif name == "portfolio_stats":
            fetch_portfolio_stats(client)
        elif name == "transaction_log":
            fetch_transaction_data(client)
