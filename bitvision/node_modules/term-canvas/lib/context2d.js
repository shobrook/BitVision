
/**
 * Module dependencies.
 */

var State = require('./state');

/**
 * Expose `Context2d`.
 */

exports = module.exports = Context2d;

/**
 * Math.
 */

var abs = Math.abs
  , round = Math.round;

/**
 * Color map.
 */

exports.colors = {
    black: 0
  , red: 1
  , green: 2
  , yellow: 3
  , blue: 4
  , magenta: 5
  , cyan: 6
  , white: 7
  , normal: 9
};

/**
 * Initialize a new 2d canvas rendering context.
 *
 * @param {Canvas} canvas
 * @api private
 */

function Context2d(canvas) {
  this.canvas = canvas;
  this.beginPath();
  this.states = [];
  this.save();
}

/**
 * Return the current `State` object.
 *
 * @return {State}
 * @api private
 */

Context2d.prototype.state = function(){
  return this.states[this.states.length - 1];
};

/**
 * Get additive state `prop`.
 *
 * @param {String} prop
 * @return {Number}
 * @api private
 */

Context2d.prototype.getState = function(prop){
  return this.states.reduce(function(sum, state){
    return sum + state[prop];
  }, 0);
};

/**
 * Push a new `State` object to the stack.
 *
 * @api public
 */

Context2d.prototype.save = function(){
  this.states.push(new State);
};

/**
 * Pop the state stack.
 *
 * @api public
 */

Context2d.prototype.restore = function(){
  this.states.pop();
};

/**
 * Begin a new path.
 *
 * @api public
 */

Context2d.prototype.beginPath = function(){
  this.path = [];
};

/**
 * Write the given `str`.
 *
 * @param {String} str
 * @api public
 */

Context2d.prototype.write = function(str){
  if (process.env.DEBUG) {
    console.dir(str);
  } else {
    this.canvas.stream.write(str);
  }
};

/**
 * Hide the cursor.
 *
 * @api public
 */

Context2d.prototype.hideCursor = function(){
  this.write('\033[?25l');
};

/**
 * Show the cursor.
 *
 * @api public
 */

Context2d.prototype.showCursor = function(){
  this.write('\033[?25h');
};

/**
 * Set fill style.
 *
 * @param {String} val
 * @api public
 */

Context2d.prototype.__defineSetter__('fillStyle', function(val){
  this.state().fill = val;
});

/**
 * Set stroke style.
 *
 * @param {String} val
 * @api public
 */

Context2d.prototype.__defineSetter__('strokeStyle', function(val){
  this.state().stroke = val;
});

/**
 * Move to the given point.
 *
 * @param {Number} x
 * @param {Number} y
 * @api public
 */

Context2d.prototype.moveTo = function(x, y){
  x = round(x);
  y = round(y);
  this.write('\033[' + y + ';' + x + 'H');
};

/**
 * Scale (`x`, `y`) or (`x`, `x`).
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Context2d}
 * @api public
 */

Context2d.prototype.scale = function(x, y){
  if (2 == arguments.length) {
    this.state().scaleX = Math.max(x, 0);
    this.state().scaleY = Math.max(y, 0);
    return this;
  } else {
    return this.scale(x, x);
  }
};

/**
 * Translate (`x`, `y`).
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Context2d}
 * @api public
 */

Context2d.prototype.translate = function(x, y){
  this.state().translateX = Math.max(x, 0);
  this.state().translateY = Math.max(y, 0);
  return this;
};

/**
 * Plot line with the given points using
 * Bresenham's line algo.
 *
 * @param {Object} a
 * @param {Object} b
 * @api private
 */

Context2d.prototype.line = function(a, b){
  var steep = abs(b.y - a.y) > abs(b.x - a.x)
    , tmp;

  if (steep) {
    tmp = a.y;
    a.y = a.x;
    a.x = tmp;

    tmp = b.y;
    b.y = b.x;
    b.x = tmp;
  }

  if (a.x > b.x) {
    tmp = b.x;
    b.x = a.x;
    a.x = tmp;

    tmp = b.y;
    b.y = a.y;
    a.y = tmp;
  }

  var dx = b.x - a.x
    , dy = abs(b.y - a.y)
    , err = 0
    , derr = dy / dx;

  var ystep
    , y = a.y;

  ystep = a.y < b.y
    ? 1
    : -1;

  for (var x = a.x; x < b.x; ++x) {
    if (steep) {
      this.moveTo(y, x);
      this.write(' ');
    } else {
      this.moveTo(x, y);
      this.write(' ');
    }

    err += derr;
    if (err > .5) {
      y += ystep;
      err -= 1;
    }
  }
};

