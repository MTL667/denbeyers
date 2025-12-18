#!/bin/sh
set -e

echo "🚀 Starting Den Beyers..."

# Note: Database migrations should be run manually or via CI/CD
# Run: npx prisma migrate deploy
# The app will start without automatic migrations

# Execute the main command
exec "$@"
