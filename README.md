# 岐阜カーコーティング比較ナビ — 自動生成システム

**店舗情報を `data/stores.json` に追加して push するだけ**で、店舗ページ・比較ページ・地域ページ・内部リンク・SEO・サイトマップまで全ページが自動更新されるサイトです。HTMLを書く必要は一切ありません。

## 日常運用（これだけ覚えればOK）

### 店舗を1件追加する

1. GitHub上で `data/stores.json` を開き、鉛筆アイコン（Edit）をクリック
2. 配列の最後に店舗データを1ブロック追記（下のテンプレートをコピー）
3. 「Commit changes」を押す
4. **約1〜2分後、サイト全体が自動で更新・公開されます**（Actionsタブで進行を確認できます）

```json
{
  "slug": "example-store",
  "name": "サンプル店舗名",
  "area": "seki",
  "address": "岐阜県関市〇〇1-2-3",
  "tel": "0575-00-0000",
  "hours": "9:00〜18:00",
  "closed": "水曜定休",
  "website": "https://example.com",
  "mapQuery": "サンプル店舗名 関市",
  "badges": ["EX取扱", "1級資格者"],
  "summary": "店舗の紹介文（一覧カードと店舗ページの冒頭に表示されます）。",
  "features": ["特徴1", "特徴2"],
  "equipment": ["コーティングブース", "待合室"],
  "staff": "1級資格者2名",
  "photoCount": 100,
  "suitedFor": "こんな人に向いています",
  "menus": [
    { "name": "ダイヤモンドキーパー", "price": "SSサイズ 59,600円〜", "note": "3〜5年耐久" }
  ],
  "images": ["example-store-1.jpg"],
  "reviews": [
    { "author": "40代・男性", "rating": 5, "text": "口コミ本文" }
  ],
  "faq": [
    { "q": "質問", "a": "回答" }
  ]
}
```

**ルール**
- `slug` … 半角英数とハイフンのみ。URLになります（例: `stores/example-store/`）。重複不可
- `area` … `data/areas.json` に定義したエリアのslug
- 不明な項目は `""` や `[]` のままでOK（その項目は表示されません）
- おすすめ枠に載せたい店舗だけ `"rank": 1, "rankLabel": "総合おすすめ"` を付ける

### 写真を追加する

`images/` フォルダに元画像（jpg/png）をアップロードし、店舗データの `"images"` にファイル名を書くだけ。ビルド時に自動で **WebP変換・3サイズ生成（400/800/1200px）・Lazy Load・alt属性付与・ファイル名正規化** が行われます。

### 新しいエリアを追加する

`data/areas.json` に1ブロック追加します。`neighbors` に隣接エリアのslugを書くと、**エリアvsエリア比較ページ（例: 関市vs岐阜市）が自動生成**されます。

### 比較メニューを追加する

`data/site.json` の `menus` に追加します。`keywords` に含まれる語が店舗データ内に見つかると、その店舗が自動的にメニュー比較ページに掲載されます。

## 自動生成されるもの

| 種類 | URL | 生成条件 |
|---|---|---|
| トップページ | `/` | 常時 |
| 店舗ページ | `/stores/{slug}/` | 店舗1件ごと |
| 地域一覧 | `/areas/{area}/` | 店舗が1件以上あるエリア |
| エリア比較 | `/compare/{area}/` | 同上（ランキング+比較表+選び方） |
| エリアvs比較 | `/compare/{a}-vs-{b}/` | 隣接エリアのペアごと |
| メニュー比較 | `/compare/menu/{menu}/` | 該当店舗が1件以上あるメニュー |
| サイトマップ | `/sitemap.xml` `/robots.txt` | 常時 |

全ページに **title / meta description / canonical / OGP / パンくずリスト / 構造化データ（AutoBodyShop・BreadcrumbList・FAQPage・ItemList・AggregateRating）/ 内部リンク** が自動付与されます。

## 初回セットアップ（1回だけ）

1. このフォルダの中身をGitHubリポジトリ（例: `seki-carcoating-navi`）のルートに push
2. リポジトリの **Settings → Pages → Source** を「**GitHub Actions**」に変更
3. `data/site.json` の `baseUrl` を実際の公開URLに合わせる
4. push すると自動でビルド・公開されます

## ローカルでの確認（任意）

```bash
npm install        # 初回のみ（画像最適化のsharpが入ります）
npm run build      # dist/ に全ページ生成
npm run preview    # http://localhost:3000 でプレビュー
```

## 構成

```
data/
  stores.json   ← 店舗データ（日常的に編集するのはここだけ）
  areas.json    ← エリア定義と隣接関係
  site.json     ← サイト名・URL・比較メニュー定義
images/         ← 元画像を置くだけ（自動でWebP化）
src/
  build.js      ← ビルド本体
  lib/          ← seo / links / images / sitemap / templates
  assets/       ← CSS・OGP画像
dist/           ← 生成物（自動生成。直接編集しない）
.github/workflows/build.yml ← push時の自動ビルド＆デプロイ
```

## 拡張性

- ビルドは店舗数に対して線形（O(n)）。現在6店舗で約0.3秒、**1,000店舗でも数十秒**で完了します
- データが壊れている場合（slug重複・エリア未定義など）はビルドが**エラーで停止**し、壊れたサイトが公開されることはありません
- 将来店舗数が数千件になったら、`stores.json` をエリア別ファイル分割（`data/stores/*.json`）やGoogleスプレッドシート→CSV取込に切り替え可能な構造です
