#!/usr/bin/env python3
"""Remove deprecated contraindication strings from games-catalog.json.

apply_contraindications.py の merge_dedup ロジックは既存の
contraindications.{avoid,cautions} を保持してから新パターンを追加するため、
PATTERNS の文言を変更しても旧文字列が残り続ける。
本スクリプトは指定した文字列を全ゲームから一括削除するアドホック対応。

PATTERNS の文言を変更したら、ここの DEPRECATED に旧文字列を追記して実行する。

Usage:
  python3 scripts/cleanup_deprecated_contraindications.py [--dry-run]
"""
import argparse
import datetime
import json
from pathlib import Path

ROOT = Path.home() / "Work" / "minatomo-play-import"
CATALOG = ROOT / "games-catalog.json"

DEPRECATED = [
    "診察応接集中全般（感情接試誤発ケース）",                       # E-1 (2026-04-26)
    "認知症で遮心不安・心理不安が高評価される方",                    # E-2 (2026-04-26)
    "重度認知症（古典的記憶課題は明確なerrorとなり傷つけやすい）",   # E-3 (2026-04-26)
]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="削除内容をレポートするのみで書き込まない")
    args = ap.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    deprecated_set = set(DEPRECATED)

    print("=== 削除対象の廃止文字列 ===")
    for s in DEPRECATED:
        print(f"  - {s}")
    print()

    affected = []        # (game_id, key, removed_list)
    total_removed = 0

    for game in catalog["games"]:
        ci = game.get("contraindications", {})
        for key in ("avoid", "cautions"):
            before = ci.get(key, [])
            removed_here = [x for x in before if x in deprecated_set]
            if removed_here:
                after = [x for x in before if x not in deprecated_set]
                affected.append((game["id"], key, removed_here))
                total_removed += len(removed_here)
                if not args.dry_run:
                    ci[key] = after

    print("=== 影響を受けるゲーム ===")
    for gid, key, removed in affected:
        print(f"  {gid}.{key}: {len(removed)} 件削除")
        for r in removed:
            print(f"      - {r}")
    print()

    print("=== サマリ ===")
    print(f"  影響エントリ数:  {len(affected)}")
    print(f"  削除文字列総数:  {total_removed}")
    print(f"  影響ゲーム数:    {len({gid for gid, _, _ in affected})}")
    print()

    if args.dry_run:
        print("DRY RUN — 書き込みなし")
        return

    catalog["last_updated"] = datetime.date.today().isoformat()
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote: {CATALOG} ({CATALOG.stat().st_size} bytes)")
    print(f"last_updated: {catalog['last_updated']}")


if __name__ == "__main__":
    main()
