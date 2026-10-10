#!/usr/bin/env bash
# ==============================================================================
# ClassQue-TeachAssist: Build & Deploy to Cloudflare Pages
#   ./deploy.sh staging      staging (Pages preview env, classque_db_staging)
#   ./deploy.sh production   production (classque_db); deploy and check staging first
# ==============================================================================

set -e

PROJECT_NAME="classque-teachassist"
case "${1:-}" in
  staging)    BRANCH="staging"; URL="https://staging.${PROJECT_NAME}.pages.dev" ;;
  production) BRANCH="main";    URL="https://${PROJECT_NAME}.pages.dev and https://classque.pmandiri.com" ;;
  *) echo "usage: $0 staging|production"; exit 1 ;;
esac

echo "========================================================"
echo "📦 0. Committing changes..."
echo "========================================================"
if [ -n "$(git status --porcelain)" ]; then
  git add .
  git commit -m "Auto-commit before deploy $(date +'%Y-%m-%d %H:%M:%S')"
  echo "✅ Changes committed."
else
  echo "✅ No changes to commit."
fi
echo ""

echo "========================================================"
echo "🚀 1. Building ClassQue-TeachAssist Frontend..."
echo "========================================================"
npm run build

echo ""
echo "========================================================"
echo "☁️  2. Deploying to Cloudflare Pages ($PROJECT_NAME, $1)..."
echo "========================================================"
npx wrangler pages deploy ./dist --project-name="$PROJECT_NAME" --branch="$BRANCH"

echo ""
echo "========================================================"
echo "✅ Deployment Successful!"
echo "🔗 $URL"
echo "Check the variables are still on this deployment (docs/CLOUDFLARE_SETUP.md \"Deploying safely\")."
echo "========================================================"
