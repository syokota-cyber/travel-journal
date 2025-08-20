# 🚨 緊急: 本番環境に方面（destination）カラムが反映されていない

## 問題
- **報告日時**: 2025年8月20日 11:30
- **問題**: 本番環境で旅先方面が表示されない
- **原因**: destinationカラムのMigrationが本番環境に適用されていない可能性

## 解決手順

### 1. Supabase管理画面でのMigration実行

**SQLエディタで以下を実行:**

```sql
-- 本番環境のtripsテーブルにdestinationカラムを追加
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS destination TEXT;

-- カラムにコメントを追加
COMMENT ON COLUMN trips.destination IS '旅先方面 - 13の方面から選択';

-- 確認クエリ
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name = 'destination';
```

### 2. RLS設定の確認・有効化

```sql
-- RLS有効化（本番環境必須）
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーの確認
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'trips';

-- ポリシーが存在しない場合は作成
CREATE POLICY "Users can view own trips" 
ON trips FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" 
ON trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" 
ON trips FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" 
ON trips FOR DELETE 
USING (auth.uid() = user_id);
```

### 3. Vercelへのデプロイ

```bash
# ローカルでプッシュ
git push origin main

# Vercelが自動デプロイ
# または手動でVercel管理画面からデプロイ
```

### 4. 動作確認

1. https://travel-journal-ochre-two.vercel.app/ にアクセス
2. ログイン
3. 新規旅行作成で方面選択が表示されるか確認
4. 既存の旅行で方面が表示されるか確認

## 重要な注意事項

⚠️ **本番環境でのMigration実行前に必ず:**
1. データベースのバックアップを取る
2. 少数のテストユーザーで動作確認
3. RLS設定が正しいことを確認（他ユーザーのデータが見えないこと）

## トラブルシューティング

### 方面が表示されない場合
1. ブラウザの開発者ツールでネットワークタブを確認
2. Supabaseへのリクエストでdestinationフィールドが含まれているか確認
3. コンソールエラーを確認

### RLSエラーが発生する場合
1. ログイン状態を確認
2. auth.uid()が正しく取得できているか確認
3. ポリシーが正しく設定されているか確認

## 関連ファイル
- `/supabase/migrations/20250819_add_destination_to_production.sql`
- `/supabase/migrations/20250820_enable_trips_rls_production.sql`
- `/src/components/TripForm.jsx` - 方面選択UI
- `/src/components/TripList.jsx` - カレンダー表示
- `/src/components/TripDetail.jsx` - 詳細表示