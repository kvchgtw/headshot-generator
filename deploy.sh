#!/bin/bash

# AI Headshot Generator - Deployment Script

echo "🚀 AI Headshot Generator Deployment Script"
echo "=========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: AI Headshot Generator with Next.js"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🌐 Deploying to Vercel..."
echo "Make sure to add your GEMINI_API_KEY in the Vercel dashboard!"
echo ""

vercel --prod

echo ""
echo "✅ Deployment complete!"
echo "Don't forget to add your GEMINI_API_KEY in the Vercel dashboard environment variables."
