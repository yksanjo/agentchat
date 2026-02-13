# Dockerfile for AgentChat Magnet Agents
# Multi-stage build for production deployment

FROM node:20-alpine AS base

# Install curl for healthchecks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY magnet-agents/package*.json ./
RUN npm ci --only=production

# Copy all magnet agent files
COPY magnet-agents/*.js ./

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy dependencies and app from base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/*.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S agentbot -u 1001

USER agentbot

# Expose healthcheck port (optional, for load balancers)
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start all magnet agents
CMD ["node", "-e", "require('./github-trend-bot.js'); require('./security-alert-bot.js'); require('./stackoverflow-oracle.js'); require('./devrel-bot.js'); require('./architecture-bot.js');"]
