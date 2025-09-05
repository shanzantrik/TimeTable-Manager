#!/bin/bash

echo "🚀 Setting up Timetable Manager..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL="file:./dev.db"

# OpenAI API Key (required for AI extraction)
OPENAI_API_KEY="your-openai-api-key-here"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
EOF
    echo "⚠️  Please add your OpenAI API key to the .env file"
fi

# Create uploads directory
mkdir -p uploads

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Don't forget to:"
echo "  1. Add your OpenAI API key to .env"
echo "  2. Open http://localhost:3000 in your browser"
echo ""
echo "Happy coding! 🎉"
