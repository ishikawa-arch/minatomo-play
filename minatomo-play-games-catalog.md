# みなともPlay 全ゲーム総覧

セッション1（2026-03-28）から最新（2026-04-25）まで、全12セッションを遡って整理した、開発済み全ゲームのカタログです。

**全体像：**
- 通常版（リハビリ向け）：約52本
- シンプル版（認知機能低下中等度向け）：約40本
- リハビリ脳トレ版（高次脳機能障害向け）：18本

---

## 🎯 通常版（Phase 1：2026-03-28〜2026-04-14）

最初に立ち上がったシリーズ。デイリハ・訪問看護リハ向けで、リハビリの専門性を維持しつつ「医療っぽくない・ぬくもりのあるデザイン」を目指した。

### Phase 1-A：記憶・基礎系（セッション1〜2／2026-03-28〜29）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 1 | `minatomo-memory-game.jsx` | 神経衰弱 | 視覚記憶・対連合学習 | プラットフォーム第1弾。難易度3段階（emoji/形/SVG風景・顔）。最も親しみやすい題材から開始 |
| 2 | `minatomo-corsi-block.jsx` | 順番記憶（Corsi） | 視覚的空間的短期記憶 | Corsi Block Tapping。神経心理の古典指標を、現場で気軽に使える形に |
| 3 | `minatomo-digit-span.jsx` | すうじ記憶 | 言語的短期記憶（Forward/Backward） | Digit Span。古典指標の双方向版 |
| 4 | `minatomo-rhythm-memory.jsx` | リズム記憶 | 聴覚的短期記憶 | Web Audio APIでリズムパターン再生。視覚優位だけでなく聴覚記憶も鍛えたい |
| 5 | `minatomo-story-memory.jsx` | おはなし記憶 | エピソード記憶・物語理解 | WMS-Rの論理的記憶を意識。物語を読んで質問に答える形式 |
| 6 | `minatomo-prospective-memory.jsx` | やくそく覚え | 展望記憶（時間ベース） | 1日のスケジュール上でタスクを実行。展望記憶の機能を遊びに落とした |
| 7 | `minatomo-nback.jsx` | Nバック | ワーキングメモリ更新 | 古典的WM訓練課題。1-back→2-back |
| 8 | `minatomo-change-detection.jsx` | 変化さがし | 視覚的WM・変化検出 | Luck & Vogel系。一瞬で配置を覚え、何が変わったか答える |
| 9 | `minatomo-word-fluency.jsx` | ことば流暢性 | 言語流暢性（カテゴリ・文字） | カテゴリ流暢性課題。後に判定の難しさから word-connect に置換 |
| 10 | `minatomo-word-connect.jsx` | ことばつなぎ | 意味連合・選択肢方式 | 自由入力の判定問題を回避し、選択肢方式に再設計 |

### Phase 1-B：日常生活系（セッション3／2026-03-29-23-45）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 11 | `minatomo-step-order.jsx` | 手順ならべ | 遂行機能・順序計画 | ドラッグ＆ドロップで日常動作の順序を並べる。実生活直結 |
| 12 | `minatomo-clock-quiz.jsx` | 時計よみ | 時計読み・空間認知 | アナログ時計の針を読む。生活スキル直結 |
| 13 | `minatomo-flash-memory.jsx` | フラッシュ記憶 | 瞬間記憶・視覚的注意 | グリッド上に一瞬表示→位置/種類を答える |
| 14 | `minatomo-map-memory.jsx` | おつかいナビ | 地誌的記憶・経路 | 街マップを覚えてから方向を答える。Money's Road Map系 |
| 15 | `minatomo-fragment-id.jsx` | これなーんだ？ | 視覚認識・プライミング | SVG画像が徐々に表れて何かを当てる |
| 16 | `minatomo-face-name.jsx` | 顔と名前 | 顔-名前連合記憶 | アルツハイマー型認知症で最も障害されやすい機能の訓練 |
| 17 | `minatomo-change-calc.jsx` | おつり計算（お財布） | 計算・金銭処理 | お財布から硬貨をタップして釣りを作る。実生活直結 |

