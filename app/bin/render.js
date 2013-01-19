#!/usr/bin/env node

var Σ = require('../lib/state');
var utils = require('../lib/utils');
var renderer = require('../lib/renderer');
var router = require('../lib/router');
var handlers = require('../lib/handlers');
var Indexer = require('../lib/indexer');

require('colors');


//var indexer = new Indexer();
var indexer = Indexer.createIndexer();
indexer.loadSync();
//indexer.sort();

var help, res, special, all, contextOnly, infoOnly;
if (process.argv.length > 2) {
  if (process.argv[2] == '-h')
    help = true;
  if (process.argv[2] == '-s' && process.argv[3])
    res = process.argv[3];
  else if (process.argv[2] == '--all')
    all = true;
  else if (process.argv[2] == '-c' && process.argv.length > 3) {
    res = process.argv[3];
    contextOnly = true;
  }
  else if (process.argv[2] == '-i') {
    if (process.argv.length > 3)
      res = process.argv[3];
    infoOnly = true;
  }
  else if (!process.argv[2].match(/^-/))
    res = process.argv[2];
}

if (help || (!res && !special && !all && !infoOnly)) {
  console.log('USAGE:');
  console.log('%s <document id>    ' + 'Render the document or handler to stdout'.grey, process.argv[1]);
  console.log('%s -c <document id> ' + 'Print only the document or handler context'.grey, process.argv[1]);
  console.log('%s -i <document id> ' + 'Print info on the document'.grey, process.argv[1]);
  console.log('%s --all            ' + 'Render all indexed documents and save them to disk'.grey, process.argv[1]);
  console.log('%s -h               ' + '(Display this message)'.grey, process.argv[1]);
  console.log('\nTemplates path:');
  console.log(renderer.path.blue.bold);
  console.log('Rendered documents path:');
  console.log(indexer.path.blue.bold);
  console.log();
  printInfo();
  process.exit(1);
}
//console.log("Rendering %s...", res);

//Σ.cfg.denyDiskRead = true;

var req = { 'url': res };

if (infoOnly) {
  if (res) {
    printDocumentInfo(res);
  }
  else {
    printInfo();
  }
  process.exit(0);
}
else if (res) {
  if (contextOnly) {
    // do not render, show only context object passed to template
    var ctx = router.context(router.parse(req), req);
    console.log(require('util').inspect(ctx, false, null, true));
    process.exit(0);
  }
  else {
    // render resource from an index document
    router.getResource(req, router.parse(req), function(err, resource) {
      if (err) {
        console.error(err);
        console.log('Available documents in the index (%d): ', Object.keys(Σ.index['id']).length);
        Object.keys(Σ.index['id']).forEach(function(id) {
          console.log(Σ.index['id'][id].n + '. ' + id);
        });
        console.log('Available special handlers: ');
        for (var t in handlers)
          console.log(t);
        process.exit(1);
      }
      console.log(resource);
      process.exit(0);
    });
  }
}
else if (all) {
  // render all documents in index and save them
  // Don't use Object.keys(Σ.index['id']).forEach, because template loading from disk is async and it will try to read it once for each document at the same time...
  var ids = Object.keys(Σ.index['id']);
  function renderResource() {
    var id = ids.shift();
    if (!id)
      process.exit(0);;
    req = { 'url': id };
    router.getResource(req, router.parse(req), function(err, resource) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      //console.log(id + ':\n' + resource);
      var fs = require('fs');
      var path = require('path');
      // put rendered files in /../../doc/, so we can load them without a server to test in the browser
      fs.writeFile(path.normalize(__dirname + '/../../doc/') + id + '.html', resource, 'utf8', function(err2) {
        if (err2) {
          console.error(err2);
          process.exit(1);
        }
        renderResource();
      });
    });
  }
  // start recursion
  renderResource();
}


function printDocumentInfo(id) {
  //Σ.index['id'][id].modified.toLocaleFormat('%Y/%m/%e %T')
  var d = require('util').format('%s/%s/%s %s:%s:%s.%s',
                                 Σ.index['id'][id].modified.getFullYear(),
                                 utils.pad(Σ.index['id'][id].modified.getMonth() + 1, 2),
                                 utils.pad(Σ.index['id'][id].modified.getDay() + 1, 2),
                                 utils.pad(Σ.index['id'][id].modified.getHours(), 2),
                                 utils.pad(Σ.index['id'][id].modified.getMinutes(), 2),
                                 utils.pad(Σ.index['id'][id].modified.getSeconds(), 2),
                                 utils.pad(Σ.index['id'][id].modified.getMilliseconds(), 3));
  console.log('%d ⋅ '.green.bold + '%s ⋅ '.blue + '%s'.yellow.bold + ' ⋅ %s'.bold + ' ⋅ %s'.grey.bold + ' ⋅ %s'.red,
              Σ.index['id'][id].n,
              d,
              id,
              Σ.index['id'][id].title,
              require('path').basename(Σ.index['id'][id].filename),
              Σ.index['id'][id].tag);
}


function printInfo() {
  if (Σ.index['id']) {
    var a = Σ.index['n'] || indexer.publicIds();
    console.log('Indexed documents: %d', Object.keys(Σ.index['id']).length);
    console.log();
    console.log('Public articles (%d)%s: ', a.length, Σ.index['n'] ? '': ' (not sorted)');
    a.forEach(function(id) {
      printDocumentInfo(id);
    });
    console.log();
    a = indexer.nonPublicIds();
    console.log('Non-public articles (%d): ', a.length);
    a.forEach(function(id) {
      printDocumentInfo(id);
    });
    console.log();
    a = indexer.documentIds();
    console.log('Documents (%d): ', a.length);
    a.forEach(function(id) {
      printDocumentInfo(id);
    });
    console.log();
    console.log('Special handlers: ');
    for (var h in handlers)
      console.log(h);
    console.log();
    console.log('Tags (%d):', Object.keys(Σ.index['tag']).length);
    Object.keys(Σ.index['tag']).sort()
      .forEach(function(tag) { console.log(tag.bold + ' ⋅ ' + Σ.index['tag'][tag].length.toString().blue); });
  }
  else {
    console.log('No indexed documents'.red.bold);
  }
}