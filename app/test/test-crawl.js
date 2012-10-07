var assert = require("assert");
var m = require("../lib/crawler");
var crawler = new m.Crawler();


describe('crawler', function() {
  describe('#slug()', function() {
    it('should handle multiple spaces', function() {
      assert.equal("test-slug-b", crawler.slug("Test   Slug, $  B"));
    });


    it('should handle non-word chars', function() {
      assert.equal("test2-aaabbbeu-s-ccc", crawler.slug("Test2++ * aaa@bb☃béù ß ccc"));
    });


    it('should handle trailing spaces', function() {
      assert.equal("test-a999", crawler.slug("Test A999 * "));
    });


    it('should handle funny unicode spaces', function() {
      assert.equal("a-b-c", crawler.slug("A" + String.fromCharCode(0x205F) + "B" + String.fromCharCode(0x2000) + "c"));
    });
  })


  describe('#from*()', function() {
    it('should extract a document from a file contents', function() {
      var TITLE = "Hello, World";
      var CONTENT = "<p>HTML5 ♥ ⬢";
      var doc = crawler.fromContent(
        "<!DOCTYPE html>\n" +
          "<meta charset=utf-8>\n" +
          "<title>" + TITLE + "</title>\n" +
          "\n" +
          "<script>\n" +
          "{\n" +
          "\"id\": \"123\"\n" +
          "}\n" +
          "</script>\n" +
          "\n" +
          CONTENT + "\n", {});
      assert.equal(CONTENT, doc['content']);
      assert.equal(TITLE, doc['title']);
    });


    it('should extract the full document from an existing file', function(done) {
      var TITLE = "Hello world";
      var ID = "123";
      var CONTENT = "<!DOCTYPE html>\n" +
            "<meta charset=utf-8>\n" +
            "<title>" + TITLE + "</title>\n" +
            "\n" +
            "<script>\n" +
            "{\n" +
            "\"id\": \"" + ID + "\"\n" +
            "}\n" +
            "</script>\n" +
            "\n" +
            "<p>Content: ♥ ⬢</p>\n" +
            "<script>\n" +
            "var a, b, c;\n" +
            "</script>\n";
      var fs = require('fs');
      var path = require('path');
      var filename = path.normalize(__dirname + '/hello-world.html');
      fs.writeFileSync(filename, CONTENT, 'utf8');
      var stats = fs.statSync(filename);

      crawler.on('found', function(doc) {
        assert.equal(filename, doc['filename']);
        assert.equal(stats.mtime, doc['timestamp']);
        assert.equal(TITLE, doc['title']);
        assert.equal(ID, doc['id']);
        // Preserve <script> tags after the first one
        assert.equal(true, doc['content'].indexOf("<script>") > 0);

        fs.unlinkSync(filename);
        done();
      });
      crawler.fetch(filename, stats);
    });


    it('should extract a document from a file name', function() {
      var mtime = new Date().getTime();
      var doc = crawler.fromFile("hello-world.html", { 'mtime': mtime }, {});
      assert.equal("hello-world", doc['id']);
      assert.equal(mtime, doc['timestamp']);

      var doc_date = crawler.fromFile("20121222_hello-world.html", { 'mtime': mtime }, {});
      assert.equal("hello-world", doc_date['id']);
      assert.equal(new Date(2012, 11, 22, 0, 0, 0).toLocaleString(), doc_date['timestamp'].toLocaleString());
      assert.equal(2012, doc_date['timestamp'].getFullYear());
      assert.equal(11, doc_date['timestamp'].getMonth());
      assert.equal(22, doc_date['timestamp'].getDate());
    });

    it('should extract a document from a file name, ignoring first part', function() {
      var mtime = new Date().getTime();
      var doc = crawler.fromFile("doc_hello-world.html", { 'mtime': mtime }, {});
      assert.equal("hello-world", doc['id']);
      assert.equal(mtime, doc['timestamp']);
    });

    it('should extract a document from a file contents and metadata', function() {
      var TITLE = "Hello, World";
      var CONTENT = "<p>HTML5 ♥ ⬢";
      var S = "<!DOCTYPE html>\n" +
            "<meta charset=utf-8>\n" +
            "<title>" + TITLE + "</title>\n" +
            "\n" +
            "<script>\n" +
            "{\n" +
            "\"id\": \"123\",\n" +
            "\"tag\": [ \"www\",\"tag2\" ],\n" +
            "\"rel\": [ \"title-0\" ],\n" +
            "\"timestamp\": \"1981/07/01 17:30\",\n" +
            "\"schedule\": \"1981/07/01 17:30\",\n" +
            "\"modified\": \"1981/07/01 17:30\"\n" +
            "}\n" +
            "</script>\n" +
            "\n" +
            CONTENT + "\n";
      var doc = crawler.fromContent(S, {});
      doc = crawler.fromMeta(S, doc);
      assert.equal(1, doc['rel'].length);
      assert.equal(2, doc['tag'].length);
      assert.equal('tag2', doc['tag'][1]);
      assert.equal('title-0', doc['rel'][0]);
      assert.equal(new Date(1981, 6, 1, 17, 30, 0).toLocaleString(), doc['timestamp'].toLocaleString());
      assert.equal(new Date(1981, 6, 1, 17, 30, 0).toLocaleString(), doc['schedule'].toLocaleString());
      assert.equal(new Date(1981, 6, 1, 17, 30, 0).toLocaleString(), doc['modified'].toLocaleString());
    });

    it('should extract a document title from a file contents in HTML or Markdown', function() {
      var TITLE = "Hello, World ♥";
      var S = "<!DOCTYPE html>\n" +
            "<meta charset=utf-8>\n" +
            "<title>" + TITLE + "</title>\n" +
            "\n" +
            "AAA\n";
      var doc = crawler.fromContent(S, {});
      assert.equal(TITLE, doc['title']);

      var S2 = "# " + TITLE + "\n" +
            "\n" +
            "AAA\n";
      var marked = require('marked');
      S2 = marked(S2);
      var doc2 = crawler.fromContent(S2, {});
      assert.equal(TITLE, doc2['title']);
    });

  })
})
