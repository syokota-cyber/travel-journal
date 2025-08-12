const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://rwxllvnuuxabvgxpeuma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGxsdm51dXhhYnZneHBldW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTg2MzksImV4cCI6MjA2OTQzNDYzOX0.G39Y6jMLK8whv4ayZxOOUb54Z2ohiprMjYE-Au8Edv0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAndLoginUser() {
  console.log('🚀 ユーザー作成プロセス開始...\n');
  
  // ユニークなメールアドレスを生成（実際のメール形式）
  const timestamp = Date.now();
  const email = `developer.test.${timestamp}@gmail.com`;
  const password = 'TestPassword123!';
  
  console.log('📧 作成するアカウント情報:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');
  
  // 1. 新規ユーザー作成
  console.log('1️⃣ 新規ユーザー作成中...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        // ユーザーメタデータ（オプション）
        display_name: 'Test Developer',
        created_at: new Date().toISOString()
      }
    }
  });
  
  if (signUpError) {
    console.error('❌ サインアップエラー:', signUpError.message);
    return;
  }
  
  console.log('✅ ユーザー作成成功!');
  console.log('ユーザーID:', signUpData.user?.id);
  console.log('');
  
  // 2. メール確認をスキップしてログイン試行
  console.log('2️⃣ ログインテスト中...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (signInError) {
    if (signInError.message === 'Email not confirmed') {
      console.log('⚠️  メール確認が必要です。');
      console.log('');
      console.log('📋 次のステップ:');
      console.log('1. Supabaseダッシュボード → Authentication → Users');
      console.log('2. 作成されたユーザーを探す:', email);
      console.log('3. "..." メニューから "Confirm email" を選択');
      console.log('');
      console.log('または、メール確認を無効化:');
      console.log('1. Authentication → Providers → Email');
      console.log('2. "Confirm email" のチェックを外す');
    } else {
      console.error('❌ ログインエラー:', signInError.message);
    }
  } else {
    console.log('✅ ログイン成功!');
    console.log('セッショントークン取得済み');
    console.log('');
    console.log('🎉 このアカウントでアプリにログインできます:');
    console.log('Email:', email);
    console.log('Password:', password);
  }
  
  console.log('\n----------------------------');
  console.log('📝 作成されたアカウント情報を保存してください:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('----------------------------\n');
}

// 実行
createAndLoginUser().catch(console.error);