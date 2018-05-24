import sys
import configparser
import gdax
import urwid

config = configparser.ConfigParser()
config.read("config.ini")

def login():
    while True:
        sys.stdout.write("Enter your GDAX API key: ")
        api_key = input().upper()

        sys.stdout.write("Enter your secret: ")
        secret = input().lower()

        sys.stdout.write("Enter your passphrase: ")
        passphrase = input()

        sys.stdout.write("\nAuthenticating...")
        gdax_client = gdax.AuthenticatedClient(api_key, secret, passphrase)

        if (True): # TODO: Check if authentication was successful
            config["STATUS"]["LOGGED_IN"] = True
            config["CREDENTIALS"]["API_KEY"] = api_key
            config["CREDENTIALS"]["SECRET"] = secret
            config["CREDENTIALS"]["PASSPHRASE"] = passphrase

            return gdax_client
        else:
            sys.stdout.write("\nInvalid credentials. Please try again.\n")

def fit_model():
    if (bool(config["STATUS"]["LOGGED_IN"])):
        price_data = bus.fetch("PRICE_DATA")
        blockchain_data  = bus.fetch("BLOCKCHAIN_DATA")
        coindesk_headlines = bus.fetch("COINDESK_HEADLINES")

        training_data = (
            price_data.pipe(prep.calculate_indicators)
            .pipe(prep.merge_datasets, other_sets=[
                blockchain_data,
                coindesk_headlines.pipe(prep.tokenize)
                .pipe(prep.lemmatize)
                .pipe(prep.tag_pos)
                .pipe(prep.vectorize)
            ])
            .pipe(prep.binarize_labels)
            .pipe(prep.fix_null_vals)
            .pipe(prep.add_lag_variables, lag=3)
            .pipe(prep.power_transform)
            .pipe(prep.save) # Saves to features.csv, returns dataframe with the last row dropped
        )

        return Model(training_data) # Trains and serializes a learning algorithm
    else:
        # TODO: Check if current model.pkg is the most up-to-date
        # NOTE: Serialize the model by hashing the most recent date; check if hashes
        # match or not
        return

class App(object):
    def __init__(self, gdax_client, model):
        self.gdax_client, self.model = gdax_client, model
        self.palette = []
        self.menu = urwid.Text([
            u'\n',
            ("menu", u" ENTER "), ("light gray", u" View answers "),
            ("menu", u" B "), ("light gray", u" Open browser "),
            ("menu", u" Q "), ("light gray", u" Quit")
        ])

        # TODO: Get the last row in features.csv

        self.tech_indicators = self.__draw_box("technical_indicators")
        self.fund_indicators = self.__draw_box("fundamental_indicators")

        self.main_loop = urwid.MainLoop(layout, self.palette, unhandled_input=self._handle_input)
        self.original_widget = self.main_loop.widget

        self.main_loop.run()

    def __draw_box(self, type, content):
        if (type == "technical_indicators"): # name, value, associated buy/sell signal
            return
        elif (type == "fundamental_indicators"): # name, value
            return
        elif (type == "twitter_sentiment"): # sentiment score (aggregate), tweet volume
            return
        elif (type == "coindesk_headlines"): # headlines, sentiment scores
            return
        elif (type == "performance_statistics"): # total amt. of capital, returns (%), net profit ($), sharpe ratio, total buys, buy accuracy (%), total sells, sell accuracy (%), total trades
            return
        elif (type == "price_data"): # exchange rate / candlestick data
            return
        elif (type == "scheduled_trade"): # countdown, type (buy/sell/hold), size ($)
            return

    # TODO: Add a refresh function

    def __handle_input(self, input):
        # Needed functionality:
        #   Cancel/edit a scheduled trade
        #   Place your own trade
        #   Deposit or withdraw money from your GDAX account
        #   Export a graph of the returns given by the ML strategy vs. a buy-and-hold strategy

        return

def main():
    if (bool(config["STATUS"]["LOGGED_IN"])):
    else:
        gdax_client = login()
        model = fit_model()

        App(gdax_client, model)
