#!/usr/bin/env python3
"""Build games-catalog.json from MD catalog + manifest + auto-fill rules."""
import re
import json
import shutil
from pathlib import Path
from datetime import datetime

ROOT = Path.home() / "Work" / "minatomo-play-import"
MD_PATH = ROOT / "minatomo-play-games-catalog.md"
MANIFEST_PATH = ROOT / "games-manifest.json"
OUT_PATH = ROOT / "games-catalog.json"

PRIMARY_DOMAINS = [
    {"id": "attention",    "jp": "注意力",   "icon": "👁️"},
    {"id": "memory",       "jp": "記憶",     "icon": "🧠"},
    {"id": "executive",    "jp": "遂行",     "icon": "🔄"},
    {"id": "visuospatial", "jp": "視空間",   "icon": "🧩"},
    {"id": "calculation",  "jp": "計算",     "icon": "🔢"},
    {"id": "orientation",  "jp": "見当識",   "icon": "📅"},
]

SUBDOMAINS = [
    {"id": "selective_attention",      "jp": "選択的注意",       "primary": "attention"},
    {"id": "sustained_attention",      "jp": "持続的注意",       "primary": "attention"},
    {"id": "divided_attention",        "jp": "分配的注意",       "primary": "attention"},
    {"id": "spatial_attention",        "jp": "空間的注意",       "primary": "attention"},
    {"id": "inhibition",               "jp": "抑制機能",         "primary": "executive"},
    {"id": "set_shifting",             "jp": "認知的柔軟性",     "primary": "executive"},
    {"id": "planning",                 "jp": "計画立案",         "primary": "executive"},
    {"id": "working_memory_verbal",    "jp": "言語的WM",         "primary": "memory"},
    {"id": "working_memory_visual",    "jp": "視覚的WM",         "primary": "memory"},
    {"id": "working_memory_spatial",   "jp": "空間的WM",         "primary": "memory"},
    {"id": "working_memory_update",    "jp": "WM更新",           "primary": "memory"},
    {"id": "episodic_memory",          "jp": "エピソード記憶",   "primary": "memory"},
    {"id": "semantic_memory",          "jp": "意味記憶",         "primary": "memory"},
    {"id": "visual_memory",            "jp": "視覚記憶",         "primary": "memory"},
    {"id": "spatial_memory",           "jp": "空間記憶",         "primary": "memory"},
    {"id": "prospective_memory",       "jp": "展望記憶",         "primary": "memory"},
    {"id": "auditory_memory",          "jp": "聴覚記憶",         "primary": "memory"},
    {"id": "mental_rotation",          "jp": "心的回転",         "primary": "visuospatial"},
    {"id": "visual_perception",        "jp": "視覚認識",         "primary": "visuospatial"},
    {"id": "left_right_discrimination","jp": "左右弁別",         "primary": "visuospatial"},
    {"id": "topographical",            "jp": "地誌的記憶",       "primary": "visuospatial"},
    {"id": "time_orientation",         "jp": "時間見当識",       "primary": "orientation"},
    {"id": "social_cognition",         "jp": "社会的認知",       "primary": "executive"},
    {"id": "language_fluency",         "jp": "言語流暢性",       "primary": "memory"},
    {"id": "language_processing",      "jp": "言語処理",         "primary": "memory"},
    {"id": "processing_speed",         "jp": "処理速度",         "primary": "attention"},
    {"id": "reaction_time",            "jp": "反応速度",         "primary": "attention"},
    {"id": "motor_control",            "jp": "運動制御",         "primary": "executive"},
    {"id": "rhythm_timing",            "jp": "リズム同期",       "primary": "executive"},
]
SUBDOMAIN_TO_PRIMARY = {s["id"]: s["primary"] for s in SUBDOMAINS}

