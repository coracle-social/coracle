"""Subset Font Awesome Free (solid) down to the icons this app actually references.

Scans src/ for icon names, maps them to codepoints via Font Awesome's own CSS, and
writes public/fonts/fa-solid-900-subset.woff2. Run via scripts/subset-icons.sh.
"""

import re
import sys
from pathlib import Path

from fontTools.subset import main as pyftsubset

ROOT = Path(__file__).resolve().parent.parent
FA = ROOT / "node_modules/@fortawesome/fontawesome-free"
OUT = ROOT / "public/fonts/fa-solid-900-subset.woff2"

# Icon names are written several ways: as `fa-x` classes, and as bare `icon: "x"` /
# `icon="x"` values that components interpolate into `class={`fa fa-${icon}`}`.
# A few call sites pass the prefix too (icon="fa-warning"), hence the optional group.
PATTERNS = [
    r"\bfa-([a-z0-9-]+)",
    r'icon:\s*"(?:fa-)?([a-z0-9-]+)"',
    r"icon:\s*'(?:fa-)?([a-z0-9-]+)'",
    r'icon=\{?"(?:fa-)?([a-z0-9-]+)"',
    r"icon=\{?'(?:fa-)?([a-z0-9-]+)'",
]


def main():
    css = (FA / "css/fontawesome.css").read_text(encoding="utf-8")
    fa_map = {
        m.group(1): int(m.group(2), 16)
        for m in re.finditer(r'\.fa-([a-z0-9-]+)\s*\{\s*--fa:\s*"\\([0-9a-fA-F]+)"', css)
    }
    if not fa_map:
        sys.exit("could not parse icon codepoints from fontawesome.css")

    names = set()
    for path in (ROOT / "src").rglob("*"):
        if path.suffix in {".svelte", ".ts", ".js", ".css"}:
            text = path.read_text(encoding="utf-8", errors="ignore")
            for pattern in PATTERNS:
                names.update(re.findall(pattern, text))

    unicodes = sorted({fa_map[n] for n in names if n in fa_map})
    print(f"{len(unicodes)} glyphs")

    pyftsubset([
        str(FA / "webfonts/fa-solid-900.ttf"),
        "--unicodes=" + ",".join(f"U+{c:04X}" for c in unicodes),
        "--layout-features=",
        "--no-hinting",
        "--flavor=woff2",
        f"--output-file={OUT}",
    ])
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