### Phase 1-C：注意・思考系（セッション4／2026-03-30）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 18 | `minatomo-date-quiz.jsx` | きょうは何日？ | 時間見当識 | リアル日付ベースで動的に問題生成 |
| 19 | `minatomo-spot-diff.jsx` | まちがい探し | 視覚的詳細注意 | 2グリッド比較。色・位置・サイズの差異検出 |
| 20 | `minatomo-stroop.jsx` | ストループ | 抑制機能・選択的注意 | 神経心理の古典課題、初期版（後にrehab系に再構築） |
| 21 | `minatomo-shopping-list.jsx` | おかいものリスト | WM・展望記憶 | スーパーマップ上を移動して、覚えたリストの品物を取る |
| 22 | `minatomo-number-compare.jsx` | かずくらべ | 数量処理・処理速度 | 左右どちらが多いかを瞬時判断 |
| 23 | `minatomo-category-sort.jsx` | カテゴリ分け | 意味記憶・分類 | アイテムを正しいビンへ。意味ネットワーク訓練 |
| 24 | `minatomo-puzzle-rotation.jsx` | パズル回転 | 心的回転・空間認知 | 図形を回転させて元の形に戻す |
| 25 | `minatomo-serial-calc.jsx` | なぞり計算 | WM＋計算（Kraepelin風） | 連続加算。クレペリン検査の現代版 |

### Phase 1-D：応用系（セッション5／2026-04-04）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 26 | `minatomo-phone-memory.jsx` | でんごんばんごう | 言語的WM・干渉抑制 | 番号を覚える→干渉課題→再生 |
| 27 | `minatomo-letter-search.jsx` | 文字さがし | 視覚的注意・抹消課題 | グリッドからターゲット文字を見つける（Cancellation） |
| 28 | `minatomo-message-recall.jsx` | おぼえておえて | エピソード記憶・テキスト理解 | メッセージを読んで詳細質問に答える |
| 29 | `minatomo-schedule.jsx` | スケジュール管理 | 時間管理・遂行機能 | スケジュールを覚え、時間質問・矛盾検出 |
| 30 | `minatomo-color-match.jsx` | 色あわせ | 色覚・色語連合 | マッチング・色名・配色・グラデ並べ |
| 31 | `minatomo-word-builder.jsx` | ことわづくり | 言語処理・語彙 | ことわざ完成・並べ替え・穴埋め・反対語 |

### Phase 1-E：拡張系（セッション6／2026-04-07）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 32 | `minatomo-stack-calc.jsx` | つみき計算 | WM・連続加算 | 数字が次々現れて累計を追う |
| 33 | `minatomo-where-was-it.jsx` | どこだった？ | 空間記憶 | グリッド上に置かれたアイテムの位置を再生 |
| 34 | `minatomo-cooking-steps.jsx` | おりょうり手順 | 順序記憶・遂行機能 | レシピ手順を記憶→順番・材料・動作の質問 |
| 35 | `minatomo-listening-quiz.jsx` | 聞き取りクイズ | 聴覚的理解・WM | Web Speech APIで音読→質問。聴理解を鍛える唯一無二 |
| 36 | `minatomo-compare-ranking.jsx` | くらべてランキング | 意味記憶・大小比較 | サイズ・長さ・重さ・速度・価格でランク付け |

### Phase 1-F：反応・運動系（セッション7／2026-04-08）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 37 | `minatomo-whack-mole.jsx` | もぐらたたき | 反応速度・選択的注意 | 古典のもぐらたたき。爆弾は避ける選択性付き |
| 38 | `minatomo-wallet-calc.jsx` | おさいふ計算 | 金銭処理・計算 | 硬貨/紙幣を数えて金額を作る・比較 |
| 39 | `minatomo-error-finder.jsx` | まちがい直し | 言語処理・モニタリング | 誤字・誤情報・誤用を文中から見つける |
| 40 | `minatomo-left-right.jsx` | 右左クイズ | 空間認知・左右弁別 | 矢印・手・回転方向・鏡像・空間指示 |
| 41 | `minatomo-route-memory.jsx` | 道順おぼえ | 空間的記憶・経路再生 | 後に「ランドマーク+方向の言語版」に再構築 |
| 42 | `minatomo-shape-puzzle.jsx` | かたちパズル | 図形認識・パターン | 形の一致・半分合わせ・辺の数・仲間外れ・パターン補完 |
| 43 | `minatomo-counting.jsx` | かぞえて | 数量処理・選択的注意 | 散らばった絵文字を数える・特定種類を選別 |

### Phase 1-G：運動・PD系（セッション8／2026-04-09）