TARGET_POPULATIONS = [
    {"id": "healthy_elderly",   "jp": "健常高齢者",       "description": "認知機能の予防・維持目的"},
    {"id": "mci",               "jp": "軽度認知障害",     "description": "MCI、認知機能低下の予防的訓練"},
    {"id": "mild_dementia",     "jp": "軽度認知症",       "description": "アルツハイマー型・脳血管性等の軽度"},
    {"id": "moderate_dementia", "jp": "中等度認知症",     "description": "シンプル版が中心、超大ボタン・自動進行が必要"},
    {"id": "stroke_subacute",   "jp": "脳卒中亜急性期",   "description": "発症後〜6ヶ月、回復期"},
    {"id": "stroke_chronic",    "jp": "脳卒中慢性期",     "description": "発症後6ヶ月以降、生活期"},
    {"id": "tbi",               "jp": "外傷性脳損傷",     "description": "TBI、高次脳機能障害"},
    {"id": "parkinson",         "jp": "パーキンソン病",   "description": "PD、運動症状＋認知症状"},
    {"id": "preventive",        "jp": "予防",             "description": "認知機能低下の予防的活用"},
]

# Auto-fill recommendations by phase/category
RECO_BY_CATEGORY = {
    "regular":        ["stroke_subacute", "stroke_chronic", "tbi", "mci", "mild_dementia", "healthy_elderly"],
    "simple":         ["moderate_dementia", "mild_dementia", "stroke_chronic"],
    "rehabilitation": ["stroke_subacute", "stroke_chronic", "tbi", "mci"],
}

# Parkinson-related
PARKINSON_SLUGS = {
    "minatomo-big-tap", "minatomo-voice-challenge", "minatomo-trace",
    "minatomo-rhythm-tap", "minatomo-step-rhythm", "minatomo-dual-task",
}

# Audio/microphone
SPEAKER_SLUGS = {
    "minatomo-rhythm-memory", "minatomo-rhythm-tap",
    "minatomo-listening-quiz", "minatomo-step-rhythm",
}
MIC_SLUGS = {"minatomo-voice-challenge"}
TEXT_OUTPUT_SLUGS = {"minatomo-story-memory", "minatomo-message-recall", "minatomo-listening-quiz"}

