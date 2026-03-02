#!/bin/sh
set -e

echo "Initialising database..."
node init-db.js

echo "Starting server..."
exec node server.js
