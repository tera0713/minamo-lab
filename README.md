# ミナモ検証ラボ（検証用Webサイト）

架空の会社「ミナモ」（スマホ決済「ミナモPay」・クレジットカード「ミナモカード」・通信「ミナモモバイル」）のダミーサイトです。
Amplitude の **セッションリプレイ／ヒートマップ／Web Experiment／ファネル** を、本物のページで試すために使います。
Snowflake のダミーデータ（AMPLAB）と同じイベント名・同じ会員ID（MNM＋7桁）でつながります。

> 実在の会社・サービスとは関係ありません。本当の個人情報は入力しないでください。

---

## 1. 中身

| ファイル | 役割 | 試せること |
|---|---|---|
| index.html | ミナモPayのキャンペーンLP（はじめての決済で20%還元） | Web Experiment（ボタン文言）、ヒートマップ、デッドクリック、レイジクリック |
| entry.html | エントリーフォーム（3ステップ） | ファネル、セッションリプレイ（入力エラーでの離脱） |
| plan.html | ミナモモバイルの料金プラン診断 | 通信側のファネル、回答内容ごとの比較 |
| config.js | **APIキーと既定の施策IDを書く（編集はここだけ）** | ― |
| amp-init.js | 計測の開始（Session Replay・Autocapture） | ― |
| app.js | ページの動きと、独自イベントの記録 | ― |
| style.css | 見た目 | ― |

---

## 2. 公開する（GitHub Pages・約10分）

Session Replay は、インターネットに公開されたページでないと正しく再生できません（自分のPC（localhost）の画像やCSSを Amplitude が読めないため）。

1. **APIキーをコピー**：Amplitude 右上の歯車 → Organization settings → Projects → 検証用のプロジェクト → General の「API Key」
2. **config.js を書き換える**：`YOUR_API_KEY` を①のキーに置き換えて保存
3. **リポジトリを作る**：GitHub 右上「＋」→ New repository → 名前 `minamo-lab`、**Public** を選ぶ → Create repository
4. **ファイルを入れる**：「uploading an existing file」を押し、このフォルダの8ファイルをドラッグ → Commit changes
5. **公開する**：Settings → Pages → Build and deployment の Source を「Deploy from a branch」、Branch を `main` と `/ (root)` にして Save
6. 1〜2分後、`https://<GitHubのユーザー名>.github.io/minamo-lab/` で開けます

- **APIキーの扱い**：ブラウザ用のAPIキーは、ページのソースを見れば誰でも読める前提のキーです。**Secret Key は絶対に書かない**でください。URLを広く配ると他人の操作が混ざるので、共有は検証メンバーだけにします。
- GitHub が使えない場合は、Netlify Drop（`app.netlify.com/drop` にフォルダをドラッグ）でも公開できます。

---

## 3. 届いているか確かめる（5分）

1. 次のURLを開く（施策ID・会員ID・流入元の印つき）

   ```
   https://<ユーザー名>.github.io/minamo-lab/index.html?cid=CP-2610-WEB-06&uid=MNM0000123&utm_source=push&utm_medium=app&utm_campaign=CP-2610-WEB-06
   ```

2. F12 → Console に `[track] [ミナモPay]キャンペーン詳細表示 …` が出れば、ページは動いています。
   `[ミナモ検証ラボ] Amplitudeが動いていません` が出たら、config.js のキーを確認します。
3. Amplitude の User Look-Up で `MNM0000123` を検索 → イベントの流れ（Event Stream）に `[Amplitude] Page Viewed` と `[ミナモPay]キャンペーン詳細表示` があればOK。
4. 数分後、同じ画面のセッションに再生ボタン（Play Session）が出れば、リプレイも録れています。
   出ないときは、Session Replay の設定でサンプリング率が 0% になっていないか確認します（このサイトは、Amplitude の設定画面の値が優先されます）。

---

## 4. 記録されるイベント

独自イベント（すべてに「施策ID」「ページ」「接触チャネル＝Web」が付きます）

