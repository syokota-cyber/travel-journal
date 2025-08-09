#!/bin/bash
# 🚀 Travel Journal バックアップセットアップスクリプト
# Phase 1: 最小限バックアップ戦略の実装

echo "🚀 Travel Journal バックアップセットアップ開始"
echo "📅 実行日時: $(date)"

# プロジェクトルート確認
if [[ ! -f "package.json" ]]; then
    echo "❌ エラー: プロジェクトルートディレクトリで実行してください"
    exit 1
fi

# バックアップディレクトリ作成
echo ""
echo "📁 バックアップディレクトリ作成中..."
mkdir -p backups/{database,config,migrations}

# 1. Supabase設定バックアップ
echo ""
echo "⚙️ Step 1: Supabase設定バックアップ"

if [ -f ".env" ]; then
    # 環境変数から機密情報を除いた設定のみバックアップ
    grep -E "^REACT_APP_SUPABASE_URL=" .env > backups/config/supabase-config.env
    echo "   ✅ Supabase URL設定バックアップ完了"
else
    echo "   ⚠️ .env ファイルが見つかりません"
fi

# 2. Migration ファイルバックアップ
echo ""
echo "🗄️ Step 2: Migrationファイルバックアップ"

if [ -d "../supabase/migrations" ]; then
    cp -r ../supabase/migrations/* backups/migrations/
    MIGRATION_COUNT=$(ls -1 backups/migrations/*.sql 2>/dev/null | wc -l)
    echo "   ✅ $MIGRATION_COUNT 個のMigrationファイルをバックアップ"
else
    echo "   ⚠️ ../supabase/migrations ディレクトリが見つかりません"
fi

# 3. データベーススキーマ出力 (制限解除時用)
echo ""
echo "📋 Step 3: スキーマ情報準備"

cat > backups/database/schema-export.sql << 'EOF'
-- Travel Journal Database Schema Export Script
-- 制限解除後に実行してスキーマ情報を取得

-- テーブル一覧
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 各テーブルの行数
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';

-- マスターデータ確認
SELECT 'main_purposes' as table_name, COUNT(*) as record_count FROM main_purposes
UNION ALL
SELECT 'sub_purposes', COUNT(*) FROM sub_purposes  
UNION ALL
SELECT 'default_items', COUNT(*) FROM default_items;
EOF

echo "   ✅ スキーマエクスポート用SQLを準備"

# 4. バックアップ情報ファイル作成
echo ""
echo "📄 Step 4: バックアップ情報記録"

cat > backups/backup-info.json << EOF
{
  "backup_date": "$(date -Iseconds)",
  "project_name": "travel-journal",
  "supabase_project": "rwxllvnuuxabvgxpeuma",
  "backup_type": "phase1-minimal",
  "contents": {
    "config": {
      "supabase_url": true,
      "env_template": true
    },
    "migrations": {
      "files": $MIGRATION_COUNT,
      "location": "backups/migrations/"
    },
    "database": {
      "schema_export_sql": true,
      "data_export": false
    }
  },
  "recovery_steps": [
    "1. Supabaseプロジェクト再作成",
    "2. migrations/ 内のSQLを順次実行",
    "3. 環境変数設定を復元",
    "4. アプリケーション再起動・動作確認"
  ]
}
EOF

echo "   ✅ バックアップ情報を記録"

# 5. 復旧スクリプト作成
echo ""
echo "🔧 Step 5: 復旧スクリプト準備"

cat > backups/restore.sh << 'EOF'
#!/bin/bash
# 🚑 Travel Journal 復旧スクリプト
# 障害発生時に実行

echo "🚑 Travel Journal 復旧開始"

# 新しいSupabaseプロジェクトの情報入力
read -p "新しいSupabase Project URL: " NEW_SUPABASE_URL
read -p "新しいSupabase Anon Key: " NEW_SUPABASE_KEY

# .env ファイル更新
cat > ../.env << ENV_EOF
SKIP_PREFLIGHT_CHECK=true
GENERATE_SOURCEMAP=false

REACT_APP_SUPABASE_URL=$NEW_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$NEW_SUPABASE_KEY
ENV_EOF

echo "✅ 環境変数を更新しました"
echo "📋 次の手順:"
echo "1. Supabase Dashboardで migrations/ 内のSQLを順次実行"
echo "2. npm start でアプリケーション動作確認"
echo "3. ユーザーデータの復旧 (別途バックアップから)"

EOF

chmod +x backups/restore.sh
echo "   ✅ 復旧スクリプトを準備"

# 6. .gitignore更新 (機密情報保護)
echo ""
echo "🔒 Step 6: セキュリティ設定"

if ! grep -q "backups/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Backup files (contains sensitive info)" >> .gitignore
    echo "backups/" >> .gitignore
    echo "   ✅ .gitignore にバックアップディレクトリを追加"
else
    echo "   ✅ .gitignore は既に設定済み"
fi

# 7. 最終確認
echo ""
echo "📊 バックアップセットアップ完了確認:"
echo "   📁 backups/config/: $(ls -1 backups/config/ 2>/dev/null | wc -l) ファイル"
echo "   📁 backups/migrations/: $(ls -1 backups/migrations/ 2>/dev/null | wc -l) ファイル"
echo "   📁 backups/database/: $(ls -1 backups/database/ 2>/dev/null | wc -l) ファイル"

# 8. 次の推奨アクション
echo ""
echo "💡 Phase 1 バックアップ完了!"
echo "📋 推奨される次のアクション:"
echo "   1. 週次: ./scripts/weekly-backup.sh の実行"
echo "   2. 重要変更前: ./scripts/backup-setup.sh の再実行"
echo "   3. Phase 2移行: ユーザー100人超過時に自動バックアップ導入"

echo ""
echo "⚠️ 重要な制限:"
echo "   - ユーザー生成データは別途バックアップ必要"
echo "   - リアルタイムデータは手動エクスポートのみ"
echo "   - 完全復旧には新規Supabaseプロジェクト作成が必要"

echo ""
echo "✨ バックアップセットアップ完了!"
echo "📅 完了時刻: $(date)"