#!/bin/bash

# Discord Role Assignment Bot - Setup Script
# This script helps you set up the environment and test the bot

set -e

echo "🤖 Discord Role Assignment Bot Setup"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
    echo ""
    echo "📝 You need to set these values:"
    echo "   - DISCORD_BOT_TOKEN (from Discord Developer Portal)"
    echo "   - DISCORD_GUILD_ID (your server ID)"
    echo "   - DISCORD_ROLE_ID (role to assign)"
    echo "   - API_SECRET_KEY (generate a secure random string)"
    echo ""
    echo "💡 To generate a secure API key, run:"
    echo "   openssl rand -base64 32"
    echo ""
    exit 1
fi

echo "✅ Found .env file"

# Check if required environment variables are set
source .env

if [ -z "$DISCORD_BOT_TOKEN" ] || [ "$DISCORD_BOT_TOKEN" = "your_bot_token_here" ]; then
    echo "❌ DISCORD_BOT_TOKEN not set in .env file"
    exit 1
fi

if [ -z "$DISCORD_GUILD_ID" ] || [ "$DISCORD_GUILD_ID" = "your_server_id_here" ]; then
    echo "❌ DISCORD_GUILD_ID not set in .env file"
    exit 1
fi

if [ -z "$DISCORD_ROLE_ID" ] || [ "$DISCORD_ROLE_ID" = "role_id_to_assign" ]; then
    echo "❌ DISCORD_ROLE_ID not set in .env file"
    exit 1
fi

if [ -z "$API_SECRET_KEY" ] || [ "$API_SECRET_KEY" = "your_secure_api_key_here" ]; then
    echo "❌ API_SECRET_KEY not set in .env file"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

echo "✅ Dependencies installed"

# Validate Discord IDs format
if ! [[ $DISCORD_GUILD_ID =~ ^[0-9]{17,19}$ ]]; then
    echo "❌ Invalid DISCORD_GUILD_ID format (should be 17-19 digits)"
    exit 1
fi

if ! [[ $DISCORD_ROLE_ID =~ ^[0-9]{17,19}$ ]]; then
    echo "❌ Invalid DISCORD_ROLE_ID format (should be 17-19 digits)"
    exit 1
fi

echo "✅ Discord IDs format validated"

echo ""
echo "🚀 Setup complete! You can now:"
echo "   1. Start development server: bun run dev"
echo "   2. Start production server: bun start"
echo "   3. Test the API: curl http://localhost:3000/api/health"
echo ""
echo "📖 See SETUP.md for detailed configuration instructions"
echo "📖 See README.md for API usage examples"
