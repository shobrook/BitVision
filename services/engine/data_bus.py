#########
# GLOBALS
#########


import os
import random
import time
import pandas as pd
import requests
from bs4 import BeautifulSoup
from .transformers import transformer


#######
# BUSES
#######


def fetch_price_data():
    return pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHARTS/BITSTAMPUSD.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')

def fetch_blockchain_data():
    # Loads datasets from Quandl
    conf_time = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/ATRCT.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    block_size = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/AVBLS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    txn_cost = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/CPTRA.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    difficulty = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/DIFF.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    txn_count = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NTRAN.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    hash_rate = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/HRATE.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    market_cap = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/MKTCP.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    miners_rev = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/MIREV.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    block_txn = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NTRBL.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    unique_addr = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/NADDU.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    total_btc = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/TOTBC.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')
    txn_fees = pd.read_csv("https://www.quandl.com/api/v3/datasets/BCHAIN/TRFUS.csv?api_key=iKmHLdjz-ghzaWVKyEfw", sep=',')

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


######
# MAIN
######


def dataset(name):
    if name == "price_data":
        return fetch_price_data()
    elif name == "blockchain_data":
        return fetch_blockchain_data()
