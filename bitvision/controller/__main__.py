import sys
from monitor import refresh
from trader import train_and_predict, make_trade
from bitstamp import Trading


def action(name):
    client = Trading(
        username="test",
        key="test",
        secret="test"
    )

    if name == "monitor_network":  # Updates price and blockchain data
        refresh([
            "price_data",
            "indicators",
            "blockchain"
        ])
    elif name == "monitor_opinions":  # Updates coindesk data
        refresh(["coindesk_stats"])
    elif name == "monitor_performance":  # Updates portfolio data
        refresh(["performance"])
    elif name == "toggle_algo":  # Toggles algorithmic trading
        return
    elif name == "make_algotrade":  # Makes a scheduled trade
        # TODO: Figure out amount w/ the Kelly Criterion
        make_trade({"type": train_and_predict(), "amount": 0})
    elif name == "make_trade":  # Makes a user-defined trade
        make_trade(dict(sys.argv[2]))
    elif name == "withdraw":  # Withdraws money from user account
        client.bitcoin_withdrawal(int(sys.argv[2]), sys.argv[3])
    elif name == "deposit_address":  # Gets wallet address for depositing BTC
        client.bitcoin_deposit_address()  # TODO: Write this to account.json


if __name__ == "__main__":
    action(sys.argv[1])
