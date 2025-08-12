#!/bin/bash

echo "🚀 Starting AIPS Production Deployment..."

# Create database schema
echo "📋 Creating database schema..."
pnpm exec prisma db push --force-reset || {
    echo "⚠️  Schema creation failed, continuing..."
}

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm exec prisma generate

# Start the server
echo "🌟 Starting AIPS server..."
exec pnpm start
