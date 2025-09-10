#!/bin/bash

# Redis Setup Script for AI Headshot Generator
echo "Setting up Redis for AI Headshot Generator..."

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "Redis is not installed. Installing Redis..."
    
    # Detect OS and install Redis
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install redis
        else
            echo "Please install Homebrew first, then run: brew install redis"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install redis-server
        elif command -v yum &> /dev/null; then
            sudo yum install redis
        else
            echo "Please install Redis manually for your Linux distribution"
            exit 1
        fi
    else
        echo "Unsupported OS. Please install Redis manually."
        exit 1
    fi
fi

# Start Redis server
echo "Starting Redis server..."
redis-server --daemonize yes

# Test Redis connection
echo "Testing Redis connection..."
redis-cli ping

if [ $? -eq 0 ]; then
    echo "✅ Redis is running successfully!"
    echo ""
    echo "Redis Configuration:"
    echo "- Host: localhost"
    echo "- Port: 6379"
    echo "- URL: redis://localhost:6379"
    echo ""
    echo "You can now start your Next.js application with Redis rate limiting enabled."
    echo "Visit /analytics to view IP tracking dashboard."
else
    echo "❌ Failed to connect to Redis. Please check Redis installation."
    exit 1
fi
