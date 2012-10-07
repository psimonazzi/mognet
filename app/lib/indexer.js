var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
require('colors');

var utils = require('../lib/utils');
var Σ = require('../lib/state');

exports.Indexer = Indexer;

function Indexer() {
  EventEmitter.call(this);
}

util.inherits(Indexer, EventEmitter);


/**
 * Full path of the serialized index directory.
 *
 * @api public
 */
Indexer.prototype.path = path.normalize(__dirname + '/../../data/');


/**
 * Filename of the serialized index.
 *
 * @api public
 */
Indexer.prototype.file = 'index.json';


/**
 * Index data structure. This holds all the site text contents, indexed by id, tags and publication month.
 * The index attributes are:
 *
 * id - Map of document ids and data.
 * tag - Map of tags and arrays with the ids having that tag.
 * time - Map of time spans and arrays with the ids having that timestamp. The time spans are in format: 'yyyy/mm'.
 * n - Array of document ids in chronological order. Array index corresponds to document attribute 'n'.
 *
 * @api public
 */
//Indexer.prototype.index = {
Indexer.prototype.EMPTY_INDEX = function() {
  return {
    'id': {},
    'tag': {},
    'time': {},
    'n': []
  };
};


/**
 * Add a document to the index.
 *
 * @param {Object} doc Document to add
 *
 * @api public
 */
Indexer.prototype.add = function(doc) {
  if (!Σ.index)
    Σ.index = this.EMPTY_INDEX();

  // by id
  if (!Σ.index['id'])
    Σ.index['id'] = {};
  Σ.index['id'][doc.id] = doc;

  // by tag
  if (!Σ.index['tag'])
    Σ.index['tag'] = {};
  doc.tag.forEach(function(e) {
    var tags = Σ.index['tag'][e] || [];
    tags.push(doc.id);
    Σ.index['tag'][e] = tags;
  });

  // by time
  if (!Σ.index['time'])
    Σ.index['time'] = {};
  var timeTag = util.format('%d/%s', doc.timestamp.getFullYear(), utils.pad(doc.timestamp.getMonth() + 1, 2));
  var times = Σ.index['time'][timeTag] || [];
  times.push(doc.id);
  Σ.index['time'][timeTag] = times;
};


/**
 * Sort the public articles in the index, creating an array with the ordered document ids in the 'n' attribute of the index.
 * The 'n' attribute of each document is also updated to reflect its position in the index (zero-based).
 * Sort according to modified date and document id.
 * Only public articles are sorted. Secret, ignored, or non-article documents will not have a 'n' attribute.
 *
 * @api public
 */
Indexer.prototype.sort = function() {
  if (!Σ.index)
    return;

  // reset
  Σ.index['n'] = null;

  Σ.index['n'] = this.publicIds().sort(function(a, b) {
    var aTime = Σ.index['id'][a].modified.UTC, bTime = Σ.index['id'][b].modified.UTC;
    if (aTime != bTime)
      return aTime - bTime;
    else {
      if (Σ.index['id'][a].id < Σ.index['id'][b].id)
        return -1;
      else if (Σ.index['id'][a].id > Σ.index['id'][b].id)
        return 1;
      else
        return 0;
    }
  });

  for (var i = 0; i < Σ.index['n'].length; i++) {
    Σ.index['id'][Σ.index['n'][i]].n = i;
  }
};


/**
 * Get the ids of the public documents in the index. Public documents are all articles not flagged 'secret' or 'ignore'.
 *
 * @return {Array} The array of public document ids (sorted if the index is sorted), or the empty array if the index is empty
 *
 * @api public
 */
Indexer.prototype.publicIds = function publicIds() {
  if (!Σ.index || !Σ.index['id'])
    return [];
  var ids = (Σ.index['n'] || Object.keys(Σ.index['id'])).filter(function(element, index, array) {
    return !Σ.index['id'][element].doc && !Σ.index['id'][element].ignore && !Σ.index['id'][element].secret;
  });
  return ids;
};


/**
 * Reviver function for JSON.parse. Restores Date objects when parsing the json index.
 *
 * @api private
 */
function indexReviver(k, v) {
  if (k === "")
    return v;
  if (typeof v === 'string' &&
      (k == 'modified' || k == 'timestamp' || k == 'schedule')) {
    return new Date(v);
  }
  return v;
}


Indexer.prototype.loadSync = function loadSync() {
  try {
    Σ.index = utils.loadJSONSync(this.path + this.file, indexReviver);
  }
  catch (err) {
    console.error(err);
    Σ.index = this.EMPTY_INDEX();
  }
};


/**
 * Load the index from a file in JSON format.
 *
 * @param {Function} done Callback function called on completion. If the operation was unsuccessful, the callback argument 'err' is an exception
 *
 * @api public
 */
Indexer.prototype.load = function load(done) {
  utils.loadJSON(this.path + this.file, function(err, data) {
    if (!err) {
      Σ.index = data;
    }
    else {
      Σ.index = this.EMPTY_INDEX();
    }
    done(err);
  }, indexReviver);
};


/**
 * Save the index to a file in JSON format.
 *
 * @param {Function} done Callback function called on completion. If the operation was unsuccessful, the callback argument 'err' is an exception
 *
 * @api public
 */
Indexer.prototype.save = function(done) {
  utils.saveJSON(this.path + this.file, Σ.index, done);
};
