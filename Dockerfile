# Production Dockerfile for SPN Trucking Ltd.
FROM node:22-alpine AS production

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Ensure data and uploads directories exist with proper permissions
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app

USER node

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
