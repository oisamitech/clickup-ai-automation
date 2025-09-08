# Use a imagem oficial do Node.js mais recente
FROM node:22.11-alpine AS builder

ARG NPM_TOKEN

# Create app directory
WORKDIR /app

# Install OpenSSL and other required dependencies
RUN apk add --no-cache openssl openssl-dev curl

# Copy package files and .npmrc
COPY package*.json ./
COPY .npmrc ./

# Replace NPM_TOKEN in .npmrc and install dependencies
RUN sed -i "s/\${NPM_TOKEN}/${NPM_TOKEN}/g" .npmrc && \
    npm ci --omit=dev && \
    rm -f .npmrc

# Copy application source code
COPY . .

# Production stage
FROM node:22.11-alpine AS production

WORKDIR /app

# Install OpenSSL, curl and other required dependencies for production
RUN apk add --no-cache openssl openssl-dev curl

# Install pino-pretty for better logging
RUN npm install -g pino-pretty

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the files needed for production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]