#########
# GLOBALS
#########
import csv
import html
import os
import random
import time
import moment
import pandas as pd
import requests
from bs4 import BeautifulSoup
from ftfy import ftfy
from transformers import Transformer


#########
# HELPERS
#########


def page_config(tree):
    """
    Defines a config with XPATH selectors for each article's properties.
    """

    title = tree.find(".//title").text
    not_found_filters = ["404", "Not Found", "Not found"]
    if any(filter in title for filter in not_found_filters):
        return False  # Checking for broken links

    try:
        return {
            "title": tree.xpath("//h3[@class='article-top-title']")[0].text,
            "date": dateParse(((tree.xpath("//span[@class='article-container-left-timestamp']/text()"))[1]).strip('\n')).strftime("%Y-%m-%d")
        }
    except:
        return {"title": "N/A", "date": "N/A"}


def results_config(current_page):
    """
    Returns a config for Coindesk's search results page.
    """

    return {
        "page_url": ''.join(["https://www.coindesk.com/page/", str(current_page), "/?s=Bitcoin"]),
        "item_XPATH": "//div[@class='post-info']", # XPATH for the search result item container
        "url_XPATH": "./h3/a", # XPATH for url to full article, relative from item_XPATH
        "date_on_page": True, # Whether it's possible to collect datetime objects from the results page
        "date_ordered": True,
        "base_url": "https://coindesk.com",
        "results_per_page": 10,
        "date_XPATH": "./p[@class='timeauthor']/time"},  # XPATH for article date, will look for datetime object


def parse_html(url):
    """
    Parses HTML into an LXML tree.
    """

    page = requests.get(url, headers={
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.8",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "cache-control": "max-age=0",
        "authority": "news.bitcoin.com",
        "cookie": "__cfduid=d784026513c887ec39604c0f35333bb231500736652; PHPSESSID=el5c5j7a26njfvoe2dh6fnrer3; _ga=GA1.2.552908756.1500736659; _gid=GA1.2.2050113212.1500736659"
    })

    return html.fromstring(page.content)


def collect_articles(urls, end_date, filename):
    """
    Loops over all the URLs collected in the parent function.
    """

    for url in urls:
        tree = parse_html(url)
        config = page_config(tree)

        try:
            if end_date and dateParse(config["date"]) < dateParse(end_date):
                break
            else:
                csv_writer = csv.writer(open(os.path.dirname(os.getcwd()) + "/../cache/" + filename, "a"))
                csv_writer.writerow([config["date"], ftfy.fix_text(config["title"]), url])
        except:
            pass


#######
# BUSES
#######


def fetch_price_data():
    return pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHARTS/\
                        BITSTAMPUSD.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')


def fetch_blockchain_data():
    # Loads datasets from Quandl
    conf_time = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                             ATRCT.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    block_size = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                              AVBLS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    txn_cost = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                            CPTRA.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    difficulty = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                              DIFF.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    txn_count = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                             NTRAN.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    hash_rate = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                             HRATE.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    market_cap = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                              MKTCP.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    miners_rev = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                              MIREV.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    block_txn = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                             NTRBL.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    unique_addr = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                               NADDU.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    total_btc = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                             TOTBC.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    txn_fees = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/\
                            TRFUS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')

    # Reassigns column names
    conf_time.columns, block_size.columns = ["Date", "Conf. Time"], ["Date", "Block Size"]
    txn_cost.columns, difficulty.columns = ["Date", "TXN Cost"], ["Date", "Difficulty"]
    txn_count.columns, hash_rate.columns = ["Date", "TXNs per Day"], ["Date", "Hash Rate (GH/s)"]
    market_cap.columns, miners_rev.columns = ["Date", "Market Cap"], ["Date", "Miners Revenue"]
    block_txn.columns, unique_addr.columns = ["Date", "TXNs per Block"], ["Date", "Unique Addresses"]
    total_btc.columns, txn_fees.columns = ["Date", "Total BTC"], ["Date", "TXN Fees"]

    dfs = [conf_time, block_size, txn_cost, difficulty, txn_count, hash_rate, \
           market_cap, miners_rev, block_txn, unique_addr, total_btc, txn_fees]

    return Transformer("MERGE_DATASETS")(dfs[0], dfs[1:])


