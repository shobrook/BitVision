var x256 = require('x256');

function AnsiTerminal(width, height) {
  this.width = width;
  this.height = height;
  this.clear()

  this.fontFg='normal'
  this.fontBg='normal'
  this.color='normal'
}

exports.colors = {
    black: 0
  , red: 1
  , green: 2
  , yellow: 3
  , blue: 4
  , magenta: 5
  , cyan: 6
  , white: 7
};

function getFgCode(color) {
    // String Value
    if(typeof color == 'string' && color != 'normal') {
        return '\033[3' + exports.colors[color] + 'm';
    }
    // RGB Value
    else if (Array.isArray(color) && color.length == 3)
    {
        return '\033[38;5;' + x256(color[0],color[1],color[2]) + 'm';
    }
    // Number
    else if (typeof color == 'number')
    {
        return '\033[38;5;' + color + 'm';
    }
    // Default
    else
    {
        return '\033[39m'
    }
}

function getBgCode(color) {
    // String Value
    if(typeof color == 'string' && color != 'normal') {
        return '\033[4' + exports.colors[color] + 'm';
    }
    // RGB Value
    else if (Array.isArray(color) && color.length == 3)
    {
        return '\033[48;5;' + x256(color[0],color[1],color[2]) + 'm';
    }
    // Number
    else if (typeof color == 'number')
    {
        return '\033[48;5;' + color + 'm';
    }
    // Default
    else
    {
        return '\033[49m'
    }
}

var methods = {
  set: function(coord) {  
    var color = getBgCode(this.color);
    this.content[coord] = color + ' \033[49m';    
  },
  unset: function(coord) {    
    this.content[coord] = null;
  },
  toggle: function(coord) {    
    this.content[coord] == this.content[coord]==null?'p':null;
  }
};

Object.keys(methods).forEach(function(method) {
  AnsiTerminal.prototype[method] = function(x, y) {
    if(!(x >= 0 && x < this.width && y >= 0 && y < this.height)) {
      return;
    }    
    var coord = this.getCoord(x, y)
    methods[method].call(this, coord);
  }
});

AnsiTerminal.prototype.getCoord = function(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);    
    return x + this.width*y;
}

AnsiTerminal.prototype.clear = function() {
  this.content = new Array(this.width*this.height);
};

AnsiTerminal.prototype.measureText = function(str) {
  return {width: str.length * 1}
};

AnsiTerminal.prototype.writeText = function(str, x, y) {  
  //console.log(str + ": " + x + "," + y)
  var coord = this.getCoord(x, y)
  for (var i=0; i<str.length; i++) {    
    this.content[coord+i]=str[i]
  }

  var bg = getBgCode(this.color);
  var fg = getFgCode(this.fontFg);
  
  this.content[coord] = fg + bg +  this.content[coord]
  this.content[coord+str.length-1] += '\033[39m\033[49m'

}

AnsiTerminal.prototype.frame = function frame(delimiter) {  
  delimiter = delimiter || '\n';
  var result = [];
  for(var i = 0, j = 0; i < this.content.length; i++, j++) {
    if(j == this.width) {
      result.push(delimiter);
      j = 0;
    }

    if(this.content[i] == null) {
      result.push(' ');
    } else {
      result.push(this.content[i])
    }
  }
  result.push(delimiter);
  return result.join('');
};



module.exports = AnsiTerminal;
