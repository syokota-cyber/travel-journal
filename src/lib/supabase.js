import { createClient } from '@supabase/supabase-js'

// 環境変数から設定を取得（フォールバック値を削除してセキュリティ強化）
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 環境変数が設定されていない場合はエラーを投げる
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。REACT_APP_SUPABASE_URLとREACT_APP_SUPABASE_ANON_KEYを設定してください。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)