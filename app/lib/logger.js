var util = require('util');
var Σ = require('../lib/state');
var utils = require('../lib/utils');

var buffer = {
  info: [],
  warning: [],
  error: []
};

exports.flushInterval = 1000;


exports.e = function e() {
  if (!Σ.cfg.verbose)
    return;
  buffer['error'].push('✖ ' + timestamp() + util.format.apply(this, arguments));
};


exports.w = function i() {
  if (!Σ.cfg.verbose)
    return;
  buffer['warning'].push('✖ ' + timestamp() + util.format.apply(this, arguments));
};


exports.i = function i() {
  if (!Σ.cfg.verbose)
    return;
  buffer['info'].push(timestamp() + util.format.apply(this, arguments));
};


exports.flush = function flush() {
  if (buffer.info.length) {
    console.log(buffer.info.join('\n'));
    buffer.info.length = 0;
  }
  if (buffer.warning.length) {
    console.log(buffer.warning.join('\n'));
    buffer.warning.length = 0;
  }
  if (buffer.error.length) {
    console.error(buffer.error.join('\n'));
    buffer.error.length = 0;
  }
};


function timestamp() {
  var d = new Date();
  return util.format('[%s/%s/%s %s:%s:%s.%s] ',
                     d.getFullYear(),
                     utils.pad(d.getMonth() + 1, 2),
                     utils.pad(d.getDate(), 2),
                     utils.pad(d.getHours(), 2),
                     utils.pad(d.getMinutes(), 2),
                     utils.pad(d.getSeconds(), 2),
                     utils.pad(d.getMilliseconds(), 3));
}

setInterval(function() {
  exports.flush();
}, exports.flushInterval);
