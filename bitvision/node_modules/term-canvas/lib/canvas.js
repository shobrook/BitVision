
/**
 * Module dependencies.
 */

var tty = require('tty')
  , Context2d = require('./context2d');

/**
 * Expose `Canvas`.
 */

module.exports = Canvas;

/**
 * Initialize a new canvas with the given dimensions.
 *
 * @param {Number} width
 * @param {Number} height
 * @api public
 */

function Canvas(width, height) {
  this.width = width;
  this.height = height;
  this.stream = process.stdout;
}

/**
 * Return a rendering context of `type`.
 *
 * @param {String} type
 * @return {Context2d}
 * @api public
 */

Canvas.prototype.getContext = function(type){
  switch (type) {
    case '2d':
      return new Context2d(this);
    default:
      throw new Error('invalid context type "' + type + '"');
  }
};