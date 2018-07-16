var Canvas = require('../');
var line = require('bresenham');

var c = new Canvas(160, 160);

function draw() {
  c.clear();
  var t = new Date();
  var sin = function(i, l) {
    return Math.floor(Math.sin(i*2*Math.PI)*l+80);
  }, cos = function(i, l) {
    return Math.floor(Math.cos(i*2*Math.PI)*l+80);
  };
  line(80, 80, sin(t.getHours()/24, 30), 160-cos(t.getHours()/24, 30), c.set.bind(c));
  line(80, 80, sin(t.getMinutes()/60, 50), 160-cos(t.getMinutes()/60, 50), c.set.bind(c));
  line(80, 80, sin(t.getSeconds()/60+(+t%1000)/60000, 75), 160-cos(t.getSeconds()/60+(+t%1000)/60000, 75), c.set.bind(c));
  process.stdout.write(c.frame());
}

setInterval(draw, 1000/24);
