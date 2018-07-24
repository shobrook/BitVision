let blessed = require('blessed')
let contrib = require('blessed-contrib')

// DATA

let helpMenuData = [ [ 'Keybinding',  'Action' ],
[ '---', '---'],
[ 'H', 'Open help menu'],
[ 'I', 'Focus on headlines'],
[ 'K', 'Logout'],
[ 'L', 'Login'],
[ 'O', 'Open, changes depending on focus.'],
[ 'T', 'Toggle automatic trading'],
[ 'V', 'Show version and author info'] ]

let strings = {
	authors: '# Authors\n\n Written by Jon Shobrook and Aaron Lichtman.\n -> https://www.github.com/shobrook\n -> https://www.github.com/alichtman',
	warning: '# Warning\n\n The use of this software to trade bitcoin is done at your own risk.\n We are not responsible for damages caused if our algoritm misbehaves.'
}

let screen = blessed.screen()

var layout = blessed.layout({
	parent: screen,
	top: 'center',
	left: 'center',
	width: '80%',
	height: '80%',
	border: 'line',
	layout: 'grid',
	style: {
		bg: 'red',
		border: {
			fg: 'blue'
		}
	}
});

var topleftBox = blessed.box({
  parent: layout,
  left: 0,
  top: 0,
  width: 50,
  height: 8,
  border: 'line',
  content: strings["authors"]
});

var table = blessed.listtable({
	parent: layout,
	interactive: false,
	left: 'center',
	data: helpMenuData,
	border: {
		type: "line",
	},
	// align: 'center',
	pad: 2,
	width: 40,
	height: 10,
	style: {
		border: {
			fg: 'blue'
		},
		header: {
			fg: 'red',
			bold: true,
			underline: true,
		},
		cell: {
			fg: 'green',
		}
	}
});

var middleLeftBox = blessed.box({
  parent: layout,
  aleft: 0,
  atop: 30,
  width: 75,
  height: 7,
  border: 'line',
  content: strings["warning"]
});



// Quit
screen.key(['q', 'C-c', 'escape'], function() {
	process.exit(0);
});

screen.render();
