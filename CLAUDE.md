# みなともPlay — Claude Code 作業ガイド

## 1. プロジェクト概要

- **プロジェクト名**: みなともPlay
- **概要**: 112本のリハビリ・認知機能トレーニングゲーム集 + AI処方用 構造化カタログ
- **運営**: Welloop株式会社（理学療法士・石川順平）

### 公開URL

| 種別 | URL |
|---|---|
| ポータル | https://ishikawa-arch.github.io/minatomo-play/ |
| 処方カタログJSON | https://ishikawa-arch.github.io/minatomo-play/games-catalog.json |
| リポジトリ | https://github.com/ishikawa-arch/minatomo-play |
| 旧JSONエンジン版（学習資料） | https://github.com/ishikawa-arch/minatomo-play-old-jsondriven |

---

## 2. リポジトリ構成

```
minatomo-play/
├── index.html                          公開ポータル（自動生成・直接編集禁止）
├── index-old.html                      旧ポータルのバックアップ
├── games-catalog.json                  ★処方データのソース・オブ・トゥルース
├── games-catalog.json.bak              直前バージョンの自動バックアップ（.gitignore対象）
├── games-manifest.json                 ポータル用の軽量メタ（自動生成）
├── minatomo-play-games-catalog.md      開発履歴つきカタログMD（参照専用）
├── minatomo-*.html                     各ゲーム本体 ×112本
├── minatomo-*.jsx                      ゲームのReactソース ×73本（参考）
├── README.md                           リポジトリ概要
├── CLAUDE.md                           ★本ファイル（作業ガイド）
├── .gitignore
└── scripts/
    ├── build.py                        JSX → HTML 変換
    ├── portal.py                       index.html ポータル生成
    ├── inject_meta.py                  HTMLへの minatomo-* メタタグ注入
    ├── catalog_build.py                MD → games-catalog.json 初期化（通常運用では不要）
    └── apply_contraindications.py      11パターン臨床禁忌ルール適用
```

各ゲームHTMLは React + Babel CDN を読み込む単独動作型で、サーバー不要・GitHub Pagesのみで完結。

---

## 3. 主要ファイルの役割

| ファイル | 役割 |
|---|---|
| `games-catalog.json` | **処方データのソース・オブ・トゥルース**。スキーマ／6ドメイン／29サブドメイン／9対象者／baseline禁忌／全112ゲームの構造化メタを格納。 |
| `index.html` | 公開ポータル（自動生成）。検索・6領域フィルタ・subdomain/対象者の詳細フィルタ・処方モードボタン(BETA)。直接編集禁止、`scripts/portal.py` で再生成。 |
| `scripts/build.py` | JSX → HTML 変換（importストリップ・React.prefix付与・テンプレートラップ）。 |
| `scripts/portal.py` | `games-catalog.json` を読み、index.html を再生成。 |
| `scripts/inject_meta.py` | カタログJSONを各HTML `<head>` に minatomo-* メタタグとして注入（idempotent）。 |
| `scripts/catalog_build.py` | カタログMDから games-catalog.json を初期化。**通常運用では走らせない**（catalog.json直接編集を上書きしてしまうため）。 |
| `scripts/apply_contraindications.py` | 11パターンの臨床禁忌ルールを catalog.json に適用。 |

---

## 4. 運用フロー

### 新規ゲーム追加（JSXから）

```bash
# 1. JSXを置く
#    命名: minatomo-{game-id}.jsx
#    冒頭コメント: // ========== タイトル ==========
#    import { useState, ... } from "react"; のみ
#    export default function GameName() { ... }
cp 新ゲーム.jsx ~/Work/minatomo-play-import/minatomo-foo.jsx

# 2. HTML化
python3 scripts/build.py

# 3. カタログ手動追記（games-catalog.json の "games" 配列に新エントリを追加）
#    最低限: id / name / category / phase / url / domain / indications / metadata

# 4. メタタグ反映 + ポータル再生成
python3 scripts/inject_meta.py
python3 scripts/portal.py

# 5. push
git add -A
git commit -m "add: 新規ゲーム"
git push
```

### カタログ編集（処方情報の修正）

```bash
# 1. games-catalog.json を直接編集
vim games-catalog.json

# 2. メタタグ反映
python3 scripts/inject_meta.py

# 3. ポータル再生成
python3 scripts/portal.py

# 4. push
git add -A
git commit -m "review: <内容>"
git push
```

### 11パターン禁忌ルールの再適用（パターン定義を変えた時）

```bash
python3 scripts/apply_contraindications.py
python3 scripts/inject_meta.py
python3 scripts/portal.py
git add -A && git commit -m "feat: 禁忌ルール更新" && git push
```

### Mac / Windows の切り替え

| タイミング | コマンド |
|---|---|
| 作業終了時 | `git push` |
| 作業開始時 | `git pull` |
| 切り替え忘れ時 | `git pull` → コンフリクトあれば Claude Code に解消依頼 |

---

## 5. 設計思想（重要）

### 6 認知ドメイン

| id | 日本語 | アイコン |
|---|---|---|
| attention | 注意力 | 👁️ |
| memory | 記憶 | 🧠 |
| executive | 遂行 | 🔄 |
| visuospatial | 視空間 | 🧩 |
| calculation | 計算 | 🔢 |
| orientation | 見当識 | 📅 |

### 29 サブドメイン

