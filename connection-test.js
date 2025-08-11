const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Supabase接続テスト開始...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key (最初の20文字): ${supabaseAnonKey?.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n📊 データベース接続テスト...');
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ データベース接続エラー:', error.message);
      console.error('エラーコード:', error.code);
      console.error('詳細:', error.details);
      
      if (error.code === '42P01') {
        console.log('\n⚠️ テーブルが存在しません。48時間制限がまだ有効の可能性があります。');
      }
    } else {
      console.log('✅ データベース接続成功！');
      console.log('取得したデータ数:', data?.length || 0);
    }
    
    console.log('\n🔐 認証テスト...');
    const { data: session, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ 認証エラー:', authError.message);
    } else {
      console.log('✅ 認証接続成功！');
      console.log('セッション状態:', session?.session ? 'アクティブ' : 'なし');
    }
    
  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }
}

testConnection();