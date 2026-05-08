#!/bin/sh

# Read secrets from mounted path and export as environment variables
if [ -f "/mnt/secrets-store/VITE-API-BASE-URL" ]; then
    export VITE_API_BASE_URL=$(cat /mnt/secrets-store/VITE-API-BASE-URL)
fi

if [ -f "/mnt/secrets-store/VITE-APP-ENV" ]; then
    export VITE_APP_ENV=$(cat /mnt/secrets-store/VITE-APP-ENV)
fi

if [ -f "/mnt/secrets-store/VITE-GOOGLE-MAPS-API-KEY" ]; then
    export VITE_GOOGLE_MAPS_API_KEY=$(cat /mnt/secrets-store/VITE-GOOGLE-MAPS-API-KEY)
fi

echo "Starting frontend with API URL: $VITE_API_BASE_URL"

# Serve the static files with SPA routing support
exec serve -s dist -l 3000
