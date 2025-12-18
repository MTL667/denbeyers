#!/bin/sh
set -e

echo "🚀 Starting Den Beyers..."

# Sync database schema (creates tables if they don't exist)
echo "📦 Syncing database schema..."
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --skip-generate --accept-data-loss 2>&1 || echo "⚠️ Database sync failed, continuing anyway..."
else
  echo "⚠️ Prisma CLI not found in node_modules/.bin"
fi

echo "✅ Starting server..."

# Execute the main command
exec "$@"
