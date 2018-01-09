# The scrapeconfig.py config file contains all xpaths for the websites that are being scraped
# Since this scraper is modular, you can edit the scrapeconfig.py file to use this
# scraper to collect data from ANY news website with a results and article page
# Just make sure you set correct XPaths for the properties you want to collect

### Scrape Config ###

#Predefine xpath selectors for article info we want to scrape here.
#These are basically the structure configs for each separate website
#Change these in case the website changes; modular, doesn't break anything else
#References parsed LXML tree, so just putting it in the loop for now
#Need to do if statements, otherwise you'd get list index errors

def pageConfig(source, tree):

	#Sometimes a link is broken and it returns a 404, just checking page title
	#and returning a False for the config
	pageTitle = tree.find(".//title").text
	notFoundFilters = ['404', 'Not Found','Not found']
	if any(notFoundFilter in pageTitle for notFoundFilter in notFoundFilters):
		return False

	#In general, we find all paragraphs in the article body section, and then just merge them with join
	if source == 'newsbitcoin':
		try:
			config = {'articleTitle': tree.xpath('//h1[@class="entry-title"]')[0].text,
								#'articleText': " ".join(str(paragraph.text_content()) for paragraph in tree.xpath('//div[@class="td-post-content"]/p')),
								'articleAuthor': " & ".join(str(author.text) for author in tree.xpath('//div[@class="td-post-author-name"]/a')),
								'articleDate': tree.xpath('//meta[@property="article:published_time"]')[0].get('content')}
		except:
			print("\n######### NEWSBITCOIN PARSING ERROR #########\n")
			config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}
	#Also doing the join for authors, as there might be more than one, or none at all
	elif source == 'bloomberg':
		try:
			config = {'articleTitle':tree.xpath('//h1[contains(@class, "__hed")]/span')[0].text,
								#'articleText':" ".join(str(paragraph.text_content()) for paragraph in tree.xpath('//div[@class="body-copy"]/p')),
								'articleAuthor':" & ".join(str(author.text) for author in tree.xpath('//div[@class="author"]')),
								'articleDate':tree.xpath('//time[@class="article-timestamp"]')[0].get('datetime')}
		except:
			print("\n######### BLOOMBERG PARSING ERROR #########\n")
			config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}
	#Reuters seems to append random chars to div classes, so use regexp 'contains' to bypass
	elif source == 'reuters':
		try:
			config = {'articleTitle':tree.xpath('//h1')[0].text,
							#'articleText':" ".join(str(paragraph.text_content()) for paragraph in tree.xpath('//div[contains(@class, "ArticleBody_body_")]/p')),
							'articleAuthor':" & ".join(str(author.text) for author in tree.xpath('//p[contains(@class, "ArticleHeader_byline_")]/a')),
							'articleDate':tree.xpath('//div[contains(@class, "ArticleHeader_date_")]')[0].text}
		except:
			print("\n######### REUTERS PARSING ERROR #########\n")
			config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}
	#NOTE: WSJ has a paywall - if you want the full article text, set the appropriate headers and cookies in parseHTML function (I don't have them)
	#For now, only the article snippet will be collected
	elif source == 'wsj':
		try:
			config = {'articleTitle':tree.xpath('//h1[@class="wsj-article-headline"]')[0].text,
							#'articleText':" ".join(str(paragraph.text_content()) for paragraph in tree.xpath('//div[@class="wsj-snippet-body"]/p')),
							'articleAuthor':" & ".join(str(author.text) for author in tree.xpath('//span[@class="name"]')),
							'articleDate':tree.xpath('//time[@class="timestamp"]')[0].text}
		except:
			print("\n######### WSJ PARSING ERROR #########\n")
			config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}
	elif source == 'cnbc':
		try:
			config = {'articleTitle':tree.xpath('//h1[@class="title"]')[0].text,
							#'articleText':" ".join(str(paragraph.text_content()) for paragraph in tree.xpath('//div[@itemprop="articleBody"]/p')),
							'articleAuthor':" & ".join(str(author.text) for author in tree.xpath('//span[@itemprop="name"]')),
							'articleDate':tree.xpath('//time[@class="datestamp"]')[0].get('datetime')}
		except:
			print("\n######### CNBC PARSING ERROR #########\n")
			config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}
	elif source == 'coindesk':
		try:
			config = {'articleTitle':tree.xpath('//h3[@class="featured-article-title"]')[0].text,
							#'articleText':" ".join(str(paragraph.text_content()) for paragraph in tree.xpath('//div[@class="article-content-container noskimwords"]/p')),
							'articleAuthor':" & ".join(str(author.text) for author in tree.xpath('//div[@class="article-meta"]/p[@class="timeauthor"]/a')),
							'articleDate':tree.xpath('//div[@class="article-meta"]/p[@class="timeauthor"]/time')[0].get('datetime')}
		except:
			print("\n######### COINDESK PARSING ERROR #########\n")
			config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}
	else:
		config = {"articleTitle": "N/A", "articleAuthor": "N/A", "articleDate": "N/A"}

	#Return it here instead of inside if-statement, will terminate before anyways if no config is found
	return config

