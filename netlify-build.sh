#!/bin/bash

# Netlify build script to handle Prisma properly
echo "🔧 Starting Netlify build process..."

# Clear any existing Prisma cache
echo "🧹 Clearing Prisma cache..."
rm -rf node_modules/.prisma
rm -rf .next

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
