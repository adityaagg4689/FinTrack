#!/bin/bash
# client/render-build.sh

echo "Building Finance Tracker Frontend..."

# Install dependencies
npm ci

# Build the app
npm run build

echo "Build completed!"