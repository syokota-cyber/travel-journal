const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('🔍 テストユーザー作成開始...');
  
  const email = 'test@camping-car.com';
  const password = 'test123456';
  
  try {
    // 既存ユーザーでログイン試行
    console.log('\n📊 既存ユーザーでログイン試行...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInData?.user) {
      console.log('✅ 既存ユーザーでログイン成功！');
      console.log('ユーザーID:', signInData.user.id);
      console.log('メール:', signInData.user.email);
      return;
    }
    
    if (signInError) {
      console.log('⚠️ ログイン失敗:', signInError.message);
      console.log('新規ユーザーを作成します...');
    }
    
    // 新規ユーザー作成
    console.log('\n📊 新規ユーザー作成...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'テストユーザー'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ ユーザー作成エラー:', signUpError.message);
      console.error('詳細:', signUpError);
      return;
    }
    
    if (signUpData?.user) {
      console.log('✅ ユーザー作成成功！');
      console.log('ユーザーID:', signUpData.user.id);
      console.log('メール:', signUpData.user.email);
      console.log('確認メール送信状態:', signUpData.user.email_confirmed_at ? '確認済み' : '未確認');
      
      if (!signUpData.user.email_confirmed_at) {
        console.log('\n⚠️ メール確認が必要です。');
        console.log('開発環境のため、自動確認を試みます...');
      }
    }
    
  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }
}

createTestUser();