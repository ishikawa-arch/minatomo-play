#!/usr/bin/env python3
"""Apply 10 clinical contraindication patterns + baseline to games-catalog.json.

Patterns:
  P1 高速反応・タイミング系
  P2 言語処理系
  P3 複雑指示・多段階処理系
  P4 視覚刺激特性
  P5 聴覚・音楽系
  P6 身体・運動操作系
  P7 感情・社会的内容
  P8 記憶課題
  P9 計算系
  P10 音声入力必須
"""
import datetime
import json
import shutil
from pathlib import Path

ROOT = Path.home() / "Work" / "minatomo-play-import"
CATALOG = ROOT / "games-catalog.json"

BASELINE = {
    "avoid": [
        "意識障害（JCS II以上等、覚醒不安定）",
        "急性期のバイタルサイン不安定",
        "医師・主治医から認知記憶課題の中止指示あり",
        "セッションに取り組める状態にない（急変対応中・他のケア優先・プライバシー配慮が必要な状況等）",
        "本人による明確な拒否",
    ],
    "note": "これらは全112本のゲームに無条件で適用される共通禁忌。各ゲームのcontraindications.avoidは、この上に追加で適用される。",
}

# Pattern definitions
PATTERNS = {
    "P1": {
        "name": "高速反応・タイミング系",
        "avoid":    ["重度認知症（ルール理解不可）", "重度偏麻痺（Brunnstrom III以下）"],
        "cautions": ["心血管リスクのある方（心拍上昇誘発）"],
    },
    "P1_flashing": {
        "name": "P1のうち点滅刺激あり",
        "avoid":    ["てんかん既往"],
        "cautions": [],
    },
    "P2": {
        "name": "言語処理系",
        "avoid":    ["重度失語症", "言語・記号によるコミュニケーション重度困難", "重度認知症（言語理解不可）"],
        "cautions": ["重度聴覚障害（聴覚ゲーム以外、文字読みゲームは継続可）"],
    },
    "P2_audio": {
        "name": "P2のうち聴覚必須",
        "avoid":    ["重度聴覚障害"],
        "cautions": [],
    },
    "P3": {
        "name": "複雑指示・多段階処理系",
        "avoid":    ["重度認知症", "重度高次脳機能障害（遂行機能重度低下）"],
        "cautions": ["うつ状態・不安障害が強い方（挑戦課題の挫折体験誘発）", "外傷性脳損傷急性期（覚醒度・易疲労性考慮）"],
    },
    "P4": {
        "name": "視覚刺激特性",
        "avoid":    ["重度視覚障害（画面識別不可）", "重度視野障害", "重度認知症（視覚認知不可）"],
        "cautions": [],
    },
    "P4_color": {
        "name": "P4のうち色覚要求",
        "avoid":    ["色覚異常"],
        "cautions": [],
    },
    "P4_scan": {
        "name": "P4のうちスキャン課題",
        "avoid":    ["重度半側空間無視（評価目的以外）"],
        "cautions": [],
    },
    "P5": {
        "name": "聴覚・音楽系",
        "avoid":    ["重度聴覚障害（補聴器でも聴取不可）", "重度認知症（聴覚認知不可）"],
        "cautions": ["耳鳴りが強い方（音識別困難）"],
    },
    "P5_balance": {
        "name": "P5のうちバランス要求 (step-rhythm)",
        "avoid":    ["めまい・バランス障害が強い方"],
        "cautions": [],
    },
    "P5_voice_oral": {
        "name": "P5のうち発声 (voice-challenge)",
        "avoid":    [],
        "cautions": ["口腔・耳鼻科疾患"],
    },
    "P6": {
        "name": "身体・運動操作系",
        "avoid":    [],
        "cautions": [],
        # tag: motor_precision_required
    },
    "P7": {
        "name": "感情・社会的内容",
        "avoid":    [
            "重度うつ状態・抑うつ状態（face-name/emotionは感情誤発リスク）",
            "自閉スペクトラム症 重度（emotionは評価不能）",
            "心理的サポート体制が確保されていない環境での単独使用（感情誘発リスク）",
        ],
        "cautions": [
            "認知症で焦燥不安・心理的不安が強い方",
            "うつ状態・不安障害（振り返り判断付きで使用）",
        ],
    },
    "P8": {
        "name": "記憶課題",
        "avoid":    [
            "重度認知症（古典的記憶課題は明確な誤りとなり傷つけやすい）",
            "重度抑うつ状態（失敗体験誘発リスク高）",
        ],
        "cautions": [],
    },
    "P9": {
        "name": "計算系",
        "avoid":    ["重度認知症（計算不可）"],
        "cautions": [],
    },
    "P10": {
        "name": "音声入力必須",
        "avoid":    [
            "重度失語症（発話不可）",
            "重度構音障害（クリアな発話不可）",
            "気管切開中・人工呼吸器使用中・発話ツール未使用の方",
            "重度認知症（指示理解・反応不可）",
        ],
        "cautions": [
            "軽度〜中等度失語症（ST介助下で可能）",
            "多人数現場（周囲騒音で認識低下、個人面談室推奨）",
        ],
    },
}

