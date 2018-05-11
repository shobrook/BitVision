# alichtman
# CSV Data Entry CLI

import pandas as pd
import os.path
import sys
from colorama import Fore, Style

#  0. Change relative path below to appropriate path
#  1. Keep file closed while working with it.
#  2. IMPORTANT: Press `q` when you're done to save your work to the file.


def new_entry(index):

	print(Fore.Blue + Style.BRIGHT + "How does this headline impact the public sentiment of Bitcoin?" + Style.RESET_ALL)
	print(Fore.GREEN + Style.BRIGHT + "LINE:" + str(index) + Style.RESET_ALL)
	print(Fore.YELLOW + Style.BRIGHT + headlines["Headline"][index] + Style.RESET_ALL)

	user_input = input().lower()

	# BACK
	if user_input == 'b':
		return (user_input, True);

	# QUIT
	elif user_input == 'q':
		print("EXIT")
		headlines.to_csv(path, sep=",")
		sys.exit()

	else:
		return (user_input, False)



path = "../../data/scored_filtered_coindesk_headlines.csv"

headlines = pd.read_csv(path, sep=",")

# print(headlines)

for idx in range(len(headlines["Sentiment"])):
	# print("CURR", headlines["Sentiment"][idx])

	valid = ["-2", "-1", "0", "1", "2", "x"]

	if str(headlines["Sentiment"][idx]) not in valid:
		output = new_entry(idx)
		repeat = output[1]
		user_input = output[0]

		# print(output)
		if repeat:
			user_input = new_entry(idx - 1)[0]
			if user_input in valid:
				headlines["Sentiment"][idx-1] = user_input

			user_input = new_entry(idx)[0]

		if user_input in valid:
			headlines["Sentiment"][idx] = user_input


headlines.to_csv(path, sep=",")
