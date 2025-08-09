import { createClient } from '@supabase/supabase-js'

// 最新の正しいanon keyに更新
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rwxllvnuuxabvgxpeuma.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGxsdm51dXhhYnZneHBldW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTg2MzksImV4cCI6MjA2OTQzNDYzOX0.G39Y6jMLK8whv4ayZxOOUb54Z2ohiprMjYE-Au8Edv0'

// 開発環境でのみデバッグ情報を出力
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase設定デバッグ情報:');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey?.substring(0, 30) + '...' || 'undefined');
}

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