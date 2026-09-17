# Multi-stage Dockerfile for Node 22 + Vite + Express Cloud Run Deployment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies required for build)
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend and esbuild server bundle
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy dist artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Expose application port
EXPOSE 3000

# Launch server
CMD ["node", "dist/server.cjs"]