ここからパーキンソン病（PD）リハビリ向けの試行的シリーズ。後に「PD特化」を外して汎用化。

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 44 | `minatomo-hint-guess.jsx` | しりとりあて | 推論・語彙アクセス | ヒントが順に出る、少ないヒントで当てるほど高得点 |
| 45 | `minatomo-big-tap.jsx` | おおきくタップ | 振幅訓練・運動範囲 | LSVT BIG発想。長押し膨張・端から端へのスワイプ |
| 46 | `minatomo-rhythm-tap.jsx` | リズムタップ | リズム同期・タイミング | メトロノーム同期、テンポキープ・テンポ変化。Web Audio API |
| 47 | `minatomo-voice-challenge.jsx` | 声出しチャレンジ | 発声機能・呼気持続 | LSVT LOUD発想。マイクで音量測定、持続発声・音量目標 |
| 48 | `minatomo-trace.jsx` | なぞりトレース | 微細運動・micrographia予防 | 線・形・文字をなぞる。精度と大きさを測定 |
| 49 | `minatomo-step-rhythm.jsx` | ステップリズム | 歩行リズム・両側運動 | 左右交互タップでリズム歩行模擬 |
| 50 | `minatomo-dual-task.jsx` | ダブルタスク | 二重課題遂行 | 認知＋運動の同時遂行。両パフォーマンスを測定 |

### Phase 1-H：仕上げ系（セッション9／2026-04-14）

| # | ファイル名 | ゲーム名 | 認知機能タグ | 作成背景 |
|---|---|---|---|---|
| 51 | `minatomo-go-nogo.jsx` | 反応スイッチ | Go/No-Go・抑制 | Go刺激にタップ・No-Goは抑制。色・形・反転ルール |
| 52 | `minatomo-pair-search.jsx` | ペアさがし | 意味連合 | グリッドから関連するペアを2つタップして繋ぐ |
| 53 | `minatomo-yesterday-quiz.jsx` | きのうクイズ | 時間見当識・時間推論 | 昨日・明日・曜日・月の質問。リアル日付動的 |
| 54 | `minatomo-block-stack.jsx` | ブロックたおし | 視覚的空間的記憶 | ターゲットの塔を覚え、正しい色順で再構築 |
| - | `minatomo-map-quiz.jsx` | （日本地図クイズ・お蔵入り） | - | 都道府県の試作。ニーズ薄で開発中止 |

---

## 🌱 シンプル版（Phase 2：2026-04-14〜2026-04-24）

**認知機能低下が中等度の方向け**。説明文を最小化し、超大ボタン・自動進行・直感的UIで設計。

### シンプル版コア（セッション9〜10）

| # | ファイル名 | ゲーム名（仮） | 認知機能タグ |
|---|---|---|---|
| 1 | `minatomo-simple-tap.jsx` | タップ | 反応・基礎運動 |
| 2 | `minatomo-simple-pairs.jsx` | ペア合わせ | 視覚記憶 |
| 3 | `minatomo-simple-balloon.jsx` | バルーン | 反応・タイミング |
| 4 | `minatomo-simple-bigger.jsx` | おおきい方 | 数量比較 |
| 5 | `minatomo-simple-color.jsx` | 色 | 色覚・選択 |
| 6 | `minatomo-simple-colorchange.jsx` | 色変わり | 変化検出 |
| 7 | `minatomo-simple-count.jsx` | かぞえる | 計数 |
| 8 | `minatomo-simple-disappear.jsx` | きえた | 視覚記憶 |
| 9 | `minatomo-simple-greentap.jsx` | みどりタップ | 選択的注意 |
| 10 | `minatomo-simple-howmany.jsx` | いくつ | 数量見積もり |
| 11 | `minatomo-simple-leftright.jsx` | 右左 | 空間認知（簡易） |
| 12 | `minatomo-simple-memory.jsx` | おぼえる | 視覚記憶 |
| 13 | `minatomo-simple-mole.jsx` | もぐら | 反応速度 |
| 14 | `minatomo-simple-odd.jsx` | なかまはずれ | カテゴリ判断 |
| 15 | `minatomo-simple-order.jsx` | じゅんばん | 順序記憶 |
| 16 | `minatomo-simple-pattern.jsx` | パターン | パターン認識 |
| 17 | `minatomo-simple-same.jsx` | おなじ | マッチング |
| 18 | `minatomo-simple-samecount.jsx` | おなじかず | 数量一致 |
| 19 | `minatomo-simple-shell.jsx` | シェル（基本） | 物体永続性・追跡 |
| 20 | `minatomo-simple-shell2.jsx` | シェル（中級） | 物体追跡 |
| 21 | `minatomo-simple-shell3.jsx` | シェル（上級） | 物体追跡 |
| 22 | `minatomo-simple-simon.jsx` | サイモン（基本） | 順序記憶 |
| 23 | `minatomo-simple-simon2.jsx` | サイモン（中） | 順序記憶 |
| 24 | `minatomo-simple-simon3.jsx` | サイモン（上） | 順序記憶 |
| 25 | `minatomo-simple-sort.jsx` | そろえる | 分類 |
| 26 | `minatomo-simple-spotdiff.jsx` | ちがいさがし | 視覚的詳細注意 |
| 27 | `minatomo-simple-category.jsx` | なかまわけ | カテゴリ判断 |

