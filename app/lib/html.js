// Inspired by https://github.com/isaacs/sax-js/blob/master/examples/pretty-print.js
var sax = require("sax"),
    fs = require("fs");

/**
 * var xmlfile = require("path").join(process.cwd(), filename);
 * stream = fs.createReadStream(xmlfile, { encoding: "utf8" });
 *
 */
module.exports.prettify = function prettify(stream) {
  var printer = sax.createStream(false, { lowercasetags:true, trim:true });
  printer.tabstop = 2;
  printer.level = 0;

  //var fout = fs.createWriteStream(xmlfile + ".o", { encoding: "utf8" });
  printer.print = function(c) {
    if (!process.stdout.write(c))
      stream.pause();
  };

  printer.indent = function(tag) {
    if (tag) {
      switch (tag) {
        case 'div':
        case 'ul':
        case 'ol':
        case 'head':
        case 'body':
        case 'script':
        break;
        default:
        return;
      }
    }
    this.print("\n");
    for (var i = this.level; i > 0; i --)
      for (var j = this.tabstop; j > 0; j --)
        this.print(" ");
  };


  printer.entity = function(s) {
    // apply some heuristics here to guess if the attribute value is already entity-escaped
    if (s.indexOf('&amp;') < 0 && s.indexOf('&quot;') < 0)
      return require('../lib/txt').htmlEscape(s);
    else
      return s;
  };


  printer.on("opentag", function (tag) {
    this.indent(tag.name);
    this.level++;
    this.print("<" + tag.name);
    for (var i in tag.attributes) {
      this.print(" " + i + "=\"" + this.entity(tag.attributes[i]) + "\"");
    }
    this.print(">");
  });


  printer.on("text", function(text) {
    //this.indent();
    var txt = require('../lib/txt');
    text = txt.smarten(text);
    this.print(text);
  });


  printer.on("doctype", function(text) {
    this.print("<!DOCTYPE" + text + ">");
  });


  printer.on("closetag", function(tag) {
    this.level--;
    this.indent(tag.name);
    this.print("</" + tag + ">");
  });


  printer.on("cdata", function(data) {
    this.indent();
    this.print("<![CDATA[" + data + "]]>");
  });


  printer.on("comment", function(comment) {
    this.indent();
    this.print("<!-- " + comment + " -->");
  });


  printer.on("error", function(error) {
    console.error(error);
    throw error;
  });


  process.stdout.on("drain", function() {
    stream.resume();
  });


  stream.pipe(printer);
};
