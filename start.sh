#!/bin/bash

echo "🎮 Setting up 92 - The Money Game 🎮"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if port 3000 is in use
echo ""
echo "🔍 Checking port 3000..."
PID=$(lsof -ti:3000)
if [ ! -z "$PID" ]; then
    echo "⚠️  Port 3000 is already in use by process $PID"
    read -p "Do you want to stop it and start the game? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill -9 $PID
        echo "✅ Stopped existing process"
        sleep 1
    else
        echo "❌ Exiting. Please free up port 3000 or use a different port."
        exit 1
    fi
fi

# Start the game
echo ""
echo "🚀 Starting the game server..."
echo "=================================="
echo "🌐 Open http://localhost:3000 in your browser"
echo "🎥 Don't forget to set up your video chat!"
echo "=================================="
echo ""

npm start