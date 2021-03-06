#!/usr/bin/env bash
# Run from mognet repository dir

# get latest tag or current branch name if none
TAG=`git describe --exact-match --abbrev=0 2>&1`
if [[ `echo $TAG | grep fatal` != "" ]]; then
    echo "No tag matches current HEAD, using current branch..."
    TAG=`git branch | grep "*" | sed "s/* //"`
    #exit 1
fi

echo "Deploying $TAG..."

# exit on error
set -e

git archive --format=tar HEAD | (mkdir -p /var/www/mognet-$TAG && tar -xf - -C /var/www/mognet-$TAG)
rm -f /var/www/mognet ; ln -s /var/www/mognet-$TAG /var/www/mognet
cd ..
if [ ! -e /var/www/static ]; then
    ln -s "$(pwd)/static" /var/www/static  
fi
if [ ! -e /var/www/res ]; then
    ln -s "$(pwd)/res" /var/www/res 
fi
cd - >/dev/null
if [ -e app/node_modules ]; then
    cp -R app/node_modules /var/www/mognet/app
fi

mkdir -p /var/www/log
mkdir -p /var/www/mognet/data
chmod +x /var/www/mognet/*.sh /var/www/mognet/app/bin/*.js

echo "Minifying..."
cd /var/www/mognet
/var/www/mognet/minify.sh
cd - >/dev/null

echo "Updating index..."
/var/www/mognet/app/bin/update.js >/dev/null

echo "Deployed to /var/www/mognet-$TAG."
echo "Set config if needed and start server with 'start mognet'."
