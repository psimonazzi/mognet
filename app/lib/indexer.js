var util = require('util');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
require('colors');

var utils = require('../lib/utils');
var Σ = require('../lib/state');

module.exports.createIndexer = function createIndexer() { return new Indexer(); };

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
 * The index fields are:
 *
 * id - Map of document ids and data.
 * tag - Map of tags and arrays with the ids having that tag.
 * time - Map of time spans and arrays with the ids having that timestamp. The time spans are in format: 'yyyy/mm'.
 * n - Array of document ids in chronological order. Array index corresponds to document field 'n'.
 *
 * @api public
 */
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

  // Index by tag and time only if the document is public
  if (this.isPublicId(doc.id)) {
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
  }
};


/**
 * Sort the public articles in the index, creating an array with the ordered document ids in the 'n' field of the index.
 * The 'n' field of each document is also updated to reflect its position in the index (zero-based).
 * Sort according to modified date and document id.
 * Only public articles are sorted. Secret, ignored, or non-article documents will not have a 'n' field. So the sorted array length may NOT be equal to the total number of documents in the index.
 *
 * @api public
 */
Indexer.prototype.sort = function() {
  if (!Σ.index)
    return;

  // reset
  Σ.index['n'] = null;

  Σ.index['n'] = this.publicIds().sort(function(a, b) {
    var aTime = Σ.index['id'][a].modified.getTime(), bTime = Σ.index['id'][b].modified.getTime();
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
  var self = this;
  var ids = (Σ.index['n'] || Object.keys(Σ.index['id'])).filter(function(id, index, array) {
    return self.isPublicId(id);
  });
  return ids;
};


/**
 * Get the ids of the non-public documents in the index.
 *
 * @return {Array} The array of non-public document ids (sorted if the index is sorted), or the empty array if the index is empty
 *
 * @api public
 */
Indexer.prototype.nonPublicIds = function nonPublicIds() {
  if (!Σ.index || !Σ.index['id'])
    return [];
  var self = this;
  var ids = (Object.keys(Σ.index['id'])).filter(function(id, index, array) {
    return !Σ.index['id'][id].doc && (Σ.index['id'][id].ignore || Σ.index['id'][id].secret);
  });
  return ids;
};


/**
 * Determine if the document with the given id is public. Public documents are all articles not flagged 'secret' or 'ignore'.
 *
 * @param {string} id The document id
 *
 * @return {boolean} Whether the document is public or not
 *
 * @api public
 */
Indexer.prototype.isPublicId = function isPublicId(id) {
  return !Σ.index['id'][id].doc && !Σ.index['id'][id].ignore && !Σ.index['id'][id].secret;
};



/**
 * Get the ids of the non-article, non-secret documents in the index.
 *
 * @return {Array} The array of non-article document ids (sorted if the index is sorted), or the empty array if the index is empty
 *
 * @api public
 */
Indexer.prototype.documentIds = function documentIds() {
  if (!Σ.index || !Σ.index['id'])
    return [];
  var ids = Object.keys(Σ.index['id']).filter(function(id, index, array) {
    return Σ.index['id'][id].doc && !Σ.index['id'][id].secret;
  });
  return ids;
};


/**
 * Reviver function for JSON.parse. Restores Date objects when parsing the json index.
 *
 * @param {string} k JSON field name
 * @param {Object} v JSON field value
 *
 * @api private
 */
function indexReviver(k, v) {
  if (k === '')
    return v;
  if (typeof v === 'string' &&
      (k === 'modified' || k === 'timestamp' || k === 'schedule')) {
    return new Date(v);
  }
  return v;
}


Indexer.prototype.loadSync = function loadSync() {
  try {
    Σ.index = utils.loadJSONSync(this.path + this.file, indexReviver);
  }
  catch (err) {
    if (Σ.cfg.verbose) console.error(err);
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
