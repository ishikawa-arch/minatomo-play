#!/usr/bin/env python3
"""Inject minatomo-* meta tags into game HTML <head> from games-catalog.json.

Idempotent: existing meta tags with the same name are replaced.
Preserves existing minatomo-domain meta tag for backward compat.
Does NOT touch <script> blocks or game logic.
"""
import re
import json
from pathlib import Path

ROOT = Path.home() / "Work" / "minatomo-play-import"
CATALOG = json.loads((ROOT / "games-catalog.json").read_text(encoding="utf-8"))

# Meta tag names this script manages (will be removed before re-inject)
MANAGED = [
    "minatomo-id",
    "minatomo-domain-primary",
    "minatomo-domain-subdomains",
    "minatomo-test-base",
    "minatomo-target",
    "minatomo-difficulty-levels",
    "minatomo-duration",
    "minatomo-completion-status",
]
# Note: NOT removing minatomo-domain / minatomo-category / minatomo-source — those are legacy

def build_meta_block(game):
    test_base = ""
    if game.get("neuropsych_basis") and game["neuropsych_basis"].get("test_name"):
        test_base = game["neuropsych_basis"]["test_name"]
    lines = [
        f'<meta name="minatomo-id" content="{game["id"]}">',
        f'<meta name="minatomo-domain-primary" content="{game["domain"]["primary"]}">',
        f'<meta name="minatomo-domain-subdomains" content="{",".join(game["domain"]["subdomains"])}">',
    ]
    if test_base:
        # escape any quotes
        tb = test_base.replace('"', '&quot;')
        lines.append(f'<meta name="minatomo-test-base" content="{tb}">')
    lines.extend([
        f'<meta name="minatomo-target" content="{",".join(game["indications"]["recommended"])}">',
        f'<meta name="minatomo-difficulty-levels" content="{",".join(str(x) for x in game["difficulty"]["levels"])}">',
        f'<meta name="minatomo-duration" content="{game["duration"]["estimated_minutes"]}">',
        f'<meta name="minatomo-completion-status" content="{game["metadata"]["completion_status"]}">',
    ])
    return "\n".join(lines)

def inject(html, meta_block):
    # 1. remove any existing managed meta tags
    for name in MANAGED:
        pat = re.compile(r'^[ \t]*<meta\s+name="' + re.escape(name) + r'"\s+content="[^"]*">[ \t]*\n?', re.MULTILINE)
        html = pat.sub("", html)
    # 2. insert before </head>
    if "</head>" not in html:
        return html, "no-head-tag"
    new_html = html.replace("</head>", meta_block + "\n</head>", 1)
    return new_html, "ok"

def main():
    results = {"ok": [], "no-html": [], "no-head-tag": [], "skipped": []}
    for game in CATALOG["games"]:
        path = ROOT / game["url"]
        if not path.exists():
            results["no-html"].append(game["id"])
            continue
        html = path.read_text(encoding="utf-8")
        meta = build_meta_block(game)
        new_html, status = inject(html, meta)
        if status == "ok":
            path.write_text(new_html, encoding="utf-8")
            results["ok"].append(game["id"])
        else:
            results[status].append(game["id"])

    print("=== Meta injection summary ===")
    for k, v in results.items():
        print(f"  {k}: {len(v)}")
        for item in v[:5]:
            print(f"    - {item}")
        if len(v) > 5:
            print(f"    ... ({len(v)-5} more)")

if __name__ == "__main__":
    main()
