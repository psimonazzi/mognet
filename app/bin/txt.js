#!/usr/bin/env node

require('colors');

var txt = require('../lib/txt');


var cmd, f;
if (process.argv.length > 2) {
  if (process.argv[2] == '-h')
    cmd = 'help';
  if (process.argv[2] == '-s' || process.argv[2] == '--smarten')
    cmd = 'smarten';
  else if (process.argv[2] == '-e' || process.argv[2] == '--escape')
    cmd = 'escape';
  else if (process.argv[2] == '-t' || process.argv[2] == '--transliterate')
    cmd = 'transliterate';
  else if (process.argv[2] == '-m' || process.argv[2] == '--markdown')
    cmd = 'markdown';
  if (process.argv.length > 3)
    f = process.argv[3];
}
else {
  cmd = 'help';
}

if (cmd == 'help') {
  console.log('USAGE:');
  console.log('%s -s,--smarten [<file>]       ' + 'Refine typography on input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -t,--transliterate [<file>] ' + 'Transliterate to ASCII string the input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -e,--escape [<file>]        ' + 'Escape HTML special chars on input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -m,--markdown [<file>]      ' + 'Convert to HTML the Markdown input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -h                          ' + 'Display this message'.grey, process.argv[1]);
  process.exit(1);
}

function out(s, fn) {
  switch (cmd) {
  case 'smarten':
    fn(txt.smarten(s));
    break;
  case 'transliterate':
    fn(txt.transliterate(s));
    break;
  case 'escape':
    fn(txt.htmlEscape(s));
    break;
  case 'markdown':
    var marked = require('marked');
    fn(marked(s));
    break;
  }
}

if (f) {
  // read from file and output to stdout
  var s = require('fs').readFileSync(f, 'utf8');
  out(s, console.log);
}
else {
  // read from stdin and output to stdout, interactively
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(s) {
    out(s, function(a) { process.stdout.write(a); });
  });

  process.stdin.on('end', function () {
    // no op
  });
}
