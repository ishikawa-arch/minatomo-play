#!/usr/bin/env python3
"""minatomo-*.html の <meta name="description"> を catalog の description_user で更新する。

形式: "{description_user_oneline} | みなともPlay"

description_user は2行構成（\n 区切り）なので、ここではスペースで連結して1行に整形する。

Usage:
  python3 scripts/update_meta_descriptions.py --dry-run
  python3 scripts/update_meta_descriptions.py
  python3 scripts/update_meta_descriptions.py minatomo-foo --dry-run
"""
import argparse
import datetime
import json
import re
import shutil
from pathlib import Path

ROOT = Path.home() / "Work" / "minatomo-play-import"
CATALOG = ROOT / "games-catalog.json"

META_DESC_RE = re.compile(
    r'(<meta\s+name="description"\s+content=")([^"]*)(")'
)


def load_descs() -> dict[str, str]:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    return {g["id"]: g.get("description_user") or "" for g in catalog["games"]}


def build_new_content(desc_user: str) -> str:
    short = desc_user.replace("\n", " ").strip()
    return f"{short} | みなともPlay"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("ids", nargs="*", help="game id (省略時は全 minatomo-*.html)")
    ap.add_argument("--dry-run", action="store_true", help="差分のみ表示、書き込まない")
    ap.add_argument("--no-backup", action="store_true", help="バックアップを作らない")
    args = ap.parse_args()

    descs = load_descs()
    ids = args.ids or sorted(p.stem for p in ROOT.glob("minatomo-*.html"))
    backup_date = datetime.date.today().strftime("%Y%m%d")

    changed, unchanged, no_desc, not_found, no_meta = 0, 0, 0, 0, 0

    for gid in ids:
        path = ROOT / f"{gid}.html"
        if not path.exists():
            print(f"  ! NOT FOUND: {gid}.html")
            not_found += 1
            continue
        desc_user = descs.get(gid)
        if not desc_user:
            print(f"  WARN no description_user: {gid}")
            no_desc += 1
            continue

        original = path.read_text(encoding="utf-8")
        m = META_DESC_RE.search(original)
        if not m:
            print(f"  WARN no <meta description>: {gid}")
            no_meta += 1
            continue

        new_content = build_new_content(desc_user)
        old_content = m.group(2)
        if old_content == new_content:
            unchanged += 1
            continue

        print(f"  {gid}:")
        print(f"    OLD: {old_content}")
        print(f"    NEW: {new_content}")

        changed += 1

        if args.dry_run:
            continue

        if not args.no_backup:
            bak = path.with_suffix(f".html.bak.{backup_date}")
            if not bak.exists():
                shutil.copy2(path, bak)
                print(f"    backup -> {bak.name}")

        cleaned = META_DESC_RE.sub(
            lambda mm: f"{mm.group(1)}{new_content}{mm.group(3)}",
            original, count=1,
        )
        path.write_text(cleaned, encoding="utf-8")

    print()
    print("=== サマリ ===")
    print(f"  対象: {len(ids)}")
    print(f"  変更あり: {changed}")
    print(f"  変更なし: {unchanged}")
    if no_desc: print(f"  description_user なし: {no_desc}")
    if not_found: print(f"  ファイルなし: {not_found}")
    if no_meta: print(f"  <meta description> なし: {no_meta}")
    if args.dry_run:
        print("  DRY RUN — 書き込みなし")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
