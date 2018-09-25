# Setup #


import preprocessing
# import multiprocessing
# import re
import requests
import pandas as pd
# import json
import ftfy
# import argparse
from lxml import html  # , etree
from dateutil.parser import parse as dateParse
import csv
import os
import time
import sys
import importlib
from selenium import webdriver

importlib.reload(sys)


# Blockchain and OHLCV Data #


def fetch_blockchain_data():
    """Fetches datasets related to Blockchain network activity."""

    # Loads network-based datasets
    CONF_TIME = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/ATRCT.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    BLOCK_SIZE = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/AVBLS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    TXN_COST = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/CPTRA.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    DIFFICULTY = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/DIFF.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    TXN_COUNT = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NTRAN.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    HASH_RATE = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/HRATE.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    MARKET_CAP = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/MKTCP.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    MINERS_REV = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/MIREV.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    BLOCK_TXN = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NTRBL.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    UNIQUE_ADDR = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NADDU.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    TOTAL_BTC = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/TOTBC.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")
    TXN_FEES = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/TRFUS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")

    # Assigns column names
    CONF_TIME.columns, BLOCK_SIZE.columns = ["Date", "Conf. Time"], ["Date", "Block Size"]
    TXN_COST.columns, DIFFICULTY.columns = ["Date", "TXN Cost"], ["Date", "Difficulty"]
    TXN_COUNT.columns, HASH_RATE.columns = ["Date", "TXNs per Day"], ["Date", "Hash Rate (GH/s)"]
    MARKET_CAP.columns, MINERS_REV.columns = ["Date", "Market Cap"], ["Date", "Miners Revenue"]
    BLOCK_TXN.columns, UNIQUE_ADDR.columns = [
        "Date", "TXNs per Block"], ["Date", "Unique Addresses"]
    TOTAL_BTC.columns, TXN_FEES.columns = ["Date", "Total BTC"], ["Date", "TXN Fees"]

    return [CONF_TIME, BLOCK_SIZE, TXN_COST, DIFFICULTY, TXN_COUNT, HASH_RATE, MARKET_CAP, MINERS_REV, BLOCK_TXN, UNIQUE_ADDR, TOTAL_BTC, TXN_FEES]


def fetch_price_data():
    """Fetches Bitstamp's OHLCV dataset."""
    return pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHARTS/BITSTAMPUSD.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")


# News Headlines #


def page_config(tree):
    """Defines a config with XPATH selectors for each article's properties."""
    title = tree.find(".//title").text
    not_found_filters = ["404", "Not Found", "Not found"]
    if any(filter in title for filter in not_found_filters):
        return False  # Checking for broken links

    try:
        config = {
            "title": tree.xpath('//h3[@class="article-top-title"]')[0].text,
            "date": dateParse(((tree.xpath('//span[@class="article-container-left-timestamp"]/text()'))[1]).strip("\n")).strftime("%Y-%m-%d")
        }
    except:
        config = {"title": "N/A", "date": "N/A"}

    return config


def results_config(current_page):
    """Returns a config for each source's search results page."""
    return {
        "coindesk": {
            "page_url": "https://www.coindesk.com/page/" + str(current_page) + "/?s=Bitcoin",
            "item_XPATH": '//div[@class="post-info"]',  # XPATH for the search result item container
            "url_XPATH": "./h3/a",  # XPATH for url to full article, relative from item_XPATH
            "date_on_page": True,  # Whether it's possible to collect datetime objects from the results page
            "date_ordered": True,
            "base_url": "https://coindesk.com",
            "results_per_page": 10,
            "date_XPATH": './p[@class="timeauthor"]/time'},  # XPATH for article date, will look for datetime object
        "news_bitcoin": {
            "page_url": "https://news.bitcoin.com/page/" + str(current_page) + "/?s=Bitcoin",
            "item_XPATH": '//div[@class="item-details"]',
            "url_XPATH": "./h3/a",
            "date_on_page": True,
            "date_ordered": True,
            "base_url": "https://news.bitcoin.com",
            "results_per_page": 10,
            "date_XPATH": './div[@class="td-module-meta-info"]/span/time'
        }
    }


def parse_html(url):
    """Handles web requests and parses HTML into an lxml tree."""
    headers = {
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.8",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "cache-control": "max-age=0",
        "authority": "news.bitcoin.com",
        "cookie": "__cfduid=d784026513c887ec39604c0f35333bb231500736652; PHPSESSID=el5c5j7a26njfvoe2dh6fnrer3; _ga=GA1.2.552908756.1500736659; _gid=GA1.2.2050113212.1500736659"
    }
    page = requests.get(url, headers=headers)
    return html.fromstring(page.content)


