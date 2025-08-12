# Railway Dockerfile for AIPS Backend
FROM node:18-alpine

# Install pnpm and other dependencies
RUN npm install -g pnpm
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json first for better layer caching
COPY backend/package.json ./backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all backend source code
COPY backend ./backend

# Set working directory to backend
WORKDIR /app/backend

# Copy the production schema for PostgreSQL
COPY backend/prisma/schema.production.prisma ./prisma/schema.prisma

# Generate Prisma client and build
RUN pnpm exec prisma generate
RUN pnpm run build

# Create a startup script to handle migrations
RUN echo '#!/bin/sh\n\
echo "Running database migrations..."\n\
pnpm exec prisma migrate deploy || echo "Migration failed, continuing..."\n\
echo "Starting application..."\n\
exec pnpm start' > /app/start.sh && chmod +x /app/start.sh

# Expose port
EXPOSE 3000

# Start the application
CMD ["/app/start.sh"]
