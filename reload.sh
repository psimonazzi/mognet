#!/usr/bin/env bash
# Update index and if changed reload it in the server

HASH=`cksum < /var/www/mognet/data/index.json`
/var/www/mognet/app/bin/update.js >/dev/null
NEW_HASH=`cksum < /var/www/mognet/data/index.json`
if [ ! -e /var/run/mognet.pid ]; then
    exit 0
fi
if [ "$NEW_HASH" != "$HASH" ]; then
    kill -HUP `cat /var/run/mognet.pid`
else
    echo "No need to reload"
fi
