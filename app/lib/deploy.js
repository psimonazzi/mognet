/**
 * TODO
 *
 * See https://github.com/h5bp/node-build-script
 *
 */
var fs = require('fs');
var utils = require('../lib/utils');


exports.minifyJs = function minifyJs() {
  var uglify = require('uglify-js');
  var jsp = uglify.parser;
  var pro = uglify.uglify;

  var str = fs.readFileSync(__dirname + '/../../doc/js/app.js', 'utf8');
  var ast = jsp.parse(str);
  ast = pro.ast_mangle(ast);
  ast = pro.ast_squeeze(ast);
  var uglified = pro.gen_code(ast);
  fs.writeFileSync(__dirname + '/../../doc/js/app.min.js', uglified, 'utf8');
};


exports.minifyCss = function minifyCss() {
  var str = fs.readFileSync(__dirname + '/../doc/css/style.css', 'utf8');
  var sqwished = require('sqwish').minify(str);
  fs.writeFileSync(__dirname + '/../../doc/css/style.min.css', sqwished, 'utf8');
};


exports.minifyHtml = function minifyHtml() {
  var str = fs.readFileSync(__dirname + '/../../doc/index.html', 'utf8');
  // Don't bother stripping whitespace, it will be gzipped anyway!
  str = str.replace(/<!--([\s\S]*?)-->/igm, '');
  fs.writeFileSync(__dirname + '/../../doc/index.html', str, 'utf8');
};


// exports.updateLicense = function updateLicense() {
//   var hogan = require('hogan.js');
//   var str = fs.readFileSync(__dirname + '/../server.js', 'utf8');
//   var template = hogan.compile(str);
//   var context = utils.loadJSONSync(__dirname + '/../package.json');
//   str = template.render(context);
//   fs.writeFileSync(__dirname + '/../server.js', str, 'utf8');
// };


exports.minify = function minify() {
  // Minify assets if the minified files are missing
  if (!fs.existsSync(__dirname + '/../../doc/js/app.min.js'))
    minifyJs();
  if (!fs.existsSync(__dirname + '/../../doc/css/style.min.css'))
    minifyCss();
};
