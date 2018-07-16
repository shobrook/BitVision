var bresenham = require('bresenham');
var glmatrix = require('gl-matrix');
var mat4 = glmatrix.mat4;
var vec3 = glmatrix.vec3;
var Canvas = require('../');

vec3.transformMat4 = function(out, a, m) {
  var x = a[0], y = a[1], z = a[2],
    w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
};

var c = new Canvas(160, 160);

var points = [[-1,-1,-1],[-1,-1,1],[1,-1,1],[1,-1,-1],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]];
var quads = [[0,1,2,3],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0],[4,7,6,5]];
var cube = quads.map(function(quad) {
  return quad.map(function(v) {
    return vec3.fromValues.apply(null, points[v]);
  });
});

var projection = mat4.create();
mat4.perspective(projection, Math.PI/3, 1, 1, 50);

function draw() {
  var now = Date.now();
  var modelView = mat4.create();
  mat4.lookAt(modelView,
              vec3.fromValues(0, 0.1, 4),
              vec3.fromValues(0, 0, 0),
              vec3.fromValues(0, 1, 0));
  mat4.rotateY(modelView, modelView, Math.PI*2*now/10000);
  mat4.rotateZ(modelView, modelView, Math.PI*2*now/11000);
  mat4.rotateX(modelView, modelView, Math.PI*2*now/9000);
  mat4.scale(modelView, modelView, vec3.fromValues(Math.sin(now/1000*Math.PI)/2+1, 1, 1));
  c.clear();
  var transformed = cube.map(function(quad) {
    return quad.map(function(v) {
      var m = mat4.create();
      var out = vec3.create();
      mat4.mul(m, projection, modelView);
      vec3.transformMat4(out, v, m);
      return {
        x: Math.floor(out[0]*40+80),
        y: Math.floor(out[1]*40+80)
      };
    });
  });
  transformed.forEach(function(quad) {
    quad.forEach(function(v, i) {
      var n = quad[(+i+1)%4];
      bresenham(v.x, v.y, n.x, n.y, c.set.bind(c));
    });
  });
  process.stdout.write(c.frame());
}

setInterval(draw, 1000/24);
