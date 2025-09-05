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

# Switch to PostgreSQL schema for production
echo "🔄 Switching to PostgreSQL schema for production..."
cp prisma/schema.postgresql.prisma prisma/schema.prisma

# Generate Prisma client for production (PostgreSQL)
echo "🔨 Generating Prisma client for production..."
npx prisma generate

# Deploy database schema to Neon
echo "🗄️ Deploying database schema to Neon..."
npx prisma db push

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
