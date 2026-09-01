#!/usr/bin/env bash

set -e

# Fetch tags and set to env vars
git fetch --prune --unshallow --tags || true
git describe --tags --abbrev=0 || true

# Fall back to the checked-out commit when the host does not provide one
COMMIT="${RENDER_GIT_COMMIT:-$(git rev-parse HEAD)}"
export VITE_BUILD_VERSION=$COMMIT
export VITE_BUILD_HASH=$COMMIT

# Install deps
pnpm i

# Rebuild sharp
pnpm rebuild

# The build runs out of memory at times
NODE_OPTIONS=--max_old_space_size=16384 pnpm run build
