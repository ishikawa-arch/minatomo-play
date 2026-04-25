# みなともPlay

認知症・脳卒中後のリハビリ向け、自宅で続けるブラウザゲーム集。

🎮 **112ゲーム** / 🧠 **6認知領域** をカバー: 記憶 / 注意力 / 遂行 / 見当識 / 視空間 / 計算

## 公開サイト

GitHub Pages で公開: https://ishikawa-arch.github.io/minatomo-play/

## 構成

```
minatomo-play/
├── index.html              ポータル（検索・フィルタ付き、112本リスト）
├── index-old.html          旧ポータル（バックアップ）
├── minatomo-*.html         各ゲーム本体（112本）
├── minatomo-*.jsx          ゲームのReactソース（参考）
├── games-manifest.json     ゲーム一覧メタデータ
└── README.md
```

各ゲームHTMLは React + Babel CDN を読み込む単独動作型で、サーバー不要・GitHub Pages のみで完結します。

## 認知領域とゲーム数

| 領域 | アイコン | 本数 |
|---|---|---|
| 注意力 | 👁️ | 36 |
| 記憶   | 🧠 | 28 |
| 遂行   | 🔄 | 16 |
| 視空間 | 🧩 | 13 |
| 計算   | 🔢 | 11 |
| 見当識 | 📅 | 5 |
| 未分類 | 📦 | 3 |

## 新しいゲームの追加方法

1. `~/Work/minatomo-play-import/` に `minatomo-{game-id}.jsx` を追加
   - `import { useState, useEffect, useRef, useCallback } from "react";` 形式のimportのみ使用
   - `export default function GameName()` で関数をexport
   - 冒頭に `// ========== タイトル ==========` 形式のコメントでタイトル指定

2. ビルドスクリプトを実行（JSX→HTML変換）:
   ```
   python3 /tmp/minatomo_build.py
   ```

3. ポータル再生成:
   ```
   python3 /tmp/minatomo_portal.py
   ```

4. コミット & push:
   ```
   git add -A
   git commit -m "add: 新規ゲーム"
   git push
   ```

## 関連リポジトリ

- 旧JSONエンジン版（学習資料・参考用、現在は使用していません）:
  https://github.com/ishikawa-arch/minatomo-play-old-jsondriven

## ライセンス

社内利用・運営事業所向け。詳細は管理者まで。

---

© 株式会社Welloop / みなとも