### シンプル版拡張（セッション11／2026-04-24）

| # | ファイル名 | ゲーム名（仮） | 認知機能タグ |
|---|---|---|---|
| 28 | `minatomo-simple-addition.jsx` | たしざん | 計算（簡易） |
| 29 | `minatomo-simple-appearorder.jsx` | あらわれた順 | 順序記憶 |
| 30 | `minatomo-simple-chasetap.jsx` | おいかけタップ | 追跡・反応 |
| 31 | `minatomo-simple-colorchange.jsx` | 色変化 | 変化検出 |
| 32 | `minatomo-simple-colorconnect.jsx` | 色つなぎ | 色覚・連合 |
| 33 | `minatomo-simple-counttap.jsx` | カウントタップ | 計数 |
| 34 | `minatomo-simple-falling.jsx` | おちてくる | 反応・タイミング |
| 35 | `minatomo-simple-justone.jsx` | ひとつだけ | 識別 |
| 36 | `minatomo-simple-mostcommon.jsx` | いちばんおおい | 頻度判断 |
| 37 | `minatomo-simple-reaction.jsx` | はんのう | 反応速度 |
| 38 | `minatomo-simple-realone.jsx` | ほんもの | 弁別 |
| 39 | `minatomo-simple-tapspeed.jsx` | タップスピード | 反応速度 |
| 40 | `minatomo-simple-updown.jsx` | うえした | 空間認知（簡易） |
| 41 | `minatomo-simple-whatadded.jsx` | なにふえた | 変化検出 |
| 42 | `minatomo-simple-wherewasite.jsx` | どこだった | 空間記憶 |
| - | `minatomo-simple-mirror.jsx` | （却下） | - |

---

## 🧠 リハビリ脳トレ版（Phase 3：2026-04-24〜2026-04-25）

**高次脳機能障害向け**の本格神経心理リハビリシリーズ。古典的検査をベースにした臨床的タグ付き。

| # | ファイル名 | ゲーム名 | 認知機能タグ | 神経心理学的背景 | 作成背景 |
|---|---|---|---|---|---|
| 1 | `minatomo-rehab-stroop.jsx` | ストループ | 抑制・選択的注意 | Stroop Test | 古典の中の古典。congruent練習→incongruent本番の段階構造 |
| 2 | `minatomo-rehab-tmtb.jsx` | こうごにタップ | 遂行機能・認知的柔軟性 | TMT Part B | 1→あ→2→い→...の交互タップ。set-shifting評価 |
| 3 | `minatomo-rehab-cancellation.jsx` | ぜんぶさがせ！ | 視覚探索・半側空間注意 | Cancellation Task | 半側空間無視の検出にも使える臨床標準 |
| 4 | `minatomo-rehab-digitback.jsx` | ぎゃくからタップ | 言語的WM・遂行機能 | Digit Span Backward | WMS-R等の標準指標 |
| 5 | `minatomo-rehab-serialadd.jsx` | たしざんリレー | WM＋計算＋持続注意 | PASAT | MS・脳外傷のADL評価で標準的 |
| 6 | `minatomo-rehab-gonogo.jsx` | とめて！タップ！ | 抑制・反応切替 | Go/No-Go＋Reversal | 前頭前野機能、反応抑制 |
| 7 | `minatomo-rehab-corsi.jsx` | まねしてタップ | 視覚的空間的WM | Corsi Block Tapping | Digit Spanの空間版。適応的難易度3〜8 |
| 8 | `minatomo-rehab-category.jsx` | なかまはどれ？ | 意味記憶・カテゴリ判断 | Category Fluency | 8カテゴリで分類判断 |
| 9 | `minatomo-rehab-flanker.jsx` | まんなかのむき | 空間的選択的注意・抑制 | Eriksen Flanker Task | フランカー効果計測、ADHDや前頭機能の評価 |
| 10 | `minatomo-rehab-numseries.jsx` | すうじのつぎは？ | 流動性知能・帰納推論 | Number Series（WAIS系） | 等差/交互/フィボナッチの3レベル |
| 11 | `minatomo-rehab-rotation.jsx` | まわしたらおなじ？ | 心的回転・空間認知 | Mental Rotation（Shepard-Metzler系） | 正解は別角度の同一形、妨害は鏡像 |
| 12 | `minatomo-rehab-clock.jsx` | なんじかな？ | 時計読み・空間認知 | CDT読み取り版 | SVGアナログ時計、4レベル |
| 13 | `minatomo-rehab-delayedrecall.jsx` | あとでおもいだす | エピソード記憶・干渉抑制 | Rey-AVLT系 | 干渉課題（実計算4択）→遅延再認 |
| 14 | `minatomo-rehab-emotion.jsx` | きもちをよもう | 表情認識・社会的認知 | Ekman 60 Faces系 | 6基本感情、一義的決定可能なシナリオ20問 |
| 15 | `minatomo-rehab-wordpic.jsx` | ことばとえ | 語彙アクセス・言語理解 | Word-Picture Matching（SLTA系） | 失語症評価でも使える標準形式 |
| 16 | `minatomo-rehab-path.jsx` | どうろをすすめ | 地誌的見当識・指示遂行 | Money's Road Map系 | 5×5マップ |
| 17 | `minatomo-rehab-prospective.jsx` | やくそくをまもる | 展望記憶・二重課題 | Prospective Memory | 足し算課題＋約束タスク |
| 18 | `minatomo-rehab-change.jsx` | どこがかわった？ | 視覚的記憶・変化検出 | Luck & Vogel系 | 視覚的WM容量計測 |
| - | `minatomo-rehab-dsst.jsx` | （DSST・削除） | 処理速度 | Digit Symbol Substitution | 「難しすぎ」判定で却下 |
| - | `minatomo-rehab-nback.jsx` | （N-back rehab・却下） | WM更新 | N-back | 通常版で既出のため却下 |