# Cognitive tag string → subdomain ids (priority order)
TAG_RULES = [
    # specific phrases first
    (r"半側空間.*注意",                 ["spatial_attention"]),
    (r"視覚探索",                       ["selective_attention", "spatial_attention"]),
    (r"地誌的(?:記憶|見当識)",          ["topographical"]),
    (r"心的回転",                       ["mental_rotation"]),
    (r"左右弁別",                       ["left_right_discrimination"]),
    (r"展望記憶",                       ["prospective_memory"]),
    (r"エピソード記憶",                 ["episodic_memory"]),
    (r"意味.*?(?:記憶|連合|分類|判断|大小比較|ネットワーク)", ["semantic_memory"]),
    (r"言語流暢性",                     ["language_fluency"]),
    (r"言語(?:処理|理解)",              ["language_processing"]),
    (r"語彙(?:アクセス|処理)",          ["language_processing"]),
    (r"認知的柔軟性",                   ["set_shifting"]),
    (r"set[\- ]shifting",               ["set_shifting"]),
    (r"反応(?:切替|スイッチ)",          ["set_shifting", "inhibition"]),
    (r"抑制(?:機能|・選択|・反応|を)?", ["inhibition"]),
    (r"go.?/.?no.?go|Go/No-Go",         ["inhibition"]),
    (r"フランカー|flanker",             ["inhibition", "spatial_attention"]),
    (r"分配的注意|二重課題|ダブルタスク", ["divided_attention"]),
    (r"WM更新|ワーキングメモリ更新|n.?back|N.?バック", ["working_memory_update"]),
    (r"言語的(?:WM|短期記憶)",          ["working_memory_verbal"]),
    (r"視覚的空間的(?:WM|短期記憶|記憶)", ["working_memory_visual", "working_memory_spatial"]),
    (r"視覚的(?:WM|短期記憶)",          ["working_memory_visual"]),
    (r"空間的(?:WM|短期記憶)",          ["working_memory_spatial"]),
    (r"空間(?:的)?記憶",                ["spatial_memory"]),
    (r"視覚記憶",                       ["visual_memory"]),
    (r"視覚的(?:記憶|詳細注意|注意)",   ["selective_attention"]),
    (r"視覚(?:認識|認知)",              ["visual_perception"]),
    (r"視覚的注意",                     ["selective_attention"]),
    (r"瞬間記憶",                       ["visual_memory", "selective_attention"]),
    (r"聴覚(?:的(?:短期記憶|理解)|記憶)", ["auditory_memory"]),
    (r"時間(?:見当識|推論)",            ["time_orientation"]),
    (r"時計(?:読み|よみ)",              ["time_orientation", "visual_perception"]),
    (r"時間管理",                       ["planning", "time_orientation"]),
    (r"順序(?:記憶|計画)",              ["spatial_memory", "planning"]),
    (r"順番|順序",                      ["spatial_memory"]),
    (r"遂行(?:機能)?",                  ["planning"]),
    (r"計画(?:立案)?",                  ["planning"]),
    (r"持続(?:的)?注意",                ["sustained_attention"]),
    (r"選択(?:的)?注意",                ["selective_attention"]),
    (r"空間(?:的)?(?:選択的)?注意",     ["spatial_attention"]),
    (r"処理速度",                       ["processing_speed"]),
    (r"反応速度",                       ["reaction_time"]),
    (r"反応(?:・|・)?(?:基礎)?(?:運動|タイミング)", ["reaction_time"]),
    (r"反応(?:$|・)",                   ["reaction_time"]),
    (r"リズム(?:同期|タイミング)",      ["rhythm_timing"]),
    (r"歩行リズム",                     ["rhythm_timing", "motor_control"]),
    (r"両側運動",                       ["motor_control"]),
    (r"振幅訓練|運動範囲",              ["motor_control"]),
    (r"発声機能|呼気持続",              ["motor_control"]),
    (r"微細運動|micrographia",          ["motor_control"]),
    (r"対連合(?:学習)?",                ["episodic_memory", "semantic_memory"]),
    (r"顔.?名前(?:連合)?(?:記憶)?",     ["episodic_memory", "semantic_memory"]),
    (r"表情認識|社会的認知",            ["social_cognition"]),
    (r"流動性知能|帰納推論",            ["planning"]),
    (r"変化(?:検出|さがし)",            ["visual_memory", "selective_attention"]),
    (r"パターン(?:認識)?",              ["visual_perception"]),
    (r"マッチング",                     ["visual_perception"]),
    (r"分類",                           ["semantic_memory"]),
    (r"カテゴリ(?:判断|分け)",          ["semantic_memory"]),
    (r"識別|弁別",                      ["visual_perception"]),
    (r"頻度判断",                       ["selective_attention"]),
    (r"物体(?:永続性|追跡)",            ["spatial_attention"]),
    (r"プライミング",                   ["visual_perception"]),
    (r"色(?:覚|語|・)",                 ["visual_perception"]),
    (r"連続加算|たしざんリレー",        ["working_memory_update"]),
    (r"干渉抑制",                       ["inhibition"]),
    (r"指示遂行",                       ["planning"]),
    (r"計数|計算",                      []),  # primary domain calculation handled separately
    (r"金銭処理|数量(?:処理|見積もり|比較|一致)", []),
    (r"連合",                           ["semantic_memory"]),
    (r"モニタリング",                   ["planning"]),
    (r"基礎運動",                       ["motor_control"]),
]

CALC_TAG_RE = re.compile(r"計算|金銭|数量(?:処理|見積もり|比較|一致)|計数")
PROCSPEED_TAG_RE = re.compile(r"処理速度")

def map_tag_to_subdomains(tag_text):
    """Map a Japanese cognitive tag string to a list of subdomain ids."""
    found = []
    for pattern, subs in TAG_RULES:
        if re.search(pattern, tag_text, re.IGNORECASE):
            for s in subs:
                if s not in found:
                    found.append(s)
    return found

