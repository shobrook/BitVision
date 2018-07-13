#########
# GLOBALS
#########


import sys
import configparser
import gdax
import urwid

from engine import Dataset, Fetch, Transformer, Model

# from data_bus import Dataset, Fetch
# from transformers import Transformer
# from model import Model

CONFIG = configparser.ConfigParser()
CONFIG.read("config.ini")

#########
# HELPERS
#########

# BitVision CLI Trading Platform
# Aaron Lichtman and Jon Shobrook


def cached_credential_login(config):
	"""
	Tries to log user in to GDAX with a cached API key, secret, and passphrase.
	Defaults to prompting user for login on failure.
	@return: authenticated GDAX Client object
	"""
	try:
		print("\nChecking for cached credentials...")
		api_key = config["CREDENTIALS"]["KEY"]
		secret = config["CREDENTIALS"]["SECRET"]
		passphrase = config["CREDENTIALS"]["PASSPHRASE"]

		if "default-value" in api_key or secret or passphrase:
			prompt_for_login_creds()
		else:
			print("\nAuthenticating with cached credentials...")
			gdax_client = gdax.AuthenticatedClient(api_key, secret, passphrase)
			return gdax_client
	except Exception as e:
		print(e)
		print("\nPrompting user for credentials...")
		prompt_for_login_creds()


def prompt_for_login_creds():
	"""
	Prompts the user for their GDAX API key, secret, and passphrase before
	logging into the trading system.
	@return: authenticated GDAX Client object
	"""

	# TODO: Add a helper message with GDAX instructions and a security disclaimer

	while True:
		print("Enter your GDAX API key: ")
		api_key = input()

		print("Enter your secret: ")
		secret = input()

		print("Enter your passphrase: ")
		passphrase = input()

		print("\nAuthenticating...")
		gdax_client = gdax.AuthenticatedClient(api_key, secret, passphrase)

		if True:  # TODO: Check if authentication was successful
			config["STATE"]["LOGGED_IN"] = True
			config["CREDENTIALS"]["API_KEY"] = api_key
			config["CREDENTIALS"]["SECRET"] = secret
			config["CREDENTIALS"]["PASSPHRASE"] = passphrase

			return gdax_client
		else:
			print("\nInvalid credentials. Please try again.\n")


def fit_model():
	"""
	Pipeline for training the machine learning model.

	@return: a Model object fitted on price, blockchain, and headline data
	"""

	price_data = Dataset("PRICE_DATA")
	blockchain_data = Dataset("BLOCKCHAIN_DATA")
	coindesk_headlines = Dataset("COINDESK_HEADLINES")

	processed_data = (
		price_data.pipe(Transformer("CALCULATE_INDICATORS"))
			.pipe(Transformer("MERGE_DATASETS"), other_sets=[
			blockchain_data,
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

	processed_data.drop("Trend", axis=1).to_csv("cache/features.csv", sep=',', index=False)
	processed_data = processed_data.drop(df.index[0])

	return Model(processed_data, hyperparameterize=False)


class App(object):
	def __init__(self, gdax_client):
		self.gdax_client = gdax_client
		self.palette = []
		self.menu = urwid.Text([
			u'\n',
			("menu", u" SPACE "), ("light gray", u" Toggle automated trading "),
			("menu", u" P "), ("light gray", u" Place a trade "),
			("menu", u" D "), ("light gray", u" Deposit money "),
			("menu", u" W "), ("light gray", u" Withdraw money "),
			("menu", u" Q "), ("light gray", u" Quit")
		])

		self.model = fit_model()

		self.tech_indicators = self.__draw_box(Fetch("TECHNICAL_INDICATORS"))
		self.network_attributes = self.__draw_box(Fetch("NETWORK_ATTRIBUTES"))
		# self.twitter_stats = self.__draw_box(Fetch("TWITTER_STATS"))
		self.coindesk_stats = self.__draw_box(Fetch("COINDESK_STATS"))
		self.price_data = self.__draw_box(Fetch("PRICE_DATA"))
		self.performance_stats = self.__draw_box(Fetch("PERFORMANCE_STATS"))

		self.main_loop = urwid.MainLoop(layout, self.palette, unhandled_input=self._handle_input)
		self.original_widget = self.main_loop.widget

		self.main_loop.run()

	def __draw_box(self, content):
		if content["name"] == "TECHNICAL_INDICATORS":
			return
		if content["name"] == "NETWORK_ATTRIBUTES":
			return
		elif content["name"] == "TWITTER_STATS":
			return
		elif content["name"] == "COINDESK_STATS":
			return
		elif content["name"] == "PRICE_DATA":
			return
		elif content[
			"name"] == "PERFORMANCE_STATS":  # total amt. of capital, returns (%), net profit ($), sharpe ratio, total buys, buy accuracy (%), total sells, sell accuracy (%), total trades
			return
		elif content["name"] == "SCHEDULED_TRADE":  # countdown, type (buy/sell/hold), size ($)
			return

	# TODO: Add a refresh function

	def __handle_input(self, input):
		return


######
# MAIN
######


def main():

	if bool(CONFIG["STATE"]["LOGGED_IN"]):  # User has already logged in
		print("User logged in.")
		gdax_client = cached_credential_login(CONFIG)
		App(gdax_client)
	else:  # User just installed
		print("New user.")
		gdax_client = prompt_for_login_creds()
		App(gdax_client)


if __name__ == "__main__":
	main()
