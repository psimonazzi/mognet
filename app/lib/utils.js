var fs = require('fs');
var path = require('path');

// Export all members in 'core'
// for (var k in core) { exports[k] = core[k]; };


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


function timeIt(name, cont) {
  /*if (!options.verbose)
    return cont();*/
  var τ0 = new Date().getTime();
  try { return cont(); }
  finally { sys.debug("// " + name + ": " + ((new Date().getTime() - τ0) / 1000).toFixed(3) + " sec."); }
}


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
 * Emulate blocking sleep system call, hopefully for debugging purposes only.
 * As Node is single-threaded, this will block the ENTIRE NODE INSTANCE.
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
 * @param {Number} len Resulting string length
 *
 * @return {String} The padded number as a string
 *
 * @api public
 */
exports.pad = function pad(n, len) {
  return (1e15 + n + "").slice(-len);
};


/*
 * Concat a list of files with newline chars.
 *
 * @param {Array} files An array of filenames
 * @param {String} distPath Output filename
 */
/*exports.concat = function concat(files, distPath) {
  var strings = [];
    for (var i = 0; i < files.length; i++)
      strings[i] = fs.readFileSync(files[i], 'utf-8');
  fs.writeFileSync(distPath, strings.join('\n'), 'utf-8');
};*/


/*
 * Command line prompt.
 *
 * @param {String} msg Message prepended to prompt
 * @param {Function} callback Callback executed on the input text. Input text is passed as the first argument
 *
 * @api public
 *
 */
/*exports.prompt = function prompt(msg, callback) {
  process.stdout.write(msg);
  process.stdin.resume();
  process.stdin.setEncoding( "utf8" );
  process.stdin.once("data", function(chunk) {
    process.stdin.pause();
    callback(chunk.replace(/\n*$/g, ""));
  });
};*/


exports.rangeCheck = function rangeCheck(n, max) {
  if (n < 0)
    n = null;// 0;
  else if (n > max)
    n = null;// max;
  return n;
};