def determine_primary_domain(tag_text, manifest_domain, slug):
    """Pick the primary cognitive domain for a game."""
    # explicit calculation tag
    if CALC_TAG_RE.search(tag_text or ""):
        # if also has memory subdomain, prefer calculation
        return "calculation"
    # use manifest domain if valid
    if manifest_domain in {d["id"] for d in PRIMARY_DOMAINS}:
        return manifest_domain
    return "memory"  # safe fallback

def parse_catalog_md():
    """Parse the catalog MD into {slug: dict}."""
    text = MD_PATH.read_text(encoding="utf-8")
    out = {}
    for line in text.split("\n"):
        # row in table: | # | `minatomo-x.jsx` | name | tag | basis(opt) | notes |
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]
        if len(cells) < 4:
            continue
        # find filename cell
        fname_cell = None
        fname_idx = None
        for idx, c in enumerate(cells):
            m = re.match(r"`(minatomo-[a-z0-9-]+)\.jsx`", c)
            if m:
                fname_cell = m.group(1)
                fname_idx = idx
                break
        if not fname_cell:
            continue
        # name is next cell
        name_cell = cells[fname_idx + 1] if fname_idx + 1 < len(cells) else ""
        tag_cell  = cells[fname_idx + 2] if fname_idx + 2 < len(cells) else ""
        # rest: depending on table type
        rest = cells[fname_idx + 3:]
        notes = ""
        basis = ""
        if len(rest) >= 2:
            # rehab table: basis | notes
            basis = rest[0]
            notes = rest[1] if len(rest) > 1 else ""
        elif len(rest) == 1:
            notes = rest[0]
        out[fname_cell] = {
            "raw_name": name_cell,
            "raw_tag":  tag_cell,
            "basis":    basis,
            "notes":    notes,
        }
    return out

def categorize(slug):
    if slug.startswith("minatomo-rehab-"):
        return "rehabilitation", 3
    if slug.startswith("minatomo-simple-"):
        return "simple", 2
    return "regular", 1

def auto_indications(category, slug):
    base = list(RECO_BY_CATEGORY.get(category, RECO_BY_CATEGORY["regular"]))
    if slug in PARKINSON_SLUGS:
        base.append("parkinson")
    return base

def auto_cautions(slug, subdomains, raw_tag):
    cautions = []
    if any(s in subdomains for s in ("visual_memory", "visual_perception", "spatial_memory", "mental_rotation", "left_right_discrimination", "topographical")):
        cautions.append("重度視覚障害")
    if any(s in subdomains for s in ("auditory_memory",)) or slug in SPEAKER_SLUGS:
        cautions.append("重度聴覚障害")
    if slug in MIC_SLUGS:
        cautions.append("発声困難")
    if "calculation" in (raw_tag or "") or CALC_TAG_RE.search(raw_tag or ""):
        cautions.append("計算障害（失算症）")
    # de-dup, preserve order
    seen, out = set(), []
    for c in cautions:
        if c not in seen:
            out.append(c); seen.add(c)
    return out

def device_spec(slug):
    inputs = ["touch"]
    outputs = ["visual"]
    if slug in SPEAKER_SLUGS:
        outputs.append("audio")
    if slug in TEXT_OUTPUT_SLUGS:
        outputs.append("text")
    if slug in MIC_SLUGS:
        inputs.append("microphone")
    return {
        "input": inputs,
        "output": outputs,
        "requires_audio": slug in SPEAKER_SLUGS or slug in MIC_SLUGS,
        "requires_microphone": slug in MIC_SLUGS,
        "requires_speaker": slug in SPEAKER_SLUGS,
    }

def duration_minutes(category):
    return {"simple": 3, "regular": 5, "rehabilitation": 7}.get(category, 5)

