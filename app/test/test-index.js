var assert = require("assert");
var Σ = require('../lib/state');
var m = require("../lib/indexer");
var indexer = new m.Indexer();


var doc1 = {
  n: 1,
  tag: [ 'www' ],
  rel: [],
  ignore: false,
  secret: false,
  doc: false,
  timestamp: new Date('Sun, 02 Oct 2011 13:42:03 GMT'),
  schedule: new Date('Sun, 02 Oct 2011 13:42:03 GMT'),
  modified: new Date('Sun, 02 Oct 2011 13:42:03 GMT'),
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
  timestamp: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  schedule: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  modified: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
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
  timestamp: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  schedule: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  modified: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
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
  timestamp: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  schedule: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  modified: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  title: 'Secret',
  content: '<p>content</p>',
  id: 'secret'
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

      //console.log(require('util').inspect(indexer.index, false, null, true));
      assert.equal(doc2, Σ.index.id['title-1']);
      assert.equal(2, Σ.index.tag['www'].length);
      assert.equal(2, Object.keys(Σ.index.id).length);
      assert.equal("Title 0", Σ.index.id['title-0']['title']);
      assert.equal(1, Σ.index.time['2012/10'].length);
    });
  })


  describe('#save()', function() {
    it('should save the index to a json file and reload it correctly', function(done) {
      indexer.add(doc1);
      indexer.add(doc2);
      //var index0 = indexer.index;

      indexer.save(function(err) {
        assert.ifError(err);
        indexer.load(function(err) {
          assert.ifError(err);
          assert.equal(1, Σ.index.time['2012/10'].length);
          done(err);
        });
      });
    });
  })

  describe('#sort()', function() {
    it('should sort documents in the index', function() {
      indexer.add(doc1);
      indexer.add(doc2);

      indexer.sort();
      assert.equal(2, Σ.index.n.length);
      assert.equal(doc1.id, Σ.index.n[0]);
      assert.equal(doc2.id, Σ.index.n[1]);
      assert.equal(Σ.index.id[Σ.index.n[0]].n, 0);
      assert.equal(Σ.index.id[Σ.index.n[1]].n, 1);
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

      assert.equal(4, Object.keys(Σ.index.id).length);
      assert.equal(2, indexer.publicIds().length);
      indexer.sort();
      assert.equal(doc1.id, indexer.publicIds()[0]);
    });
  })
})
