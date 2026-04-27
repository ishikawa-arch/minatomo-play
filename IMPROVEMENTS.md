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
