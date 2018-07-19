// GLOBALS
"use strict"

let blessed = require('blessed')
let contrib = require('blessed-contrib')
let cp = require('child_process');

let screen = blessed.screen()

let MAX_HEADLINE_LENTH = 35

// CLI ACTION METHODS

function focusOnHeadlines() {
	headlineTable.focus()
}

/**
* Execute shell command.
**/
function executeShellCommand(command) {
	console.log(command)
	let args = command.split(" ")
  // Remove first element
  let program = args.splice(0, 1)[0];
  console.log(args)
  console.log(program)
  let cmd = cp.spawn(program, args);

  cmd.stdout.on('data', function(data) {
  	console.log('OUTPUT: ' + data);
  });

  cmd.on('close', function(code, signal) {
  	console.log('command finished...');
  });
}

// PYTHON CONTROL METHODS

function refreshData() {
	executeShellCommand("python3 refresh_data.py")
}

function retrainModel() {
	executeShellCommand("python3 retrain_model.py")
}

function executeBuyOrder(amount) {
	executeShellCommand(`python3 control.py BUY ${amount}`)
}

function executeSellOrder(amount) {
	executeShellCommand(`python3 control.py SELL ${amount}`)
}

function getRandomInteger(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)

	return Math.floor(Math.random() * (max - min)) + min
}

function getRandomSentiment() {
	return String(Math.random().toFixed(2))
}

function getRandomDate() {
	let month = Math.floor(Math.random() * 12) + 1
	let day = Math.floor(Math.random() * 30) + 1
	return `${month}/${day}`
}

function getRandomHeadline() {
	let possiblities = [ "Zerocoin's widget promises Bitcoin privacy",
	"Bitcoin is bad news for stability",
	"WikiLeaks' Assange hypes bitcoin in secret talk",
	"Butterfly Labs' Jalapeno aims to spice up bitcoin mining" ]
	return possiblities[Math.floor(Math.random() * 4)]
}

function trimIfLongerThan(text, len) {
	if (text.length > len) {
		return text.slice(0, len)
	} else {
		return text
	}
}

function zipThreeArrays(a, b, c) {
	let zipped = []
	for (var i = 0; i < a.length; i++) {
		zipped.push([a[i], b[i], c[i]])
	}
	return zipped
}


// Takes dictionary with key -> list pairs and returns a list of lists.
function unpackData(dict) {
	var listOfIndicatorData = []
	Object.keys(dict["data"]).forEach(function(key) {
		listOfIndicatorData.push([key, dict["data"][key]["value"], dict["data"][key]["signal"]])
	});

	return listOfIndicatorData
}

// TESTING DATA

let headlineDates = [...Array(16).keys()].map((key) => {
	return getRandomDate()
})

let headlines = [...Array(16).keys()].map((key) => {
	return getRandomHeadline()
})

let headlineSentiment = [...Array(16).keys()].map((key) => {
	return getRandomSentiment()
})

let headlinesTrimmed = headlines.map(str => trimIfLongerThan(str, MAX_HEADLINE_LENTH));
let headlinesZipped = zipThreeArrays(headlineDates, headlinesTrimmed, headlineSentiment)

let exchangeRateSeries = {
	title: "Exchange Rate",
	x: [...Array(24).keys()].map((key) => {
		return String(key) + ":00"
	}),
	y: [...Array(24).keys()].map((key) => {
		return key * getRandomInteger(1000, 1200)
	})
}

var signalEnum = Object.freeze ({ buy: "BUY", sell: "SELL" });

let networkIndicatorData = {
	"name": "NETWORK_DATA",
	"data": {
		"Confirmation Time": { value: "42ms", signal: signalEnum.buy },
		"Block Size": { value: "129MB", signal: signalEnum.sell },
		"Avg Transaction Cost": { value: "Val+Unit", signal: signalEnum.buy },
		"Difficulty": { value: "Val+Unit", signal: signalEnum.sell },
		"Transaction Value": { value: "Val+Unit", signal: signalEnum.buy },
		"Hash Rate": { value: "Val+Unit", signal: signalEnum.sell },
		"Transactions per Block": { value: "Val+Unit", signal: signalEnum.sell },
		"Unique Addresses": { value: "Val", signal: signalEnum.buy },
		"Total BTC": { value: "Val+Unit", signal: signalEnum.sell },
		"Transaction Fees": { value: "Val+Unit", signal: signalEnum.buy },
		"Transactions per Day": { value: "Val+Unit", signal: signalEnum.sell }
	}
}

