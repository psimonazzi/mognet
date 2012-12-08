(function() {
  if (typeof html === "undefined" || html === null) {
    var html = {};
  }

  // Inspired by https://github.com/isaacs/sax-js/blob/master/examples/pretty-print.js
  html.prettify = function(filename) {
    var sax = require("sax"),
        fs = require("fs");
    var printer = sax.createStream(false, { lowercasetags:true, trim:true });
    var out = "";


    function entity(str) {
      // apply some heuristics here to guess if the attribute value is already entity-escaped
      if (str.indexOf('&amp;') < 0 && str.indexOf('&quot;') < 0)
        return str.replace('&', '&amp;').replace('"', '&quot;');
      else
        return str;
    }

    printer.tabstop = 2;
    printer.level = 0;
    printer.indent = function () {
      print("\n");
      for (var i = this.level; i > 0; i --) {
        for (var j = this.tabstop; j > 0; j --) {
          print(" ");
        }
      }
    };


    printer.on("opentag", function (tag) {
      this.indent();
      this.level++;
      print("<" + tag.name);
      for (var i in tag.attributes) {
        print(" " + i + "=\"" + entity(tag.attributes[i]) + "\"");
      }
      print(">");
    });

    function ontext(text) {
      this.indent();
      //TODO prettify text with nice typography
      print(text);
    }
    printer.on("text", ontext);
    printer.on("doctype", ontext);

    printer.on("closetag", function(tag) {
      this.level--;
      this.indent();
      print("</" + tag + ">");
    });

    printer.on("cdata", function(data) {
      this.indent();
      print("<![CDATA[" + data + "]]>");
    });

    printer.on("comment", function(comment) {
      this.indent();
      print("<!--" + comment + "-->");
    });

    printer.on("error", function(error) {
      console.error(error);
      throw error;
    });

    //typeof filename !== "string"
    if (!filename) {
      throw new Error("Please provide an xml file to prettify\n" +
                      "TODO: read from stdin or take a file");
    }
    var xmlfile = require("path").join(process.cwd(), filename);
    var fstr = fs.createReadStream(xmlfile, { encoding: "utf8" });
    var fout = fs.createWriteStream(xmlfile + ".o", { encoding: "utf8" });

    function print(c) {
      if (!fout.write(c)) {
        fstr.pause();
      }
    }

    process.stdout.on("drain", function() {
      fstr.resume();
    });

    fstr.pipe(printer);
  };


  // Node.js module
  if (typeof module != 'undefined' && module.exports) {
    module.exports = html;
  }

  // Browser
  if (typeof window != 'undefined') {
    window.html = html;
  }

})();
