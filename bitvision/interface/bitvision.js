// GLOBALS
"use strict"

let blessed = require('blessed')
let contrib = require('blessed-contrib')
let cp = require('child_process');

let screen = blessed.screen()

function getRandomInteger(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)

  return Math.floor(Math.random() * (max - min)) + min
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

// CONTROL METHODS

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

// TESTING DATA

let exchangeRateSeries = {
  title: "Exchange Rate",
  x: [...Array(24).keys()].map((key) => {
    return String(key) + ":00"
  }),
  y: [...Array(24).keys()].map((key) => {
    return key * getRandomInteger(1000, 1200)
  })
}

let headlines = [ [ "10/29 12:39", "Zerocoin's widget promises Bitcoin privacy", "0.39"],
[ "10/29 2:15", "Bitcoin is bad news for stability", "0.54"],
[ "10/29 8:15", "WikiLeaks' Assange hypes bitcoin in secret talk", "0.43"],
[ "10/29 12:15", "Butterfly Labs' Jalapeno aims to spice up bitcoin mining", "0.34"] ]

// TODO: Turn that into a generator
// TODO: Add Techinical Indicators

// LAYOUT AND WIDGETS

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

// Place tables on the left side of the screen.

var headlineTable = grid.set(0, 0, 4, 4, contrib.table,
                             { keys: true
                              , fg: 'green'
                              , label: 'Headlines'
                              , interactive: true
                              , columnSpacing: 1
                              , columnWidth: [12, 35, 15]
                            })


// Allow scrolling
headlineTable.setData({ headers: ['Date', 'Title', 'Sentiment'],
                      data: headlines})

var technicalTable = grid.set(4, 0, 4, 4, contrib.table,
                              { keys: true
                                , fg: 'green'
                                , label: 'Technical Indicators'
                                , columnSpacing: 1
                                , columnWidth: [24, 10, 10]
                              })

var networkTable = grid.set(8, 0, 4, 4, contrib.table,
                            { keys: true
                              , fg: 'green'
                              , label: 'Network Indicators'
                              , columnSpacing: 1
                              , columnWidth: [24, 10, 10]})

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
  segmentWidth: 0.06, // how wide are the segments in % so 50% = 0.5,
  segmentInterval: 0.11, // spacing between the segments in % so 50% = 0.550% = 0.5,
  strokeWidth: 0.11, // spacing between the segments in % so 50% = 0.5
  elements: 5, // how many elements in the display. or how many characters can be displayed.
  display: "23:59", // what should be displayed before first call to setDisplay
  elementSpacing: 3, // spacing between each element
  elementPadding: 2, // how far away from the edges to put the elements
  color: 'white', // color for the segments
  label: 'Time Until Next Trade'
})

// var lcdLineOne = grid.set(0,9,2,3, contrib.lcd,
//   {
//     label: "LCD Test",
//     segmentWidth: 0.06,
//     segmentInterval: 0.11,
//     strokeWidth: 0.1,
//     elements: 5,
//     display: "32:10",
//     elementSpacing: 4,
//     elementPadding: 2
//   }
// );

countdown.setDisplay("23:59")


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
