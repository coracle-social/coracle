#!/usr/bin/env bash
# Regenerate the Font Awesome subset in public/fonts. Run this after adding an
# fa-* icon that isn't already included, otherwise the new icon renders blank.
set -e

cd "$(dirname "$0")/.."

VENV=.cache/fontenv
if [ ! -x "$VENV/bin/python" ]; then
  echo "creating $VENV"
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q fonttools brotli
fi

"$VENV/bin/python" scripts/subset_icons.py