# ============================================================
# Specific game-slug sets for each pattern
# ============================================================
# Slugs without "minatomo-" prefix for brevity
def s(*names):
    return {f"minatomo-{n}" for n in names}

P1_SLUGS = s(
    # rapid reaction / timing
    "rhythm-tap", "big-tap", "whack-mole", "dual-task", "step-rhythm",
    "rehab-gonogo", "go-nogo", "rehab-flanker",
    "simple-tap", "simple-tapspeed", "simple-mole", "simple-balloon",
    "simple-greentap", "simple-falling", "simple-chasetap", "simple-counttap",
    "simple-reaction", "simple-justone",
)
# Subset of P1 with flashing/sudden-appearance stimuli
P1_FLASHING_SLUGS = s(
    "whack-mole", "simple-mole", "simple-balloon", "simple-falling",
    "simple-greentap", "flash-memory", "simple-disappear",
)

P2_SLUGS = s(
    "word-builder", "word-connect", "hint-guess",
    "story-memory", "message-recall", "listening-quiz",
    "error-finder", "rehab-wordpic", "rehab-category",
    "voice-challenge", "rehab-emotion",
    # semantic categorization (require word/category understanding)
    "category-sort", "simple-odd", "simple-sort", "simple-category",
)
P2_AUDIO_SLUGS = s("listening-quiz", "voice-challenge")

P3_SLUGS = s(
    "rehab-tmtb", "rehab-serialadd", "prospective-memory",
    "rehab-prospective", "dual-task", "rehab-emotion",
    "rehab-flanker", "rehab-gonogo",
    "schedule", "cooking-steps", "step-order",
)

P4_SLUGS = s(
    "stroop", "rehab-stroop",
    "spot-diff", "simple-spotdiff",
    "rehab-cancellation", "letter-search", "counting", "simple-count",
    "rehab-flanker",
    "color-match", "simple-color", "simple-colorchange", "simple-colorconnect",
    "change-detection", "rehab-change",
    "rehab-rotation", "puzzle-rotation",
    "rehab-clock", "clock-quiz",
    "shape-puzzle", "simple-pattern", "simple-same",
    "fragment-id",
    # spatial discrimination (left/right, up/down, real-vs-fake, path-following)
    "simple-updown", "simple-leftright", "left-right", "simple-realone",
    "rehab-path",
)
P4_COLOR_SLUGS = s(
    "stroop", "rehab-stroop", "color-match",
    "simple-color", "simple-colorchange", "simple-colorconnect",
)
P4_SCAN_SLUGS = s(
    "rehab-cancellation", "letter-search", "counting", "simple-count",
)

P5_SLUGS = s(
    "rhythm-memory", "rhythm-tap", "listening-quiz",
    "step-rhythm", "voice-challenge",
)
P5_BALANCE_SLUGS = s("step-rhythm")
P5_VOICE_ORAL_SLUGS = s("voice-challenge")

P6_SLUGS = s(
    "trace", "pair-search", "block-stack",
    "simple-colorconnect",
    "step-order", "cooking-steps",
)

P7_SLUGS = s("rehab-emotion", "face-name")

# P8: memory tasks
P8_SLUGS = s(
    "memory-game", "simple-memory-game", "simple-memory",
    "corsi-block", "rehab-corsi",
    "digit-span", "rehab-digitback",
    "story-memory", "rehab-delayedrecall",
    "prospective-memory", "rehab-prospective",
    "change-detection", "rehab-change",
    "flash-memory", "map-memory",
    "face-name", "message-recall",
    "schedule", "cooking-steps", "shopping-list",
    "where-was-it", "phone-memory", "rhythm-memory",
    "block-stack", "pair-search",
    "simple-pairs", "simple-disappear", "simple-whatadded",
    "simple-appearorder", "simple-wherewasite",
    "simple-simon", "simple-simon2", "simple-simon3",
    "simple-shell", "simple-shell2", "simple-shell3",
    "simple-order",
    # WM updating
    "nback",
)

# P9: calculation
P9_SLUGS = s(
    "change-calc", "serial-calc", "stack-calc", "wallet-calc",
    "counting", "number-compare", "compare-ranking",
    "rehab-serialadd", "rehab-numseries",
    "simple-addition", "simple-bigger", "simple-howmany",
    "simple-samecount", "simple-counttap", "simple-count",
    "simple-mostcommon",
)

P10_SLUGS = s("voice-challenge")

