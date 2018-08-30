import sys
from monitor import refresh
from trader import train_and_predict, make_trade
from bitstamp import Trading
from crontab import CronTab


def action(name):
    # client = Trading(
    #     username="test",
    #     key="test",
    #     secret="test"
    # )

    if name == "monitor_price": # Updates ticker data
        refresh(["price_data"])
    elif name == "monitor_network":  # Updates technical indicators and blockchain data
        refresh(["tech_indicators", "blockchain_data"])
    elif name == "monitor_opinions":  # Updates coindesk data
        refresh(["coindesk_stats"])
    elif name == "monitor_portfolio":  # Updates portfolio data
        refresh(["portfolio_stats"])
    elif name == "toggle_algo":  # Toggles algorithmic trading
        cron = CronTab(user=True)
        job = cron.new(command="python3 __main__.py make_algotrade")
        job.hour.every(24)

        cron.write()
    elif name == "make_algotrade":  # Makes a scheduled trade
        balance = client.account_balance()["usd_available"]
        # TODO: Figure out amount w/ the Kelly Criterion
        make_trade({"type": train_and_predict(), "amount": 0})
    elif name == "make_trade":  # Makes a user-defined trade
        make_trade(dict(sys.argv[2]))
    elif name == "withdraw":  # Withdraws money from user account
        client.bitcoin_withdrawal(int(sys.argv[2]), sys.argv[3])
    # elif name == "deposit_address":  # Gets wallet address for depositing BTC
    #     client.bitcoin_deposit_address()  # TODO: Write this to account.json


if __name__ == "__main__":
    action(sys.argv[1])