def find_related(this_slug, this_subdomains, all_games, max_n=3):
    if not this_subdomains:
        return []
    sub_set = set(this_subdomains)
    scored = []
    for g in all_games:
        if g["id"] == this_slug:
            continue
        other = set(g["domain"]["subdomains"])
        if not other:
            continue
        score = len(sub_set & other)
        if score == 0:
            continue
        scored.append((score, g["id"]))
    scored.sort(key=lambda x: (-x[0], x[1]))
    return [s for _, s in scored[:max_n]]

# Hand-perfected gold standard for rehab-stroop
REHAB_STROOP_GOLD = {
    "id": "minatomo-rehab-stroop",
    "name": "ストループ",
    "name_kana": "すとるーぷ",
    "category": "rehabilitation",
    "phase": 3,
    "url": "minatomo-rehab-stroop.html",
    "icon": None,

    "domain": {
        "primary": "attention",
        "secondary": ["executive"],
        "subdomains": ["inhibition", "selective_attention"],
    },

    "neuropsych_basis": {
        "test_name": "Stroop Test",
        "description": "色名と文字色の干渉を用いた抑制機能評価",
        "measures": ["処理速度", "干渉抑制"],
        "reference": None,
    },

    "indications": {
        "recommended": ["stroke_subacute", "stroke_chronic", "tbi", "mci"],
        "use_cases": [
            "前頭葉機能の評価・訓練",
            "高次脳機能リハ",
            "選択的注意の訓練",
        ],
    },

    "contraindications": {
        "avoid": ["moderate_dementia"],
        "cautions": [
            "失語症の場合は文字読みが困難",
            "色覚異常の方は不向き",
        ],
    },

    "difficulty": {
        "levels": [1, 2, 3],
        "default": 1,
        "adaptive": False,
        "structure": "congruent練習→incongruent本番の段階構造",
    },

    "duration": {
        "estimated_minutes": 5,
        "trials": 20,
    },

    "device": {
        "input": ["touch"],
        "output": ["visual"],
        "requires_audio": False,
        "requires_microphone": False,
        "requires_speaker": False,
    },

    "related_games": ["minatomo-rehab-flanker", "minatomo-rehab-gonogo", "minatomo-stroop"],

    "tags": ["古典課題", "前頭葉", "注意", "抑制"],

    "design_notes": "古典の中の古典。congruent練習→incongruent本番の段階構造",

    "metadata": {
        "version": 1,
        "created": "2026-04-24",
        "last_reviewed": None,
        "completion_status": "complete",
    },
}