注意系（4）: `selective_attention` / `sustained_attention` / `divided_attention` / `spatial_attention`
遂行系（5）: `inhibition` / `set_shifting` / `planning` / `social_cognition` / `motor_control` / `rhythm_timing`
記憶系（10）: `working_memory_verbal/visual/spatial/update` / `episodic_memory` / `semantic_memory` / `visual_memory` / `spatial_memory` / `prospective_memory` / `auditory_memory` / `language_fluency` / `language_processing`
視空間（4）: `mental_rotation` / `visual_perception` / `left_right_discrimination` / `topographical`
見当識（1）: `time_orientation`
注意付随（2）: `processing_speed` / `reaction_time`

### 9 対象者区分

`healthy_elderly` / `mci` / `mild_dementia` / `moderate_dementia` / `stroke_subacute` / `stroke_chronic` / `tbi` / `parkinson` / `preventive`

### 11 パターンの禁忌ルール（baseline + P1〜P10）

| ID | 名前 | 例 |
|---|---|---|
| **baseline** | 全112本に無条件適用 | 意識障害／バイタル不安定／医師中止指示／取組不能／本人拒否 |
| P1 | 高速反応・タイミング | rhythm-tap / whack-mole / dual-task / step-rhythm 等 18本 |
| P2 | 言語処理 | word-builder / story-memory / listening-quiz 等 15本 |
| P3 | 複雑指示・多段階 | rehab-tmtb / serialadd(PASAT) / prospective-memory 等 11本 |
| P4 | 視覚刺激 | stroop / spot-diff / cancellation / color系 等 28本 |
| P5 | 聴覚・音楽 | rhythm-memory / listening-quiz / voice-challenge 等 5本 |
| P6 | 身体・運動操作 | trace / pair-search / block-stack 等 6本 |
| P7 | 感情・社会 | rehab-emotion / face-name 2本 |
| P8 | 記憶 | memory-game / corsi / digit / recall 系 等 38本 |
| P9 | 計算 | change-calc / serial-calc / wallet-calc 等 16本 |
| P10 | 音声入力必須 | voice-challenge 1本 |

サブフラグ: `P1_flashing`（点滅刺激→てんかん既往）／`P2_audio`（聴覚必須）／`P4_color`（色覚要求）／`P4_scan`（スキャン課題）／`P5_balance`（バランス要求）／`P5_voice_oral`（発声）

各ゲームは複数パターンに該当しうる。`avoid` / `cautions` は重複排除して統合される。

### completion_status 3段階

| 値 | 意味 |
|---|---|
| `complete` | 全項目埋まっている（**rehab-stroop がゴールドサンプル**） |
| `auto_filled` | 機械的に推測で埋めた（要臨床レビュー） |
| `needs_clinical_review` | 人間の臨床判断が必須 |

---

## 6. 次の改善候補（優先度順）

### A: 安全性に関わる（早期対応推奨）

1. `needs_clinical_review` 対象3本の臨床判断
   - `minatomo-date-quiz`
   - `minatomo-yesterday-quiz`
   - `minatomo-simple-memory-game`
2. `cautions` の充実（てんかん誘発・感情誘発・声帯疲労・易疲労性 等）
3. 「重度認知症が avoid 109/112本」問題 → 階層判定ロジック検討（重度／軽度の区別）
4. simple系の寛容な禁忌運用（中等度認知症向けに調整）

### B: 処方精度に関わる

5. `duration.estimated_minutes` の精緻化（カテゴリ一律値からの脱却）
6. `related_games` の臨床的セット提案（subdomain共起 → 専門家推奨ペア）
7. `indications.use_cases` の充実（現在は rehab-stroop のみ）
8. rehab-stroop cautions の文言重複統一（"色覚異常" と "色覚異常の方は不向き" の二重化）

### C: 体裁・補強

9. `neuropsych_basis.description` / `measures` / `reference` の補強（rehab 18本は test_name のみ）
10. `name_kana` 全件埋め（検索改善）

---

## 7. 将来構想

- **AI処方**: 認知機能評価結果からの自動ゲームリスト生成（処方モードボタン BETA placeholder で枠だけ用意済み）
- **専門家処方**: PT/OT/ST/CP が指定する認知ドメインに基づくゲームリスト生成
- **利用ログ連携**: Welloop kintone 等との接続、ゲーム結果の蓄積・推移可視化
- **多チャネル展開**: LINE Bot や独自アプリへのカタログJSON活用（games-catalog.json はそのまま外部消費可能）

---

## 8. 重要な注意事項

- **`games-catalog.json` は構造化された処方データ**。編集時はJSON構文に注意（カンマ忘れ・引用符忘れ）。バックアップは `apply_contraindications.py` 等が `.bak` として自動保存。
- **HTMLファイルのゲーム本体（`<script>` 内）は変更禁止**。メタタグのみ可。`scripts/inject_meta.py` は `<head>` の minatomo-* メタタグだけを idempotent に置換する設計。
- **カタログMD（`minatomo-play-games-catalog.md`）は参照用**。`scripts/catalog_build.py` の初期化時のみ使用。**通常運用で走らせると `games-catalog.json` を上書きしてしまう**ので注意。
- **個人情報チェック済み**: 実名・実住所・郵便番号は含まれない、架空サンプル（田中さん／鈴木さん 等の頻出姓）のみ。`face-name` `phone-memory` `message-recall` `shopping-list` 等のサンプルデータは公開可。
- **CDN依存**: 全ゲームHTMLは React + Babel CDN 経由で動作。**オフライン環境では動かない**（GitHub Pages 経由前提）。
- **メール露出防止**: コミットには noreply email 必須（`270029497+ishikawa-arch@users.noreply.github.com`）。

---

*Last updated: 2026-04-25 / Claude Code セッションで作成*
