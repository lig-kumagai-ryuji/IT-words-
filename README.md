# IT単語クイズ

IT用語を4択クイズ形式で学習するWebアプリです。

## 事前に必要なもの

以下の2つをインストールしてください。

| ツール | 確認コマンド | ダウンロード |
|---|---|---|
| Node.js v18以上 | `node -v` | https://nodejs.org/ |
| Docker | `docker -v` | https://www.docker.com/ |

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/lig-kumagai-ryuji/IT-words-.git
cd IT-words-
```

### 2. パッケージをインストール

```bash
npm install
```

### 3. 環境変数を設定

```bash
cp .env.example .env
```

### 4. PostgreSQL（データベース）を起動

```bash
docker compose up -d
```

### 5. DBのセットアップ（初回のみ）

```bash
npm run setup
```

マイグレーションとデータ投入が自動で行われます。

### 6. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで **http://localhost:3000** を開くと使えます。

---

## 主なコマンド

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run setup` | DBマイグレーション＋データ投入（初回のみ） |
| `docker compose up -d` | PostgreSQL起動 |
| `docker compose down` | PostgreSQL停止 |

---

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
