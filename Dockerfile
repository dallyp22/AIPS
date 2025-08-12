# Railway Dockerfile for AIPS Backend
FROM node:18-alpine

# Install pnpm and other dependencies including SQLite
RUN npm install -g pnpm
RUN apk add --no-cache openssl sqlite

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json first for better layer caching
COPY backend/package.json ./backend/

# Copy all backend source code (including prisma directory)
COPY backend ./backend

# Set working directory to backend
WORKDIR /app/backend

# Keep SQLite schema for now (PostgreSQL migration can be done later)
# RUN cp prisma/schema.production.prisma prisma/schema.prisma

# Install dependencies (this will run postinstall and generate Prisma client)
WORKDIR /app
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/backend
RUN pnpm run build

# Create a startup script to handle SQLite setup
RUN echo '#!/bin/sh\n\
echo "Setting up SQLite database..."\n\
cd /app/backend\n\
export DATABASE_URL="file:./data/prod.db"\n\
mkdir -p ./data\n\
pnpm exec prisma db push --force-reset || echo "Database setup failed, continuing..."\n\
echo "Starting application..."\n\
exec pnpm start' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["/app/start.sh"]
