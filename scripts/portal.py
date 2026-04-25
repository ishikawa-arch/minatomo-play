#!/usr/bin/env python3
"""Generate new index.html portal from all minatomo-*.html files."""
import re
import json
from pathlib import Path
from datetime import datetime

IMPORT_DIR = Path.home() / "Work" / "minatomo-play-import"

# Same domain rules as build script (for legacy HTMLs without meta tags)
DOMAIN_RULES = [
    ("orientation",  ["clock", "date", "yesterday", "schedule"]),
    ("calculation",  ["addition", "serialadd", "serial-add", "serial-calc", "stack-calc", "wallet", "samecount", "same-count", "howmany", "numseries", "num-series", "counttap", "count-tap", "change-calc", "number-compare"]),
    ("executive",    ["stroop", "gonogo", "go-nogo", "flanker", "sort", "category", "error", "step-rhythm", "step-order", "dual", "tmtb", "cooking", "compare-ranking"]),
    ("memory",       ["memory", "corsi", "digit", "digitback", "recall", "remember", "prospective", "story", "where", "whatadded", "what-added", "wherewasite", "where-was", "pair", "simon", "delayed", "wordpic", "word-pic", "appearorder", "appear-order", "phone-memory", "face-name", "shopping", "message", "map-memory", "flash-memory"]),
    ("visuospatial", ["rotation", "path", "trace", "shape", "leftright", "left-right", "bigger", "updown", "up-down", "mostcommon", "most-common", "realone", "real-one", "puzzle", "block-stack", "blockstack", "fragment"]),
    ("attention",    ["tap", "mole", "balloon", "cancellation", "search", "spotdiff", "spot-diff", "change-detection", "reaction", "chase", "counting", "falling", "disappear", "greentap", "green-tap", "justone", "just-one", "color", "odd", "shell", "pairs", "voice", "rhythm", "big-tap", "bigtap", "emotion", "letter-search", "whack", "listening", "nback", "n-back", "hint", "word-builder", "word-connect", "fragment-id"]),
]

def classify_domain(slug):
    s = slug.lower()
    for domain, keywords in DOMAIN_RULES:
        for kw in keywords:
            if kw in s:
                return domain
    return "uncategorized"

TITLE_RE  = re.compile(r'<title>(.+?)</title>', re.DOTALL)
META_RE   = re.compile(r'<meta\s+name="([^"]+)"\s+content="([^"]*)"')

def parse_html_meta(path):
    txt = path.read_text(encoding='utf-8', errors='ignore')
    m = TITLE_RE.search(txt)
    title_full = m.group(1).strip() if m else path.stem
    # strip " | みなともPlay"
    title = re.sub(r'\s*\|\s*みなともPlay\s*$', '', title_full).strip()
    metas = dict(META_RE.findall(txt))
    return {
        'title': title,
        'description': metas.get('description', ''),
        'domain': metas.get('minatomo-domain', ''),
        'category': metas.get('minatomo-category', ''),
        'source': metas.get('minatomo-source', ''),
        'is_new': metas.get('minatomo-source', '').startswith('jsx-build-'),
    }

DOMAIN_INFO = {
    'memory':       {'name': '記憶',     'icon': '🧠', 'color': '#FF6B35', 'bg': '#FFF3E0', 'desc': '覚えて思い出す力'},
    'attention':    {'name': '注意力',   'icon': '👁️', 'color': '#1E88E5', 'bg': '#E3F2FD', 'desc': '見つける・集中する力'},
    'executive':    {'name': '遂行',     'icon': '🔄', 'color': '#7B1FA2', 'bg': '#F3E5F5', 'desc': '判断・切り替え・計画'},
    'orientation':  {'name': '見当識',   'icon': '📅', 'color': '#43A047', 'bg': '#E8F5E9', 'desc': '日時・場所の把握'},
    'visuospatial': {'name': '視空間',   'icon': '🧩', 'color': '#00ACC1', 'bg': '#E0F7FA', 'desc': '空間を理解する力'},
    'calculation':  {'name': '計算',     'icon': '🔢', 'color': '#E53935', 'bg': '#FFEBEE', 'desc': '数を扱う力'},
    'uncategorized':{'name': '未分類',   'icon': '📦', 'color': '#757575', 'bg': '#F5F5F5', 'desc': 'カテゴリ調整中'},
}