def collect_articles(urls, end_date, filename):
    """Loops over all the URLs collected in the parent function."""

    for url in urls:
        tree = parse_html(url)
        config = page_config(tree)

        try:
            if end_date and dateParse(config["date"]) < dateParse(end_date):
                break
            else:
                csv_writer = csv.writer(open(os.path.dirname(os.getcwd()) + "/../data/" + filename, "a"))
                csv_writer.writerow([config["date"], ftfy.fix_text(config["title"]), url])
        except:
            print("\nEXCEPTION OCCURED\n")
            pass


def get_article_urls(end_date):
    """Main function."""
    filename = "coindesk_headlines.csv"
    urls, current_page = [], 1
    has_next_page, out_of_range = True, False

    while has_next_page and not out_of_range:
        config = results_config(current_page)
        tree = parse_html(config["coindesk"]["page_url"])
        items = tree.xpath(config["coindesk"]["item_XPATH"])

        for item in items:
            if config["coindesk"]["date_on_page"] and config["coindesk"]["date_ordered"] and end_date:
                date = (dateParse(item.xpath(config["coindesk"]["date_XPATH"])[
                        0].get("datetime"))).strftime("%Y-%m-%d")

                if dateParse(date) <= dateParse(end_date):
                    out_of_range = True

            url = item.xpath(config["coindesk"]["url_XPATH"])[0].get("href")

            if "://" not in url:
                url = results_config(current_page)["coindesk"]["base_url"] + url

            url_filters = ["/videos/", "/audio/", "/gadfly/", "/features/", "/press-releases/"]
            if any(filter in url for filter in url_filters):
                pass
            else:
                urls.append(url)

        if len(items) < config["coindesk"]["results_per_page"]:
            has_next_page = False

        collect_articles(urls, end_date, filename)

        current_page += 1
        urls = []


def scrape_headlines(end_date): # TODO: Remove this
    get_article_urls(end_date)


# Fetching and Caching #


def fetch_data(path):
    """Fetches updated datasets or reads from the cache if the last fetch was
       performed under 24hrs ago."""

    # Blockchain data
    if path.split("/")[-1] == "blockchain_data.csv":
        # If data doesn't exist or last modification time was > 24hrs ago, fetch updated data
        if not os.path.isfile(path) or (int(time.time()) - os.path.getmtime(path)) > 86400:
            print("\tUpdating Blockchain data")

            blockchain_data = fetch_blockchain_data()
            merged = preprocessing.merge_datasets(blockchain_data[0], blockchain_data[1:])
            merged.to_csv(path, sep=',', index=False)

            return merged
        # Otherwise pull dataset from the cache
        else:
            print("\tPulling Blockchain data from cache")

            return pd.read_csv(path, sep=",")
    # Bitcoin OHLCV data
    elif path.split("/")[-1] == "price_data.csv":
        if not os.path.isfile(path) or (int(time.time() - os.path.getmtime(path)) > 86400):
            print("\tUpdating OHLCV data")

            price_data = fetch_price_data()
            price_data.to_csv(path, sep=',', index=False)

            return price_data
        else:
            print("\tPulling OHLCV data from cache")

            return pd.read_csv(path, sep=",")
    # Bitcoin news headlines
    else:
        coindesk_path = path + "coindesk_headlines.csv"
        btc_news_path = path + "news_bitcoin_headlines.csv"

        # Corrupted dataset
        if not os.path.isfile(btc_news_path) or not os.path.isfile(coindesk_path):
            if os.path.isfile(btc_news_path):
                os.remove(btc_news_path)
            if os.path.isfile(coindesk_path):
                os.remove(coindesk_path)

            print("\tRescraping headline data")

            scrape_headlines("2013-01-01")

            # TODO: Wait until scrape_headlines() call is finished before returning dataframes

            return (pd.read_csv(coindesk_path, sep=","), pd.read_csv(btc_news_path, sep=","))
        elif ((int(time.time()) - os.path.getmtime(coindesk_path)) > 86400 or
                (int(time.time()) - os.path.getmtime(btc_news_path)) > 86400):
            print("\tUpdating headline data")

            # TODO: Convert os.path.getmtime(path) into %Y-%m-%d format, call scrape_headlines(mtime_date), then concatenate both CSVs together

        # Pull dataset from cache
        else:
            print("\tPulling headline data from cache")

            return pd.read_csv(coindesk_path, sep=","), pd.read_csv(btc_news_path, sep=",")
