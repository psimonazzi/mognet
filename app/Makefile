test:
	@@mocha --reporter dot

test-verbose:
	@@mocha --reporter spec

deploy:
# get latest tag or current branch name if none
	TAG=$(git describe --exact-match --abbrev=0)
	[[ $(echo $TAG | grep fatal) != "" ]] && TAG=$(git branch | grep "*" | sed "s/* //")
	git archive --format=tar HEAD | (mkdir /var/www/mognet-$TAG && cd /var/www/mognet-$TAG && tar xf -)

install:
	@@npm install

debug:
	@@node debug server.js

lint:
	@@find lib -name "*.js" -print0 | xargs -0 jslint

min:
	uglifyjs --unsafe ../doc/js/app.js > ../doc/js/app.min.js
	sqwish ../doc/css/style.css -o ../doc/css/style.min.css

.PHONY: test test-verbose deploy install debug lint min
