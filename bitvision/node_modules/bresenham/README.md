# node-bresenham [![Build Status](https://travis-ci.org/madbence/node-bresenham.svg?branch=master)](https://travis-ci.org/madbence/node-bresenham)

[Bresenham's line algorithm](http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm)
in node. ES6 generators are supported! \o/

## Install

```
$ npm install bresenham
```

## API

#### bresenham(x0, y0, x1, y1[, fn])

Calls `fn` with points between `(x0, y0)` and `(x1, y1)`.
The points have integer coordinates.

If `fn` is omitted, an array of points is returned.

The algorithm uses no floating point arithmetics,
so it's considered to be fast. But JS numbers are not
integers, so I'm not sure whether this is a faster
approach than the naive algorithm or not.

## ES6 API

If you `require('bresenham/generator')`, you can use the generator API.

#### bresenham(x0, y0, x1, y1)

Creates a generator that yields every point between `(x0, y0)` and `(x1, y1)`.

```js
var line = bresenham(1, 2, 3, 4);
do {
  var point = line.next().value;
  // do something
} while(point);
```

## License

MIT
