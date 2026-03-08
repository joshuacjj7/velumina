#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/drizzle-kit/bin.cjs push

echo "Starting app..."
exec node server.js