/**
 * Stroke the current path.
 *
 * @api public
 */

Context2d.prototype.stroke = function(){
  var self = this
    , path = this.path
    , len = path.length
    , prev
    , curr;

  this.applyStrokeStyle();
  for (var i = 1; i < len; ++i) {
    prev = path[i-1];
    curr = path[i];
    this.line(prev, curr);
  }
};

/**
 * Add a line to the given point.
 *
 * @param {Number} x
 * @param {Number} y
 * @api public
 */

Context2d.prototype.lineTo = function(x, y){
  this.path.push({ x: x, y: y });
};

/**
 * Clear rect.
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @api public
 */

Context2d.prototype.clearRect = function(ox, oy, w, h){
  if ( 0 == ox
    && 0 == oy
    && w == this.canvas.width
    && h == this.canvas.height) {
    return this.clear();
  }

  for (var y = 0; y < h; ++y) {
    for (var x = 0; x < w; ++x) {
      this.moveTo(ox + x, oy + y);
      this.write('\033[0m ');
    }
  }
};

/**
 * Clear the line.
 *
 * @api private
 */

Context2d.prototype.clearLine = function(){
  this.write('\033[2K');
};

/**
 * Clear down.
 *
 * @api private
 */

Context2d.prototype.clearDown = function(){
  this.write('\033[J');
};

/**
 * Clear.
 *
 * @api public
 */

Context2d.prototype.clear = function(){
  this.write('\033[0m\033[1J');
  this.clearDown();
};

/**
 * Write text at the given point.
 *
 * @param {String} str
 * @param {Number} x
 * @param {Number} y
 * @api public
 */

Context2d.prototype.fillText = function(str, x, y){
  x += this.getState('translateX');
  y += this.getState('translateY');
  this.applyForegroundFillStyle();
  this.moveTo(x, y);
  this.write(str);
};

/**
 * Reset the terminal state.
 *
 * @api public
 */

Context2d.prototype.reset = function(){
  this.clear();
  this.showCursor();
  this.moveTo(0, 0);
  this.resetState();
};

/**
 * Reset state.
 *
 * @api public
 */

Context2d.prototype.resetState = function(){
  this.state().fill = 'normal';
  this.state().stroke = 'normal';
  this.applyFillStyle();
  this.applyStrokeStyle();
};

/**
 * Stroke a rect.
 *
 * TODO: use lineTo()
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @api public
 */

Context2d.prototype.strokeRect = function(x, y, w, h){
  var sx = this.state().scaleX;
  var sy = this.state().scaleY;
  var tx = this.getState('translateX');
  var ty = this.getState('translateY');

  w *= sx;
  h *= sy;
  x += tx;
  y += ty;

  var hr = Array(Math.round(w + 1)).join(' ');
  this.applyStrokeStyle();
  this.moveTo(x, y);
  this.write(hr);
  for (var i = 1; i < h; ++i) {
    this.moveTo(x, y + i);
    this.write(' ');
    this.moveTo(x + w - 1, y + i);
    this.write(' ');
  }
  this.moveTo(x, y + h);
  this.write(hr);
};

/**
 * Fill a rect.
 *
 * @param {Number} x
 * @param {Number} y
 * @param {Number} w
 * @param {Number} h
 * @api public
 */

Context2d.prototype.fillRect = function(ox, oy, w, h){
  var sx = this.state().scaleX;
  var sy = this.state().scaleY;
  var tx = this.getState('translateX');
  var ty = this.getState('translateY');

  w *= sx;
  h *= sy;
  ox += tx;
  oy += ty;

  this.applyFillStyle();
  for (var y = 0; y < h; ++y) {
    for (var x = 0; x < w; ++x) {
      this.moveTo(ox + x, oy + y);
      this.write(' ');
    }
  }
};

/**
 * Apply the current fg fill style.
 *
 * @api private
 */

Context2d.prototype.applyForegroundFillStyle = function(){
  color = exports.colors[this.state().fill];
  this.write('\033[3' + color + 'm');
};

/**
 * Apply the current fill style.
 *
 * @api private
 */

Context2d.prototype.applyFillStyle = function(){
  color = exports.colors[this.state().fill];
  this.write('\033[4' + color + 'm');
};

/**
 * Apply the current stroke style.
 *
 * @api private
 */

Context2d.prototype.applyStrokeStyle = function(){
  color = exports.colors[this.state().stroke];
  this.write('\033[4' + color + 'm');
};
