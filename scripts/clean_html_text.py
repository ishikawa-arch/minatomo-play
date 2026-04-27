#!/usr/bin/env python3
"""minatomo-*.html から「トレーニング / リハビリ」系の文言を除去する。

削除対象 (デフォルト):
  1. <div>...</div> 要素のうち、内側テキストに 「トレーニング」 を含むもの
  2. // === 【リハビリ脳トレ】... ===  行コメント

オプション (--replace-meta):
  3. <meta name="description" content="..."> を
     "{description_user} | みなともPlay" で置換
     (description_user は games-catalog.json から取得)

Usage:
  python3 scripts/clean_html_text.py --dry-run --sample
  python3 scripts/clean_html_text.py --sample
  python3 scripts/clean_html_text.py --all --replace-meta
  python3 scripts/clean_html_text.py minatomo-foo minatomo-bar --dry-run
"""
import argparse
import datetime
import difflib
import json
import re
import shutil
from pathlib import Path

ROOT = Path.home() / "Work" / "minatomo-play-import"
CATALOG = ROOT / "games-catalog.json"

SAMPLE_IDS = [
    "minatomo-rehab-stroop",
    "minatomo-clock-quiz",
    "minatomo-cooking-steps",
    "minatomo-change-calc",
    "minatomo-corsi-block",
]

# <div>...トレーニング...</div>
# 内側に <br/> や <br> を含む multiline content も許容（ネスト要素は <br> のみ）
SUBTITLE_RE = re.compile(
    r'^[ \t]*<div\b[^>]*>(?:[^<]|<br\s*/?>)*?トレーニング(?:[^<]|<br\s*/?>)*?</div>[ \t]*\n',
    re.MULTILINE,
)

# 行コメント `// ...トレーニング... | ...リハビリ...` 行ごと削除
# (「リハビリ脳トレ」「ステップリズム - 歩行リズムトレーニング」「Cancellation Task - 視覚探索...のトレーニング」等)
HEADER_RE = re.compile(
    r'^[ \t]*//[^\n]*(?:トレーニング|リハビリ)[^\n]*\n',
    re.MULTILINE,
)

META_DESC_RE = re.compile(
    r'(<meta\s+name="description"\s+content=")([^"]*)(")'
)


def load_catalog() -> dict:
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def clean_text(
    original: str, gid: str, replace_meta: bool, descs: dict[str, str]
) -> tuple[str, list[str]]:
    """Return (cleaned_text, change_descriptions)."""
    text = original
    changes: list[str] = []

    # 1. subtitle div
    for m in SUBTITLE_RE.finditer(text):
        snippet = " ".join(m.group(0).split())[:120]
        changes.append(f"DEL subtitle: {snippet}")
    text = SUBTITLE_RE.sub("", text)

    # 2. header comment
    for m in HEADER_RE.finditer(text):
        changes.append(f"DEL header  : {m.group(0).strip()}")
    text = HEADER_RE.sub("", text)

    # 3. meta description (optional)
    if replace_meta:
        desc_user = descs.get(gid, "").strip()
        if not desc_user:
            changes.append(f"WARN meta   : no description_user for {gid}")
        else:
            # 改行をスペースに置換 (1行に整形)
            short = desc_user.replace("\n", " ")
            new_content = f"{short} | みなともPlay"
            def repl(m):
                old = m.group(2)
                if old != new_content:
                    changes.append(
                        f"REP meta    : '{old}'\n           -> '{new_content}'"
                    )
                return f"{m.group(1)}{new_content}{m.group(3)}"
            text = META_DESC_RE.sub(repl, text, count=1)

    return text, changes


def make_diff(before: str, after: str, gid: str) -> str:
    return "".join(
        difflib.unified_diff(
            before.splitlines(keepends=True),
            after.splitlines(keepends=True),
            fromfile=f"a/{gid}.html",
            tofile=f"b/{gid}.html",
            n=2,
        )
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("ids", nargs="*", help="game id (without .html). 省略時は --sample / --all を使用")
    ap.add_argument("--sample", action="store_true",
                    help=f"5本サンプル ({', '.join(SAMPLE_IDS)})")
    ap.add_argument("--all", action="store_true", help="全 minatomo-*.html を対象")
    ap.add_argument("--dry-run", action="store_true", help="差分のみ表示、書き込まない")
    ap.add_argument("--replace-meta", action="store_true",
                    help="meta description も description_user で置換")
    ap.add_argument("--no-backup", action="store_true", help="バックアップを作らない")
    args = ap.parse_args()

    if args.sample:
        ids = SAMPLE_IDS
    elif args.all:
        ids = sorted(p.stem for p in ROOT.glob("minatomo-*.html"))
    elif args.ids:
        ids = args.ids
    else:
        ap.error("対象が指定されていません: --sample / --all / <ids ...>")

    descs: dict[str, str] = {}
    if args.replace_meta:
        catalog = load_catalog()
        descs = {g["id"]: g.get("description_user") or "" for g in catalog["games"]}

    backup_date = datetime.date.today().strftime("%Y%m%d")
    changed_files = 0
    unchanged_files = 0
    not_found = 0

    for gid in ids:
        path = ROOT / f"{gid}.html"
        if not path.exists():
            print(f"  ! NOT FOUND: {gid}.html")
            not_found += 1
            continue

        original = path.read_text(encoding="utf-8")
        cleaned, changes = clean_text(original, gid, args.replace_meta, descs)

        print("=" * 72)
        print(f"=== {gid} ===")
        if not changes:
            print("  (no change)")
            unchanged_files += 1
            continue

        for c in changes:
            print(f"  {c}")
        print()
        print("  --- diff ---")
        print(make_diff(original, cleaned, gid))

        changed_files += 1

        if args.dry_run:
            continue

        if not args.no_backup:
            bak = path.with_suffix(f".html.bak.{backup_date}")
            if bak.exists():
                print(f"  backup already exists, skipped: {bak.name}")
            else:
                shutil.copy2(path, bak)
                print(f"  backup -> {bak.name}")

        path.write_text(cleaned, encoding="utf-8")
        print(f"  WROTE: {path.name}")

    print()
    print("=" * 72)
    print("=== サマリ ===")
    print(f"  対象: {len(ids)} 件")
    print(f"  変更あり: {changed_files}")
    print(f"  変更なし: {unchanged_files}")
    if not_found:
        print(f"  見つからず: {not_found}")
    if args.dry_run:
        print("  DRY RUN — 書き込みなし")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
