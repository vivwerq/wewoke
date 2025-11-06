#!/bin/bash

# VibeCast Quick Start Script
# This script starts all required services for local development

echo "🚀 Starting VibeCast Development Environment..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo "⚠️  Redis is not running. Please start Redis with 'redis-server' in a separate terminal."
    echo "   On macOS: brew services start redis"
    echo "   On Ubuntu: sudo systemctl start redis"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Build server
echo "🔨 Building server..."
cd server && npm run build && cd ..

# Create .env if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server/.env from example..."
    cp server/.env.example server/.env
    echo "⚠️  Please update server/.env with your configuration"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Start Redis (if not running): redis-server"
echo "  2. Start backend server: cd server && npm run dev"
echo "  3. Start matchmaking worker: cd server && npm run worker (in new terminal)"
echo "  4. Start frontend: npm run dev (in new terminal)"
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Backend will be available at: http://localhost:3001"
echo ""
