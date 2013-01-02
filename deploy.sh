#!/usr/bin/env bash
# Run from mognet dir

# get latest tag or current branch name if none
TAG=`git describe --exact-match --abbrev=0 2>&1`
if [[ `echo $TAG | grep fatal` != "" ]]; then
    echo "No tag matches current HEAD. Create a tag to deploy."
    exit 1
fi

TAG=$(git branch | grep "*" | sed "s/* //")
echo "Deploying $TAG..."

./minify.sh

git archive --format=tar HEAD | (mkdir /var/www/mognet-$TAG && tar -xf - -C /var/www/mognet-$TAG)
rm -f /var/www/mognet && ln -s /var/www/mognet-$TAG /var/www/mognet
if [ -f ../static ]; then
    ln -s ../static /var/www/static
fi
if [ -f ../res ]; then
    ln -s ../res /var/www/res
fi
mkdir /var/www/log
cp -R app/node_modules /var/www/mognet/app

echo "Updating index..."
/var/www/mognet/app/bin/update.js >/dev/null

echo "Deployed to /var/www/mognet-$TAG. Start server with: npm start"
