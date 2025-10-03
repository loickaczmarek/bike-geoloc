# ========================================
# MULTI-STAGE DOCKERFILE - PRODUCTION OPTIMIZED
# ========================================
# CRAFT Principles:
# - Multi-stage build (minimize final image size)
# - Layer caching optimization
# - Security best practices
# - Non-root user
# - Minimal attack surface

# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:20-alpine AS deps

# Install security updates
RUN apk update && apk upgrade

WORKDIR /app

# Copy dependency files only (better caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ========================================
# Stage 2: Builder
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build application
RUN npm run build

# ========================================
# Stage 3: Production
# ========================================
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /usr/share/nginx/html/*

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx-app && \
    adduser -u 1001 -S nginx-app -G nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx-app:nginx-app /var/run/nginx.pid

# Switch to non-root user
USER nginx-app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
