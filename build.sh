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

# Replace index.html variables with stuff from our env
perl -i -pe"s|{DESCRIPTION}|$VITE_PLATFORM_DESCRIPTION|g" build/index.html
perl -i -pe"s|{ACCENT}|$VITE_PLATFORM_ACCENT|g" build/index.html
perl -i -pe"s|{NAME}|$VITE_PLATFORM_NAME|g" build/index.html
perl -i -pe"s|{URL}|$VITE_PLATFORM_URL|g" build/index.html

npx cap sync
npx @capacitor/assets generate \
  --iconBackgroundColor '#eeeeee' \
  --iconBackgroundColorDark '#222222' \
  --splashBackgroundColor '#ffffff' \
  --splashBackgroundColorDark '#191E24'