def build_game(slug, manifest_entry, catalog_entry, all_games_partial):
    category, phase = categorize(slug)
    raw_tag = (catalog_entry or {}).get("raw_tag", "")
    raw_name = (catalog_entry or {}).get("raw_name", "")
    basis    = (catalog_entry or {}).get("basis", "")
    notes    = (catalog_entry or {}).get("notes", "")

    # name: prefer catalog raw_name, fall back to manifest title
    name = raw_name.strip() if raw_name else manifest_entry["title"]
    # strip "（仮）" etc from name
    name = re.sub(r"（[^）]*）$", "", name).strip()

    subdomains = map_tag_to_subdomains(raw_tag) if raw_tag else map_tag_to_subdomains(name)

    # determine primary
    primary = determine_primary_domain(raw_tag, manifest_entry.get("domain"), slug)

    # Subdomain fallback: if still empty, infer from primary domain + slug
    if not subdomains:
        if primary == "calculation":
            subdomains = ["processing_speed"]
        elif primary == "visuospatial":
            subdomains = ["visual_perception"]
        elif primary == "attention":
            subdomains = ["selective_attention"]
        elif primary == "memory":
            subdomains = ["visual_memory"]
        elif primary == "executive":
            subdomains = ["planning"]
        elif primary == "orientation":
            subdomains = ["time_orientation"]
    # secondary: any subdomain primaries other than primary
    secondary = []
    for sd in subdomains:
        p = SUBDOMAIN_TO_PRIMARY.get(sd)
        if p and p != primary and p not in secondary:
            secondary.append(p)

    # neuropsych
    neuropsych = None
    if basis or category == "rehabilitation":
        neuropsych = {
            "test_name": basis or None,
            "description": None,
            "measures": [],
            "reference": None,
        }

    indications = {
        "recommended": auto_indications(category, slug),
        "use_cases": [],
    }
    contraindications = {
        "avoid": [],
        "cautions": auto_cautions(slug, subdomains, raw_tag),
    }
    difficulty = {
        "levels": [1, 2, 3],
        "default": 1,
        "adaptive": False,
        "structure": notes if notes else None,
    }
    duration = {
        "estimated_minutes": duration_minutes(category),
        "trials": None,
    }
    device = device_spec(slug)

    # tags: derive from raw_tag (split on "・" and filter)
    tags = []
    if raw_tag:
        for t in re.split(r"[・/]", raw_tag):
            t = t.strip()
            t = re.sub(r"（[^）]*）", "", t).strip()
            if t and 1 <= len(t) <= 20:
                tags.append(t)

    # completion_status:
    # - if no catalog entry AND no subdomain inferred reliably → needs_clinical_review
    # - else auto_filled
    if catalog_entry:
        completion = "auto_filled"
    else:
        completion = "needs_clinical_review"

    return {
        "id": slug,
        "name": name,
        "name_kana": None,
        "category": category,
        "phase": phase,
        "url": manifest_entry["file"],
        "icon": None,
        "domain": {
            "primary": primary,
            "secondary": secondary,
            "subdomains": subdomains,
        },
        "neuropsych_basis": neuropsych,
        "indications": indications,
        "contraindications": contraindications,
        "difficulty": difficulty,
        "duration": duration,
        "device": device,
        "related_games": [],  # filled in pass 2
        "tags": tags,
        "design_notes": notes or None,
        "metadata": {
            "version": 1,
            "created": "2026-04-25",
            "last_reviewed": None,
            "completion_status": completion,
        },
    }

def main():
    catalog = parse_catalog_md()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    # build pass 1
    games = []
    for m in manifest:
        slug = m["slug"]
        cat_entry = catalog.get(slug)
        g = build_game(slug, m, cat_entry, games)
        # gold-standard override for rehab-stroop
        if slug == "minatomo-rehab-stroop":
            g = REHAB_STROOP_GOLD
        games.append(g)

    # pass 2: related_games
    for g in games:
        if g["id"] == "minatomo-rehab-stroop":
            continue  # keep curated
        g["related_games"] = find_related(g["id"], g["domain"]["subdomains"], games)

    # backup existing
    if OUT_PATH.exists():
        bak = OUT_PATH.with_suffix(".json.bak")
        shutil.copy2(OUT_PATH, bak)
        print(f"backup: {bak}")

    out = {
        "schema_version": "1.0",
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
        "total_games": len(games),
        "domains": {
            "primary_categories": PRIMARY_DOMAINS,
            "subdomains": SUBDOMAINS,
        },
        "target_populations": TARGET_POPULATIONS,
        "games": games,
    }
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote: {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)")

    # summary
    from collections import Counter
    status_c = Counter(g["metadata"]["completion_status"] for g in games)
    domain_c = Counter(g["domain"]["primary"] for g in games)
    cat_c    = Counter(g["category"] for g in games)
    no_subs  = [g["id"] for g in games if not g["domain"]["subdomains"]]

    print("\n=== completion_status ===")
    for k, v in status_c.most_common():
        print(f"  {k}: {v}")
    print("\n=== category ===")
    for k, v in cat_c.most_common():
        print(f"  {k}: {v}")
    print("\n=== primary domain ===")
    for k, v in domain_c.most_common():
        print(f"  {k}: {v}")
    print(f"\ngames with no subdomains: {len(no_subs)}")
    for s in no_subs[:10]:
        print(f"  {s}")

if __name__ == "__main__":
    main()