def main():
    games = []
    for h in sorted(IMPORT_DIR.glob('minatomo-*.html')):
        if h.name == 'index.html' or h.name == 'index-old.html':
            continue
        if h.stat().st_size < 1000:
            continue  # skip the 230B broken stubs (memory-game already overwritten)
        meta = parse_html_meta(h)
        if not meta['domain']:
            meta['domain'] = classify_domain(h.stem)
        games.append({
            'slug': h.stem,
            'file': h.name,
            'title': meta['title'],
            'description': meta['description'],
            'domain': meta['domain'],
            'category': meta['category'],
            'is_new': meta['is_new'],
        })

    # Sort: by domain order, then title
    domain_order = ['memory', 'attention', 'executive', 'orientation', 'visuospatial', 'calculation', 'uncategorized']
    games.sort(key=lambda g: (domain_order.index(g['domain']) if g['domain'] in domain_order else 99, g['title']))

    games_json = json.dumps(games, ensure_ascii=False)
    domains_json = json.dumps(DOMAIN_INFO, ensure_ascii=False)
    domain_order_json = json.dumps(domain_order, ensure_ascii=False)
    total = len(games)
    new_count = sum(1 for g in games if g['is_new'])
    ts = datetime.now().strftime('%Y-%m-%d %H:%M')

    html = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>みなともPlay - 無料リハビリゲーム {total}本</title>
<meta name="description" content="認知症・脳卒中後のリハビリに{total}種類の無料ゲーム。記憶・注意・遂行・見当識・視空間・計算の6領域を自宅で。">
<style>
:root {{
  --bg: #FAFAF7;
  --surface: #ffffff;
  --text: #1a1a1a;
  --muted: #6B6B6B;
  --border: #E0E0E0;
  --accent: #FF6B35;
  --shadow: 0 2px 12px rgba(0,0,0,0.06);
  --radius: 14px;
}}
* {{ margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }}
html {{ font-size:16px; -webkit-text-size-adjust:100%; }}
body {{
  font-family: 'Hiragino Maru Gothic ProN', 'Hiragino Sans', 'Yu Gothic', sans-serif;
  background: var(--bg); color: var(--text); line-height: 1.6;
  padding-bottom: 60px;
}}
a {{ color: inherit; text-decoration: none; }}
button {{ font-family: inherit; cursor: pointer; }}

