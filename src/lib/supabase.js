import { createClient } from '@supabase/supabase-js'

// 本番環境のSupabaseに接続（環境変数から取得）
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://rwxllvnuuxabvgxpeuma.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGxsdm51dXhhYnZneHBldW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTg2MzksImV4cCI6MjA2OTQzNDYzOX0.G39Y6jMLK8whv4ayZxOOUb54Z2ohiprMjYE-Au8Edv0';

// 環境変数が設定されていない場合でも動作するように
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase環境変数が設定されていません。デフォルト値を使用します。');
}

// 明示的に本番環境のURLを使用
export const supabase = createClient(
  'https://rwxllvnuuxabvgxpeuma.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGxsdm51dXhhYnZneHBldW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTg2MzksImV4cCI6MjA2OTQzNDYzOX0.G39Y6jMLK8whv4ayZxOOUb54Z2ohiprMjYE-Au8Edv0',
  {
    auth: {
      persistSession: true,
      storageKey: 'travel-journal-auth',
      storage: window.localStorage
    }
  }
)