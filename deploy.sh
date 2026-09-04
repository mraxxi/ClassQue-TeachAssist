#!/usr/bin/env bash
# ==============================================================================
# ClassQue-TeachAssist: Build & Deploy to Cloudflare Pages
# ==============================================================================

set -e

PROJECT_NAME="classque-teachassist"
BRANCH="main"

echo "========================================================"
echo "🚀 1. Building ClassQue-TeachAssist Frontend..."
echo "========================================================"
npm run build

echo ""
echo "========================================================"
echo "☁️  2. Deploying to Cloudflare Pages ($PROJECT_NAME)..."
echo "========================================================"
npx wrangler pages deploy ./dist --project-name="$PROJECT_NAME" --branch="$BRANCH"

echo ""
echo "========================================================"
echo "✅ Deployment Successful!"
echo "🔗 Pages Live URL: https://${PROJECT_NAME}.pages.dev"
echo "🔗 Custom Domain:  https://classque.siskaeee.dpdns.org (once DNS configured)"
echo "========================================================"