/* Header */
.hero {{
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white; padding: 36px 20px 28px; text-align: center;
}}
.hero h1 {{ font-size: 28px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px; }}
.hero .tag {{ display:inline-block; font-size: 10px; letter-spacing: 2px; color: #6ECEB2; margin-bottom: 12px; font-weight: 700; }}
.hero p {{ font-size: 13px; color: rgba(255,255,255,0.75); max-width: 480px; margin: 0 auto; }}
.hero .stats {{ margin-top: 18px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }}
.hero .stat {{ background: rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); padding: 8px 14px; border-radius: 20px; font-size: 12px; }}
.hero .stat strong {{ font-size: 16px; font-weight:800; color: #FFB199; margin-right: 4px; }}

/* Toolbar */
.toolbar {{
  position: sticky; top: 0; z-index: 50;
  background: rgba(250,250,247,0.95); backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  padding: 14px 16px;
}}
.search {{
  width: 100%; max-width: 720px; margin: 0 auto 12px;
  display: flex; gap: 8px;
}}
.search input {{
  flex: 1; padding: 12px 16px;
  border: 1.5px solid var(--border); border-radius: 24px;
  font-size: 15px; outline: none;
  background: white;
  transition: border-color 0.15s;
}}
.search input:focus {{ border-color: var(--accent); }}
.filters {{
  display: flex; gap: 8px; flex-wrap: wrap;
  max-width: 720px; margin: 0 auto;
  justify-content: center;
}}
.filter-btn {{
  padding: 6px 12px; border-radius: 16px;
  border: 1.5px solid var(--border); background: white;
  font-size: 12px; font-weight: 600; color: var(--muted);
  display: flex; align-items: center; gap: 4px;
  transition: all 0.15s;
}}
.filter-btn:hover {{ border-color: var(--accent); }}
.filter-btn.active {{
  background: var(--text); color: white; border-color: var(--text);
}}
.filter-btn .count {{
  font-size: 10px; opacity: 0.7;
  background: rgba(0,0,0,0.08); padding: 1px 6px; border-radius: 10px;
}}
.filter-btn.active .count {{ background: rgba(255,255,255,0.2); }}

/* Domain section */
.container {{ max-width: 1100px; margin: 0 auto; padding: 0 16px; }}
.domain-section {{ margin: 28px 0 12px; }}
.domain-header {{
  display: flex; align-items: center; gap: 12px;
  padding: 8px 0; cursor: pointer;
  border-bottom: 2px solid currentColor;
  margin-bottom: 14px;
}}
.domain-header .icon {{ font-size: 28px; line-height: 1; }}
.domain-header .name {{ font-size: 20px; font-weight: 800; }}
.domain-header .desc {{ font-size: 12px; color: var(--muted); margin-left: 8px; }}
.domain-header .count {{ margin-left: auto; font-size: 14px; font-weight: 700; color: var(--muted); }}
.domain-header .toggle {{ font-size: 18px; color: var(--muted); transition: transform 0.2s; }}
.domain-section.collapsed .toggle {{ transform: rotate(-90deg); }}
.domain-section.collapsed .grid {{ display: none; }}

.grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}}
.card {{
  display: block;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 12px;
  position: relative;
  transition: transform 0.12s, box-shadow 0.12s, border-color 0.12s;
  min-height: 90px;
}}
.card:hover {{
  transform: translateY(-2px); box-shadow: var(--shadow);
  border-color: var(--accent);
}}
.card .title {{ font-size: 14px; font-weight: 700; line-height: 1.35; margin-bottom: 6px; }}
.card .meta {{ font-size: 11px; color: var(--muted); }}
.card .badge-new {{
  position: absolute; top: 8px; right: 8px;
  background: #FF6B35; color: white;
  font-size: 9px; font-weight: 800; letter-spacing: 0.5px;
  padding: 2px 6px; border-radius: 8px;
}}
.empty {{
  text-align: center; padding: 60px 20px; color: var(--muted);
}}

footer {{
  margin-top: 40px; padding: 20px;
  text-align: center; color: var(--muted); font-size: 11px;
}}
footer a {{ color: var(--accent); }}

@media (max-width: 480px) {{
  .hero h1 {{ font-size: 22px; }}
  .grid {{ grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }}
  .domain-header .name {{ font-size: 17px; }}
  .domain-header .desc {{ display: none; }}
}}
</style>
</head>
<body>

<header class="hero">
  <div class="tag">MINATOMO PLAY</div>
  <h1>みなともPlay</h1>
  <p>認知症・脳卒中後のリハビリに、自宅で続ける無料ゲーム集</p>
  <div class="stats">
    <span class="stat"><strong>{total}</strong>ゲーム</span>
    <span class="stat"><strong>6</strong>領域</span>
    <span class="stat"><strong>{new_count}</strong>新着</span>
  </div>
</header>

<div class="toolbar">
  <div class="search">
    <input id="search" type="search" placeholder="ゲーム名で検索（例：ストループ、記憶、計算）" autocomplete="off">
  </div>
  <div class="filters" id="filters"></div>
</div>

<main class="container" id="main">
  <div class="empty" id="empty" style="display:none;">該当するゲームがありません</div>
</main>

<footer>
  <p>みなともPlay © {datetime.now().year} 株式会社Welloop / みなとも</p>
  <p style="margin-top:6px; opacity:0.7;">最終ビルド: {ts}</p>
</footer>

<script>
const GAMES = {games_json};
const DOMAIN_INFO = {domains_json};
const DOMAIN_ORDER = {domain_order_json};

const main = document.getElementById('main');
const empty = document.getElementById('empty');
const searchInput = document.getElementById('search');
const filtersEl = document.getElementById('filters');

let activeFilter = 'all';
let searchQuery = '';

function buildFilters() {{
  const counts = {{ all: GAMES.length, new: GAMES.filter(g => g.is_new).length }};
  for (const dom of DOMAIN_ORDER) {{
    counts[dom] = GAMES.filter(g => g.domain === dom).length;
  }}

  const items = [
    {{ key: 'all',   label: 'すべて',   icon: '🎮' }},
    {{ key: 'new',   label: '新着',     icon: '✨' }},
    ...DOMAIN_ORDER.map(d => ({{
      key: d,
      label: DOMAIN_INFO[d].name,
      icon: DOMAIN_INFO[d].icon,
    }})),
  ];

  filtersEl.innerHTML = items.filter(it => (counts[it.key] || 0) > 0).map(it => `
    <button class="filter-btn ${{activeFilter === it.key ? 'active' : ''}}" data-key="${{it.key}}">
      <span>${{it.icon}}</span>
      <span>${{it.label}}</span>
      <span class="count">${{counts[it.key] || 0}}</span>
    </button>
  `).join('');

  filtersEl.querySelectorAll('.filter-btn').forEach(btn => {{
    btn.addEventListener('click', () => {{
      activeFilter = btn.dataset.key;
      buildFilters();
      render();
    }});
  }});
}}

function matchesSearch(g, q) {{
  if (!q) return true;
  const haystack = (g.title + ' ' + g.description + ' ' + g.slug + ' ' + (DOMAIN_INFO[g.domain]?.name || '')).toLowerCase();
  return q.toLowerCase().split(/\\s+/).every(t => haystack.includes(t));
}}

function matchesFilter(g) {{
  if (activeFilter === 'all') return true;
  if (activeFilter === 'new') return g.is_new;
  return g.domain === activeFilter;
}}

function render() {{
  const filtered = GAMES.filter(g => matchesFilter(g) && matchesSearch(g, searchQuery));
  if (filtered.length === 0) {{
    main.innerHTML = '';
    main.appendChild(empty);
    empty.style.display = 'block';
    return;
  }}
  empty.style.display = 'none';

  const byDomain = {{}};
  for (const g of filtered) {{
    (byDomain[g.domain] = byDomain[g.domain] || []).push(g);
  }}

  let html = '';
  for (const dom of DOMAIN_ORDER) {{
    const list = byDomain[dom];
    if (!list || list.length === 0) continue;
    const info = DOMAIN_INFO[dom];
    html += `
      <section class="domain-section" data-domain="${{dom}}" style="color:${{info.color}};">
        <div class="domain-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="icon">${{info.icon}}</span>
          <span class="name" style="color:${{info.color}};">${{info.name}}</span>
          <span class="desc">${{info.desc}}</span>
          <span class="count">${{list.length}}本</span>
          <span class="toggle">▼</span>
        </div>
        <div class="grid">
          ${{list.map(g => `
            <a class="card" href="${{g.file}}" data-domain="${{g.domain}}">
              ${{g.is_new ? '<span class="badge-new">NEW</span>' : ''}}
              <div class="title" style="color:${{info.color}};">${{escapeHtml(g.title)}}</div>
              <div class="meta">${{escapeHtml(g.category || info.name)}}</div>
            </a>
          `).join('')}}
        </div>
      </section>
    `;
  }}
  main.innerHTML = html;
}}

function escapeHtml(s) {{
  return String(s).replace(/[&<>"']/g, c => ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}}[c]));
}}

searchInput.addEventListener('input', e => {{
  searchQuery = e.target.value.trim();
  render();
}});

buildFilters();
render();
</script>
</body>
</html>
'''
    out = IMPORT_DIR / 'index.html'
    out.write_text(html, encoding='utf-8')

    print(f"Portal generated: {out}")
    print(f"Total games: {total} (new: {new_count})")
    from collections import Counter
    by_dom = Counter(g['domain'] for g in games)
    for d in domain_order:
        print(f"  {d}: {by_dom.get(d, 0)}")

    # Save manifest for reference
    manifest = IMPORT_DIR / 'games-manifest.json'
    manifest.write_text(json.dumps(games, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Manifest: {manifest}")

if __name__ == '__main__':
    main()
