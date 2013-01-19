var fs = require('fs');
var path = require('path');


exports.loadJSONSync = function loadJSONSync(filename, reviver) {
  var raw = fs.readFileSync(filename);
  return JSON.parse(raw, reviver);
};


exports.loadJSON = function loadJSON(filename, done, reviver) {
  fs.readFile(filename, 'utf8', function(err, raw) {
    if (err)
      done(err);
    else {
      var error, parsed;
      try {
        parsed = JSON.parse(raw, reviver);
      } catch(e) {
        error = new Error('File ' + filename + ' is not a valid JSON string.');
        error.raw = raw;
      } finally {
        done(error, parsed);
      }
    }
  });
};


exports.saveJSON = function saveJSON(filename, obj, done) {
  var json = JSON.stringify(obj);
  if (json) {
    fs.writeFile(filename, json, 'utf8', done);
  }
  else {
    var error = new Error('No object to save as JSON in ' + filename + '.');
    done(error);
  }
};


/**
 * Extend an object with another.
 * Missing fields in the object are added, existing ones are overridden.
 *
 * Implemented with a simple flat version: http://groups.google.com/group/nodejs-dev/browse_thread/thread/41cfc3a2d2e4bcd9?pli=1.
 * This is about the same as Connect.merge(). Good enough & Just works.
 *
 * @param {Object} a Object to extend
 * @param {Object} b Object with which to extend 'a'
 *
 * @return {Object} The extended object
 *
 * @api public
 */
exports.extend = function extend(a, b) {
  if (b) {
    for (var x in b)
      a[x] = b[x];
  }
  return a;
};


/**
* Cache the given function's return value.
* Instead of:
* var result = fn(x);
*
* call the function to memoize as:
* var memoizedFn = memoize(fn);
* var result = memoizedFn(x);
*
* by @philogb and @addyosmani
* with further optimizations by @mathias
* and @DmitryBaranovsk
* perf tests: http://bit.ly/q3zpG3
* Released under an MIT license.
*/
exports.memoize = function memoize(fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments),
        hash = "",
        i = args.length;
    currentArg = null;
    while (i--) {
      currentArg = args[i];
      hash += (currentArg === Object(currentArg)) ?
        JSON.stringify(currentArg) : currentArg;
      fn.memoize || (fn.memoize = {});
    }
    return (hash in fn.memoize) ? fn.memoize[hash] :
      fn.memoize[hash] = fn.apply(this, args);
  };
};


/**
 * Emulate blocking sleep system call, hopefully for debugging purposes only.
 * As Node is single-threaded, this will block the ENTIRE NODE PROCESS.
 *
 * @param {Number} seconds Sleep time in seconds
 *
 * @api public
 */
exports.sleep = function sleep(seconds) {
  var now = new Date().getTime();
  while(new Date().getTime() < now + seconds*1000) {
    // do nothing
  }
};


/**
 * Pad a number with leading 0s.
 * See https://gist.github.com/1180489.
 *
 * @param {Number} n Number to pad
 * @param {Number} len Desired string length
 *
 * @return {String} The padded number as a string
 *
 * @api public
 */
exports.pad = function pad(n, len) {
  return (1e15 + n + "").slice(-len);
};
