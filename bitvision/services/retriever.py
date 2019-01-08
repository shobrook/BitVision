#########
# GLOBALS
#########


import json
import random
import requests
import moment
from bs4 import BeautifulSoup
from textblob import TextBlob

# Local
from engine import dataset, transformer

USER_AGENTS = [
    "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; AcooBrowser; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
    "Mozilla/5.0 (Windows; U; MSIE 9.0; Windows NT 9.0; en-US)",
    "Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-CN) AppleWebKit/523.15 (KHTML, like Gecko, Safari/419.3) Arora/0.3 (Change: 287 c9dfb30)",
    "Mozilla/5.0 (X11; U; Linux; en-US) AppleWebKit/527+ (KHTML, like Gecko, Safari/419.3) Arora/0.6",
    "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.2pre) Gecko/20070215 K-Ninja/2.1.1",
    "Mozilla/5.0 (Windows; U; Windows NT 5.1; zh-CN; rv:1.9) Gecko/20080705 Firefox/3.0 Kapiko/3.0",
    "Mozilla/5.0 (X11; Linux i686; U;) Gecko/20070322 Firefox/59",
    "Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Fedora/1.9.0.8-1.fc10 Kazehakase/0.5.6",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/535.20 (KHTML, like Gecko) Chrome/19.0.1036.7 Safari/535.20",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
    "Mozilla/5.0 (Windows NT 5.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36",
]


#########
# HELPERS
#########


def fetch_price_data():
    with open("./store/ticker.json", 'w') as price_data:
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

    with open("./store/graph.json", 'w') as graph_data:
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
    with open("./store/indicators.json", 'w') as indicators_json:
        try:
            price_data = dataset("price_data")
            indicators = transformer("calculate_indicators")(price_data)
            valid_indicators = [
                "MOM (1)",
                "ADX (14)",
                "WILLR",
                "RSI (6)",
                "ATR (14)",
                "OBV",
                "TRIX (20)",
                "EMA (6)"
            ]

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
            for symb in valid_indicators:
                val = round(indicators[symb][0], 2)
                data.append([symb, str(val), get_signal[symb](val)])

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
    with open("./store/blockchain.json", 'w') as blockchain_data_json:
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
    with open("./store/headlines.json", 'w') as headlines_json:
        try:
            html = requests.get("https://www.coindesk.com/", headers={
                "User-Agent": random.choice(USER_AGENTS)
            })
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
    with open("./store/portfolio.json", 'w') as portfolio_json:
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
    with open("./store/transactions.json", 'w') as transactions:
        try:
            transactions.write(json.dumps({
                "error": False,
                "data": [[txn["datetime"], txn["usd"], txn["btc"], txn["type"]] for txn in client.user_transactions()]
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
