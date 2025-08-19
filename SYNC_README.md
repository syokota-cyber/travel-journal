# 🔄 本番環境同期ガイド

## 概要
本ドキュメントは、本番環境のマスターデータを開発環境に安全に同期する手順を記載しています。

## 🚨 同期が必要なタイミング
- **メジャーアップデート前**（必須）
- **マイナーアップデート前**（推奨）
- **月次定期実行**（データ整合性確保）
- **新機能開発前**（最新データでの開発）
- **問題発生時**（本番データとの差異確認）

## ⚡ クイックスタート

### 1. 自動同期（推奨）
```bash
# 本番データを同期（Gitコミットなし）
npm run sync:production

# 本番データを同期してGitコミット
npm run sync:production:commit
```

### 2. 手動同期
```bash
# 同期スクリプトを実行
node sync_master_data.js

# Gitコミットも含める場合
node sync_master_data.js --commit
```

## 📋 同期対象テーブル

| テーブル | 内容 | 本番件数（参考） |
|----------|------|------------------|
| `main_purposes` | メイン目的マスターデータ | 16件 |
| `sub_purposes` | サブ目的マスターデータ | 11件 |
| `default_items` | 推奨持ち物マスターデータ | 80件 |
| `travel_rules` | ルール・マナーマスターデータ | 62件 |

## 🔍 同期前の確認事項

### 前提条件チェック
```bash
# ローカルSupabaseの起動確認
curl http://localhost:54321/rest/v1/ -I

# 本番環境への接続確認
curl https://rwxllvnuuxabvgxpeuma.supabase.co/rest/v1/ -I
```

### データバックアップ（推奨）
```bash
# 現在の開発環境データをバックアップ
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" \
  --table=main_purposes --table=sub_purposes --table=default_items --table=travel_rules \
  > backups/$(date +%Y%m%d_%H%M%S)/dev_backup.sql
```

## 📊 同期後の確認

### データ件数チェック
```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT 
  'main_purposes' as table_name, count(*) as count 
FROM main_purposes
UNION ALL
SELECT 'sub_purposes', count(*) FROM sub_purposes  
UNION ALL
SELECT 'default_items', count(*) FROM default_items
UNION ALL
SELECT 'travel_rules', count(*) FROM travel_rules;
"
```

### 重複データチェック
```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "
SELECT 
  table_name, 
  duplicate_count 
FROM (
  SELECT 'sub_purposes' as table_name, 
         count(*) - count(DISTINCT name) as duplicate_count 
  FROM sub_purposes
  UNION ALL
  SELECT 'main_purposes', 
         count(*) - count(DISTINCT name) 
  FROM main_purposes
) t WHERE duplicate_count > 0;
"
```

### フロントエンド動作確認
```bash
# 開発サーバー再起動
npm run dev:reset

# ブラウザで確認: http://localhost:3000
# ✅ 持ち物リストが表示される
# ✅ サブ目的の重複がない
# ✅ ルール・マナーでタイムアウトしない
```

## 🛠️ トラブルシューティング

### よくあるエラーと解決方法

#### 1. `ECONNREFUSED localhost:54322`
```bash
# Supabaseローカル環境が起動していない
supabase start
```

#### 2. `curl: command not found`
```bash
# macOS
brew install curl

# Ubuntu/Debian
sudo apt-get install curl
```

#### 3. `permission denied: psql`
```bash
# PostgreSQLクライアントのインストール
brew install postgresql
```

#### 4. `JSON parse error`
```bash
# 本番環境からの取得に失敗
# APIキーや接続を確認
curl "https://rwxllvnuuxabvgxpeuma.supabase.co/rest/v1/main_purposes?select=*" \
  -H "apikey: YOUR_API_KEY" | jq .
```

### 同期失敗時の復旧

#### 1. バックアップからの復元
```bash
# 最新のバックアップファイルを特定
ls -la backups/

# バックアップから復元
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f backups/YYYYMMDD_HHMMSS/dev_backup.sql
```

#### 2. 段階的再同期
```bash
# 特定のテーブルのみ同期
node -e "
const sync = require('./sync_master_data.js');
sync.fetchProductionData();
// 手動で特定テーブルのみ投入
"
```

## 📈 同期履歴の確認

### 履歴ファイル確認
```bash
# 同期履歴表示
cat sync_history.log

# 最新の同期状況
tail -5 sync_history.log
```

### Git履歴確認
```bash
# 同期関連のコミット履歴
git log --grep="Production master data sync" --oneline

# 同期タグ一覧
git tag -l "sync-*"
```

## 🔒 セキュリティ注意事項

### 絶対禁止事項
- ❌ 本番環境への書き込み操作
- ❌ 本番環境APIキーの公開
- ❌ 同期中の本番アプリケーション停止
- ❌ RLS設定の無断変更

### 推奨事項
- ✅ 同期は読み取り専用操作のみ
- ✅ APIキーは環境変数で管理
- ✅ 同期前のデータバックアップ
- ✅ 同期後の動作確認

## 📞 サポート

### 問題発生時の連絡先
1. **CLAUDE.md**: プロジェクトルールブック確認
2. **DEPLOYMENT_NOTES.md**: 本番移行ガイド確認
3. **sync_history.log**: 過去の同期履歴確認
4. **GitHub Issues**: 技術的問題の報告

### デバッグ情報収集
```bash
# システム情報
node --version
npm --version
psql --version

# 環境設定確認
cat .env.local | grep -v "KEY\|SECRET"
supabase status

# エラーログ確認
tail -f ~/.supabase/logs/database.log
```

---

**📝 最終更新**: 2025年8月19日  
**✅ 検証済み環境**: Node.js 18+, PostgreSQL 15+, Supabase CLI 1.187+