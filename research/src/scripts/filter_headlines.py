import pandas as pd
import os.path
import re

headlines = pd.read_csv(os.path.dirname(os.getcwd()) + "/data/coindesk_headlines.csv", sep=",")

# print(headlines)

removal_keywords = r'[Bb]itcoin [Cc]ash|bch|BCH|[Bb]itcoin [Gg]old|[Bb]tg|[Mm]onero|xmr|XMR|[Ee]thereum|eth|ETH|ripple|xrp|XRP|[Ll]itecoin|[Ll]tc|neo|cardana|ada|stellar|xlm|[Dd]oge(coin)?'
holding_keywords = r'[Bb]itcoin|BTC|btc'

removal_pattern = re.compile(removal_keywords)
holding_pattern = re.compile(holding_keywords)

headlines = headlines[headlines.Headline.str.contains(holding_pattern)]             # keep only titles with holding key
headlines = headlines[headlines.Headline.str.contains(removal_pattern) == False]    # from that, keep titles w/o removal keys

# print(headlines)

headlines.to_csv(os.path.dirname(os.getcwd()) + "/data/trimmed_headlines.csv", sep=",")
