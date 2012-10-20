var assert = require("assert");
var router = require("../lib/router");
var Σ = require('../lib/state');
var Indexer = require('../lib/indexer').Indexer;


describe('handlers', function() {
  beforeEach(function() {
    Σ.index = new Indexer().EMPTY_INDEX(); // empty index
  })

  describe('index handler', function() {
    it('should handle the \'index\' special resource', function() {
      //indexer.loadSync();

      var req1 = {
        'url': '/index',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route1 = router.parse(req1);
      assert.equal("index", route1.url);
      var ctx1 = router.context(route1, req1);
      assert.equal(1, ctx1.page);

      var req2 = {
        'url': '/index/42',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route2 = router.parse(req2);
      assert.equal("index", route2.url);
      var ctx2 = router.context(route2, req2);
      assert.equal(42, ctx2.page);
    });
  })

  describe('search handler', function() {
    it('should handle the \'search\' special resource', function() {
      var req1 = {
        'url': '/search/2012/07',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route1 = router.parse(req1);
      assert.equal("search", route1.url);
      var ctx1 = router.context(route1, req1);
      assert.equal("2012/07", ctx1.filter);
      assert.equal(1, ctx1.page);

      var req2 = {
        'url': '/search/2012/07/42',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route2 = router.parse(req2);
      assert.equal("search", route2.url);
      var ctx2 = router.context(route2, req2);
      assert.equal("2012/07", ctx2.filter);
      assert.equal(42, ctx2.page);

      var req3 = {
        'url': '/search/tag/42',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route3 = router.parse(req3);
      assert.equal("search", route3.url);
      var ctx3 = router.context(route3, req3);
      assert.equal("tag", ctx3.filter);
      assert.equal(42, ctx3.page);

      var req4 = {
        'url': '/search/tag',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route4 = router.parse(req4);
      assert.equal("search", route4.url);
      var ctx4 = router.context(route4, req4);
      assert.equal("tag", ctx4.filter);
      assert.equal(1, ctx4.page);
    });
  })


  describe('RSS handler', function() {
    it('should handle the RSS special resource', function() {
      var req1 = {
        'url': '/rss.xml',
        'headers': {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'user-agent': 'Mozilla/5.0 (Windows NT 6.0; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        'method': 'GET',
        'httpVersion': '1.1'
      };
      var route1 = router.parse(req1);
      assert.equal("rss", route1.url);
      var ctx1 = router.context(route1, req1);
      assert.equal(Σ.cfg.locale, ctx1.language);
    });
  })

})
