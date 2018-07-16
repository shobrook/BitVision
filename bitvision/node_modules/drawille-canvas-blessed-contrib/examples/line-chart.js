
var Canvas = require('../')


//brayle canvas:
/*
var size = {height: 80, width: 160}
var c = new Canvas(size.width, size.height);
var xLabelPadding = 7
var yLabelPadding = 7
*/

//ansi canvas:

var size = {height: 40, width: 80}
var c = new Canvas(size.width, size.height, require('ansi-term'));  
var xLabelPadding = 4
var yLabelPadding = 2



var xPadding = 10;
var yPadding = 10;
            

function getMaxY() {
    var max = 0;
    
    for(var i = 0; i < data.values.length; i ++) {
        if(data.values[i].Y > max) {
            max = data.values[i].Y;
        }
    }
    
    max += 10 - max % 10;
    return max;
}

function getXPixel(val) {
    return ((size.width - xPadding) / data.values.length) * val + (xPadding * 1.5);
}

function getYPixel(val) {
    return size.height - yPadding - (((size.height - yPadding) / getMaxY()) * val);
}

c.strokeStyle = 'white'
c.fillStyle="green"

c.clearRect(0, 0, c.width, c.height);

var data = { values:[
    { X: "Jan", Y: 20 },
    { X: "Feb", Y: 10 },
    { X: "Mar", Y: 30 },
    { X: "Apr", Y: 10 }  
]};

// Draw the Y value texts
for(var i = 0; i < getMaxY(); i += 10) {    
    c.fillText(i.toString(), xPadding - xLabelPadding, getYPixel(i));    
}

// Draw the line graph
c.beginPath();

c.lineTo(getXPixel(0), getYPixel(data.values[0].Y));

for(var i = 1; i < data.values.length; i ++) {
    c.lineTo(getXPixel(i), getYPixel(data.values[i].Y));    
}

c.stroke();

c.strokeStyle = 'blue';

// Draw the axises
c.beginPath();

c.lineTo(xPadding, 0);
c.lineTo(xPadding, size.height - yPadding);
c.lineTo(size.width - xPadding, size.height - yPadding);

c.stroke();

// Draw the X value texts
for(var i = 0; i < data.values.length; i ++) {                
    c.fillText(data.values[i].X, getXPixel(i), size.height - yPadding + yLabelPadding);
}

console.log(c._canvas.frame());
