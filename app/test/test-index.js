var assert = require("assert");
var Σ = require('../lib/state');
var indexer = require('../lib/indexer').createIndexer();


var doc1 = {
  n: 1,
  tag: [ 'www' ],
  rel: [],
  ignore: false,
  secret: false,
  doc: false,
  timestamp: new Date(0),
  schedule: new Date(0),
  modified: new Date(0),
  title: 'Title 0',
  content: '<p>HTML5 valid ♥',
  id: 'title-0'
};
var doc2 = {
  n: 2,
  tag: [ 'www', 'tag2' ],
  rel: [ 'title-0' ],
  ignore: false,
  secret: false,
  doc: false,
  timestamp: new Date(1000),
  schedule: new Date(1000),
  modified: new Date(1000),
  title: 'Title 1',
  content: '<p>content</p>',
  id: 'title-1'
};
var doc3 = {
  n: 3,
  tag: [],
  rel: [],
  ignore: true,
  secret: false,
  doc: false,
  timestamp: new Date(2000),
  schedule: new Date(2000),
  modified: new Date(2000),
  title: 'Ignore Me',
  content: '<p>content</p>',
  id: 'ignore-me'
};
var doc4 = {
  n: 4,
  tag: [],
  rel: [],
  ignore: false,
  secret: true,
  doc: false,
  timestamp: new Date(3000),
  schedule: new Date(3000),
  modified: new Date(3000),
  title: 'Secret',
  content: '<p>content</p>',
  id: 'secret'
};
var doc5 = {
  n: 5,
  tag: [],
  rel: [],
  ignore: false,
  secret: true,
  doc: true,
  timestamp: new Date(4000),
  schedule: new Date(4000),
  modified: new Date(4000),
  title: 'Doc 1',
  content: '<p>content</p>',
  id: 'doc1'
};
var doc6 = {
  n: 6,
  tag: [],
  rel: [],
  ignore: false,
  secret: false,
  doc: true,
  timestamp: new Date('Wed, 01 Jul 1981 17:42:03 GMT'),
  schedule: new Date('Wed, 01 Jul 1981 17:42:03 GMT'),
  modified: new Date('Wed, 01 Jul 1981 17:42:03 GMT'),
  title: 'Doc 2',
  content: '<p>content</p>',
  id: 'doc2'
};
var doc7 = {
  n: 7,
  tag: [],
  rel: [],
  ignore: false,
  secret: false,
  doc: false,
  timestamp: new Date('Sat, 13 Oct 2012 10:47:00 GMT'),
  schedule: new Date('Sat, 13 Oct 2012 10:47:00 GMT'),
  modified: new Date('Sat, 13 Oct 2012 10:47:00 GMT'),
  title: 'title 7',
  content: '<p>content</p>',
  id: 'title-7'
};

describe('indexer', function() {
  beforeEach(function() {
    Σ.index = {}; // empty index
  })

  after(function() {
    try {
      require('fs').unlinkSync(indexer.path + indexer.file);
    } catch (e) { }
  })

  describe('#add()', function() {
    it('should add documents to the index', function() {
      indexer.add(doc1);
      indexer.add(doc2);
      indexer.add(doc6);

      //console.log(require('util').inspect(indexer.index, false, null, true));
      assert.equal(doc2, Σ.index.id['title-1']);
      assert.equal(2, Σ.index.tag['www'].length);
      assert.equal(3, Object.keys(Σ.index.id).length);
      assert.equal("Title 0", Σ.index.id['title-0']['title']);
      assert.equal(1, Σ.index.time['1981/07'].length);
    });
  })


  describe('#save()', function() {
    it('should save the index to a json file and reload it correctly', function(done) {
      indexer.add(doc1);
      indexer.add(doc6);

      indexer.save(function(err) {
        assert.ifError(err);
        indexer.load(function(err) {
          assert.ifError(err);
          assert.equal(1, Σ.index.time['1981/07'].length);
          done(err);
        });
      });
    });
  })

  describe('#sort()', function() {
    it('should sort documents in the index', function() {
      indexer.add(doc1);
      indexer.add(doc2);
      indexer.add(doc3);
      indexer.add(doc4);
      indexer.add(doc5);
      indexer.add(doc6);
      indexer.add(doc7);

      indexer.sort();
      assert.equal(3, Σ.index.n.length);
      assert.equal(doc1.id, Σ.index.n[0]);
      assert.equal(doc2.id, Σ.index.n[1]);
      assert.equal(doc7.id, Σ.index.n[2]);
      assert.equal(Σ.index.id[Σ.index.n[0]].n, 0);
      assert.equal(Σ.index.id[Σ.index.n[1]].n, 1);
      assert.equal(Σ.index.id[Σ.index.n[2]].n, 2);
    });
  })

  describe('#load()', function() {
    it('should load the index json file synchronously, reviving any Date object', function(done) {
      indexer.add(doc1);
      indexer.add(doc2);

      indexer.save(function(err) {
        assert.ifError(err);

        indexer.loadSync();
        assert.equal(2, Object.keys(Σ.index.id).length);
        assert.equal(typeof new Date(), typeof Σ.index.id[doc1.id].timestamp);
        assert.equal(typeof new Date(), typeof Σ.index.id[doc1.id].schedule);
        assert.equal(typeof new Date(), typeof Σ.index.id[doc1.id].modified);
        assert.equal(doc1.timestamp.getSeconds(), Σ.index.id[doc1.id].timestamp.getSeconds());
        assert.equal(typeof doc1.title, typeof Σ.index.id[doc1.id].title);
        done(err);
      });

    })
  })


  describe('#publicIds()', function() {
    it('should get the ids of public documents', function() {
      indexer.add(doc1);
      indexer.add(doc2);
      indexer.add(doc3);
      indexer.add(doc4);
      indexer.add(doc5);
      indexer.add(doc6);

      assert.equal(6, Object.keys(Σ.index.id).length);
      assert.equal(2, indexer.publicIds().length);
      indexer.sort();
      assert.equal(doc1.id, indexer.publicIds()[0]);
    });
  })

  describe('#nonPublicIds()', function() {
    it('should get the ids of non-public documents', function() {
      indexer.add(doc1);
      indexer.add(doc2);
      indexer.add(doc3);
      indexer.add(doc4);
      indexer.add(doc5);
      indexer.add(doc6);
      indexer.sort();

      var nonPublicIds = indexer.nonPublicIds();
      assert.equal(2, nonPublicIds.length);
      assert.equal(4, nonPublicIds.length + indexer.publicIds().length);
      assert.equal(doc3.id, nonPublicIds[0]);
      assert.equal(doc4.id, nonPublicIds[1]);
    });
  })

  describe('#documentIds()', function() {
    it('should get the ids of non-articles', function() {
      indexer.add(doc1);
      indexer.add(doc2);
      indexer.add(doc3);
      indexer.add(doc4);
      indexer.add(doc5);
      indexer.add(doc6);

      var documentIds = indexer.documentIds();
      assert.equal(1, documentIds.length);
      assert.equal(doc6.id, documentIds[0]);
    });
  })
})
