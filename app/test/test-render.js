var fs = require('fs');
var path = require('path');
var assert = require("assert");
var Σ = require('../lib/state');
var renderer = require("../lib/renderer");

var TEMPLATE_HI = 'hi-spec_TEST.mu.html';
var TEMPLATE_HI_FILENAME = path.normalize(__dirname + '/../../tmpl/' + TEMPLATE_HI);

var route0 = {
  'url': 'test0',
  'key': 'test0',
  'output': 'html'
};

var route1 = {
  'url': 'aaa',
  'key': 'aaa',
  'output': 'html',
  'medium': 'hi-spec_TEST'
};

var route2 = {
  'url': 'X',
  'key': 'X',
  'output': 'html',
  'medium': 'lo-spec_TEST'
};

var route3 = {
  'url': 'test-url',
  'key': 'test-url',
  'output': 'html',
  'medium': 'hi-spec_TEST'
};

var route4 = {
  'url': 'test',
  'key': 'test',
  'output': 'html',
  'medium': 'DUMMY'
};

var doc1 = {
  n: 1,
  tag: [ 'www' ],
  rel: [],
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
  secret: false,
  doc: false,
  timestamp: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  schedule: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  modified: new Date('Sun, 03 Oct 2012 13:42:03 GMT'),
  title: 'Title 1',
  content: '<p>content</p>',
  id: 'title-1'
};

describe('renderer', function() {
  beforeEach(function() {
    Σ.renders = {};
    Σ.compiled_templates = {};
  })

  describe('#templateName()', function() {
    it('should create the template filename for a given resource', function() {
      assert.equal('index.mu.html', renderer.templateName(route0));
      assert.equal(TEMPLATE_HI, renderer.templateName(route1));
      assert.equal('lo-spec_TEST.1.mu.html', renderer.templateName(route2, '1'));
    });
  })

  /*describe('#compileAndRender()', function() {
    it('should compile and apply a template to a context', function() {
      assert.equal('Compiled template ' + TEMPLATE_HI + ': ☆',
                   renderer.compileAndRender(TEMPLATE_HI, 'Compiled template ' + TEMPLATE_HI + ': {{foo}}', { 'foo': '☆' }));
      assert.ok(Σ.compiled_templates[TEMPLATE_HI]);
    });
  })*/

  describe('#renderNew()', function() {
    it('should return the cached template after first compile', function(done) {
      // Create tmp template file
      fs.writeFileSync(TEMPLATE_HI_FILENAME, 'TEST url: {{url}}', 'utf8');

      renderer.renderNew(route3, { 'url': route3.url }, function(err, content) {
        assert.ifError(err);
        assert.equal('TEST url: ' + route3.url, content);
        assert.equal(1, Object.keys(Σ.renders).length);

        // Run again (do not read from file)
        var content2 = renderer.render(route3);
        assert.equal('TEST url: ' + route3.url, content2);

        try {
          fs.unlinkSync(TEMPLATE_HI_FILENAME);
        } catch (e) { }

        done(err);
      });
    });
  })

  describe('#renderNew()', function() {
    it('should return the resource content as text, after compiling template', function(done) {
      // Create tmp template file
      try {
        fs.statSync(TEMPLATE_HI_FILENAME);
      } catch (e) {
        fs.writeFileSync(TEMPLATE_HI_FILENAME, 'TEST url: {{url}}', 'utf8');
      }

      renderer.renderNew(route3, { 'url': route3.url }, function(err, content) {
        assert.ifError(err);
        assert.equal('TEST url: ' + route3.url, content);
        assert.equal(1, Object.keys(Σ.renders).length);
        assert.equal('TEST url: ' + route3.url, Σ.renders[route3.url]['hi-spec_TEST.mu.html']);

        try {
          fs.unlinkSync(TEMPLATE_HI_FILENAME);
        } catch (e) { }

        done(err);
      });
    });
  })

  describe('#renderNew()', function() {
    it('should fail when the template file is not found', function(done) {
      renderer.renderNew(route4, { 'url': route4.url }, function(err, content) {
        assert.equal(true, err instanceof Error);
        done();
      });
    });
  })

  describe('#preRender()', function() {
    it('should render all documents in the index twice (once for lo-spec, one for hi-spec)', function(done) {
      // First build an index
      Σ.index = {};
      var indexer = require('../lib/indexer').createIndexer();
      indexer.add(doc1);
      indexer.add(doc2);

      renderer.preRender(function() {
        assert.equal(Object.keys(Σ.renders).length, Object.keys(Σ.index['id']).length);
        assert.equal(2, Object.keys(Σ.renders[Object.keys(Σ.renders)[0]]).length);
        done();
      });
    });
  })

})
