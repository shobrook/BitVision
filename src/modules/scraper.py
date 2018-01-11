import multiprocessing
import re
import requests
import pandas as pd
import json
import ftfy
import argparse
from lxml import html, etree
from dateutil.parser import parse as dateParse
import csv
import os
import time
import sys
import importlib

importlib.reload(sys)

def preprocess():
	"""Preprocesses the blockchain network data"""
	print("Preprocessing data...")

	processed_data = (PRICES.pipe(preprocessing.calculate_indicators)
		.pipe(preprocessing.merge_datasets, set_b=NETWORK_DATA)
		.pipe(preprocessing.fix_null_vals)
		.pipe(preprocessing.calculate_labels)
	)
	return processed_data

def fetch_network_data():
	"""Fetches Blockchain Network Data"""
	print("\tFetching blockchain network data...")

	global NETWORK_DATA, PRICES

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

	# Loads Bitstamp's OHLCV dataset
	PRICES = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHARTS/BITSTAMPUSD.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=",")

	# Assigns column names
	CONF_TIME.columns, BLOCK_SIZE.columns = ["Date", "Conf. Time"], ["Date", "Block Size"]
	TXN_COST.columns, DIFFICULTY.columns = ["Date", "TXN Cost"], ["Date", "Difficulty"]
	TXN_COUNT.columns, HASH_RATE.columns = ["Date", "TXNs per Day"], ["Date", "Hash Rate (GH/s)"]
	MARKET_CAP.columns, MINERS_REV.columns = ["Date", "Market Cap"], ["Date", "Miners Revenue"]
	BLOCK_TXN.columns, UNIQUE_ADDR.columns = ["Date", "TXNs per Block"], ["Date", "Unique Addresses"]
	TOTAL_BTC.columns, TXN_FEES.columns = ["Date", "Total BTC"], ["Date", "TXN Fees"]

	NETWORK_DATA = [CONF_TIME, BLOCK_SIZE, TXN_COST, DIFFICULTY, TXN_COUNT, HASH_RATE, MARKET_CAP, MINERS_REV, BLOCK_TXN, UNIQUE_ADDR, TOTAL_BTC, TXN_FEES]

def fetch_new_data(path):
	"""Fetch new data or read from cache if the latest modification time is over 24 hours ago."""
	
	# Blockchain data
	if path.split("/")[-1] == "blockchain_network_data.csv":
		print("Looking for recent cached version of Blockchain Network data...")

		# If data doesn't exist or last modification time more than 24 hours ago, get new data
		if not os.path.isfile(path) or (int(time.time()) - os.path.getmtime(path)) > 86400 :
			print("\tValid data set not found...")
			fetch_network_data()
			btc_price_data = preprocess()
			cache_data(btc_price_data, path)
			return btc_price_data

		else: # Read from CSV
			print("\tValid data set found in cache...")
			print("\tReading...")
			btc_price_data = pd.read_csv(path, sep=",")
			return btc_price_data

	# Headline data
	else:
		print("Looking for recent cached version of headline data...")

		coindesk_path = path + "coindesk_headlines.csv"
		btc_news_path = path + "news_bitcoin_headlines.csv"

		# TODO: Fix this block, potentially scrap the corresponding else bc it makes no sense anymore
		# Maybe pull the 24 hr check bc that also doesn't really make sense
		if (not os.path.isfile(btc_news_path) or not os.path.isfile(coindesk_path) or 
					  (int(time.time()) - os.path.getmtime(coindesk_path)) > 86400 or 
					  (int(time.time()) - os.path.getmtime(btc_news_path)) > 86400):

			print("\tValid data set not found...")
			# If one of the headline data files is missing, delete the other and repopulate
			if not os.path.isfile(btc_news_path) or not os.path.isfile(coindesk_path):
				if not os.path.isfile(btc_news_path):
					os.remove(btc_news_path)
				if not os.path.isfile(coindesk_path):
					os.remove(coindesk_path)

				#SCRAPE ALL HEADLINES
			else :
				#SCRAPE ONLY UPDATED HEADLINES
			scrape_headlines()
			coindesk_headlines = pd.read_csv(coindesk_path, sep=",")
			btc_news_headlines = pd.read_csv(btc_news_path, sep=",")
			return (coindesk_headlines, btc_news_headlines)
			
		else: # Read from CSV
			print("\tValid data set found in cache...")
			print("\tReading...")
			coindesk_headlines = pd.read_csv(coindesk_path, sep=",")
			btc_news_headlines = pd.read_csv(btc_news_path, sep=",")
			return (coindesk_headlines, btc_news_headlines)

