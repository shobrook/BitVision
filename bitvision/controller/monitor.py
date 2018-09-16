#########
# GLOBALS
#########

import re
import sys
import json
import random
import requests
import moment
import pandas as pd
from bs4 import BeautifulSoup
from typing import Dict
from textblob import TextBlob

from engine import dataset
from engine import transformer
from bitstamp import Trading

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
    "Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)",
    "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0)",
    "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (Windows NT 6.2; WOW64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)",
    "Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
    "Mozilla/5.0 (Windows NT 6.1; Win64; x64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
]


#########
# HELPERS
#########


def fetch_price_data():
    with open("../cache/data/ticker.json", 'w') as price_data:
        try:
            response = requests.get(
                "https://www.bitstamp.net/api/ticker/").json()

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

    with open("../cache/data/graph.json", 'w') as graph_data:
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
    # TODO: Create a mapping between indicator values and signals

    with open("../cache/data/indicators.json", 'w') as indicators_json:
        try:
            indicators = transformer("calculate_indicators")(
                dataset("price_data"))

            # "MACD": {}, # MACD, MACD (Signal), MACD (Historical)
            # "MOM (1)": {"value": indicators["MOM (1)"][0], "signal": ""},
            # "ADX (20)": {"value": indicators["ADX (20)"][0], "signal": ""},
            # "RSI (12)": {"value": indicators["RSI (12)"][0], "signal": ""},
            # "ATR (14)": {"value": indicators["ATR (14)"][0], "signal": ""},
            # "OBV": {"value": indicators["OBV"][0], "signal": ""},
            # "TRIX (20)": {"value": indicators["TRIX (20)"][0], "signal": ""},
            # "EMA (6)": {"value": indicators["EMA (6)"][0], "signal": "NONE"},

            data = [
                ["MOM (3-period)",
                 str(round(indicators["MOM (1)"][0], 2)), "SELL"],
                ["ADX (14-period)",
                 str(round(indicators["ADX (14)"][0], 2)), "SELL"],
                ["WILLR", str(round(indicators["WILLR"][0], 2)), "SELL"],
                ["RSI (6-period)",
                 str(round(indicators["RSI (6)"][0], 2)), "SELL"],
                ["ATR (14-period)",
                 str(round(indicators["ATR (14)"][0], 2)), "SELL"],
                ["OBV",
                    str(round(indicators["OBV"][0], 2)), "BUY"],
                ["TRIX (20-period)",
                 str(round(indicators["TRIX (20)"][0], 2)), "BUY"],
                ["EMA (6-period)",
                 str(round(indicators["EMA (6)"][0], 2)), "BUY"]
            ]

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
    with open("../cache/data/blockchain.json", 'w') as blockchain_data_json:
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
    with open("../cache/data/headlines.json", 'w') as headlines_json:
        try:
            html = requests.get("https://www.coindesk.com/", headers={
                "User-Agent": random.choice(USER_AGENTS)
            })
            soup = BeautifulSoup(html.text, "html.parser")

            featured_headline_containers = [feature.find_all('a', class_="fade")[
                0] for feature in soup.find_all("div", class_="article article-featured")]
            featured_headlines = [(headline.get_text().strip(), headline.find_all("time")[
                0]["datetime"], headline["href"]) for headline in featured_headline_containers]
            other_headlines = [(headline.find_all("a", class_="fade")[0].get_text().strip(), headline.find_all("time")[
                0]["datetime"], headline.find_all("a", class_="fade")[0]["href"]) for headline in soup.find_all("div", class_="post-info")]

            # filtered_headlines = [headline for headline in featured_headlines +
            #                       other_headlines if "bitcoin" in headline[0].lower() or "btc" in headline[0].lower()]
            #
            # invalid_bch_headlines = []
            #
            # for headline in filtered_headlines:
            #     if "bitcoin cash" in headline[0].lower() or "bch" in headline[0].lower():
            #         if not any("bitcoin" in headline_splice or "btc" in headline_splice for headline_splice in headline[0].split("bitcoin cash")):
            #             # then this is not a valid headline
            #             invalid_bch_headlines.append(headline)
            #
            # valid_headlines = set(filtered_headlines) - set(invalid_bch_headlines)
            # ordered_headlines = sorted(
            #     valid_headlines, key=lambda h: moment.date(h[1]).format("M-D"), reverse=True)

            ordered_headlines = sorted(featured_headlines + other_headlines,
                                       key=lambda h: moment.date(h[1]).format("M-D"), reverse=True)

            headlines_json.write(json.dumps({
                "error": False,
                "data": [[
                    moment.date(headline[1]).format("M-D"),
                    headline[0].split("\n")[0],
                    str(round(TextBlob(headline[0]).sentiment.polarity, 2)),
                    headline[2]]
                    for headline in ordered_headlines]
            }, indent=2))
        except:
            headlines_json.write(json.dumps({
                "error": True,
                "data": []
            }, indent=2))


def fetch_portfolio_stats(client):
    with open("../cache/data/portfolio.json", 'w') as portfolio_json:
        try:
            portfolio_json.write(json.dumps({
                "error": False,
                "data": {
                    "account_balance": ''.join(['$', str(client.account_balance()["usd_available"])]),
                    "returns": "0.00%",
                    "net_profit": "$0.00",
                    "sharpe_ratio": "0.00",
                    "buy_accuracy": "0.00%",
                    "sell_accuracy": "0.00%",
                    "total_trades": "0"
                }
            }, indent=2))
        except:
            portfolio_json.write(json.dumps({
                "error": True,
                "data": {}
            }))


def fetch_transaction_data(client):
    with open("../cache/data/transactions.json", 'w') as transactions:
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


def refresh(names, client=None):
    # TODO: Parallelize
    for name in names:
        if name == "price_data":
            fetch_price_data()
        elif name == "tech_indicators":
            fetch_tech_indicators()
        elif name == "blockchain_data":
            fetch_blockchain_data()
        elif name == "coindesk_stats":
            fetch_coindesk_stats()
        elif name == "portfolio_stats":
            fetch_portfolio_stats(client)
        elif name == "transactions":
            fetch_transaction_data(client)
