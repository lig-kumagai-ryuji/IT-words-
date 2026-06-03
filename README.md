# IT単語クイズ

IT用語を4択クイズ形式で学習するWebアプリです。

## 必要なもの

- [Node.js](https://nodejs.org/) v18以上
- [Docker](https://www.docker.com/) (PostgreSQL用)

## セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/lig-kumagai-ryuji/IT-words-.git
cd IT-words-

# 2. パッケージをインストール
npm install

# 3. 環境変数を設定
cp .env.example .env

# 4. PostgreSQLを起動
docker compose up -d

# 5. DBのセットアップ（マイグレーション + データ投入）
npm run setup

# 6. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開くと使えます。

## 主なコマンド

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run setup` | DBマイグレーション＋データ投入（初回のみ） |
| `docker compose up -d` | PostgreSQL起動 |
| `docker compose down` | PostgreSQL停止 |

## 機能

- 4択クイズ（単語→意味 / 意味→単語 の2モード）
- 出題数選択（10〜50問）
- スコア・正答率・プログレスバーのリアルタイム表示
- 結果画面（ランク判定）

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **DB**: PostgreSQL + Prisma 7
- **インフラ**: Docker Compose