#Another config dict for the results pages. Contains iterative URL and xpath for items, individual URL (relative), and date
#At this point, all the Xpath references are strings, so they aren't called yet
#Because they aren't called directly, we don't need to use if-statements like we do above

#The dateOnPage key states whether it is possible to collect datetime objects from the results page, if not get it from the article page
#Needs currentPage parameter, otherwise the pageURL reference breaks

'''
Config dict keys:
# - pageURL: numerative URL with increasing page count
# - itemXpath: XPath for the search result item container
# - urlXpath: XPath for URL to full article, relative from itemXpath (./)
# - dateXpath: XPath for article date, will look for datetime object. Will allow scraper to terminate if it is in a date range you do not want to collect
# - dateOrdered: Simply states whether search results are ordered by date (descending)
# - dateOnPage: States whether the search result has a datetime object. If not, get the actual date from full article page
# - resultsPerPage: How many results are shown per page, used to terminate at the last page (results < n)
'''

def resultsConfig(currentPage):
	#Split variabl assignment and return, otherwise the currentPage is undefined upon return
	config = {'coindesk':{'pageURL':'https://www.coindesk.com/page/'+str(currentPage)+'/?s=bitcoin',
						'itemXpath':'//div[@class="post-info"]',
						'urlXpath':'./h3/a',
						'dateOnPage':True,
						'dateOrdered':True,
						'baseURL':'https://coindesk.com',
						'resultsPerPage':10,
						'dateXpath':'./p[@class="timeauthor"]/time'},

				'bloomberg':{'pageURL':'https://www.bloomberg.com/search?query=Bitcoin&page='+str(currentPage),
						'itemXpath':'//div[@class="search-result-story__container"]',
						'urlXpath':'./h1/a',
						'dateOnPage':True,
						'dateOrdered':True,
						'baseURL':'https://www.bloomberg.com',
						'resultsPerPage':10,
						'dateXpath':'./div[@class="search-result-story__metadata"]/span[@class="metadata-timestamp"]/time'},

				'reuters':{'pageURL':'http://www.reuters.com/search/news?blob=bitcoin&sortBy=date&dateRange=all&pn='+str(currentPage),
						'itemXpath':'//div[@class="search-result-content"]',
						'urlXpath':'./h3/a',
						'dateOnPage':False,
						'dateOrdered':True,
						'baseURL':'http://www.reuters.com',
						'resultsPerPage':10,
						'dateXpath':'HERE'},

				'wsj':{'pageURL':'https://www.wsj.com/search/term.html?KEYWORDS=Bitcoin&min-date=2010/07/24&max-date=2017/07/24&daysback=4y&isAdvanced=true&andor=AND&sort=date-desc&source=wsjarticle&page='+str(currentPage),
						'itemXpath':'//div[@class="headline-container"]',
						'urlXpath':'./h3/a',
						'dateOnPage':False,
						'baseURL':'https://wsj.com',
						'dateOrdered':True,
						'resultsPerPage':20,
						'dateXpath':'./div[@class="article-info"]/ul/li/time[@class="date-stamp-container highlight"]'},

				'cnbc':{'pageURL':'http://search.cnbc.com/rs/search/view.html?partnerId=2000&keywords=BITCOIN&sort=date&type=news&source=CNBC.com,The%20Reformed%20Broker,Buzzfeed,Estimize,Curbed,Polygon,Racked,Eater,SB%20Nation,Vox,The%20Verge,Recode,Breakingviews,NBC%20News,The%20Today%20Show,Fiscal%20Times,The%20New%20York%20Times,Financial%20Times,USA%20Today&assettype=partnerstory,blogpost,wirestory,cnbcnewsstory&pubtime=0&pubfreq=a&page='+str(currentPage),
						'itemXpath':'//div[@class="searchResultCard"]',
						'urlXpath':'./h3/a',
						'dateOnPage':False,
						'dateOrdered':True,
						'baseURL':'http://cnbc.com',
						'resultsPerPage':10,
						'dateXpath':'./time'},

				'newsbitcoin':{'pageURL':'https://news.bitcoin.com/page/'+str(currentPage)+'/?s=Bitcoin',
						'itemXpath':'//div[@class="item-details"]',
						'urlXpath':'./h3/a',
						'dateOnPage':True,
						'dateOrdered':True,
						'baseURL':'https://news.bitcoin.com',
						'resultsPerPage':10,
						'dateXpath':'./div[@class="td-module-meta-info"]/span/time'}
				}
	return config

