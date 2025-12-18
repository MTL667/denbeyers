#!/bin/sh
set -e

echo "🚀 Starting Den Beyers..."

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Running database migrations..."
  npx prisma migrate deploy
  echo "✅ Migrations complete"
fi

# Execute the main command
exec "$@"

