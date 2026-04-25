#!/usr/bin/env python3
"""JSX → HTML one-shot builder for minatomo-play."""
import re
import sys
import json
from pathlib import Path

IMPORT_DIR = Path.home() / "Work" / "minatomo-play-import"
OVERWRITE_ALLOWED = {"minatomo-memory-game.html"}  # broken stub exception

# Domain classification (priority order — first match wins)
DOMAIN_RULES = [
    ("orientation",  ["clock", "date", "yesterday", "schedule"]),
    ("calculation",  ["addition", "serialadd", "serial-add", "stack-calc", "wallet", "samecount", "same-count", "howmany", "numseries", "num-series", "counttap", "count-tap"]),
    ("executive",    ["stroop", "gonogo", "go-nogo", "flanker", "sort", "category", "error", "step-rhythm", "step-order", "dual", "tmtb", "cooking"]),
    ("memory",       ["memory", "corsi", "digit", "digitback", "recall", "remember", "prospective", "story", "where", "whatadded", "what-added", "wherewasite", "where-was", "pair", "simon", "delayed", "wordpic", "word-pic", "appearorder", "appear-order", "phone-memory", "face-name", "shopping", "message", "map-memory"]),
    ("visuospatial", ["rotation", "path", "trace", "shape", "leftright", "left-right", "bigger", "updown", "up-down", "mostcommon", "most-common", "realone", "real-one", "puzzle", "block-stack", "blockstack", "fragment"]),
    ("attention",    ["tap", "mole", "balloon", "cancellation", "search", "spotdiff", "spot-diff", "change", "reaction", "chase", "count", "falling", "disappear", "greentap", "green-tap", "justone", "just-one", "color", "odd", "shell", "pairs", "voice", "rhythm", "big-tap", "bigtap", "emotion", "compare", "number-compare", "letter-search", "whack", "listening", "nback", "n-back", "hint", "word-builder", "word-connect", "left-right", "fragment-id"]),
]

def classify_domain(slug):
    s = slug.lower()
    for domain, keywords in DOMAIN_RULES:
        for kw in keywords:
            if kw in s:
                return domain
    return "uncategorized"

# Title extraction
TITLE_RE   = re.compile(r'^//\s*=+\s*(.+?)\s*=+\s*$')
BRACKET_RE = re.compile(r'^【(.+?)】\s*(.+)$')
DASH_RE    = re.compile(r'^(.+?)\s*[-–—ー]\s*(.+)$')

def extract_title(jsx_content, fallback_slug):
    for line in jsx_content.split('\n')[:10]:
        m = TITLE_RE.match(line.strip())
        if m:
            raw = m.group(1).strip()
            category = ""
            description = ""
            bm = BRACKET_RE.match(raw)
            if bm:
                category = bm.group(1).strip()
                raw = bm.group(2).strip()
            # try " - " separator (only if it's a real dash with spaces around)
            if ' - ' in raw or ' – ' in raw or ' — ' in raw:
                parts = re.split(r'\s+[-–—]\s+', raw, maxsplit=1)
                if len(parts) == 2:
                    raw = parts[0].strip()
                    description = parts[1].strip()
            return raw, category, description
    # fallback: titlecase the slug
    return fallback_slug.replace('-', ' ').title(), "", ""

HOOK_RE = re.compile(r'(?<![.\w])(useState|useEffect|useRef|useCallback)(\s*\()')

def transform_jsx(jsx):
    """Strip imports, prefix hooks with React., rename export default."""
    lines = []
    func_name = None
    for line in jsx.split('\n'):
        s = line.strip()
        if s.startswith('import ') and 'from "react"' in s:
            continue  # drop react import
        m = re.match(r'^export default function (\w+)\s*(\(\s*\))', line)
        if m:
            func_name = m.group(1)
            line = re.sub(r'export default function \w+\s*\(\s*\)', 'function App()', line)
        # handle "export default function FuncName(){" no-space variant
        m2 = re.match(r'^export default function (\w+)\(\)', line)
        if m2 and func_name is None:
            func_name = m2.group(1)
            line = re.sub(r'export default function \w+\(\)', 'function App()', line)
        lines.append(line)
    code = '\n'.join(lines)
    # prefix hooks with React.
    code = HOOK_RE.sub(r'React.\1\2', code)
    return code, func_name

