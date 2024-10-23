#!/usr/bin/env bash

temp_env=$(declare -p -x)

if [ -f .env ]; then
  source .env
fi

if [ -f .env.local ]; then
  source .env.local
fi

# Avoid overwriting env vars provided directly
# https://stackoverflow.com/a/69127685/1467342
eval "$temp_env"

if [[ $VITE_PLATFORM_LOGO =~ ^https://* ]]; then
  curl $VITE_PLATFORM_LOGO > static/logo.png
  export VITE_PLATFORM_LOGO=static/logo.png
fi

npx pwa-assets-generator
npx vite build
mv build/manifest.{webmanifest,json}