let networkIndicators = unpackData(networkIndicatorData)
console.log(networkIndicators)

let technicalIndicatorData = {
	"name": "TECHNICAL_INDICATORS",
	"data": {
		"Rate of Change Ratio": { value: "Val", signal: signalEnum.buy },
		"Momentum": { value: "Val", signal: signalEnum.sell },
		"Avg Directional Index": { value: "Val", signal: signalEnum.buy },
		"Williams %R": { value: "Val", signal: signalEnum.sell },
		"Relative Strength Index": { value: "Val", signal: signalEnum.buy },
		"Moving Avg Convergence Divergence": { value: "Val", signal: signalEnum.sell },
		"Avg True Range": { value: "Val", signal: signalEnum.sell },
		"On-Balance Volume": { value: "Val", signal: signalEnum.buy },
		"Triple Exponential Moving Avg": { value: "Val", signal: signalEnum.sell }
	}
}

let technicalIndicators = unpackData(technicalIndicatorData)
console.log(technicalIndicators)

// LAYOUT AND WIDGETS

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

// Place tables on the left side of the screen.

var headlineTable = grid.set(0, 0, 4, 4, contrib.table,
                             { keys: true
                             	, fg: 'green'
                             	, label: 'Headlines'
                             	, interactive: true
                             	, columnSpacing: 1
                             	, columnWidth: [7, 38, 10]
                             })

headlineTable.setData({ headers: ['Date', 'Title', 'Sentiment'],
                      data: headlinesZipped})

var technicalTable = grid.set(4, 0, 3.5, 4, contrib.table,
                              { keys: true
                              	, fg: 'green'
                              	, label: 'Technical Indicators'
                              	, interactive: false
                              	, columnSpacing: 1
                              	, columnWidth: [40, 10, 10]
                              })

technicalTable.setData({ headers: ['Name', 'Value', 'Signal'],
                       data: technicalIndicators})

var networkTable = grid.set(7.2, 0, 4, 4, contrib.table,
                            { keys: true
                            	, fg: 'green'
                            	, label: 'Network Indicators'
                            	, interactive: false
                            	, columnSpacing: 1
                            	, columnWidth: [30, 15, 10]})

networkTable.setData({ headers: ['Name', 'Value', 'Signal'],
                     data: networkIndicators})


// Line chart on the right of the tables

var exchangeRateCurve = grid.set(0, 4, 6, 6, contrib.line, {
	style: {
		line: "yellow",
		text: "green",
		baseline: "black"
	},
	xLabelPadding: 3,
	xPadding: 5,
	showLegend: true,
	wholeNumbersOnly: false,
	label: "Exchange Rate"
})

// Countdown under chart

var countdown = grid.set(6, 4, 3, 3, contrib.lcd, {
	segmentWidth: 0.06,
	segmentInterval: 0.10,
	strokeWidth: 0.1,
	elements: 4,
	display: 1439,
	elementSpacing: 4,
	elementPadding: 2,
  color: 'white', // color for the segments
  label: 'Minutes Until Next Trade'
})

// countdown.setDisplay("23:59")


function setLineData(mockData, line) {
	for (var i=0; i<mockData.length; i++) {
		var last = mockData[i].y[mockData[i].y.length-1]
		mockData[i].y.shift()
		var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)
		mockData[i].y.push(num)
	}

	line.setData(mockData)
}

setLineData([exchangeRateSeries], exchangeRateCurve)

setInterval(function() {
	setLineData([exchangeRateSeries], exchangeRateCurve)
	screen.render()
}, 500)

// Quit functionality
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
	return process.exit(0);
});

// Resizing
screen.on('resize', function() {
	technicalTable.emit('attach');
	networkTable.emit('attach');
	headlineTable.emit('attach');
	exchangeRateCurve.emit('attach');
});

screen.render()