HTML_TEMPLATE = '''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scale=no">
<title>{title} | みなともPlay</title>
<meta name="description" content="{desc} - 無料リハビリゲーム みなともPlay">
<meta name="minatomo-domain" content="{domain}">
<meta name="minatomo-category" content="{category}">
<meta name="minatomo-source" content="jsx-build-{ts}">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: sans-serif; background: #FAFAF7; }}
  #root {{ min-height: 100vh; }}
  .loading {{ display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; color: #6B6B6B; }}
</style>
</head>
<body>
<div id="root"><div class="loading">読み込み中...</div></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"></script>

<script type="text/babel" data-type="module">
{code}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
</script>
</body>
</html>
'''

def build_one(jsx_path, ts):
    slug = jsx_path.stem  # minatomo-foo
    out_path = jsx_path.with_suffix('.html')
    if out_path.exists() and out_path.name not in OVERWRITE_ALLOWED:
        return ('skip-existing', out_path, None)

    jsx = jsx_path.read_text(encoding='utf-8')
    title, category, description = extract_title(jsx, slug)
    domain = classify_domain(slug)
    code, func_name = transform_jsx(jsx)
    if func_name is None:
        return ('error-no-export', out_path, 'export default function ... not found')

    # Static checks on transformed code
    if 'import ' in code and 'from "react"' in code:
        return ('error-import-remains', out_path, 'react import not stripped')

    desc_text = description if description else title
    html = HTML_TEMPLATE.format(
        title=title, desc=desc_text, domain=domain,
        category=category, code=code, ts=ts
    )
    out_path.write_text(html, encoding='utf-8')

    # Post-write static validation
    issues = []
    if '<title>' not in html or '| みなともPlay</title>' not in html:
        issues.append('title-missing')
    if '<script type="text/babel"' not in html:
        issues.append('babel-script-missing')
    if 'react.production.min.js' not in html:
        issues.append('react-cdn-missing')
    if 'react-dom.production.min.js' not in html:
        issues.append('reactdom-cdn-missing')
    if 'babel-standalone' not in html:
        issues.append('babel-cdn-missing')

    return ('ok' if not issues else 'warn', out_path, {'title': title, 'category': category, 'domain': domain, 'func': func_name, 'issues': issues})

def main():
    from datetime import datetime
    ts = datetime.now().strftime('%Y%m%dT%H%M%S')

    jsx_files = sorted(IMPORT_DIR.glob('minatomo-*.jsx'))
    results = {'ok': [], 'warn': [], 'skip-existing': [], 'error-no-export': [], 'error-import-remains': []}
    details = []

    for j in jsx_files:
        status, out_path, info = build_one(j, ts)
        results[status].append(j.name)
        if status not in ('skip-existing',):
            details.append({
                'jsx': j.name,
                'html': out_path.name,
                'status': status,
                'info': info,
            })

    # Summary
    print(f"=== Build summary (ts={ts}) ===")
    for k, v in results.items():
        print(f"  {k}: {len(v)}")
    print()

    # Domain distribution
    from collections import Counter
    domain_counter = Counter()
    uncategorized = []
    for d in details:
        if isinstance(d['info'], dict):
            domain_counter[d['info']['domain']] += 1
            if d['info']['domain'] == 'uncategorized':
                uncategorized.append(d['html'])
    print("=== Domain distribution (newly built) ===")
    for dom, n in domain_counter.most_common():
        print(f"  {dom}: {n}")
    print()
    if uncategorized:
        print(f"=== Uncategorized ({len(uncategorized)}) ===")
        for u in uncategorized:
            print(f"  {u}")
        print()

    # Save report json
    report = {
        'ts': ts,
        'totals': {k: len(v) for k, v in results.items()},
        'domain_distribution': dict(domain_counter),
        'uncategorized': uncategorized,
        'details': details,
    }
    rp = IMPORT_DIR.parent / 'minatomo_build_report.json'
    rp.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Report saved: {rp}")

if __name__ == '__main__':
    main()
