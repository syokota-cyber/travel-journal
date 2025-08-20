-- 本番環境用: tripsテーブルのRLS有効化
-- 作成日: 2025年8月20日
-- 目的: 開発環境で無効化されていたRLSを本番環境で有効化

-- 1. RLS有効化（本番環境必須）
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 2. 既存ポリシーの確認（もし存在しなければ作成）
-- ユーザーは自分の旅行のみ閲覧可能
CREATE POLICY IF NOT EXISTS "Users can view own trips" 
ON trips FOR SELECT 
USING (auth.uid() = user_id);

-- ユーザーは自分の旅行を作成可能
CREATE POLICY IF NOT EXISTS "Users can insert own trips" 
ON trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の旅行のみ更新可能
CREATE POLICY IF NOT EXISTS "Users can update own trips" 
ON trips FOR UPDATE 
USING (auth.uid() = user_id);

-- ユーザーは自分の旅行のみ削除可能
CREATE POLICY IF NOT EXISTS "Users can delete own trips" 
ON trips FOR DELETE 
USING (auth.uid() = user_id);

-- 確認クエリ
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'trips';