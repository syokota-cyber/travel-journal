import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません');
  throw new Error('Supabase設定エラー');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase本番モード接続完了');