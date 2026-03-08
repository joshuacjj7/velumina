#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/drizzle-kit/bin.cjs push

echo "Starting app..."
exec node node_modules/next/dist/bin/next dev -p 3005