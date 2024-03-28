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

args="--db-client SQLite "

if [ -n "${DATABASE_CLIENT}" ]; then
    args="${args} --db-client ${DATABASE_CLIENT}"
else
    args="${args} --db-client SQLite"
fi

if [ -n "${DATABASE_CONNECTION_STRING}" ]; then
    args="${args} --db-connection-string ${DATABASE_CONNECTION_STRING}"
else
    args="${args} --db-filepath /storage/data.db"
fi

su -c "node /app/build/index.js start-server --logs-dir /logs --assets-dir /assets ${args}" abc