| ページ | イベント | 主な属性 |
|---|---|---|
| LP | [ミナモPay]キャンペーン詳細表示 | ― |
| LP | [ミナモPay]エントリーボタンクリック | ボタン位置（ファーストビュー／ページ下部） |
| LP・エントリー | [ミナモモバイル]プラン診断導線クリック | ボタン位置 |
| エントリー | [ミナモPay]エントリー開始 | ― |
| エントリー | [ミナモPay]エントリーステップ完了 | ステップ番号、総ステップ数（3）、支払い方法 |
| エントリー | [ミナモPay]エントリー入力エラー | ステップ番号、項目 |
| エントリー | [ミナモPay]キャンペーンエントリー | 支払い方法 |
| プラン診断 | [ミナモモバイル]料金プラン画面表示 | ― |
| プラン診断 | [ミナモモバイル]プラン診断入力エラー | ― |
| プラン診断 | [ミナモモバイル]プラン診断実行 | データ使用量、通話、手続き、おすすめプラン |
| プラン診断 | [ミナモモバイル]プラン変更申込 | おすすめプラン |
| プラン診断 | [ミナモPay]キャンペーン導線クリック | ボタン位置 |

自動で記録されるもの（Autocapture）：ページ表示、クリック、セッションの開始と終了、流入元（URLの utm_…）、レイジクリック（同じ場所を1秒以内に4回）、デッドクリック（押しても何も変わらない）。
ファイルのダウンロード・通信の記録・表示速度は、イベント数を増やさないため切っています。LP→エントリー完了の1回で、約20〜30イベントです。

**会員IDのつなぎ方**は2つ：URLの `?uid=MNM0000123`、またはエントリーフォームのステップ1。
Snowflake から取り込んだ同じ会員の記録と、1人のユーザーとしてつながります（年代などの人の属性も、そのまま使えます）。

---

## 5. 仕込んである観察ポイント

| 場所 | 仕込み | Amplitudeで見るもの |
|---|---|---|
| LP中ほどの「さらに抽選で500ポイント」 | 押しても何も起きないボタン | デッドクリック、ヒートマップのクリック集中 |
| LPの「ポイント残高を確認する」 | 反応が3秒遅いボタン | 連打（レイジクリック）と、そのリプレイ |
| エントリーのステップ1 | 会員IDの形式チェック | 入力エラーからの離脱（ファネル＋リプレイ） |
| エントリーのステップ3 | 同意のチェック忘れ | 確定を押しても進まない様子 |
| LPの「エントリーする」ボタン | Web Experiment の題材 | パターン別のエントリー率 |

---

## 6. Web Experiment（LPのボタン文言テスト）

1. Amplitude → Experiment → Web Experiment を新規作成。名前は `CP-2610-WEB-06 LPボタン文言`、対象ページに公開した index.html のURLを入れる
2. Visual Editor で「エントリーする」ボタン（`#cta-entry`）を選び、文言を「20%還元を受け取る」に変える（treatment）。control はそのまま
3. ページの条件（Page targeting）を「URLに `/minamo-lab/index.html` を含む」にして、配分 50:50 で開始（無料・Plusで同時に動かせるのは1本）
4. シークレットウィンドウで何度か開き直すと、別の人として振り分けられ、`[Experiment] Impression` が届く。**control と treatment の両方が届いているか**を先に確認
5. 結果はファネルで見る：`[Experiment] Impression`（flag_key で絞る）→ `[ミナモPay]エントリーボタンクリック` → `[ミナモPay]キャンペーンエントリー`、分割は `variant`
   （A/Bの結果画面 Experiment results は Growth 以上のため）

---

## 7. ヒートマップ（Plusが必要）

1. Amplitude の Heatmaps を開き、新規作成 → ページURLに index.html を指定
2. Clickmap（クリックの集まり）、Scrollmap（どこまで読まれたか）、Selectormap（要素ごとのクリック数）を切り替える
3. 見どころ：抽選ボタンにクリックが集まるのにエントリーにつながらない、FAQより下はほとんど読まれない、など

ヒートマップはリプレイのデータから作られます。スマホ幅とPC幅の両方で10〜20回ほど操作すると、形が見えてきます。

---

## 8. 片付け

- GitHub：リポジトリの Settings → 一番下の Delete this repository
- Amplitude：Web Experiment を停止（Stop）してからアーカイブ
