#!/bin/sh

echo "🚀 Starting AIPS Backend..."

# Ensure Prisma Client is generated
echo "📦 Generating Prisma client..."
pnpm exec prisma generate

# Create database schema if it doesn't exist
echo "🏗️  Setting up database schema..."
pnpm exec prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Database schema ready!"
else
    echo "⚠️  Database schema setup failed, but continuing..."
fi

# Start the application
echo "🎯 Starting Fastify server..."
exec pnpm start