def cache_data(data, path_to_file):
	"""Caches data to path_to_file"""
	print("Caching data...")
	data.to_csv(path_to_file, sep=',',index = False)




def page_config(source, tree):
	"""Defines a config with XPATH selectors for each article's properties."""
	title = tree.find(".//title").text
	not_found_filters = ["404", "Not Found", "Not found"]
	if any(filter in title for filter in not_found_filters): return False # Checking for broken links

	if source == "news_bitcoin":
		try: config = {"title": tree.xpath('//h1[@class="entry-title"]')[0].text,
				"date": tree.xpath('//meta[@property="article:published_time"]')[0].get("content")
			}
		except: config = {"title": "N/A", "date": "N/A"}
	elif source == "coindesk":
		try: config = {"title": tree.xpath('//h3[@class="article-top-title"]')[0].text,
				"date": "N/A"
			}
		except: config = {"title": "N/A", "date": "N/A"}
	else: config = {"title": "N/A", "date": "N/A"}

	return config

def results_config(current_page):
	"""Returns a config for each source's search results page."""
	return {"coindesk": {"page_url": "https://www.coindesk.com/page/" + str(current_page) + "/?s=Bitcoin",
			"item_XPATH": '//div[@class="post-info"]', # XPATH for the search result item container
			"url_XPATH": "./h3/a", # XPATH for url to full article, relative from item_XPATH
			"date_on_page": True, # Whether it's possible to collect datetime objects from the results page
			"date_ordered": True,
			"base_url": "https://coindesk.com",
			"results_per_page": 10,
			"date_XPATH": './p[@class="timeauthor"]/time'}, # XPATH for article date, will look for datetime object
		"news_bitcoin": {"page_url": "https://news.bitcoin.com/page/" + str(current_page) + "/?s=Bitcoin",
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
	headers = {"accept-encoding": "gzip, deflate, br",
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

def collect_articles(urls, source, args, filename):
	"""Loops over all the URLs collected in the parent function."""
	for url in urls:
		tree = parse_html(url)
		config = page_config(source, tree)

		print(url)

		if args.scrape_year and dateParse(config["date"]).year < int(args.scrape_year): break
		elif args.scrape_year and int(str(dateParse(config["date"]).year)) != int(args.scrape_year): pass
		else:
			# csv_writer = csv.writer(open(filename, "a"))
			print("PATH:",os.path.dirname(os.path.dirname(os.getcwd())) + "/data/" + filename)
			csv_writer = csv.writer(open(os.path.dirname(os.path.dirname(os.getcwd())) + "/data/" + filename, "a"))
			csv_writer.writerow([config["date"], ftfy.fix_text(config["title"]), url])

def get_article_urls(source, args):
	"""Main function."""
	filename = source.lower() + "_headlines.csv"
	urls, current_page = [], 1
	has_next_page, out_of_range = True, False

	while has_next_page and not out_of_range:
		config = results_config(current_page)
		tree = parse_html(config[source]["page_url"])
		items = tree.xpath(config[source]["item_XPATH"])

		for item in items:
			if config[source]["date_on_page"] and config[source]["date_ordered"] and args.scrape_year:
				date = dateParse(item.xpath(config[source]["date_XPATH"])[0].get("datetime"))
				if date.year < int(args.scrape_year): out_of_range = True

			url = item.xpath(config[source]["url_XPATH"])[0].get("href")

			if "://" not in url: url = results_config(current_page)[source]["base_url"] + url

			url_filters = ["/videos/", "/audio/", "/gadfly/", "/features/", "/press-releases/"]
			if any(filter in url for filter in url_filters): pass
			else: urls.append(url)

		if len(items) < config[source]["results_per_page"]: has_next_page = False

		collect_articles(urls, source, args, filename)

		current_page += 1
		urls = []

def scrape_headlines():
	parser = argparse.ArgumentParser(description="Scrape cryptocurrency-related news articles")
	parser.add_argument("--year", dest="scrape_year", required=False, help="Specify a specific year to collect from")
	parser.add_argument("--sources", nargs="+", dest="sources", help="Set the news websites you want to collect from", required=False)
	args = parser.parse_args()

	all_sources = ["coindesk", "news_bitcoin"]
	if args.sources: visit_sources = args.sources
	else: visit_sources = all_sources

	for source in visit_sources:
		process = multiprocessing.Process(target=get_article_urls, args=(source, args))
		process.start()
