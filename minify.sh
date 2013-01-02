#!/usr/bin/env bash
# Run from mognet dir

cat doc/js/app.js doc/js/rainbow-custom.min.js > doc/js/app.min.js
# uglifyjs --unsafe doc/js/app.min.js > doc/js/app.min.js
# sqwish doc/css/style.css -o doc/css/style.min.css
