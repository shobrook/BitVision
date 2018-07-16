var PNG = require('png-js');
var charm = require('charm');
var x256 = require('x256');
var buffers = require('buffers');
var es = require('event-stream');

var Stream = require('stream').Stream;

module.exports = function (opts) {
    if (!opts) opts = {};
    if (!opts.cols) opts.cols = 80;
    
    var c = charm();
    var bufs = buffers();
    
    var ws = es.writeArray(function (err, bufs) {
        var data = buffers(bufs).slice();
        var png = new PNG(data);
        
        png.decode(function (pixels) {
            var dx = png.width / opts.cols;
            var dy = 2 * dx;
            
            for (var y = 0; y < png.height; y += dy) {
                for (var x = 0; x < png.width; x += dx) {
                    var i = (Math.floor(y) * png.width + Math.floor(x)) * 4;
                    
                    var ix = x256([ pixels[i], pixels[i+1], pixels[i+2] ]);
                    if (pixels[i+3] > 0) {
                        c.background(ix).write(' ');
                    }
                    else {
                        c.display('reset').write(' ');
                    }
                }
                c.display('reset').write('\r\n');
            }
            
            c.display('reset').end();
        });
    });
    
    return es.duplex(ws, c);
};
