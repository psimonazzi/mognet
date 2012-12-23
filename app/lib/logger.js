var util = require('util');
var Σ = require('../lib/state');

var buffer = {
  info: [],
  error: []
};

exports.flushInterval = 5000;


exports.e = function e() {
  if (!Σ.cfg.verbose)
    return;
  buffer['error'].push(util.format.apply(this, arguments));
};


exports.i = function i() {
  if (!Σ.cfg.verbose)
    return;
  buffer['info'].push(util.format.apply(this, arguments));
};


exports.flush = function flush() {
  if (buffer.info.length) {
    console.log(buffer.info.join('\n'));
    buffer.info.length = 0;
  }
  if (buffer.error.length) {
    console.error(buffer.error.join('\n'));
    buffer.error.length = 0;
  }
};


setInterval(function() {
  exports.flush();
}, exports.flushInterval);
