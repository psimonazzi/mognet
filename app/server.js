/*
 * Mognet
 * https://github.com/psimonazzi/mognet
 *
 * Copyright (c) 2012 Paolo Simonazzi.
 * Available under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */

/*
 * 'Run, Shadowfax! Show us the meaning of haste!'
 */

var util = require('util');
var fs = require('fs');
var path = require('path');
var http = require('http');
var connect = require('connect');

//require.paths.unshift(__dirname + '/lib');
var Σ = require(__dirname + '/lib/state');
var router = require(__dirname + '/lib/router');
var Indexer = require(__dirname + '/lib/indexer').Indexer;
var utils = require(__dirname + '/lib/utils');

// Run with "PORT=3000 node server.js" or "node server.js 3000" (or defined in config file)
var port = process.env.PORT || process.argv[2] || Σ.cfg.port;

process.on('SIGPOLL', function() {
  console.log('Got SIGPOLL (29). Reloading index...');
  require('child_process').exec('/usr/bin/env node ' + __dirname + '/bin/update.js', function (error, stdout, stderr) {
    if (!error)
      indexer.load(function() { console.log('Loaded index.'); });
    else
      console.err(error);
  });
});

process.on('SIGUSR1', function() {
  console.log('Got SIGUSR1 (10).');
  console.log('Index:');
  console.log(util.inspect(Σ.index, false, null, true));
  console.log('\nRenders:');
  console.log(util.inspect(Σ.renders, false, null, true));
});

process.on('SIGUSR2', function() {
  console.log('Got SIGUSR2 (12).');
  console.log('%j', process.memoryUsage());
});

// listen for Naught shutdown message
process.on('message', function(message) {
  if (message === 'shutdown') {
    process.exit(0);
  }
});


try {
  var version = utils.loadJSONSync(__dirname + '/package.json').version;
} catch (err) { }
console.log('Server v%s (pid %s)', version, process.pid);
fs.writeFile(__dirname + '/../../server.pid', process.pid, 'utf8', function(err) {
  if (err) {
    console.error('Cannot write pid file: ' + ex);
    process.exit(0);
  }
});

console.log('Loading index from disk...');
var indexer = new Indexer();
indexer.loadSync();
//indexer.sort(); // will be already sorted on disk
if (Object.keys(Σ.index['id']).length == 0) {
  console.error('No index found. Create a new index with:\nbin/update.js');
  process.exit(0);
}

try {
  var lastModified = Σ.index['id'][Σ.index['n'][Σ.index['n'].length - 1]].modified;
} catch (ex) { console.error(ex); }
console.log('Index contains %d entries. Last modified on %s', Object.keys(Σ.index.id).length, lastModified);

var ONE_YEAR = 31536000000;

// last handler applies to paths not served by the previous (static() by default serves '/' and all filenames under it)
// so it catches any non-existent url
var app = connect()
      //.use(connect.profiler())
      //.use(connect.responseTime())
      .use(connect.logger('tiny'))
      .use(connect.compress())
      .use(connect.favicon('/favicon.ico', { 'maxAge': ONE_YEAR }))
      .use(connect.staticCache({ 'maxObjects': 256, 'maxLength': 1024 * 256 }))
      .use(connect.static(path.normalize(__dirname + '/../doc'), { 'maxAge': ONE_YEAR }))
      .use('/static', connect.static(path.normalize(__dirname + '/../../static'), { 'maxAge': ONE_YEAR }))
      .use('/api', function(req, res) {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end('DEBUG: ' + req.url);
      })
      .use('/500', function(req, res) {
        // Generate a 500 error for testing
        res.statusCode = 500;
        var body = '<h1>' + res.statusCode + ' ' + http.STATUS_CODES[res.statusCode] + '</h1>\n';
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
        res.end(body);
      })
      .use(function(req, res) {
        if (req.method != 'GET' && req.method != 'HEAD') {
          res.statusCode = 405;
          var body = '<h1>' + res.statusCode + ' ' + http.STATUS_CODES[res.statusCode] + '</h1>\n';
          res.setHeader('Content-Type', 'text/html; charset=UTF-8');
          res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'));
          res.end(body);
          return;
        }

        router.getResource(req, function(err, resource, route) {
          if (err) {
            if (404 === err.status)
              res.statusCode = 404;
            else
              res.statusCode = 500;
            resource = '<h1>' + res.statusCode + ' ' + http.STATUS_CODES[res.statusCode] + '</h1>\n' + err.toString();
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
          }
          else {
            res.statusCode = 200;
            res.setHeader('Content-Type', (route.contentType || 'text/html') + '; charset=UTF-8');
          }
          // If content length is not set, chunked encoding will be used automatically (as defined by the HTTP standard)
          res.setHeader('Content-Length', Buffer.byteLength(resource, 'utf8'));
          // Cache control
          if (lastModified) {
            var expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            res.setHeader('Expires', expires.toUTCString());
            res.setHeader('Last-Modified', lastModified.toUTCString());
          }
          else {
            //TODO use ETAG???
            res.setHeader('Expires', '"' + require('crc').crc32(resource) + '"');
          }
          res.end(resource);
        });
      })
      .listen(port, function() {
        // notify Naught
        if (process.send)
          process.send('online');
      });

console.log('Server listening on http://0.0.0.0:%s', port);
