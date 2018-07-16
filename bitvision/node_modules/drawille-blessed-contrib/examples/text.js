var Canvas = require('../')
var c = new Canvas(200, 100)

c.color='cyan'

for (var i=0; i<200; i++) {
   c.set(i, 5)
}

c.fontFg='white'
c.fontBg='red'
c.writeText("123", 7, 20)

c.fontFg='green'
c.fontBg='yellow'
c.writeText("456", 7, 70)

console.log(c.frame())