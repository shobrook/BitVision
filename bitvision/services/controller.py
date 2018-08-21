import sys
from .monitor import refresh
from .trader import fit_model, make_trade


def action(name):
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
        # TODO: Figure out amount via Kelly Criterion
        make_trade({"type": sys.argv[2], "amount": 0})
    elif name == "make_trade":  # Makes a user-defined trade
        make_trade(dict(sys.argv[2]))
    elif name == "withdraw":  # Withdraws money from user account
        return


if __name__ == "__main__":
    action(sys.argv[1])
