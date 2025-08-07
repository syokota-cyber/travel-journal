# 🚐 キャンピングカー旅日記アプリ

キャンピングカー愛好家のための旅行記録・計画アプリケーション

## 🌐 デプロイ済みURL
https://travel-journal-ochre-two.vercel.app

⚠️ **現在の状態 (2025年8月7日)**: Invalid API keyエラーにより認証機能が停止中

## 🔒 セキュリティ

このアプリケーションは以下のセキュリティ対策を実施しています：

- ✅ 環境変数による機密情報の管理
- ✅ Supabase Row Level Security (RLS) によるデータ保護  
- ✅ HTTPSによる通信の暗号化
- ✅ セキュリティヘッダーの設定（CSP, X-Frame-Options等）
- ✅ GitHubシークレットによる安全なCI/CD

## 🚀 機能

- 旅の計画と記録
- 目的別チェックリスト
- ルール・マナー確認
- 旅のレビューと評価
- 持ち物管理

## 🛠️ 技術スタック

- **フロントエンド**: React 19
- **バックエンド**: Supabase (PostgreSQL + Auth)
- **ホスティング**: Vercel
- **バージョン管理**: GitHub

## 📝 環境変数

以下の環境変数が必要です（`.env.example`参照）：

```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🔧 ローカル開発

```bash
# インストール
npm install --legacy-peer-deps

# 開発サーバー起動
npm start

# ビルド
npm run build

# テスト
npm test
```

## 🚨 **緊急課題ログ**

### Invalid API Key問題 (2025年8月7日)
- **症状**: Supabase認証で401エラー継続
- **試行済み**: Legacy JWT Secret, Publishable Key
- **影響**: ログイン・認証機能の完全停止
- **詳細**: `DEPLOYMENT_LOG_20250807.md`参照

### 明日の対応予定
1. Supabaseプロジェクト状態の全面確認
2. API Keysの完全再生成
3. Vercel環境変数の再設定
4. 必要に応じて新Supabaseプロジェクト作成

## 📄 ライセンス

MIT License

## 👥 貢献

プルリクエストを歓迎します！

---

© 2025 Syokota Cyber. All rights reserved.