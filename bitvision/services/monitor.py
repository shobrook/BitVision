#########
# GLOBALS
#########


import sys
import random
from bs4 import BeautifulSoup


#########
# HELPERS
#########


def Fetch(name):
    if name == "PRICE_DATA":
        # {
        #     "name": "PRICE_DATA",
        #     "data": {
        #         "exchange_rate": 0,
        #         "growth": 0.00
        #     }
        # }

        return {}
    elif name == "TECHNICAL_INDICATORS":
        # {
        #     "name": "TECHNICAL_INDICATORS",
        #     "data": {
        #         "tech1": {"value": 0, "signal": "BUY"},
        #         "tech2": {"value": 0, "signal": "SELL"},
        #         ...
        #     }
        # }

        return {}
    elif name == "NETWORK_ATTRIBUTES":
        # {
        #     "name": "NETWORK_ATTRIBUTES",
        #     "data": {
        #         "attr1": 0,
        #         "attr2": 0,
        #         ...
        #     }
        # }

        return {}
    elif name == "COINDESK_STATS":
        html = requests.get("https://www.coindesk.com/", headers={
            "User-Agent": random.choice(USER_AGENTS)
        })
        soup = BeautifulSoup(html.text, "html.parser")

        featured_headline_containers = [feature.find_all('a', class_="fade")[0] for feature in soup.find_all("div", class_="article article-featured")]

        featured_headlines = [(headline.text, headline.find_all("time")[0].datetime) for headline in featured_headline_containers]
        other_headlines = [(headline.find_all("a", class_="fade")[0].title, headline.find_all("time")[0].datetime) for headline in soup.find_all("div", class_="post-info")]
        all_headlines = list(filter(lambda headline: moment.date(headline[0]).format("YYYY-M-D") == moment.now().locale("US/Pacific").timezone("US/Eastern")))

        # TODO: Populate the 'timestamp', 'sentiment', and 'tweets' fields

        return {
            "name": "COINDESK_STATS",
            "data": {headline[0]: {"timestamp": "", "sentiment": 0, "tweets": 0} for headline in all_headlines}
        }
    elif name == "TWITTER_STATS":
        # {
        #     "name": "TWITTER_STATS",
        #     "data": {
        #         "POSITIVE": .65,
        #         "NEUTRAL": .15,
        #         "NEGATIVE": .20,
        #         "VOLUME": 123456789
        #     }
        # }

        return {}
    elif name == "PERFORMANCE_STATS":
        # {
        #     "name": "PERFORMANCE_STATS",
        #     "data": {
        #         "capital": 0,
        #         "returns": 0.00,
        #         "net_profit": 0,
        #         "sharpe_ratio": 0,
        #         "buy_accuracy": 0.00,
        #         "sell_accuracy": 0.00,
        #         "total_trades": 0
        #     }
        # }

        return {}

def Write(data):
    # TODO: Write data["data"] to data["name"].lower() + ".csv"

    return True


######
# MAIN
######


def refresh(names):
    for name in names: # TODO: Parallelize
        data = Fetch(name)
        if not Write(data):
            return False

    return True
