let blessed = require('blessed')

// Global functions

function validateInput(value) {
  if (value != "") {
    return true;
  }
  return 'You must enter some value here.';
}

// TODO: WHY DOES THIS RETURN UNDEFINED AKSDJFALKJDFALKD
var x = checkForDotFile()
console.log(x)

// let screen = blessed.screen()

// Custom cursor
var screen = blessed.screen({
  cursor: {
    artificial: true,
    shape: 'line',
    blink: true,
    color: null // null for default
  }
});

var form = blessed.form({
  parent: screen,
  keys: true,
  top: 'center',
  left: 'center',
  width: '20%',
  height: '50%',
  bg: 'black',
  color: 'white',
});

// Text Boxes for Key, Passphrase and Secret

let textBoxStyle = {
  fg: "#8b345a",
  bg: "#7acba8",
  focus: {
    // bg: 'q
  },
  hover: {
    fg: 'red',
    bg:  'orange'
  },
  border: {
      fg: '#f0f0f0'
    },
}

var apiKeyTextBox = blessed.textbox({
  parent: form,
  tags: true,
  keys: true,
  border: {
    type: "line"
  },
  top: 2,
  left: 2,
  interactive: true,
  width: '80%',
  height: "14%",
  content: "Enter {bold}API key{\bold}.",
  style: textBoxStyle
})

// Submit and Cancel buttons

var submit = blessed.button({
  parent: form,
  mouse: true,
  keys: true,
  shrink: true,
  right: 2,
  bottom: 1,
  padding: {
    left: 2,
    right: 2,
  },
  shrink: true,
  name: 'submit',
  content: 'submit',
  style: {
    bg: 'blue',
    focus: {
      bg: 'green',
      fg: 'black'
    },
    hover: {
      bg: 'green',
      fg: 'black'
    }
  }
});

var skip = blessed.button({
  parent: form,
  mouse: true,
  keys: true,
  shrink: true,
  left: 2,
  bottom: 1,
  padding: {
    left: 2,
    right: 2,
  },
  name: 'skip',
  content: 'skip',
  style: {
    bg: 'blue',
    focus: {
      bg: 'red',
      fg: 'black'
    },
    hover: {
      bg: 'red',
      fg: 'black'
    }
  }
});

submit.on('press', function() {
  form.submit();
});

skip.on('press', function() {
  process.exit(0);
});

form.on('submit', function(data) {
  form.setContent('Submitted.');
  screen.render();
});

screen.key(['q', 'C-c'], function() {
  process.exit(0);
});

screen.render();
