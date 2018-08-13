import bitstamp.client
import json
from os.path import expanduser
from pathlib import Path
from pprint import pprint

# Set Bitstamp client as Public until auth.
# https://github.com/kmadac/bitstamp-python-client
bitstamp_client = bitstamp.client.Public()

########
# Config Utilities
########


def getConfig():
	"""
	Returns config file contents in JSON format.
	"""
	config_path = os.path.join(expanduser("~"), ".shallow-backup")
	config_contents = Path(file_path).read_text()
	config = json.loads(config_contents)
	return config


def getCredentials():
	config = getConfig()
	return config["credentials"]

########
# BitStamp Methods
########


def tradingAccountLogin():
	"""
	Replaces bitstamp public client with authenticated private client.
	"""
	creds = getCredentials()
	bitstamp_client = bitstamp.client.Trading(username=creds["username"],
	                                          key=creds["key"],
	                                          secret=creds["secret"])

def getAccountBalance():
	pprint(bitstamp_client.account_balance())
	return



def main():
	print("Ticker")
	pprint(bitstamp_client.ticker())
	print("Ticker Hourly")
	pprint(bitstamp_client.ticker_hour())
	print("Order Book")
	pprint(bitstamp_client.order_book())
	print("Transactions")
	pprint(bitstamp_client.transactions())
	print("Trading Pairs Info")
	pprint(bitstamp_client.trading_pairs_info())


