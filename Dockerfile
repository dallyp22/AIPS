# Railway Dockerfile for AIPS Backend
FROM node:18-alpine

# Install pnpm and PostgreSQL client tools
RUN npm install -g pnpm
RUN apk add --no-cache openssl postgresql-client

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json first for better layer caching
COPY backend/package.json ./backend/

# Copy all backend source code (including prisma directory)
COPY backend ./backend

# Install dependencies (this will run postinstall and generate Prisma client)
RUN pnpm install --frozen-lockfile

# Build the application
WORKDIR /app/backend
RUN pnpm run build

# Expose port
EXPOSE 3000

# Set working directory for startup
WORKDIR /app/backend

# Set environment for production
ENV NODE_ENV=production

# Copy startup script
COPY backend/start.sh ./start.sh
RUN chmod +x ./start.sh

# Start the application with database setup
CMD ["./start.sh"]