def fetch_coindesk_headlines(end_date):
    filename = "coindesk_headlines.csv"
    urls, current_page = [], 1
    has_next_page, out_of_range = True, False

    while has_next_page and not out_of_range:
        config = results_config(current_page)
        tree = parse_html(config["page_url"])
        items = tree.xpath(config["item_XPATH"])

        for item in items:
            if config["date_on_page"] and config["date_ordered"] and end_date:
                date = (dateParse(item.xpath(config["date_XPATH"])[
                        0].get("datetime"))).strftime("%Y-%m-%d")

                if dateParse(date) <= dateParse(end_date):
                    out_of_range = True

            url = item.xpath(config["url_XPATH"])[0].get("href")

            if "://" not in url:
                url = results_config(current_page)["base_url"] + url

            url_filters = ["/videos/", "/audio/", "/gadfly/", "/features/", "/press-releases/"]
            if any(filter in url for filter in url_filters):
                pass
            else:
                urls.append(url)

        if len(items) < config["results_per_page"]:
            has_next_page = False

        collect_articles(urls, source, end_date, filename)

        current_page += 1
        urls = []


def fetch_tweets():
    pass


######
# MAIN
######


def Dataset(name):
    if name == "PRICE_DATA":
        path = "../cache/price_data.csv"

        # Fetches from Quandl if local dataset is out of date or corrupted
        if not os.path.isfile(path) or int(time.time() - os.path.getmtime(path)) > 86400:
            price_data = fetch_price_data()
            price_data.to_csv(path, sep=',', index=False)

            return price_data

        return pd.read_csv(path, sep=',')
    elif name == "BLOCKCHAIN_DATA":
        path = "../cache/blockchain_data.csv"

        # Fetches from Quandl if local dataset is out of date or corrupted
        if not os.path.isfile(path) or int(time.time() - os.path.getmtime(path)) > 86400:
            blockchain_data = fetch_blockchain_data()
            blockchain_data.to_csv(path, sep=',', index=False)

            return blockchain_data

        return pd.read_csv(path, sep=',')
    elif name == "COINDESK_HEADLINES":
        return fetch_coindesk_headlines()
    elif name == "TWEETS":
        return fetch_tweets()


def Fetch(name):
    if name == "FEATURE_VECTOR":
        pass
    elif name == "TECHNICAL_INDICATORS":
        # {"name": "TECHNICAL_INDICATORS", "value": {
        #    "TECH1": {"value": 0, "signal": "BUY"},
        #    "TECH2": {"value": 1, "signal": "SELL"},
        #    ...
        # }}

        pass
    elif name == "NETWORK_ATTRIBUTES":
        # {"name": "NETWORK_ATTRIBUTES", "value": {
        #    "ATTR1": 0,
        #    "ATTR2": 0,
        #    ...
        # }}

        pass
    elif name == "TWITTER_STATS":
        # {"name": "TWITTER_STATS", "value": {
        #    "AVG_SENTIMENT": 0,
        #    "TWEET_VOLUME": 0,
        #    "TOPICS": ["...", ...]
        # }}

        pass
    elif name == "COINDESK_STATS":
        html = requests.get("https://www.coindesk.com/", headers={
            "User-Agent": random.choice(USER_AGENTS)
        })
        soup = BeautifulSoup(html.text, "html.parser")

        featured_headline_containers = [feature.find_all('a', class_="fade")[0] for feature in soup.find_all("div", class_="article article-featured")]

        featured_headlines = [(headline.text, headline.find_all("time")[0].datetime) for headline in featured_headline_containers]
        other_headlines = [(headline.find_all("a", class_="fade")[0].title, headline.find_all("time")[0].datetime) for headline in soup.find_all("div", class_="post-info")]
        all_headlines = list(filter(lambda headline: moment.date(headline[0]).format("YYYY-M-D") == moment.now().locale("US/Pacific").timezone("US/Eastern")))

        # TODO: Replace the 0 with either a sentiment rating or # of tweets

        return {
            "name": "COINDESK_STATS",
            "value": {headline[0]: 0 for headline in all_headlines}
        }
    elif name == "PRICE_DATA":
        # {"name": "PRICE_DATA", "value": {
        #    "EXCHANGE_RATE": 0,
        #    "PERCENTAGE_GROWTH": 0
        # }}

        pass
    elif name == "PERFORMANCE_STATS":
        pass
