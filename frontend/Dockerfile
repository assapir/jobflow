# Build stage
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Production stage - just the static files
# Caddy will serve these directly
FROM scratch AS production

# Copy built static files
COPY --from=builder /app/dist /frontend

