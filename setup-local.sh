#!/bin/bash

# Local development setup script
echo "🔧 Setting up local development environment..."

# Use SQLite for local development
echo "📁 Setting up SQLite database..."
cp prisma/schema.sqlite.prisma prisma/schema.prisma

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Push schema to local SQLite database
echo "🗄️ Setting up local SQLite database..."
npx prisma db push

echo "✅ Local development setup completed!"
echo "🚀 Run 'npm run dev' to start the development server"
