
var Canvas = require('drawille-canvas-blessed-contrib').Canvas
var Map = require('../map')

var size = {height: 140, width: 220}
canvas = new Canvas(size.width, size.height)
var ctx = canvas.getContext()
ctx.strokeStyle="green"
ctx.fillStyle="green"
ctx.clearRect(0, 0, canvas.width, canvas.height);

var options = { excludeAntartica: true
              , disableBackground: true
              , disableMapBackground: true
              , disableGraticule: true
              , disableFill: true
              , height: size.height
              , width: size.width }

var map = new Map(options, canvas)
map.draw()
map.addMarker( {"lon" : "-122", "lat" : "37", color: "red", char: "X" } )

console.log(ctx._canvas.frame());
