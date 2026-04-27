# 改善候補メモ

> プロダクト本流の作業の傍らで温める「将来やりたい」リスト。優先度や着手時期が決まったら CLAUDE.md 6章 に昇格させる。

---

## 改善候補: 禁忌パターンの版数管理

### 課題

`scripts/apply_contraindications.py` の `PATTERNS` に変更が入った時、廃止された文字列が `games-catalog.json` に残り続ける問題がある。`merge_dedup` ロジックが既存の `contraindications.{avoid,cautions}` を保持してから新パターンを追加するため、文言を変更しても旧文字列が消えない。

### 今回の対処（アドホック）

`scripts/cleanup_deprecated_contraindications.py` で個別削除（2026-04-26 の校正対応で導入）。`PATTERNS` の文言を変えるたびに、本スクリプトの `DEPRECATED` リストに旧文字列を追記して実行する運用。

### 将来の恒久対策

各ゲームの `contraindications` を構造的に分離する:

- `from_patterns`: パターン適用結果（`apply_contraindications.py` で毎回上書き再生成）
- `manual`: 手動追加（保持）

### イメージ

```json
"contraindications": {
  "from_patterns": {
    "avoid": [...],
    "cautions": [...]
  },
  "manual": {
    "avoid": [...],
    "cautions": [...]
  }
}
```

参照時は `from_patterns + manual` をマージして見せる。

### 移行時の注意

- 既存の手動追加（`rehab-stroop` の「色覚異常配慮」等）を `manual` に分離する作業が必要
- `apply_contraindications.py` の仕様変更も伴う（`existing_avoid/cautions` を読まずに `from_patterns` だけを再生成）
- `inject_meta.py` / `portal.py` がフラットな `avoid/cautions` を前提にしている場合は、参照箇所も合わせて改修が必要
- 移行データを失わないよう、段階的な移行スクリプトが必要（既存エントリのうちパターン由来か手動かを判別して振り分け）

---

## 改善候補: ゲームHTML内文言の整理（"トレーニング""リハビリ"等）

### 課題

`games-catalog.json` の `description_user`（2026-04-27 追加）は「気付かないうちに / トレーニング / リハビリ 等の言葉を避けたニュートラルトーン」で揃えた。一方、各ゲーム本体（`minatomo-*.html`）の中には依然として「〜のトレーニング」「リハビリ」等の文言が残っており、catalog との**トーン不一致**が発生している。

### 例（2026-04-27 サムネイル撮影時に発見）

- `minatomo-rehab-stroop`: "注意の切り替え・抑制のトレーニング"
- `minatomo-clock-quiz`: "見当識（時間の認識力）のトレーニングです"
- `minatomo-change-calc`: "計算力・お金の扱い方のトレーニングです"
- `minatomo-cooking-steps`: "手順記憶・遂行機能のトレーニングです"

### 影響

- catalog（ニュートラルトーン）と HTML（医療系トーン）でブランド・言葉遣いが不統一
- サムネイル一覧で HTML 内文言が露出する
- PRODUCT_DESIGN.md §2 人物像C（山田ヨネさん）の想定する「リハビリ感ゼロの入口設計」を妨げる
- catalog 単体を整えても利用者の体験は半端なまま

### 対応案

- 各 `minatomo-*.html` の説明テキストを、catalog の `description_user` と同じトーンで書き換え
- 自動置換は難しい（HTML が手書きで構造もまちまち）→ ゲーム1本ずつ確認しながら更新する半手動運用が現実的
- 着手時期: β版テスター展開前、サムネイル本撮影前のいずれかが望ましい

### 別日対応の理由

- 112本 × 文言確認で工数が大きい
- ゲーム本体の見た目を変える可能性があり、機能に影響しないか個別検証が必要
- 2026-04-27 Day 1 のスコープには含まれない、独立したクリーンアップ案件

---

## 改善候補: その他

2026-04-25 の Claude Code 報告で挙がった候補（CLAUDE.md 6章 と重複あり）:

1. `needs_clinical_review` 対象3本の臨床判断
   - `minatomo-date-quiz`
   - `minatomo-yesterday-quiz`
   - `minatomo-simple-memory-game`
2. `cautions` の充実（てんかん誘発、感情誘発、声帯疲労、易疲労性 等）
3. 「重度認知症が avoid 109/112本」問題 → 階層判定ロジック検討（重度／軽度の区別）
4. `simple` 系の寛容な禁忌運用（中等度認知症向けに調整）
5. `duration.estimated_minutes` の精緻化（カテゴリ一律値からの脱却）
6. `related_games` の臨床的セット提案（subdomain 共起 → 専門家推奨ペア）
7. `indications.use_cases` の充実（現在は `rehab-stroop` のみ）
8. `neuropsych_basis` の説明・参考文献補強（rehab 18本は test_name のみ）
9. `name_kana` 全件埋め（検索改善）

---

*Last updated: 2026-04-27*
