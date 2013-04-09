#!/usr/bin/env node

var τ0 = new Date().getTime();

var fs = require('fs');
var path = require('path');
var util = require('util');
require('colors');

var Σ = require('../lib/state');
var crawler = require('../lib/crawler').createCrawler();
var indexer = require('../lib/indexer').createIndexer();
var utils = require('../lib/utils');

function usage() {
  console.log("USAGE:");
  console.log('%s           ' + ' (Full update)'.grey, process.argv[1]);
  console.log('%s -i        ' + ' (Incremental update: add new only)'.grey, process.argv[1]);
  console.log('%s <filename>' + ' (Update only the specified filename)'.grey, process.argv[1]);
  console.log('%s -h        ' + ' (Display this message)'.grey, process.argv[1]);
  console.log('\nCrawled path:');
  console.log(crawler.path.blue.bold);
  console.log('Index file:');
  console.log((indexer.path + indexer.file).blue.bold);
  process.exit(1);
}

// We want the log messages
Σ.cfg.verbose = true;

var incremental = false;
var filename;
if (process.argv.length > 2) {
  if (process.argv[2] == '-i')
    incremental = true;
  else if (process.argv[2] == '-h')
    usage();
  else
    filename = process.argv[2];
}
console.log("Starting %supdate...", incremental ? "incremental " : "");
if (filename)
  console.log("Adding file " + filename.green);


// Load existing index if we are not performing a full crawl
if (incremental || filename)
  indexer.loadSync();

crawler.on('found', function(doc) {
  if (Σ.index['id'] && Σ.index['id'][doc.id]) {
    // Already indexed
    if (incremental) {
      console.log("Skipping %s".grey, doc.id);
      return;
    }
    else {
      if (!filename) {
        console.log("Document with id %s was already indexed, skipping".red, doc.id);
        return;
      }
    }
  }

  // Skip documents scheduled for a future date
  if (doc.timestamp.getTime() > new Date().getTime()) {
    console.log("Skipping %s, scheduled for %s", doc.id, util.format('%s/%s/%s %s:%s:%s.%s',
                     doc.timestamp.getFullYear(),
                     utils.pad(doc.timestamp.getMonth() + 1, 2),
                     utils.pad(doc.timestamp.getDate(), 2),
                     utils.pad(doc.timestamp.getHours(), 2),
                     utils.pad(doc.timestamp.getMinutes(), 2),
                     utils.pad(doc.timestamp.getSeconds(), 2),
                     utils.pad(doc.timestamp.getMilliseconds(), 3)));
    return;
  }

  indexer.add(doc);

  if (filename) {
    // End here
    crawler.emit('end', 1);
  }
});

crawler.on('end', function(count) {
  indexer.sort();
  indexer.save(function(err) {
    if (err)
      throw err;
  });
  //console.log(util.inspect(Σ.index, false, null, true));
  console.log("\n------[ Result ]------".grey);
  if (Σ.index.id)
    console.log("Indexed %s files on %s in %s",
                Object.keys(Σ.index.id).length.toString().green.bold,
                count.toString().green,
                (((new Date().getTime() - τ0) / 1000).toFixed(3) + "s").blue.bold);
  else
    console.log("No files indexed");
});


if (filename) {
  // index only the specified file
  var fullFilename = path.normalize(crawler.path + filename);
  fs.stat(fullFilename, function(err, stats) {
    if (err)
      throw err;
    else {
      crawler.fetch(fullFilename, stats);
    }
  });
}
else {
  // Full crawl of document space
  crawler.start();
}
