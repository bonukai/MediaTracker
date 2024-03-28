#!/bin/sh

if ! [ "$PGID" -eq "$(id -g abc)" ]; then
    groupmod --non-unique --gid "$PGID" abc
fi

if ! [ "$PUID" -eq "$(id -u abc)" ]; then
    usermod --non-unique --uid "$PUID" abc
fi

echo 
echo PUID: $(id -u abc)
echo PGID: $(id -g abc)
echo 

chown -R abc:abc /storage
chown -R abc:abc /assets
chown -R abc:abc /logs

su -c "node /app/build/index.js start-server --db-filepath /storage/data.db --logs-dir /logs --assets-dir /assets" abc