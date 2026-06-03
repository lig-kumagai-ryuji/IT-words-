# IT単語クイズ

IT用語を4択クイズ形式で学習するWebアプリです。

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

## セットアップ

```bash
npm install
docker compose up -d
npx prisma migrate dev
npm run db:seed
npm run dev
```

`http://localhost:3000` でアクセスできます。

## 環境変数

`.env` ファイルを作成してください：

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/it_words?schema=public"
```
