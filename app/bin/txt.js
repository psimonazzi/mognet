#!/usr/bin/env node

require('colors');

var txt = require('../lib/txt');


var help, smarten, transliterate, escape, f;
if (process.argv.length > 2) {
  if (process.argv[2] == '-h')
    help = true;
  if (process.argv[2] == '-s' || process.argv[2] == '--smarten')
    smarten = true;
  else if (process.argv[2] == '-e' || process.argv[2] == '--escape')
    escape = true;
  else if (process.argv[2] == '-t' || process.argv[2] == '--transliterate')
    transliterate = true;
  if (process.argv.length > 3)
    f = process.argv[3];
}
else {
  smarten = true;
}

if (help) {
  console.log('USAGE:');
  console.log('%s -s,--smarten [<file>]       ' + 'Refine typography on input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -t,--transliterate [<file>] ' + 'Transliterate to ASCII string the input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -e,--escape [<file>]        ' + 'Escape HTML special chars on input (stdin or file)'.grey, process.argv[1]);
  console.log('%s -h                        ' + 'Display this message'.grey, process.argv[1]);
  process.exit(1);
}

if (f) {
  // read from file and output to stdout
  var s = require('fs').readFileSync(f, 'utf8');
  if (smarten)
    console.log(txt.smarten(s));
  else if (transliterate)
    console.log(txt.transliterate(s));
  else if (escape)
    console.log(txt.htmlEscape(s));
}
else {
  // read from stdin and output to stdout, interactively
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(s) {
    if (smarten)
      process.stdout.write(txt.smarten(s));
    else if (transliterate)
      process.stdout.write(txt.transliterate(s));
    else if (escape)
      process.stdout.write(txt.htmlEscape(s));
  });

  process.stdin.on('end', function () {
    
  });
}