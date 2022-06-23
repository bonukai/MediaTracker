#!/bin/sh

addgroup -g $PGID abc
adduser -D -u $PUID -G abc abc

chown -R abc:abc /storage
chown -R abc:abc /assets
chown -R abc:abc /logs

su -c "node /app/build/index.js" abc