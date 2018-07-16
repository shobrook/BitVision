
var Canvas = require('../')


var size = {height: 40, width: 80}
var c = new Canvas(size.width, size.height, require('ansi-term'));  


var data = [5, 2, 7, 3, 2]
  , max = 7
  , x = 3;


c.strokeStyle = 'normal'
c.fillStyle = 'white';


data.forEach(function(n){
  var y = 10
    , w = 4
    , h = 10 * (n / max);

  c.fillText("name", x, y + 4);

  x += 6;
});


c.strokeStyle = [123,123,50]


x = 3;

data.forEach(function(n){
  var y = 10
    , w = 4
    , h = Math.round(10 * (n / max));
    
  c.fillRect(x, y - h + 3, w, h);
  c.fillStyle = 'white';
  c.fillText(n.toString(), x + 1, y + 2);
  

  x += 6;
});


console.log(c._canvas.frame());
