import { createClient } from '@supabase/supabase-js'

// 認証には anon key (JWT形式) が必要
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rwxllvnuuxabvgxpeuma.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGxsdm51dXhhYnZneHBldW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzI4NjQsImV4cCI6MjA1MTI0ODg2NH0.Kj8vX7nC3QV5mE2dF7hB1pL9sW6tR4uY8oI0qA3zN5M'

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