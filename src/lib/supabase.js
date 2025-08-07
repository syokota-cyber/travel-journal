import { createClient } from '@supabase/supabase-js'

// 暫定対応: 直接値を指定（環境変数が読み込まれない場合）
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rwxllvnuuxabvgxpeuma.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_iocv0OdvU4tJ1ENbCGskug_hOaJccJr'

console.log('🔍 Supabase設定デバッグ情報:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey?.substring(0, 30) + '...' || 'undefined');

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