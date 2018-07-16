#!/usr/bin/env node
'use strict';

let blessed = require('blessed')
let contrib = require('blessed-contrib')

let screen = blessed.screen()

//create layout and widgets

var grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

var transactionsLine = grid.set(0, 0, 6, 6, contrib.line,
          { showNthLabel: 5
          , maxY: 100
          , label: 'Total Transactions'
          , showLegend: true
, legend: {width: 10}})

var technicalTable =  grid.set(4, 9, 4, 3, contrib.table,
  { keys: true
  , fg: 'green'
  , label: 'Technical Indicators'
  , columnSpacing: 1
, columnWidth: [24, 10, 10]})

var networkTable =  grid.set(4, 9, 4, 3, contrib.table,
  { keys: true
  , fg: 'green'
  , label: 'Network Indicators'
  , columnSpacing: 1
, columnWidth: [24, 10, 10]})

var headlineTable =  grid.set(4, 9, 4, 3, contrib.table,
  { keys: true
  , fg: 'green'
  , label: 'Headlines'
  , columnSpacing: 1
, columnWidth: [24, 10, 10]})


//set line charts dummy data

var transactionsData = {
   title: 'USA',
   style: {line: 'red'},
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40',
   '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00',
   '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20',
   '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
   y: [0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70,
   50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80, 72, 70]
}

var transactionsData1 = {
   title: 'Europe',
   style: {line: 'yellow'},
   x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40',
   '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00',
   '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20',
   '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
   y: [0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15,
   15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30]
}


function setLineData(mockData, line) {
  for (var i=0; i<mockData.length; i++) {
    var last = mockData[i].y[mockData[i].y.length-1]
    mockData[i].y.shift()
    var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)
    mockData[i].y.push(num)
  }

  line.setData(mockData)
}

setLineData([transactionsData, transactionsData1], transactionsLine)

setInterval(function() {
   setLineData([transactionsData, transactionsData1], transactionsLine)
   screen.render()
}, 500)

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.on('resize', function() {
  technicalTable.emit('attach');
  transactionsLine.emit('attach');
});

screen.render()
