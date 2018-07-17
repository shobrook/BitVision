import sys
from .monitor import refresh
from .trader import fit_model, make_trade

def action(name):
    if name == "LOGIN": # Logs in and initializes trading client
        return
    elif name == "RETRAIN": # Retrains and serialize the model
        fit_model().serialize("../data/trader_model.pkl")
    elif name == "MONITOR_NETWORK": # Updates price and blockchain data
        refresh([
            "PRICE_DATA",
            "TECHNICAL_INDICATORS",
            "NETWORK_ATTRIBUTES"
        ])
    elif name == "MONITOR_OPINIONS": # Updates coindesk and twitter data
        refresh([
            "COINDESK_STATS",
            "TWITTER_STATS"
        ])
    elif name == "MONITOR_PERFORMANCE": # Updates portfolio data
        refresh(["PERFORMANCE_STATS"])
    elif name == "TOGGLE_ALGO": # Toggles algorithmic trading
        return
    elif name == "MAKE_ALGOTRADE": # Makes a scheduled trade
        make_trade(payload={})
    elif name == "MAKE_TRADE": # Makes a user-defined trade
        make_trade(payload={}, auto=False)
    elif name == "WITHDRAW": # Withdraws money from user account
        return
    elif name == "DEPOSIT": # Deposits money into user account
        return
    elif name == "QUIT": # Quits application
        return

if __name__ == "__main__":
    action(sys.argv[1])
