#!/usr/bin/python

#########
# GLOBALS
#########


import os
import sys
import json
from datetime import datetime, timedelta
from crontab import CronTab

# Local
from retriever import retrieve
from trader import make_prediction, make_trade, allocate_funds, TradingClient

DIR_PATH = os.path.dirname(os.path.abspath(__file__))


######
# MAIN
######


def action(name):
    with open(os.path.join(DIR_PATH, "../store/config.json")) as config:
        config_dict = json.load(config)
        credentials = config_dict["credentials"]
        client = TradingClient(
            username=credentials["username"],
            key=credentials["key"],
            secret=credentials["secret"]
        )

        if name == "authenticate": # Authenticates Bitstamp credentials
            with open(os.path.join(DIR_PATH, "../store/config.json"), 'w') as new_config:
                try: # Tries to pull account balance; if fails, then invalid creds
                    client.account_balance()
                    logged_in = True
                except:
                    logged_in = False

                config_dict["logged_in"] = logged_in
                new_config.write(json.dumps(config_dict))
        elif name == "retrieve_price_data": # Updates ticker and graph data
            retrieve(["price_data"])
        elif name == "retrieve_network_data": # Updates technical indicators and blockchain data
            retrieve(["tech_indicators", "blockchain_data"])
        elif name == "retrieve_headline_data": # Updates coindesk data
            retrieve(["coindesk_headlines"])
        elif name == "retrieve_portfolio_stats": # Updates portfolio data
            retrieve(["portfolio_stats", "transaction_log"], client)
        elif name == "toggle_algo":  # Toggles algorithmic trading
            with open(os.path.join(DIR_PATH, "../store/config.json"), 'w') as new_config:
                cron = CronTab(user=True)
                job_killed = False

                for job in cron:
                    # Job is already running, kill it
                    if job.comment == "bitvision_algotrading_job":
                        cron.remove(job)
                        cron.write()

                        job_killed = True
                        new_config.write(json.dumps({
                            **config_dict,
                            **{"autotrade": {
                                "next-trade-timestamp-UTC": -1,
                                "enabled": False
                            }}
                        }))

                        break

                if not job_killed: # Job doesn't exist, create it
                    job = cron.new(
                        command="python3 __main__.py make_algotrade",
                        comment="bitvision_algotrading_job"
                    )
                    job.hour.every(23)
                    cron.write()

                    next_trade_time = str(datetime.utcnow() + timedelta(hours=23))
                    new_config.write(json.dumps({
                        **config_dict,
                        **{"autotrade": {
                            "next-trade-timestamp-UTC": next_trade_time,
                            "enabled": True
                        }}
                    }))
        elif name == "make_algotrade": # Makes a scheduled trade
            balance = client.account_balance()["usd_available"]
            make_trade(client, {
                "type": make_prediction(),
                "amount": allocate_funds(balance)
            })
        elif name == "make_trade": # Makes a user-defined trade
            make_trade(client, dict(sys.argv[2]))

if __name__ == "__main__":
    action(sys.argv[1])
