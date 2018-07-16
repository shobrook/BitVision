#!/usr/bin/env node
var argv = require('optimist')
    .usage('Usage: picture-tube OPTIONS { file or uri }')
    .demand(1)
    .describe('cols', 'number of columns to use for output')
    .argv
;
var tube = require('../')(argv);
var request = require('request');
var fs = require('fs');

var file = argv._[0];
if (/^https?:/.test(file)) {
    request(file).pipe(tube);
}
else {
    fs.createReadStream(file).pipe(tube);
}
tube.pipe(process.stdout);
