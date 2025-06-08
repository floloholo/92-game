#!/bin/bash

echo "🚀 92 Game - Quick Deploy Script 🚀"
echo "===================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

echo ""
echo "📝 Preparing files for deployment..."

# Add all files
git add .

# Commit
echo ""
echo "💾 Creating commit..."
git commit -m "92 Game - Ready for deployment" || echo "ℹ️  No changes to commit"

echo ""
echo "===================================="
echo "✅ Your game is ready to deploy!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Go to https://github.com/new"
echo "2. Create a new repository named '92-game'"
echo "3. Don't initialize with README (keep it empty)"
echo "4. After creating, come back here and run:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/92-game.git"
echo "   git branch -M main"  
echo "   git push -u origin main"
echo ""
echo "5. Then go to https://railway.app and:"
echo "   - Click 'New Project'"
echo "   - Choose 'Deploy from GitHub repo'"
echo "   - Select your 92-game repository"
echo "   - Click 'Deploy'"
echo ""
echo "🎮 Your game will be live in minutes!"
echo "===================================="