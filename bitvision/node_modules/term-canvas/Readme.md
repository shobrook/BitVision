
# term-canvas

  experimental html canvas API for the terminal written with node.js.

 ![terminal canvas chart](http://f.cl.ly/items/0s112y02180S0l0N0u12/Grab.png)

  ![terminal canvas grid](http://f.cl.ly/items/3t3616131p0N032p1906/Screenshot.png)

## Installation

```
$ npm install term-canvas
```

## Examples

### States

  ![state](http://f.cl.ly/items/0H1E3u371y1o3q2l2G2p/Grab.png)

 Source:

```js
var Canvas = require('term-canvas');

var canvas = new Canvas(50, 100)
  , ctx = canvas.getContext('2d');

ctx.fillStyle = 'red';
ctx.fillRect(5, 5, 20, 10);
ctx.save();

ctx.fillStyle = 'blue';
ctx.fillRect(6, 6, 18, 8);
ctx.save();

ctx.fillStyle = 'yellow';
ctx.fillRect(7, 7, 16, 6);

ctx.restore();
ctx.fillRect(8, 8, 14, 4);

ctx.restore();
ctx.fillRect(9, 9, 12, 2);

console.log('\n\n\n\n\n');
ctx.resetState();
```

### Fill styles

 Static colored rects with no draw loop:
 
 ![rects](http://f.cl.ly/items/3v3F3j2C0Q3H3t1C0r29/Grab.png)

Source:

```js
var Canvas = require('term-canvas');

var canvas = new Canvas(50, 100)
  , ctx = canvas.getContext('2d');

ctx.fillStyle = 'red';
ctx.fillRect(5, 5, 20, 10);

ctx.fillStyle = 'blue';
ctx.fillRect(27, 5, 20, 10);

ctx.fillStyle = 'yellow';
ctx.fillRect(49, 5, 20, 10);

console.log('\n\n\n');
ctx.resetState();

```

### Animation

  ![animated rects](http://f.cl.ly/items/0s121k3C2R1R0q2w2I1y/Grab.png)

 Source:

```js
var Canvas = require('term-canvas')
  , size = process.stdout.getWindowSize();

process.on('SIGINT', function(){
  ctx.reset();
  process.nextTick(function(){
    process.exit();
  });
});

process.on('SIGWINCH', function(){
  size = process.stdout.getWindowSize();
  canvas.width = size[0];
  canvas.height = size[1];
  x2 = x = 1;
  y2 = y = 1;
});

var canvas = new Canvas(size[0], size[1])
  , ctx = canvas.getContext('2d')
  , x = 1
  , y = 2
  , sx = 2
  , sy = 2
  , x2 = 1
  , y2 = 5
  , sx2 = 1
  , sy2 = 1;

ctx.hideCursor();
setInterval(function(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'blue';
  ctx.strokeRect(1, 1, canvas.width - 1, canvas.height - 1);
  ctx.strokeStyle = 'green';
  ctx.strokeRect(x += sx, y += sy, 30, 5);
  ctx.fillStyle = 'yellow';
  ctx.fillRect(x2 += sx2, y2 += sy2, 12, 5);
  ctx.fillStyle = 'white';
  ctx.fillText('Rectangle', x2 + 1, y2 + 2);
  ctx.moveTo(0, 10);
  if (x + 30 >= canvas.width || x <= 1) sx = -sx;
  if (x2 + 10 >= canvas.width || x2 <= 1) sx2 = -sx2;
  if (y + 5 >= canvas.height || y <= 1) sy = -sy;
  if (y2 + 5 >= canvas.height || y2 <= 1) sy2 = -sy2;
}, 1000 / 20);
```

## Tests

  There are none! currently testing with OSX "Terminal".

## License 

(The MIT License)

Copyright (c) 2011 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.