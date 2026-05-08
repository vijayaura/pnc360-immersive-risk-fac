# ---------- Build Stage ----------
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Build-time environment variables
ARG VITE_API_BASE_URL
ARG VITE_APP_ENV

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

# Build frontend
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 3000

# Serve the static files with SPA routing support
CMD ["sh", "-c", "\
KEY=$(cat /mnt/secrets-store/VITE-GOOGLE-MAPS-API-KEY 2>/dev/null || echo ${GOOGLE_MAPS_API_KEY:-\"\"}); \
echo \"window.APP_CONFIG = { GOOGLE_MAPS_API_KEY: '$KEY' };\" > /app/dist/config.js && \
serve -s dist -l 3000 \
"]
