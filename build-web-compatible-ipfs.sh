#!/usr/bin/env bash
##############################################################################
# build-web-compatible-ipfs.sh — Build Coracle for IPFS deployment
#
# Usage:  ./build-web-compatible-ipfs.sh [gateway_base_url]
#
# Example:
#   ./build-web-compatible-ipfs.sh
#   ./build-web-compatible-ipfs.sh https://dweb.link
#
# The script:
#   1. Overrides env vars to use relative paths (./images/...)
#   2. Builds the Svelte app with base: "./" (set in vite.config.js)
#   3. Removes service worker (incompatible with IPFS gateways)
#   4. Publishes dist/ to IPFS via `ipfs add -rw`
#   5. Prints the gateway URL
##############################################################################

set -e

GATEWAY="${1:-https://ipfs.copylaradio.com}"

echo "=== Building Coracle for IPFS ==="

# Install deps if needed
if [ ! -d node_modules ]; then
  echo "--- Installing dependencies ---"
  pnpm i
fi

# Override absolute image paths to relative for IPFS compatibility
# VITE_APP_LOGO stays absolute (used by pwa-assets-generator with "public" prefix)
export VITE_APP_WORDMARK_DARK=./images/wordmark-dark.png
export VITE_APP_WORDMARK_LIGHT=./images/wordmark-light.png

# Build
echo "--- Building ---"
NODE_OPTIONS=--max_old_space_size=16384 pnpm run build 2>&1 | grep -v "^\[fatal\]" || true

if [ ! -f dist/index.html ]; then
  echo "ERROR: Build failed — dist/index.html not found"
  exit 1
fi

# Remove service worker files (incompatible with IPFS gateways)
echo "--- Removing service worker (incompatible with IPFS gateways) ---"
rm -f dist/sw.js dist/sw.js.map dist/workbox-*.js dist/workbox-*.js.map
sed -i '/<script.*registerSW/d' dist/index.html 2>/dev/null || true

# Publish to IPFS
echo "--- Publishing to IPFS ---"
IPFS_OUTPUT=$(ipfs add -rw --pin dist/*)
ROOT_CID=$(echo "$IPFS_OUTPUT" | tail -1 | awk '{print $2}')

echo ""
echo "=== Published to IPFS ==="
echo "CID:  $ROOT_CID"
echo "URL:  ${GATEWAY}/ipfs/${ROOT_CID}/"
echo ""
echo "$IPFS_OUTPUT"
