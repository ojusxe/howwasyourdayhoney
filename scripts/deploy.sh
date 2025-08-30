#!/bin/bash

# ASCII Frame Generator Deployment Script
# This script handles deployment to Vercel with proper environment setup

set -e  # Exit on any error

echo "🚀 Starting ASCII Frame Generator deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Environment setup
ENVIRONMENT=${1:-production}
echo "🌍 Deploying to environment: $ENVIRONMENT"

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📋 Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit

# Run linting
echo "🔍 Running ESLint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test -- --passWithNoTests

# Build the application
echo "🏗️  Building application..."
npm run build

# Check build output
if [ ! -d ".next" ]; then
    echo "❌ Error: Build failed - .next directory not found"
    exit 1
fi

echo "✅ Build successful"

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Deploying to production..."
    vercel --prod --yes
elif [ "$ENVIRONMENT" = "preview" ]; then
    echo "🚀 Deploying to preview..."
    vercel --yes
else
    echo "❌ Error: Invalid environment. Use 'production' or 'preview'"
    exit 1
fi

# Post-deployment checks
echo "🔍 Running post-deployment checks..."

# Wait a moment for deployment to be ready
sleep 10

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --limit 1 | grep -o 'https://[^ ]*' | head -1)

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "🌐 Deployment URL: $DEPLOYMENT_URL"
    
    # Health check
    echo "🏥 Running health check..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Health check passed"
    else
        echo "⚠️  Health check failed (HTTP $HTTP_STATUS)"
    fi
    
    # Basic functionality test
    echo "🧪 Testing basic functionality..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Basic functionality test passed"
    else
        echo "⚠️  Basic functionality test failed (HTTP $HTTP_STATUS)"
    fi
else
    echo "⚠️  Could not determine deployment URL"
fi

echo "🎉 Deployment complete!"
echo ""
echo "📋 Deployment Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Node.js: $NODE_VERSION"
echo "   URL: ${DEPLOYMENT_URL:-'Unknown'}"
echo ""
echo "📚 Next steps:"
echo "   1. Test the deployed application thoroughly"
echo "   2. Monitor performance and error rates"
echo "   3. Update documentation if needed"
echo ""
echo "🔗 Useful links:"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - Application: ${DEPLOYMENT_URL:-'Check Vercel dashboard'}"
echo "   - Health Check: ${DEPLOYMENT_URL:-'Check Vercel dashboard'}/health"