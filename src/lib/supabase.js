import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  })
}


// 環境変数が読み込まれない場合はエラーを投げる
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase環境変数が設定されていません。' +
    '\nURL: ' + (supabaseUrl || 'undefined') +
    '\nKey: ' + (supabaseAnonKey ? 'set' : 'undefined')
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)