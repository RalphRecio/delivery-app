#!/bin/sh
# Installs dependencies into the node_modules volume when it is empty or
# when package-lock.json changed since the last install, then runs the command.
set -eu

STAMP="node_modules/.docker-install-stamp"

if [ ! -f "$STAMP" ] || ! cmp -s package-lock.json "$STAMP"; then
    echo "entrypoint: installing npm dependencies"
    npm ci --no-audit --no-fund
    cp package-lock.json "$STAMP"
fi

exec "$@"
