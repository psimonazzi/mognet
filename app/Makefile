deploy: min
# get latest tag or current branch name if none
	TAG=$(git describe --exact-match --abbrev=0)
ifeq ($(echo $TAG | grep fatal),"")
	TAG=$(git branch | grep "*" | sed "s/* //")
	git archive --format=tar HEAD | (mkdir /var/www/mognet-$TAG && cd /var/www/mognet-$TAG && tar xf -)
	rm -f /var/www/mognet
	ln -s /var/www/mognet-$TAG /var/www/mognet
	cd /var/www/mognet
else
	@@echo "No tag matches current HEAD. Create a tag to deploy."
endif

debug:
	@@node debug server.js

lint:
	@@find lib -name "*.js" -print0 | xargs -0 jslint

min:
	cat ../doc/js/app.js ../doc/js/rainbow-custom.min.js > ../doc/js/app.min.js
# uglifyjs --unsafe ../doc/js/app.min.js > ../doc/js/app.min.js
# sqwish ../doc/css/style.css -o ../doc/css/style.min.css

.PHONY: test test-verbose deploy debug lint min
