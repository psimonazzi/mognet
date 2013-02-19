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
var child_process = require('child_process');

var Σ = require(__dirname + '/lib/state');
var router = require(__dirname + '/lib/router');
var Indexer = require(__dirname + '/lib/indexer');
var utils = require(__dirname + '/lib/utils');
var logger = require(__dirname + '/lib/logger');

// Run with "PORT=3000 node server.js" or "node server.js 3000" (or define in config file)
var port = process.argv[2] || Σ.cfg.port;

process.on('SIGHUP', function() {
  console.log('Got SIGHUP (1). Rebuilding/reloading index and config & clearing cache...');
  Σ.compiled_templates = {};
  Σ.renders = {};
  Σ.cfg = Σ.loadConfig();
  child_process.exec('/usr/bin/env node ' + __dirname + '/bin/update.js', function(error, stdout, stderr) {
    if (!error)
      indexer.load(function() { console.log('Reloaded.'); });
    else
      console.error('✖ ERROR: Cannot update index. ' + error);
  });
});

process.on('SIGUSR1', function() {
  console.log('Got SIGUSR1 (10).');
  console.log('Index:');
  console.log(util.inspect(Σ.index, false, null, false));
  console.log('\nRenders:');
  console.log(util.inspect(Σ.renders, false, null, false));
});

process.on('SIGUSR2', function() {
  console.log('Got SIGUSR2 (12).');
  try {
    var version = utils.loadJSONSync(__dirname + '/package.json').version;
  } catch (err) { }
  console.log('Mognet v' + version);
  console.log('Running from ' + __dirname + ' as user ' + process.getuid() + ' and group ' + process.getgid());
  console.log('Config:');
  console.log(util.inspect(Σ.cfg, false, null, false));
  console.log('%j', process.memoryUsage());
});

try {
  var version = utils.loadJSONSync(__dirname + '/package.json').version;
} catch (err) { }
console.log('[' + new Date() + ']');
console.log('Server v%s (pid %s)', version, process.pid);

console.log('Loading index from disk...');
var indexer = Indexer.createIndexer();
indexer.loadSync();
//indexer.sort(); // will be already sorted on disk

if (Object.keys(Σ.index['id']).length == 0) {
  console.error('✖ ERROR: No index found. Maybe create a new index with: bin/update.js');
  // do not exit, just serve what we can: static files and special routes with dedicated handlers
}

try {
  var lastModified = Σ.index['id'][Σ.index['n'][Σ.index['n'].length - 1]].modified;
  console.log('Index contains %d entries. Last modified on %s', Object.keys(Σ.index.id).length, lastModified);
} catch (ex) {
  console.error('✖ ERROR: Cannot determine last modified time for index.');
}

var ONE_YEAR = 31536000000;

// last handler applies to paths not served by the previous (static() by default serves '/' and all filenames under it)
// so it catches any non-existent url
var app = connect()
      .use(connect.logger({ format: 'tiny', buffer: 1000 })) //TODO debug only
      .use(connect.timeout(10000))
      .use(connect.compress())
      .use(connect.favicon(__dirname + '/../doc/favicon.ico', { 'maxAge': ONE_YEAR }))
      .use(connect.static(path.normalize(__dirname + '/../doc'), { 'maxAge': ONE_YEAR }))
      .use('/static', connect.static(path.normalize(__dirname + '/../../static'), { 'maxAge': ONE_YEAR }))
      .use('/api', function(req, res) {
        res.statusCode = 204;
        res.end();
      })
      .use(function(req, res) {
        if (req.method != 'GET' && req.method != 'HEAD') {
          res.statusCode = 405;
          var body = '<h1>' + res.statusCode + ' ' + http.STATUS_CODES[res.statusCode] + '</h1>\n';
          res.setHeader('content-type', 'text/html; charset=UTF-8');
          res.setHeader('content-length', Buffer.byteLength(body, 'utf8'));
          res.end(body);
          return;
        }

        var route = router.parse(req);
        router.getResource(req, route, function(err, resource) {
          if (err) {
            if (404 === err.status || 403 === err.status) {
              res.statusCode = 404; // mask 403 (secret document) as 404 (not found)
              if (!resource)
                resource = '<h1>' + res.statusCode + ' ' + http.STATUS_CODES[res.statusCode] + '</h1>\n' + req.url + '\n';
            }
            else {
              logger.e("✖ " + err);
              res.statusCode = 500;
              if (!resource)
                resource = '<h1>' + res.statusCode + ' ' + http.STATUS_CODES[res.statusCode] + '</h1>\n' + err.toString() + '\n';
            }
            res.setHeader('content-type', 'text/html; charset=UTF-8');
          }
          else {
            res.statusCode = 200;
            res.setHeader('content-type', (route.contentType || 'text/html') + '; charset=UTF-8');
          }
          // If content length is not set, chunked encoding will be used automatically (as defined by the HTTP standard)
          var len = Buffer.byteLength(resource, 'utf8');
          if (!route.noCache) {
            // Use a hash based Etag so if the template (but not the document) has changed it will be reflected in the Etag
            //var etag = '"' + len + '-' + Number(lastModified.getTime()) + '"';
            var etag = '"' + connect.utils.md5(resource) + '"';
            res.setHeader('Etag', etag);
            // Check if we need to return the content or just Not Modified
            // Could reuse VisionMedia node-fresh, but we don't really need it
            if (etag === req.headers['if-none-match']) {
              res.statusCode = 304;
              res.removeHeader('content-type');
              res.removeHeader('content-length');
              res.end();
              return;
            }
          }
          res.setHeader('content-length', len);
          res.end(resource);
        });
      })
      .listen(port, function() {
        // drop root privileges if we have them
        if (process && process.getuid() == 0 && process.getgid() == 0) {
          try {
            if (!Σ.cfg.group || !Σ.cfg.user)
              throw new Error('Mognet user or group not defined');
            console.log('Try to run as user ' + process.getuid() + ' and group ' + process.getgid());
            process.setgid(Σ.cfg.group);
            process.setuid(Σ.cfg.user);
          } catch (ex) {
            console.error('✖ ERROR: Cannot drop privileges, running as ROOT...! ' + ex);
          }
        }
        else {
          console.log('Now running as user ' + process.getuid() + ' and group ' + process.getgid());
        }
      });

console.log('Server listening on http://0.0.0.0:%s', port);
