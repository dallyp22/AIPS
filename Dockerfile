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

# Create data directory for SQLite
RUN mkdir -p /app/backend/data

# Expose port
EXPOSE 3000

# Set working directory for startup
WORKDIR /app/backend

# Set environment for production
ENV DATABASE_URL="file:./data/prod.db"
ENV NODE_ENV=production

# Start the application with database setup
CMD ["sh", "-c", "echo 'Setting up SQLite database...' && pnpm exec prisma db push --force-reset || echo 'Database setup failed, continuing...' && echo 'Starting application...' && exec pnpm start"]