### End Scrape Config ###



import multiprocessing

#regex for some string locations
import re
import requests
import json
import ftfy

#Parsing CLI arguments
import argparse

#LXML as main HTML parser. Has nice Xpath selection, works everywhere
from lxml import html
from lxml import etree

#dateparser to handle different types of date formats on articles
from dateutil.parser import parse as dateParse

import csv
import time

#Setting default to UTF8 to deal with pesky ascii errors in python 2.x
import sys
import importlib

importlib.reload(sys)

def parsedHTML(url):
	#This function handles the web requests and parses the HTML into an lxml tree
	#Headers so we don't get 403 forbidden errors
	headers = {
		'accept-encoding': 'gzip, deflate, br',
		'accept-language': 'en-US,en;q=0.8',
		'upgrade-insecure-requests': '1',
		'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36',
		'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'cache-control': 'max-age=0',
		'authority': 'news.bitcoin.com',
		'cookie': '__cfduid=d784026513c887ec39604c0f35333bb231500736652; PHPSESSID=el5c5j7a26njfvoe2dh6fnrer3; _ga=GA1.2.552908756.1500736659; _gid=GA1.2.2050113212.1500736659',
	}
	page = requests.get(url, headers=headers)
	tree = html.fromstring(page.content)
	return tree

def collectArticles(urls, source, args, filename):
	#Loop over all the URLS that were collected in the parent function
	for url in urls:

		tree = parsedHTML(url)

		#Initialize empty text string, add paragraphs when collected
		articleText = ""

		#The function that is called here is from the scrapeconfig.py file (imported)
		#Have to pass the tree along with the source key, otherwise it cant access xpaths
		print(url)
		config = pageConfig(source, tree)

		#If page was not found, continue to next URL
		if config == None:
			continue

		#Based on xpaths defined above, call correct selector for current source
		#Could just pass the config selectors to the array, but for the sake of cleanliness...

		articleTitle = ftfy.fix_text(config['articleTitle'])
		#articleText = config['articleText']
		articleAuthor = config['articleAuthor']
		#Storing it as a datetime object
		articleDate = config['articleDate']

		#Check against the year argument, terminate if it turns out the year for the current
		#article is < than the year you want to collect from (no point in continuing then)
		#if it does not match, don't write, if it's smaller, terminate


		# print("Length of thing: ", len(str(dateParse(articleDate).year)))
		# print(type(articleDate.year))
		# print("\n", type(dateParse(articleDate).year), "\n")
		# print("SCRAPE YEAR: ", args.scrapeYear)
		# print("ARTICLE DATE DATA: ", str(dateParse(articleDate).year))
		# print("ARTICLE DATE: ", str(dateParse(articleDate).year))
		# print(args.scrapeYear and dateParse(articleDate).year)

		if args.scrapeYear and dateParse(articleDate).year < int(args.scrapeYear):
			break
		elif args.scrapeYear and int(str(dateParse(articleDate).year)) != int(args.scrapeYear):
			pass
		else:
			csvwriter = csv.writer(open(filename, "a"))
			csvwriter.writerow([articleDate, articleTitle, articleAuthor, url, articleText])


