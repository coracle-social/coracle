#!/bin/bash

cat package.json \
  | jq '.dependencies|keys[]' \
  | grep welshman \
  | grep -v editor \
  | sed s/@welshman\\/// \
  | xargs -I{} npx link ../welshman/packages/{}

# @welshman/editor has conflicting dependencies, so copy it over manually
# rm -rf node_modules/@welshman/editor
# cp -r ../welshman/packages/editor ./node_modules/@welshman/
