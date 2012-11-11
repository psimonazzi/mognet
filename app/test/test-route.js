var fs = require('fs');
var path = require('path');
var assert = require("assert");
var router = require("../lib/router");

var Σ = require('../lib/state');

var req0 = {
  'url': '/',
  'headers': {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req1 = {
  'url': '/info',
  'headers': {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req2 = {
  'url': '/search?q=X',
  'headers': {
    'accept': 'application/json',
    'user-agent': 'Mozilla/5.0 (Linux; U; Android 2.3.6; it-it; GT-I9100 Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req3 = {
  'url': '/search.html/www',
  'headers': {
    'accept': 'text/html',
    'user-agent': 'Mozilla/5.0 (Linux; U; Android 2.3.6; it-it; GT-I9100 Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req4 = {
  'url': '/search/tag/2',
  'headers': {
    'accept': 'text/html',
    'user-agent': 'Mozilla/5.0 (Linux; U; Android 2.3.6; it-it; GT-I9100 Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req5 = {
  'url': '/42',
  'headers': {
    'accept': 'text/html',
    'user-agent': 'Mozilla/5.0 (Linux; U; Android 2.3.6; it-it; GT-I9100 Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req6 = {
  'url': '/title-0',
  'headers': {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var req7 = {
  'url': '/secret-0',
  'headers': {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
  },
  'method': 'GET',
  'httpVersion': '1.1'
};

var doc1 = {
  n: 1,
  tag: [ 'www' ],
  rel: [],
  blip: false,
  ignore: false,
  secret: false,
  doc: false,
  timestamp: new Date('Sun, 02 Oct 2011 13:42:03 GMT'),
  title: 'Title 0',
  content: '<p>HTML5 valid ♥',
  id: 'title-0'
};

var doc2 = {
  n: 2,
  tag: [],
  rel: [],
  blip: false,
  ignore: false,
  secret: true,
  doc: false,
  timestamp: new Date('Sun, 02 Oct 2011 13:42:03 GMT'),
  title: 'Secret',
  content: '<p>HTML5 valid ♥',
  id: 'secret-0'
};

describe('router', function() {
  describe('#mobileCheck()', function() {
    it('should detect mobile User Agents', function() {
      assert.equal(true, router.mobileCheck({ 'headers': {'user-agent': 'Android Mobile'} }));
    })
  })

  describe('#parse()', function() {
    it('should parse an HTTP request', function() {

      var route0 = router.parse(req0);
      assert.equal("index", route0.url);
      assert.equal("hi-spec", route0.medium);
      assert.equal("html", route0.output);
      assert.equal("text/html", route0.contentType);

      var route1 = router.parse(req1);
      assert.equal("info", route1.url);
      assert.equal("hi-spec", route1.medium);
      assert.equal("html", route1.output);
      assert.equal("text/html", route1.contentType);

      var route2 = router.parse(req2);
      assert.equal("search", route2.url);
      assert.equal("lo-spec", route2.medium);
      assert.equal("json", route2.output);

      var route3 = router.parse(req3);
      assert.equal("search", route3.url);
      assert.equal("lo-spec", route3.medium);
      assert.equal("html", route3.output);

      var route4 = router.parse(req4);
      assert.equal("search", route4.url);
      assert.equal("lo-spec", route4.medium);
      assert.equal("html", route4.output);

      var route5 = router.parse(req5);
      assert.equal("42", route5.url);
      assert.equal("lo-spec", route5.medium);
      assert.equal("html", route5.output);
    });
  })

  describe('#resource()', function() {
    it('should do whatever it takes to get the requested resource', function(done) {
      // First build an index
      var indexer = require('../lib/indexer').createIndexer();
      indexer.add(doc1);

      // We will get the standard template for this request, and it must already exist.
      /*var tmpfile = path.normalize(__dirname + '/../../tmpl/hi-spec.mu.html');
      try {
        fs.statSync(tmpfile);
      } catch (e) {
        fs.writeFileSync(tmpfile, 'TEST url: {{url}}', 'utf8');
      }*/

      router.getResource(req6, router.parse(req6), function(err, resource) {
        assert.ifError(err);
        assert.notEqual('', resource);
        done(err);
      });
    });

    it('should return 404', function(done) {
      Σ.index['id'] = {};
      Σ.renders = {};
      Σ.compiled_templates = {};
      router.getResource(req6, router.parse(req6), function(err, resource) {
        assert.equal(404, err.status);
        done();
      });
    });

    it('should return 403 for secret documents', function(done) {
      Σ.cfg.verbose = false; // prevent log messages
      Σ.index['id'] = {};
      Σ.renders = {};
      Σ.compiled_templates = {};
      // First build an index
      var indexer = require('../lib/indexer').createIndexer();
      indexer.add(doc2);

      router.getResource(req7, router.parse(req7), function(err, resource) {
        assert.equal(403, err.status);
        done();
      });
    });

    it('should set a unique key for the resource cache', function() {
      var route0 = router.parse(req0);
      assert.equal("index", route0.key);

      var route1 = router.parse(req1);
      assert.equal("info", route1.key);

      var route2 = router.parse(req2);
      assert.equal("search", route2.key);

      var route3 = router.parse(req3);
      assert.equal("search/www", route3.key);

      var route4 = router.parse(req4);
      assert.equal("search/tag/2", route4.key);
    });

  })

})
