#!/bin/sh
set -e

echo "🚀 Starting Den Beyers..."

# Sync database schema (creates tables if they don't exist)
echo "📦 Syncing database schema..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || echo "⚠️ Database sync skipped"

echo "✅ Starting server..."

# Execute the main command
exec "$@"
