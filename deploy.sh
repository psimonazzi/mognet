#!/usr/bin/env bash
# Run from mognet dir

# get latest tag or current branch name if none
TAG=`git describe --exact-match --abbrev=0 2>&1`
if [[ `echo $TAG | grep fatal` != "" ]]; then
    echo "No tag matches current HEAD. Create a tag to deploy."
    exit 1
fi

# This requires checking out the tag first
#TAG=$(git branch | grep "*" | sed "s/* //")
echo "Deploying $TAG..."

./minify.sh

git archive --format=tar HEAD | (mkdir -p /var/www/mognet-$TAG && tar -xf - -C /var/www/mognet-$TAG)
rm -f /var/www/mognet && ln -s /var/www/mognet-$TAG /var/www/mognet
cd ..
if [ ! -e /var/www/static ]; then
    ln -s "$(pwd)/static" /var/www/static  
fi
if [ ! -e /var/www/res ]; then
    ln -s "$(pwd)/res" /var/www/res 
fi
cd - >/dev/null
mkdir -p /var/www/log
mkdir -p /var/www/mognet/data
if [ -e app/node_modules ]; then
    cp -R app/node_modules /var/www/mognet/app
fi
chmod +x /var/www/mognet/app/bin/*.js

echo "Updating index..."
/var/www/mognet/app/bin/update.js >/dev/null

echo "Deployed to /var/www/mognet-$TAG."
echo "Start server with: npm start"
