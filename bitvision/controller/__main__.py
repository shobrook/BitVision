import sys
import json
from monitor import refresh
from trader import train_and_predict, make_trade
from bitstamp import Trading
from crontab import CronTab


def action(name):
    with open("../cache/config.json") as config:
        credentials = json.load(config)["credentials"]
        client = Trading(
            username=credentials["username"],
            key=credentials["key"],
            secret=credentials["secret"]
        )

        if name == "authenticate":  # Authenticates Bitstamp credentials
            with open("../cache/config.json", 'w') as config:
                config_dict = json.loads(config_dict)

                try:
                    client.account_balance()
                    config.write(json.dumps({**config_dict, **{"logged_in": True}}))
                except:
                    config.write(json.dumps({**config_dict, **{"logged_in": False}}))
        elif name == "monitor_price":  # Updates ticker and graph data
            refresh(["price_data"])
        elif name == "monitor_network":  # Updates technical indicators and blockchain data
            refresh(["tech_indicators", "blockchain_data"])
        elif name == "monitor_opinions":  # Updates coindesk data
            refresh(["coindesk_stats"])
        elif name == "monitor_portfolio":  # Updates portfolio data
            refresh(["portfolio_stats", "transactions"], client)
        elif name == "toggle_algo":  # Toggles algorithmic trading
            cron = CronTab(user=True)
            job_killed = False

            for job in cron:
                if job.comment == "bitvision_algotrading_job": # Job is already running, kill it
                    cron.remove(job)
                    cron.write()

                    job_killed = True

                    break

            if not job_killed: # Job doesn't exist, create it
                job = cron.new(command="python3 __main__.py make_algotrade", comment="bitvision_algotrading_job")
                job.hour.every(24)

                cron.write()
        elif name == "make_algotrade":  # Makes a scheduled trade
            balance = client.account_balance()["usd_available"]
            # TODO: Figure out amount w/ the Kelly Criterion
            make_trade(client, {"type": train_and_predict(), "amount": 0})
        elif name == "make_trade":  # Makes a user-defined trade
            make_trade(client, dict(sys.argv[2]))
        elif name == "withdraw":  # Withdraws money from user account
            client.bitcoin_withdrawal(int(sys.argv[2]), sys.argv[3])


if __name__ == "__main__":
    action(sys.argv[1])