def getArticleURLS(source, args):
	#Create filename where everything is stored eventually. Doing str(int()) so the time is rounded off
	filename = source+'_ARTICLES_'+str(int(time.time()))+'.csv'
	urls = []
	currentPage = 1
	print(currentPage)
	hasNextPage = True
	outOfRange = False
	while hasNextPage and not outOfRange:
		print('setting dict')
		#Parse HTML, invoke config (x)paths
		tree = parsedHTML(resultsConfig(currentPage)[source]['pageURL'])
		items = tree.xpath(resultsConfig(currentPage)[source]['itemXpath'])

		print('looping over items')
		#For every item on the search results page...
		for item in items:
			#Here we invoke the correct Xpaths from the config dict above

			#Not every results page correctly displays datetime in result, so if it's not here
			#do the check when fetching the articles. Else, if its ordered by date just terminate if the current article date is < the year youre scraping
			if resultsConfig(currentPage)[source]['dateOnPage'] and resultsConfig(currentPage)[source]['dateOrdered'] and args.scrapeYear:
				articleDate = dateParse(item.xpath(resultsConfig(currentPage)[source]['dateXpath'])[0].get('datetime'))

				#If we already see that the article date is not from a year we want to collect (eg if from 2014 and 2015 was specified)
				#then we just terminate the while loop. Only works one way, as articles are ordered by date, so can only do if smaller
				if articleDate.year < int(args.scrapeYear):
					outOfRange = True
				#Note that it then just terminates on the next page (since there is no 'break' statement for the while loop)

			articleURL = item.xpath(resultsConfig(currentPage)[source]['urlXpath'])[0].get('href')

			#Some websites have relative URL pointers, so prefix the base URL
			if '://' not in articleURL:
				articleURL = resultsConfig(currentPage)[source]['baseURL']+articleURL

			#Urlfilter hack to prevent video/audio/gadfly pages from being visited (mostly bloomberg)
			#These pages have custom xpath structures, so not even bothering collecting them
			urlFilters = ['/videos/','/audio/','/gadfly/','/features/','/press-releases/']
			#If any of the above strings is in the url, pass writing it, else write it
			if any(urlFilter in articleURL for urlFilter in urlFilters):
				pass
			else:
				urls.append(articleURL)

		#If there are less items in the results than the resultsPerPage param, we assume this is the last page
		if len(items) < resultsConfig(currentPage)[source]['resultsPerPage']:
			hasNextPage = False

		#Increase page number by 1 for the next iteration of the while loop
		currentPage += 1

		#Once all URLs for the page have been collected, go visit the actual articles
		#Do this here so it doesn't first collect too many URLs that are useless afterwards
		collectArticles(urls, source, args, filename)
		#Reinitialize URLS array again for next loop
		urls = []


if __name__ == '__main__':

	#Neat way of inputting CLI arguments
	parser = argparse.ArgumentParser(description='Scrape news articles')
	parser.add_argument("--year", dest="scrapeYear", required=False, help="Specify a specific year to collect from")
	parser.add_argument('--sources', nargs='+', dest="sources", help='Set the news websites you want to collect from', required=False)
	args = parser.parse_args()
	print(args.scrapeYear)
	print(args.sources)

	#Check if some sources are defined as input argument, otherwise just go over all
	allSources = ['coindesk','reuters','newsbitcoin','wsj','cnbc','bloomberg']
	if args.sources:
		visitSources = args.sources
	else:
		visitSources = allSources

	for source in visitSources:
		#Using multiprocessing to speed things up a little. Creates new process thread for every source channel o
		#Calling getArticleURLS will also call child function that collects the actual articles
		p = multiprocessing.Process(target=getArticleURLS, args=(source, args))
		p.start()
		print('started thread')
