var assert = require("assert");
var crawler = require('../lib/crawler').createCrawler();


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

    it('should handle HTML tags', function() {
      assert.equal("test-html-tags", crawler.slug("<h1>Test</h1> HTML<br/> Tags"));
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
            "\"id\": \"" + ID + "\",\n" +
            "\"blip\": true\n" +
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

      crawler.once('found', function(doc) {
        assert.equal(filename, doc['filename']);
        assert.equal(stats.ctime, doc['timestamp']);
        assert.equal(TITLE, doc['title']);
        assert.equal(ID, doc['id']);
        assert.equal(true, doc['blip']);
        // Preserve <script> tags after the first one
        assert.equal(true, doc['content'].indexOf("<script>") > 0);

        fs.unlinkSync(filename);
        done();
      });
      crawler.fetch(filename, stats);
    });


    it('should extract a document from a file name', function() {
      var mtime = new Date().getTime();
      var ctime = new Date(new Date().getTime() - 10000);
      var doc = crawler.fromFile("hello-world.html", { 'ctime': ctime, 'mtime': mtime }, {});
      assert.equal("hello-world", doc['id']);
      assert.equal(ctime, doc['timestamp']);
      assert.equal(mtime, doc['modified']);

      var doc_date = crawler.fromFile("20121222_hello-world.html", { 'mtime': mtime, 'ctime': mtime }, {});
      assert.equal("hello-world", doc_date['id']);
      assert.equal(new Date(2012, 11, 22, 0, 0, 0).toLocaleString(), doc_date['timestamp'].toLocaleString());
      assert.equal(2012, doc_date['timestamp'].getFullYear());
      assert.equal(11, doc_date['timestamp'].getMonth());
      assert.equal(22, doc_date['timestamp'].getDate());
    });

    it('should extract a document from a file name, ignoring first part', function() {
      var mtime = new Date().getTime();
      var doc = crawler.fromFile("doc_hello-world.html", { 'mtime': mtime, 'ctime': mtime }, {});
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
            "\"modified\": \"1981/08/02 18:30\"\n" +
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
      assert.equal(new Date(1981, 7, 2, 18, 30, 0).toLocaleString(), doc['modified'].toLocaleString());
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
            "_AAA_\n";
      var marked = require('marked');
      S2 = marked(S2);
      var doc2 = crawler.fromContent(S2, {});
      assert.equal(TITLE, doc2['title']);
    });

    it('should extract a document metadata from a file contents in Markdown', function(done) {
      var TITLE = "Hello, World";
      var CONTENT = "<script>\n" +
            "{\n" +
            "\"id\": \"test-markdown\",\n" +
            "\"doc\": true,\n" +
            "\"tag\": [ \"www\",\"tag2\" ],\n" +
            "\"rel\": [ \"title-0\" ]\n" +
            "}\n" +
            "</script>\n" +
            "\n" +
            "# " + TITLE + "\n" +
            "\n" +
            "_AAA_\n";
      var fs = require('fs');
      var path = require('path');
      var filename = path.normalize(__dirname + '/test-markdown.md');
      fs.writeFileSync(filename, CONTENT, 'utf8');
      var stats = fs.statSync(filename);

      crawler.once('found', function(doc) {
        assert.equal("test-markdown", doc.id);
        assert.equal(TITLE, doc.title);
        assert.equal(true, doc.doc);
        assert.equal("tag2", doc.tag[1]);
        fs.unlinkSync(filename);
        done();
      });
      crawler.fetch(filename, stats);
    });

    it('should extract a document abstract and description', function() {
      var S = "<!DOCTYPE html>\n" +
            "<meta charset=utf-8>\n" +
            "<title>Abstract</title>\n" +
            "\n" +
            "<p>First <code>p</code> used for     abstract.</p>\n" +
            "<p>Second.</p>";
      var doc = crawler.fromContent(S, {});
      assert.equal(null, doc['abstract']);
      assert.equal("<p>First <code>p</code> used for     abstract.</p>\n<p>Second.</p>", doc['content']);
      assert.equal("First p used for abstract. Second.", doc['description']);
      assert.equal(null, doc['description'].match(/<.+?>/));

      var PADDING = "<p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p><p>Second.</p>";
      var ABSTRACT = "<p>First <code>p</code> used for     abstract. First <code>p</code> used for     abstract. First <code>p</code> used for     abstract. First <code>p</code> used for     abstract. First <code>p</code> used for     abstract. First <code>p</code> used for     abstract.</p>";
      S = "<!DOCTYPE html>\n" +
            "<meta charset=utf-8>\n" +
            "<title>Abstract</title>\n" +
            "\n" +
            ABSTRACT + "\n" +
            "<br/>\n\n" +
            PADDING;
      var doc2 = crawler.fromContent(S, {});
      assert.equal(ABSTRACT, doc2['abstract']);
      assert.equal("First p used for abstract. First p used for abstract. First p used for abstract. First p used for abstract. First p used for abstract. First …", doc2['description']);

      var S2 = "<!DOCTYPE html>\n" +
            "<meta charset=utf-8>\n" +
            "<title>Abstract</title>\n" +
            "<script>\n" +
            "{\n" +
            "\"abstract\": false\n" +
            "}\n" +
            "</script>\n" +
            "\n" +
            ABSTRACT + "\n" +
            "<br/>\n\n" +
            PADDING;
      var doc3 = crawler.fromContent(S2, {});
      doc3 = crawler.fromMeta(S2, doc3);
      assert.equal(false, doc3['abstract']);
      assert.equal("First p used for abstract. First p used for abstract. First p used for abstract. First p used for abstract. First p used for abstract. First …", doc3['description']);
    });

  })
})
