#!/bin/bash

echo "🎮 92 Game - Update Deployment Script 🎮"
echo "========================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "⚠️  Git not initialized. Run prepare-deploy.sh first!"
    exit 1
fi

echo "📝 Preparing update for deployment..."

# Add all changes
git add .

# Commit with update message
echo ""
echo "💾 Creating commit for game improvements..."
git commit -m "Major update: Host-controlled timer, vote deselection, emergency voting, and detailed results" || echo "ℹ️  No changes to commit"

echo ""
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "========================================"
echo "✅ Update pushed to GitHub!"
echo ""
echo "🚀 Railway will automatically deploy the changes"
echo "   (This usually takes 1-2 minutes)"
echo ""
echo "📋 What's new in this update:"
echo "   • Host now controls when timer starts"
echo "   • Click voting with selection/deselection"
echo "   • 30-second voting + 10-second emergency timer"
echo "   • Shows who voted for whom with 👉 emojis"
echo "   • Auto-elimination for non-voters"
echo "   • Better voting UI with player cards"
echo ""
echo "🎮 Your game will be updated shortly!"
echo "========================================"