# ============================================================
# Apply
# ============================================================
def classify_game(game):
    """Return list of pattern keys that apply to this game."""
    slug = game["id"]
    applied = []
    if slug in P1_SLUGS:
        applied.append("P1")
        if slug in P1_FLASHING_SLUGS:
            applied.append("P1_flashing")
    # P1_flashing can also apply to non-P1 games (e.g., flash-memory which is P8)
    elif slug in P1_FLASHING_SLUGS:
        applied.append("P1_flashing")  # still mark photosensitive risk

    if slug in P2_SLUGS:
        applied.append("P2")
        if slug in P2_AUDIO_SLUGS:
            applied.append("P2_audio")
    if slug in P3_SLUGS:
        applied.append("P3")
    if slug in P4_SLUGS:
        applied.append("P4")
        if slug in P4_COLOR_SLUGS:
            applied.append("P4_color")
        if slug in P4_SCAN_SLUGS:
            applied.append("P4_scan")
    if slug in P5_SLUGS:
        applied.append("P5")
        if slug in P5_BALANCE_SLUGS:
            applied.append("P5_balance")
        if slug in P5_VOICE_ORAL_SLUGS:
            applied.append("P5_voice_oral")
    if slug in P6_SLUGS:
        applied.append("P6")
    if slug in P7_SLUGS:
        applied.append("P7")
    if slug in P8_SLUGS:
        applied.append("P8")
    if slug in P9_SLUGS:
        applied.append("P9")
    if slug in P10_SLUGS:
        applied.append("P10")
    return applied

def merge_dedup(*lists):
    seen, out = set(), []
    for lst in lists:
        for item in lst:
            if item not in seen:
                out.append(item); seen.add(item)
    return out

def main():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))

    # Add baseline at top level
    catalog["baseline_contraindications"] = BASELINE

    pattern_counts = {}
    needs_review = []
    classified_count = 0
    for game in catalog["games"]:
        applied = classify_game(game)
        # Public-facing applied_patterns: only top-level P1..P10 (not sub-flags)
        public_patterns = [p for p in applied if p in {"P1","P2","P3","P4","P5","P6","P7","P8","P9","P10"}]
        for p in public_patterns:
            pattern_counts[p] = pattern_counts.get(p, 0) + 1

        # build avoid / cautions from all sub-pattern flags
        avoid_lists, caution_lists = [], []
        for p in applied:
            if p in PATTERNS:
                avoid_lists.append(PATTERNS[p]["avoid"])
                caution_lists.append(PATTERNS[p]["cautions"])

        # preserve any legacy items already in cautions (e.g. 視覚障害 added by previous heuristic)
        existing_avoid    = game.get("contraindications", {}).get("avoid", [])
        existing_cautions = game.get("contraindications", {}).get("cautions", [])

        new_avoid    = merge_dedup(existing_avoid, *avoid_lists)
        new_cautions = merge_dedup(existing_cautions, *caution_lists)

        game["contraindications"] = {"avoid": new_avoid, "cautions": new_cautions}
        game["applied_patterns"] = public_patterns

        # P6 motor characteristic flag
        if "P6" in applied:
            chars = set(game.get("characteristics", []))
            chars.add("motor_precision_required")
            game["characteristics"] = sorted(chars)

        if not public_patterns:
            game["metadata"]["completion_status"] = "needs_clinical_review"
            game["metadata"]["review_reason"] = "パターン分類が不明確"
            needs_review.append(game["id"])
        else:
            classified_count += 1
            # promote auto_filled if currently needs_clinical_review
            cs = game["metadata"]["completion_status"]
            if cs == "needs_clinical_review":
                game["metadata"]["completion_status"] = "auto_filled"
                game["metadata"].pop("review_reason", None)

    # write
    catalog["last_updated"] = datetime.date.today().isoformat()
    CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote: {CATALOG} ({CATALOG.stat().st_size} bytes)")
    print(f"last_updated: {catalog['last_updated']}")
    print()
    print("=== pattern counts ===")
    for k in sorted(pattern_counts.keys()):
        print(f"  {k}: {pattern_counts[k]}")
    print()
    print(f"classified: {classified_count} / {len(catalog['games'])}")
    print(f"needs_clinical_review (no patterns matched): {len(needs_review)}")
    for s in needs_review[:20]:
        print(f"  - {s}")

    # extra stats
    severe_dementia_avoid = sum(
        1 for g in catalog["games"]
        if any("重度認知症" in a for a in g["contraindications"]["avoid"])
    )
    print()
    print(f"重度認知症 が avoid に含まれるゲーム: {severe_dementia_avoid}")

    # completion status breakdown
    from collections import Counter
    cs_c = Counter(g["metadata"]["completion_status"] for g in catalog["games"])
    print()
    print("=== completion_status ===")
    for k, v in cs_c.most_common():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    main()
