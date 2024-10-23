#!/usr/bin/env bash

if [ -f .env ]; then
  source .env
fi

if [ -f .env.local ]; then
  source .env.local
fi

if [[ $VITE_PLATFORM_LOGO =~ ^https://* ]]; then
  curl $VITE_PLATFORM_LOGO > static/logo.png
  export VITE_PLATFORM_LOGO=static/logo.png
fi

npx pwa-assets-generator
npx vite build
