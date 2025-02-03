#!/bin/bash

hash=$(find build -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum | awk '{print $1}')

sentry-cli \
  --url https://glitchtip.coracle.social \
  --auth-token $GLITCHTIP_AUTH_TOKEN \
  --api-key $VITE_GLITCHTIP_API_KEY \
  sourcemaps \
  --org coracle \
  --project flotilla \
  --release $hash \
  upload \
  --url-prefix /_app/immutable/ \
  build/_app/immutable
