const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmail() {
  console.log('📧 メール送信テスト開始...\n');
  
  // 実在するメールアドレスを使用
  const testEmail = 'shin1yokota@gmail.com';
  
  try {
    console.log('1️⃣ パスワードリセットメールのテスト');
    console.log(`   送信先: ${testEmail}`);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${process.env.REACT_APP_URL || 'http://localhost:3000'}/reset-password`,
    });
    
    if (error) {
      console.error('❌ エラー:', error.message);
      console.error('   詳細:', error);
      
      if (error.message.includes('Email address not authorized')) {
        console.log('\n⚠️ デフォルトSMTPの制限に引っかかっています');
        console.log('   カスタムSMTPの設定が必要です');
      } else if (error.message.includes('Rate limit')) {
        console.log('\n⚠️ レート制限に達しました（1時間2通まで）');
        console.log('   カスタムSMTPの設定が必要です');
      }
    } else {
      console.log('✅ メール送信成功！');
      console.log('   メールボックスを確認してください');
      console.log('\n📊 送信結果:', data);
    }
    
    console.log('\n2️⃣ Resendダッシュボードでの確認方法:');
    console.log('   1. https://resend.com/emails にアクセス');
    console.log('   2. 送信履歴を確認');
    console.log('   3. 配信状態（Delivered/Bounced/Pending）を確認');
    
  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }
  
  console.log('\n📝 トラブルシューティング:');
  console.log('   - Supabaseダッシュボード → Settings → Authentication → SMTP Settings');
  console.log('   - Enable Custom SMTP がONになっているか確認');
  console.log('   - ResendのAPIキーが正しく設定されているか確認');
  console.log('   - Sender emailが正しいドメインになっているか確認');
}

testEmail();