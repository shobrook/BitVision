import sys
from .monitor import refresh
from .trader import fit_model, make_trade

def action(name):
    if name == "login": # Logs in and initializes trading client
        return
    elif name == "retrain": # Retrains and serialize the model
        fit_model().serialize("../data/trader_model.pkl")
    elif name == "monitor_network": # Updates price and blockchain data
        refresh([
            "PRICE_DATA",
            "TECHNICAL_INDICATORS",
            "NETWORK_ATTRIBUTES"
        ])
    elif name == "monitor_opinions": # Updates coindesk and twitter data
        refresh([
            "COINDESK_STATS",
            "TWITTER_STATS"
        ])
    elif name == "monitor_performance": # Updates portfolio data
        refresh(["PERFORMANCE_STATS"])
    elif name == "toggle_algo": # Toggles algorithmic trading
        return
    elif name == "make_algotrade": # Makes a scheduled trade
        make_trade(payload={})
    elif name == "make_trade": # Makes a user-defined trade
        make_trade(payload={}, auto=False)
    elif name == "withdraw": # Withdraws money from user account
        return
    elif name == "deposit": # Deposits money into user account
        return
    elif name == "quit": # Quits application
        return

if __name__ == "__main__":
    action(sys.argv[1])
