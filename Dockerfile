# Stage 1: Build Frontend React app
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY ai-workspace/client/package*.json ./
RUN npm ci
COPY ai-workspace/client/ ./
RUN npm run build

# Stage 2: Build Backend Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY ai-workspace/server/package*.json ./
RUN npm ci
COPY ai-workspace/server/ ./
RUN npm run build

# Stage 3: Production Runtime (Node.js 20 + Python 3.11 + ML + Client Assets)
FROM python:3.11-slim

# Install Node.js 20
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python ML dependencies
RUN pip install --no-cache-dir numpy pandas scikit-learn joblib pypdf python-docx

# Setup Server
WORKDIR /app/server
COPY ai-workspace/server/package*.json ./
RUN npm ci --only=production
COPY --from=server-builder /app/server/dist ./dist
RUN mkdir -p data uploads

# Copy built React client assets so Express serves the SPA
COPY --from=client-builder /app/client/dist /app/client/dist

# Copy ML microservice
WORKDIR /app/ml
COPY ai-workspace/ml/src/ ./src/
COPY ai-workspace/ml/data/ ./data/
COPY ai-workspace/ml/models/ ./models/

# Setup Entrypoint
WORKDIR /app
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV PORT=5000
ENV NODE_ENV=production
ENV ML_SERVICE_URL=http://127.0.0.1:5001

EXPOSE 5000

CMD ["./docker-entrypoint.sh"]
