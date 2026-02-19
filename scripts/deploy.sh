#!/bin/bash
USER="ashenatore"
DEST="/mnt/app-data/autoboard"
REPO_ROOT=$(pwd)

# 1. Clean and Prepare
sudo rm -rf $DEST
sudo mkdir -p $DEST/api
sudo mkdir -p $DEST/data
sudo chown -R $USER:$USER $DEST

echo "Stage 1: Building..."
pnpm approve-builds #ensure esbuild and others are allowed to run
pnpm install
pnpm run build

echo "Stage 2: Deploying API..."
pnpm --filter @autoboard/api --prod deploy --legacy $DEST/api

echo "Stage 3: Resolving Assets..."
# Copy the compiled API code
cp -rL $REPO_ROOT/apps/api/dist $DEST/api/

# NEW: Copy the gateway script to the production root
cp -L $REPO_ROOT/apps/api/gateway.js $DEST/api/

# Copy the built React frontend into a 'public' folder inside the API
mkdir -p $DEST/api/public
cp -rL $REPO_ROOT/apps/web/dist/* $DEST/api/public/

# Ensure internal workspace packages are linked
cp -rL $REPO_ROOT/node_modules $DEST/api/ 2>/dev/null || true

echo "✅ Deployment complete. Frontend assets are in $DEST/api/public"