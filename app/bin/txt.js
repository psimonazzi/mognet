#!/usr/bin/env node

require('colors');

var txt = require('../lib/txt');


var help, smarten, transliterate, escape, f;
if (process.argv.length > 2) {
  if (process.argv[2] == '-h')
    help = true;
  else {
    if (process.argv.length > 3) {
      if (process.argv[2] == '-s' || process.argv[2] == '--smarten')
        smarten = true;
      else if (process.argv[2] == '-e' || process.argv[2] == '--escape')
        escape = true;
      else if (process.argv[2] == '-t' || process.argv[2] == '--transliterate')
        transliterate = true;
      f = process.argv[3];
    }
    else {
      smarten = true;
      f = process.argv[2];
    }
  }
}

if (help) {
  console.log('USAGE:');
  console.log('%s -s,--smarten <file>       ' + 'Refine typography on input file'.grey, process.argv[1]);
  console.log('%s -t,--transliterate <file> ' + 'Transliterate to ASCII string the input file'.grey, process.argv[1]);
  console.log('%s -e,--escape <file>        ' + 'Escape HTML special chars on input file'.grey, process.argv[1]);
  console.log('%s -h                        ' + 'Display this message'.grey, process.argv[1]);
  process.exit(1);
}

var s = require('fs').readFileSync(f, 'utf8');
if (smarten)
  console.log(txt.smarten(s));
else if (transliterate)
  console.log(txt.transliterate(s));
else if (escape)
  console.log(txt.htmlEscape(s));
