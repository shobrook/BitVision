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
from .transformers import transformer

quandl_endpoints = {
    "conf_time": "https://www.quandl.com/api/v3/datasets/BCHAIN/ATRCT.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "block_size": "https://www.quandl.com/api/v3/datasets/BCHAIN/AVBLS.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "txn_cost": "https://www.quandl.com/api/v3/datasets/BCHAIN/CPTRA.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "difficulty": "https://www.quandl.com/api/v3/datasets/BCHAIN/DIFF.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "txn_count": "https://www.quandl.com/api/v3/datasets/BCHAIN/NTRAN.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "hash_rate": "https://www.quandl.com/api/v3/datasets/BCHAIN/HRATE.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "market_cap": "https://www.quandl.com/api/v3/datasets/BCHAIN/MKTCP.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "miners_rev": "https://www.quandl.com/api/v3/datasets/BCHAIN/MIREV.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "block_txn": "https://www.quandl.com/api/v3/datasets/BCHAIN/NTRBL.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "unique_addr": "https://www.quandl.com/api/v3/datasets/BCHAIN/NADDU.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "total_btc": "https://www.quandl.com/api/v3/datasets/BCHAIN/TOTBC.csv?api_key=iKmHLdjz-ghzaWVKyEfw",
    "txn_fees": "https://www.quandl.com/api/v3/datasets/BCHAIN/TRFUS.csv?api_key=iKmHLdjz-ghzaWVKyEfw"
}


#######
# BUSES
#######


def fetch_price_data():
    return pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHARTS/BITSTAMPUSD.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')


def fetch_blockchain_data():
    # Loads datasets from Quandl
    conf_time = pd.read_csv(quandl_endpoints["conf_time"], sep=',')
    block_size = pd.read_csv(quandl_endpoints["block_size"], sep=',')
    txn_cost = pd.read_csv(quandl_endpoints["txn_cost"], sep=',')
    difficulty = pd.read_csv(quandl_endpoints["difficulty"], sep=',')
    txn_count = pd.read_csv(quandl_endpoints["txn_count"], sep=',')
    hash_rate = pd.read_csv(quandl_endpoints["hash_rate"], sep=',')
    market_cap = pd.read_csv(quandl_endpoints["market_cap"], sep=',')
    miners_rev = pd.read_csv(quandl_endpoints["miners_rev"], sep=',')
    block_txn = pd.read_csv(quandl_endpoints["block_txn"], sep=',')
    unique_addr = pd.read_csv(quandl_endpoints["unique_addr"], sep=',')
    total_btc = pd.read_csv(quandl_endpoints["total_btc"], sep=',')
    txn_fees = pd.read_csv(quandl_endpoints["txn_fees"], sep=',')

    # Reassigns column names
    conf_time.columns, block_size.columns = [
        "Date", "Conf. Time"], ["Date", "Block Size"]
    txn_cost.columns, difficulty.columns = [
        "Date", "TXN Cost"], ["Date", "Difficulty"]
    txn_count.columns, hash_rate.columns = [
        "Date", "TXNs per Day"], ["Date", "Hash Rate (GH/s)"]
    market_cap.columns, miners_rev.columns = [
        "Date", "Market Cap"], ["Date", "Miners Revenue"]
    block_txn.columns, unique_addr.columns = [
        "Date", "TXNs per Block"], ["Date", "Unique Addresses"]
    total_btc.columns, txn_fees.columns = [
        "Date", "Total BTC"], ["Date", "TXN Fees"]

    dfs = [conf_time, block_size, txn_cost, difficulty, txn_count, hash_rate,
           market_cap, miners_rev, block_txn, unique_addr, total_btc, txn_fees]

    return transformer("merge_datasets")(dfs[0], dfs[1:])


def fetch_tweets():
    pass


######
# MAIN
######


def dataset(name):
    if name == "price_data":
        # path = "../../cache/features/price_data.csv"
        #
        # # Fetches from Quandl if local dataset is out of date or corrupted
        # if not os.path.isfile(path) or int(time.time() - os.path.getmtime(path)) > 86400:
        #     price_data = fetch_price_data()
        #     price_data.to_csv(path, sep=',', index=False)
        #
        #     return price_data
        #
        # return pd.read_csv(path, sep=',')

        return fetch_price_data()
    elif name == "blockchain_data":
        # path = "../../cache/features/blockchain_data.csv"
        #
        # # Fetches from Quandl if local dataset is out of date or corrupted
        # if not os.path.isfile(path) or int(time.time() - os.path.getmtime(path)) > 86400:
        #     blockchain_data = fetch_blockchain_data()
        #     blockchain_data.to_csv(path, sep=',', index=False)
        #
        #     return blockchain_data
        #
        # return pd.read_csv(path, sep=',')

        return fetch_blockchain_data()
    elif name == "tweets":
        return fetch_tweets()