---

## 全体の認知ドメインカバレッジ

| ドメイン | カバー状況 | 主要ゲーム例 |
|---|---|---|
| **注意（持続・選択・分配）** | ◎ | ストループ・ぜんぶさがせ！・もぐらたたき・ダブルタスク・まんなかのむき |
| **ワーキングメモリ** | ◎ | ぎゃくからタップ・たしざんリレー・Nバック・つみき計算 |
| **遂行機能** | ◎ | こうごにタップ・とめて！タップ！・手順ならべ・反応スイッチ |
| **エピソード記憶** | ◎ | おはなし記憶・あとでおもいだす・おぼえておえて |
| **意味記憶・言語** | ◎ | ことばつなぎ・なかまはどれ？・ことばとえ・ことわづくり |
| **視覚的記憶** | ◎ | 神経衰弱・どこがかわった？・フラッシュ記憶 |
| **空間認知** | ◎ | まねしてタップ・なんじかな？・パズル回転・まわしたらおなじ？ |
| **計算・処理速度** | ◎ | なぞり計算・おさいふ計算・たしざんリレー・かずくらべ |
| **時間見当識** | ◎ | きょうは何日？・きのうクイズ・スケジュール管理 |
| **社会的認知** | ○ | きもちをよもう（脳トレ版で唯一） |
| **運動・身体機能** | ○ | おおきくタップ・なぞりトレース・ステップリズム |
| **生活スキル直結** | ◎ | おつり計算・おかいものリスト・おりょうり手順・スケジュール管理 |
| **半側空間注意** | ○ | ぜんぶさがせ！（脳トレ版） |
| **展望記憶** | ◎ | やくそくをまもる・やくそく覚え |

---

## 設計思想の進化（時系列）

**Phase 1（通常版・3月下旬〜4月中旬）**
古典的な神経心理課題を、現場のリハビリ職が違和感なく使える「ぬくもりのあるデザイン」で再構築。3段階難易度・Confetti演出・履歴保存。

**Phase 2（シンプル版・4月中旬〜下旬）**
中等度認知症の方を対象に、説明文を消し・ボタンを巨大化・自動進行で「言葉なしで遊べる」を追求。同じテーマ（記憶・反応・パターン）を複数バージョンで段階的に。

**Phase 3（リハビリ脳トレ版・4月下旬）**
高次脳機能障害（脳卒中後・外傷後）の方向けに、神経心理の標準的検査（Stroop・TMT-B・PASAT・Corsi等）を、訓練ゲームとして再設計。臨床的に「この機能を見ている」と説明できる粒度のタグ付き。

---

## ファイル数サマリー

- 通常版：54本（うち1本お蔵入り = 53本稼働）
- シンプル版：43本（うち1本却下 = 42本稼働、+colorchangeが2バージョン存在）
- リハビリ脳トレ版：20本（うち2本却下 = 18本稼働）

**合計：約113本（稼働 約110本超）**

---

*この一覧は2026-04-25時点のスナップショット。今後の追加・修正は別途。*
