#!/usr/bin/env python3
"""Apply description_user (利用者向け説明) を各ゲームに付与する。

トーン方針:
  - 効能匂わせ（「○○な力」「気付かないうちに」「ふっと」等）を多用しない
  - 1行目: 活動の内容（〜しましょう / 〜できますか？ / 〜です）
  - 2行目: 温かみ・ちょっとしたユーモア
  - 「リハビリ」「トレーニング」「鍛える」を避ける
  - 構文を多様化、日常感を含める

Usage:
  python3 scripts/apply_descriptions.py --dry-run
  python3 scripts/apply_descriptions.py
"""
import argparse
import datetime
import json
from pathlib import Path

ROOT = Path.home() / "Work" / "minatomo-play-import"
CATALOG = ROOT / "games-catalog.json"

DESCRIPTIONS: dict[str, str] = {
    # ========== USER PROVIDED (5本) ==========
    "minatomo-memory-game": "カードの絵柄をめくって、同じものを見つけましょう。\n懐かしいような、新しいような。",
    "minatomo-rehab-stroop": "色と文字、どちらを答えたらいいでしょう？\nちょっと意地悪なゲームです。",
    "minatomo-cooking-steps": "お料理の手順を、一緒に思い出してみましょう。\nお味噌汁、肉じゃが、お好きなものから。",
    "minatomo-rehab-rotation": "頭の中で形をくるりと回してみてください。\n同じ形を見つけられますか？",
    "minatomo-change-calc": "お財布のコインで、ぴったりおつりを作りましょう。\nお買い物気分で、どうぞ。",

    # ========== memory (残り 30本) ==========
    "minatomo-rehab-delayedrecall": "覚えたあと、別のことをして、それからもう一度。\nちょっと意地悪な思い出しゲームです。",
    "minatomo-shopping-list": "おつかいリストを覚えて、お店の中をまわります。\n卵、人参、お醤油……忘れていませんか？",
    "minatomo-map-memory": "街の地図を覚えてから、道を答えてみましょう。\n右に曲がって、二つ目の角は……？",
    "minatomo-message-recall": "短いメッセージを読んで、内容を思い出すゲーム。\nちょっとしたお手紙を、頭に入れてみましょう。",
    "minatomo-simple-memory": "出てきた絵を、しっかり見て覚えましょう。\nシンプルだけど、けっこう手強いです。",
    "minatomo-rehab-digitback": "出てきた数字を、逆の順番で答えるゲーム。\n頭の中で並べ替える感覚、楽しんでみてください。",
    "minatomo-rehab-wordpic": "ことばと絵を、ぴったり結びつけるゲーム。\n見たまま、思い浮かんだままに。",
    "minatomo-simple-appearorder": "出てきた順番を、そのまま答えてみましょう。\n一つずつ、ゆっくりで大丈夫です。",
    "minatomo-phone-memory": "電話番号を覚えて、伝言を届けるゲーム。\n途中でちょっと邪魔が入りますが、めげずに。",
    "minatomo-simple-wherewasite": "どこに何があったか、思い出してみましょう。\n頭の中の地図を、そっと開いて。",
    "minatomo-where-was-it": "マスの中に置かれた品物の場所を、当てるゲーム。\n目で見たままを、覚えていられますか？",
    "minatomo-simple-whatadded": "何が増えたか、見つけてみましょう。\n間違い探しの、ちょっとお優しい版です。",
    "minatomo-simple-simon": "光った順に、同じようにタップしましょう。\n一つずつ、しずかに増えていきます。",
    "minatomo-rehab-corsi": "光ったマスを、同じ順番でなぞるゲーム。\n目と指で、リズムをつないで。",
    "minatomo-simple-simon2": "サイモンの、ちょっと違うアレンジ版。\n光と音を、追いかけてみましょう。",
    "minatomo-simple-simon3": "サイモンのもう一つのバージョンです。\nリズムよく、いきましょう。",
    "minatomo-rehab-prospective": "計算をしながら、約束ごとも忘れずに。\n二つのことを同時に、できますか？",
    "minatomo-flash-memory": "一瞬だけ表示される配置を、覚えてみましょう。\nまばたきしないで、よく見て。",
    "minatomo-pair-search": "つながりのある二つを、探して結ぶゲーム。\n犬と骨、お茶と急須、みたいに。",
    "minatomo-simple-pairs": "同じ絵を二つ、見つけてめくっていきましょう。\nゆっくりでも、慌てずでも。",
    "minatomo-rhythm-memory": "聞こえたリズムを、同じように叩き返すゲーム。\n耳と手で、合わせてみてください。",
    "minatomo-prospective-memory": "1日のスケジュールの中で、約束を実行するゲーム。\nうっかり忘れない練習、楽しく。",
    "minatomo-digit-span": "出てきた数字を、覚えて答えるゲーム。\n電話番号を覚えるみたいな感じです。",
    "minatomo-story-memory": "短いお話を読んで、内容に答えるゲーム。\n本を読んだあとの、おさらいのように。",
    "minatomo-simple-memory-game": "同じものを覚えて、合わせていくゲーム。\n懐かしくも新しい、定番の楽しさ。",
    "minatomo-corsi-block": "光ったブロックを、その順にタップ。\n目で追いかける、しずかな記憶ゲーム。",
    "minatomo-face-name": "お顔とお名前を、ぴったり覚えるゲーム。\nご近所さんとの会話のように。",
    "minatomo-simple-same": "同じものを見つけてタップしましょう。\nシンプルだけど、ちょっと頭を使います。",
    "minatomo-simple-order": "正しい順番に、並べてみてください。\nじっくり考えても大丈夫です。",
    "minatomo-simple-pattern": "繰り返しの中の、次の一つは？\nリズムを感じながら、当ててみて。",

    # ========== attention (35本、うち rehab-stroop は user 提供) ==========
    "minatomo-nback": "数手前のことを思い出しながら、続けるゲーム。\n頭の中をくるくる回す感じ、不思議です。",
    "minatomo-voice-challenge": "マイクに向かって、しっかり声を出すゲーム。\nおなかから、伸びやかに。",
    "minatomo-simple-color": "色を見て、合うものを選んでみましょう。\n目に入る、たしかな手がかりで。",
    "minatomo-simple-colorchange": "色がいつ変わったか、見つけてみましょう。\nじっと見ていると、変わる瞬間があります。",
    "minatomo-simple-chasetap": "動くものを目で追いかけて、タップしていくゲーム。\n鬼ごっこみたいな気持ちで、どうぞ。",
    "minatomo-big-tap": "大きく、思いきり動かすタップのゲーム。\n腕を伸ばして、画面いっぱいに。",
    "minatomo-simple-falling": "落ちてくるものを、タイミングよくタップ。\n目と指の、ちょっとした駆け引き。",
    "minatomo-simple-colorconnect": "同じ色を線でつないでいくゲーム。\n迷路のような、お絵描きのような。",
    "minatomo-simple-disappear": "あったものが、消えました。何だったか、思い出せますか？\n目の記憶を、頼ってみてください。",
    "minatomo-rehab-emotion": "お顔の表情から、その人の気持ちを読みましょう。\n笑顔、ちょっと困った顔、いろいろあります。",
    "minatomo-word-builder": "ことわざを完成させたり、並べ替えたり。\n聞いたことあるような、ないような？",
    "minatomo-hint-guess": "ヒントを少しずつ見て、答えを当てるゲーム。\n早く気づくほど、すっきり気持ちいい。",
    "minatomo-rehab-cancellation": "決まった印を、画面の中から全部見つけるゲーム。\n見落としがないように、ぐるりと。",
    "minatomo-rehab-change": "前と後で、どこが変わったかを当てるゲーム。\n画面ぜんたいを、ぐっと見比べて。",
    "minatomo-simple-spotdiff": "二つの絵を見比べて、違うところを探しましょう。\nじっくり、のんびり、お楽しみください。",
    "minatomo-simple-shell": "コップの下のボール、目で追いかけられますか？\nシャッフルされても、どこにあるか。",
    "minatomo-simple-odd": "並んだ中で、一つだけ違うものを見つけて。\nなんとなく感じる「違和感」が手がかり。",
    "minatomo-simple-tapspeed": "ひたすらタップ、どこまで早くできるかな？\n気持ちのいい、リズム遊び。",
    "minatomo-simple-justone": "たくさんある中から、一つだけ違うものを。\n見つけた瞬間、ちょっと嬉しい。",
    "minatomo-simple-balloon": "風船が割れる前に、タップしてつかまえて。\nぱちん、と弾けないように。",
    "minatomo-spot-diff": "二つの絵の、ちがうところを探すゲーム。\n雑誌の隅にある、あの遊びです。",
    "minatomo-simple-reaction": "合図が出たら、すぐにタップ！\nシンプルでも、奥が深いです。",
    "minatomo-simple-greentap": "緑色だけを、選んでタップしましょう。\n他の色は、そっと見送って。",
    "minatomo-whack-mole": "もぐらが顔を出したら、すかさずタップ。\n爆弾は、よけてくださいね。",
    "minatomo-simple-mole": "もぐらたたき、シンプル版です。\n目と指で、もぐらをつかまえて。",
    "minatomo-simple-shell2": "シェルゲームの、もう少し難しいバージョン。\n目で追い続けるのが、コツです。",
    "minatomo-simple-shell3": "シェル、さらに手強くなった三作目。\nシャッフルが速くなります。",
    "minatomo-simple-tap": "ただタップするだけ、リズムを楽しんで。\nシンプルがいちばん。",
    "minatomo-rhythm-tap": "音に合わせて、リズムよくタップ。\nメトロノームと、うまく合わせられますか？",
    "minatomo-change-detection": "一瞬の変化を見逃さない、見比べゲーム。\n目を凝らしてみてください。",
    "minatomo-letter-search": "決まった文字を、グリッドから全部見つけて。\n新聞の中で、漢字を探すような感覚。",
    "minatomo-listening-quiz": "音声で読み上げられる文章を、聞いて答えるクイズ。\nラジオを聴くような気持ちで。",
    "minatomo-color-match": "色と名前、色と色をぴったり合わせるゲーム。\n並んだグラデーションが、なんだか綺麗。",
    "minatomo-word-connect": "意味のつながることばを、選んでつなげましょう。\nなんとなく似ている、を見つけて。",

    # ========== executive (15本、うち cooking-steps は user 提供) ==========
    "minatomo-dual-task": "二つのことを、同時にこなせるかチャレンジ。\n歩きながら考える、みたいな感じです。",
    "minatomo-go-nogo": "出るものによって、押すか押さないか。\nうっかり押したくなる気持ちと、勝負。",
    "minatomo-compare-ranking": "大きい順、長い順、いろんな順番でランキング。\n「これってどっちが大きい？」をたくさん。",
    "minatomo-rehab-tmtb": "数字とひらがなを、交互にタップ。\n頭をくるりと切り替える感覚です。",
    "minatomo-simple-sort": "ばらばらのものを、種類ごとに分けましょう。\n片付けの楽しさ、あります。",
    "minatomo-rehab-gonogo": "押す、押さない、押す、押さない……合図に注意して。\n止まる練習も、立派な動き。",
    "minatomo-rehab-category": "仲間どうしを、選んで集めましょう。\n果物、野菜、道具……いろんな分け方があります。",
    "minatomo-simple-category": "似たもの同士で、グループを作ってみて。\n答えがいくつもあって、おもしろい。",
    "minatomo-error-finder": "文章の中に紛れた、ちょっとした間違いを見つけて。\n校正のお仕事、体験版。",
    "minatomo-rehab-flanker": "真ん中の矢印の向きだけを、答えるゲーム。\n周りに惑わされないで、まっすぐに。",
    "minatomo-category-sort": "アイテムを、正しい入れ物に振り分けて。\n整理整頓、楽しんでください。",
    "minatomo-step-rhythm": "左右交互にステップを踏むように、タップ。\nリズムが取れると、心地いい。",
    "minatomo-stroop": "色の名前と、文字の色。どっちを答える？\n古典中の古典、楽しんでみてください。",
    "minatomo-step-order": "日常の動作を、正しい順番に並べ替えて。\nご飯を炊く、お茶を淹れる、いろいろ。",

    # ========== orientation (5本) ==========
    "minatomo-yesterday-quiz": "昨日のこと、明日のこと、答えてみましょう。\n曜日や日付は、頭の体操に。",
    "minatomo-date-quiz": "今日は何月何日？すらりと出てきますか？\nカレンダーを見ない、ちょっとしたチャレンジ。",
    "minatomo-rehab-clock": "アナログ時計の針、何時を指しているでしょう？\n短い針と長い針、見分けて。",
    "minatomo-schedule": "1日の予定を覚えて、時間の質問に答えるゲーム。\n「あれ、何時から？」を、頭の中で。",
    "minatomo-clock-quiz": "時計の針、読めますか？シンプルで、奥深い。\n毎日見ているけど、いざとなると……？",

    # ========== visuospatial (12本、うち rehab-rotation は user 提供) ==========
    "minatomo-simple-mostcommon": "並んだ中で、一番多いものはどれ？\n目で見て、ぱっと判断。",
    "minatomo-simple-updown": "上か下か、ささっと答えてみましょう。\n頭で考える前に、感じるくらいで。",
    "minatomo-shape-puzzle": "形を組み合わせて、ぴたりとはめるパズル。\nあと一つで完成、その瞬間が好きです。",
    "minatomo-fragment-id": "少しずつ姿を現すもの、何だかわかりますか？\nヒントが増えると、ぱっとひらめく。",
    "minatomo-rehab-path": "地図を見ながら、指示通りに道を進みましょう。\n「次の角を右」、頭の中の冒険。",
    "minatomo-trace": "画面の線をなぞって、形をきれいに描きます。\nゆっくりでも、はやくでも。",
    "minatomo-simple-leftright": "右ですか、左ですか？さあ、どっち。\n迷ったら、まずは深呼吸。",
    "minatomo-simple-realone": "本物を、にせものの中から見つけましょう。\n細かい違いに、気づけるか。",
    "minatomo-puzzle-rotation": "ぐるりと回して、元の形に戻すパズル。\n頭の中で動かす感じ、慣れると癖になります。",
    "minatomo-block-stack": "見本のブロック、同じ色順に積み上げて。\n順番、覚えていられますか？",
    "minatomo-left-right": "矢印や手の向き、左右をぱっと判断するゲーム。\n鏡像が出てくると、ちょっと混乱。",

    # ========== calculation (14本、うち change-calc は user 提供) ==========
    "minatomo-counting": "ちらばった絵文字、数えてみてください。\n途中で見失わないように、ゆっくりと。",
    "minatomo-simple-bigger": "どっちが大きい？すぐに答えてみましょう。\n見た目とちがうこと、たまにあります。",
    "minatomo-simple-addition": "シンプルなたしざん、ぽんぽんと。\n暗算でも、指を使っても。",
    "minatomo-simple-howmany": "ぱっと見て、いくつあるか答えてみて。\n細かく数えなくても、感覚で。",
    "minatomo-wallet-calc": "硬貨や紙幣を組み合わせて、金額を作るゲーム。\nお買い物の前の、頭の中の準備。",
    "minatomo-simple-samecount": "数が同じものを、見つけてみましょう。\n数字じゃなく、見た目の量で。",
    "minatomo-number-compare": "左と右、どちらが多い？瞬時に判断。\n考える前に、感じる速さで。",
    "minatomo-simple-counttap": "タップした数を、ちゃんと覚えていられるか。\n数えながら、ゆっくりでも。",
    "minatomo-rehab-numseries": "数の並び、次に来る数字は何でしょう？\n規則を見つける楽しさ、ぱっと。",
    "minatomo-rehab-serialadd": "次々に出る数字を、足し続けるゲーム。\nリレーのように、リズムよく。",
    "minatomo-stack-calc": "現れる数字を、頭の中で積み上げて合計。\n途中で逃さないように、しずかに。",
    "minatomo-serial-calc": "連続する数字を、足していくゲーム。\nリズムに乗ると、楽しくなります。",
    "minatomo-simple-count": "数えるだけ、それだけです。\n落ち着いて、一つずつ。",
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true",
                    help="変更内容をレポートするのみで書き込まない")
    args = ap.parse_args()

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    catalog_ids = {g["id"] for g in catalog["games"]}
    desc_keys = set(DESCRIPTIONS.keys())

    missing = catalog_ids - desc_keys
    extra = desc_keys - catalog_ids

    if missing:
        print("ERROR: catalog にあるが DESCRIPTIONS 未定義のゲーム:")
        for g in sorted(missing):
            print(f"  - {g}")
        return 1
    if extra:
        print("WARN: DESCRIPTIONS にあるが catalog 未存在のキー:")
        for g in sorted(extra):
            print(f"  - {g}")

    added, updated, unchanged = 0, 0, 0
    for game in catalog["games"]:
        new_desc = DESCRIPTIONS[game["id"]]
        existing = game.get("description_user")
        if existing == new_desc:
            unchanged += 1
        elif existing is None:
            game["description_user"] = new_desc
            added += 1
        else:
            game["description_user"] = new_desc
            updated += 1

    print("=== サマリ ===")
    print(f"  追加:     {added}")
    print(f"  上書き:   {updated}")
    print(f"  変更なし: {unchanged}")
    print(f"  total:   {added + updated + unchanged}/{len(catalog['games'])}")
    print(f"  DESCRIPTIONS 件数: {len(DESCRIPTIONS)}")
    print()

    print("=== 各ドメイン代表サンプル6本 ===")
    sample_ids = [
        "minatomo-memory-game",       # memory (USER)
        "minatomo-rehab-stroop",      # attention (USER)
        "minatomo-cooking-steps",     # executive (USER)
        "minatomo-clock-quiz",        # orientation (NEW)
        "minatomo-shape-puzzle",      # visuospatial (NEW)
        "minatomo-wallet-calc",       # calculation (NEW)
    ]
    for gid in sample_ids:
        g = next((g for g in catalog["games"] if g["id"] == gid), None)
        if not g:
            continue
        print(f"--- {gid} ({g['name']}) [{g['domain']['primary']}] ---")
        print(g["description_user"])
        print()

    if args.dry_run:
        print("DRY RUN — 書き込みなし")
        return 0

    catalog["last_updated"] = datetime.date.today().isoformat()
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote: {CATALOG} ({CATALOG.stat().st_size} bytes)")
    print(f"last_updated: {catalog['last_updated']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
