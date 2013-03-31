var fs = require('fs');
var path = require('path');
var util = require('util');
var findit = require('findit');
var EventEmitter = require('events').EventEmitter;
require('colors').setTheme({
  silly: 'rainbow',
  input: 'white',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var utils = require('../lib/utils');
var txt = require('../lib/txt');
var Σ = require('../lib/state');

// Instead of:
// module.exports.Crawler = Crawler;
// and instance with:
// var Crawler = require('../lib/crawler').Crawler;
// var crawler = new Crawler();
//
// use the preferred Node.js style and instance with:
// var crawler = require('../lib/crawler').createCrawler();
//
//module.exports.Crawler = Crawler;
module.exports.createCrawler = function createCrawler() { return new Crawler(); };


/**
 * Default (empty) document. See sources for permitted attributes.
 *
 * @api private
 */
var DEFAULTS = function() {
  return {
    'n': 0, // position in ordered index
    'id': null, // unique id for url
    'filename': null, // resource filename
    'timestamp': null, // creation time, set to future to schedule
    'modified': null, // modification time
    'title': null,
    'abstract': null, // article first lines, empty if full article is shown
    'description': null, // page description, short and without html tags
    'content': null,
    'tag': [],
    'rel': [], // related ids
    'blip': false, // special format for short articles
    'secret': false, // not shown in archives
    'doc': false // document or article
  };
};

var count = 0;


function Crawler() {
  EventEmitter.call(this);
}

util.inherits(Crawler, EventEmitter);
// Could also be done by prototypal inheritance:
//Crawler.prototype = Object.create(EventEmitter.prototype);


/**
 * Full path of the resources directory.
 *
 * @api public
 */
Crawler.prototype.path = path.normalize(__dirname + '/../../../res/');


/**
 * Start to crawl the filesystem for document files.
 * Crawled document types: .html, .md, .markdown.
 *
 * As each document is created, an event is raised. When the crawler has finished, the 'end' event is raised.
 *
 * @api public
 */
Crawler.prototype.start = function start() {
  var self = this; // keep ref to this to use inside other scopes
  var finder = findit.find(this.path);

  finder.on('directory', function(dir) {
    if (Σ.cfg.verbose) console.log((dir + '/').blue);
  });

  finder.on('file', function(file, stat) {
    file = path.normalize(file);//fs.realpathSync(file);
    if (file.match(/\.(html|md|markdown)$/i)) {
      if (Σ.cfg.verbose) console.log(("  " + file).green);
      count++;
      self.fetch(file, stat);
    }
    else {
      //if (Σ.cfg.verbose) console.log(("  Skipping " + file).yellow);
    }
  });

  finder.on('end', function() {
    self.emit('end', count);
  });
};


/**
 * Create a new fully formed document from a file.
 * Returns nothing. On completion emits an event 'found' with the newly created document.
 * If the file extension is .md or .markdown, transparently convert Markdown to HTML.
 *
 * @param {string} file Full filename
 * @param {Object} stat Stat data for file
 *
 * @api public
 */
Crawler.prototype.fetch = function fetch(file, stat) {
  var doc = this.fromFile(file, stat, DEFAULTS());

  var s = fs.readFileSync(file, 'utf8');
  if (!s)
    return;
  s = txt.removeByteOrderMark(s);

  // handle markdown
  if (file.match(/\.(md|markdown)$/i)) {
    var marked = require('marked');
    var orig = s; // preserve original content for metadata parsing, as <script> element will be escaped
    s = marked(s);
  }
  doc = this.fromContent(s, doc);
  doc = this.fromMeta(orig || s, doc);

  this.emit('found', doc);
};


/**
 * Construct a normalized slug from a document title in natural language.
 *
 * @param {string} title A document title. The string can contain any Unicode char, including punctuation
 *
 * @return {string} A string suitable to use as part of an URL (the 'slug'), replacing whitespace with dashes and stripping HTML tags, punctuation and non-letter chars except dashes. Any non-ASCII char will be transliterated if possible, otherwise it will be stripped. The slug has a max length of 64 chars.
 *
 * @api private
 */
Crawler.prototype.slug = function slug(title) {
  return txt
    .transliterate(title)
    .replace(/<.+?>/g, '')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substr(0, 64);
};


/**
 * Create a partial document from a file, overriding any existing field of the passed document.
 * The following document fields are set:
 *
 * - 'timestamp': if the file name is formatted as 'yyyymmdd_slug.html', the first 8 digits are interpreted as a timestamp.
 * If not, the file creation time is used as a timestamp.
 *
 * - 'modified': file modification time.
 *
 * - 'id': a slug created from the whole file name without extension, or the last part if the file name also contains a timestamp. If the filename contains a '_' char, it and all preceding characters are ignored when creating the slug, So one could use the first part of the filename for tagging/sorting on filesystem. As a special case, if the filename starts with 'doc_', the 'doc' field is also set to true.
 *
 * @param {string} file Full filename
 * @param {Object} stat Stat data for file.
 * @param {Object} doc Possibly empty partial document to be overridden
 *
 * @return {Object} The updated partial document
 *
 * @api private
 */
Crawler.prototype.fromFile = function(file, stat, doc) {
  doc['filename'] = file;
  doc['timestamp'] = stat.ctime;
  doc['modified'] = stat.mtime;

  var name = path.basename(file);
  var match = /^(\d{8})_(.+?)\.[^.]+$/.exec(name);//var match = /^(\d{8})_(.+?)\.html$/.exec(name);
  if (match) {
    if (match[1]) {
      var year = match[1].substring(0, 4);
      var month = match[1].substring(4, 6) - 1;
      var day = match[1].substring(6, 8);
      doc['timestamp'] = new Date(year, month, day, 0, 0, 0);
    }
    if (match[2]) {
      doc['id'] = this.slug(match[2]);
    }
  }
  else {
    if (/^doc_/.exec(name))
      doc['doc'] = true;
    // ignore chars up to first '_'
    doc['id'] = this.slug(name.replace(/^[^_]+_/, '').replace(/\.[^.]+$/, ''));
  }
  return doc;
};


/**
 * Create a partial document from a file content, overriding any existing field of the passed document.
 * Content can be HTML (with or without doctype) or Markdown.
 *
 * Example file contents:
 *
 * <!DOCTYPE html>
 * <meta charset="utf-8"/>
 * <title>Title</title>
 * <script>
 * {
 * "id": "example0",
 * "tag": [ "example" ]
 * }
 * </script>
 *
 * <p>Contents<br/>End.
 *
 *
 * The following document fields are set:
 *
 * 'title': content of the <title> element or first Markdown title
 *
 * 'id': slug created from the title, if undefined. This field is NOT overwritten if it was already set
 *
 * 'content': file content without doctype, HTML comments, <meta>, <title> and first <script> element

 * 'abstract': document abstract
 *
 * 'description': document description used in HTML meta elements. This field is the abstract without HTML tags, possibly truncated
 *
 * @param {string} s File contents as string
 * @param {Object} doc Possibly empty partial document to be overridden
 *
 * @return {Object} The updated partial document
 *
 * @api private
 */
Crawler.prototype.fromContent = function(s, doc) {
  var title;
  var startTitle = s.indexOf('<title>'), endTitle = s.indexOf('</title>');
  if (startTitle >= 0 && endTitle > 0) {
    title = s.substring(startTitle + '<title>'.length, endTitle).trim();
    if (title)
      doc['title'] = title;
    if (!doc['id'])
      doc['id'] = this.slug(doc['title']);
  }
  else {
    // This will not be Markdown, it's already rendered to HTML
    var match = /<h1>(.*?)<\/h1>/i.exec(s);
    if (match && match.length == 2) {
      title = match[1].trim();
      if (title)
        doc['title'] = title;
      if (!doc['id'])
        doc['id'] = this.slug(doc['title']);
    }
  }

  doc['content'] =
    s.replace(/<!DOCTYPE\s+html>/i, '')
    .replace(/<!--.*?-->/g, '')
    .replace(/<meta.*?>/ig, '')
    .replace(/<title>.*?<\/title>/i, '')
    .replace(/<h1>.*?<\/h1>/i, '')
    .replace(/<script(?! src)(.*?)>([\s\S]*?)<\/script>/im, '')
    .trim();

  if (!doc['title']) {
    doc['title'] = doc['content']
      .replace(/<.+?>/g, '')
      .trim()
      .substring(0, 30) + '…';
  }

  if (!doc['abstract']) {
    if (doc['content'].length < 2500) {
      doc['abstract'] = doc['content'].trim();
    }
    else {
      // Use first <br/> instead of first <p> paragraph
      /*var startSecondPar = doc['content'].indexOf('<br/>');
       if (startSecondPar > 0) {
       doc['abstract'] = doc['content']
       .substring(0, startSecondPar);
       }*/
      var startFirstPar = doc['content'].search(/<p.*?>/);
      if (startFirstPar >= 0) {
        var startSecondPar = doc['content'].indexOf('</p>', startFirstPar + 1);
        if (startSecondPar > 0) {
          doc['abstract'] = doc['content'].substring(startFirstPar, startSecondPar + 4);
          if (doc['abstract'].length < doc['content'].length) {
            var needContinue = true;
          }
          doc['abstract'] = doc['abstract'].trim();
        }
      }
      if (!doc['abstract']) {
        doc['abstract'] = doc['content'].trim();
      }
    }
  }

  doc['description'] = doc['abstract']
    .replace(/<.+?>/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (doc['description'].length > 140)
      doc['description'] = doc['description'].substring(0, 140) + ' …';

  // discard abstract if not needed
  if (!needContinue)
    doc['abstract'] = null;

  return doc;
};


/**
 * Create a partial document from a file metadata, overriding any existing field of the passed document.
 * Metadata takes precedence over any other way to set attributes.
 * This function returns the final instance of a document. If any field is still undefined after parsing metadata, and has no default value, it is set by heuristics if possible.
 * Further modules consuming the document returned by this function should not modify it, nor transform or parse its attributes. Please!
 *
 * @param {string} s File contents as string, containing the metadata in the first <script> element
 * @param {Object} doc Possibly empty partial document to be overridden
 *
 * @return {Object} The final document
 *
 * @api private
 */
Crawler.prototype.fromMeta = function(s, doc) {
  var startMeta = s.indexOf('<script>'), endMeta = s.indexOf('</script>');
  if (startMeta >= 0 && endMeta > 0) {
    var js = s.substring(startMeta + '<script>'.length, endMeta);
    try {
      var meta = JSON.parse(js);
    }
    catch (err) {
      console.error('There has been an error parsing JSON: %s'.red, js);
    }
  }
  // Transform parsed attributes in the correct format if needed
  // Dates are specified as strings in format 'yyyy/mm/dd hh:mm' or in standard JSON serialized format, i.e. 'yyyy-mm-ddThh:mm:ss.sssZ'
  [ 'timestamp', 'modified' ].forEach(function(name) {
    if (meta && meta[name]) {
      var match = /^(\d{4})\/(\d{2})\/(\d{2})\s(\d{2}):(\d{2})$/.exec(meta[name]);
      if (match && match.length == 6) {
        meta[name] = new Date(match[1], match[2] - 1, match[3], match[4], match[5], 0);
      }
      else {
        try {
          meta[name] = new Date(meta[name]);
        }
        catch (ex) { }
      }
    }
  });

  doc = utils.extend(doc, meta);

  // remove abstract from blip articles
  /*if (doc['blip'])
    doc['abstract'] = null;*/

  // Heuristically set any field still missing
  // Do this here to keep all document creation logic in one place
  if (!doc['modified'])
    doc['modified'] = doc['timestamp'];

  if (!doc['timestamp'] instanceof Date)
    doc['timestamp'] = new Date(doc['timestamp']);
  if (!doc['modified'] instanceof Date)
    doc['modified'] = new Date(doc['modified']);

  return doc;
};
