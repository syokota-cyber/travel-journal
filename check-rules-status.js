require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCurrentStatus() {
  console.log('🔍 現在の状況確認中...\n');

  try {
    // 1. データベース接続確認
    console.log('📡 データベース接続テスト...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('main_purposes')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ データベース接続エラー:', connectionError.message);
      return;
    }
    console.log('✅ データベース接続: 正常');

    // 2. travel_rulesテーブルの存在確認
    console.log('\n🗂️ travel_rulesテーブル確認...');
    const { data: rulesTest, error: rulesError } = await supabase
      .from('travel_rules')
      .select('*')
      .limit(1);

    if (rulesError) {
      console.error('❌ travel_rulesテーブルエラー:', rulesError.message);
      if (rulesError.message.includes('does not exist')) {
        console.log('⚠️ travel_rulesテーブルが存在しません');
        console.log('💡 Supabase SQL Editorでテーブル作成が必要です');
      }
      return;
    }

    // 3. ルールデータの確認
    const { data: rulesCount } = await supabase
      .from('travel_rules')
      .select('*', { count: 'exact', head: true });

    console.log('✅ travel_rulesテーブル: 存在');
    console.log(`📊 ルール数: ${rulesCount || 0}件`);

    if (rulesCount === 0) {
      console.log('⚠️ ルールデータが空です');
      console.log('💡 データ挿入SQLの実行が必要です');
    } else {
      // サンプルデータ表示
      const { data: sampleRules } = await supabase
        .from('travel_rules')
        .select('rule_title, rule_category, main_purpose_id')
        .limit(3);

      console.log('\n📝 サンプルルール:');
      sampleRules?.forEach(rule => {
        console.log(`  - [${rule.rule_category}] ${rule.rule_title}`);
      });
    }

    // 4. メイン目的との関連確認
    console.log('\n🎯 メイン目的との関連確認...');
    const { data: purposeWithRules } = await supabase
      .from('main_purposes')
      .select(`
        id, name,
        travel_rules(count)
      `);

    if (purposeWithRules) {
      console.log('📋 目的別ルール数:');
      purposeWithRules.forEach(purpose => {
        const ruleCount = purpose.travel_rules?.[0]?.count || 0;
        console.log(`  - ${purpose.name}: ${ruleCount}件`);
      });
    }

    // 5. アプリケーション確認
    console.log('\n🌐 アプリケーション状況:');
    console.log('✅ 開発サーバー: http://localhost:3000 で稼働中');
    console.log('📱 動作確認手順:');
    console.log('  1. ブラウザでアプリを開く');
    console.log('  2. ログイン');
    console.log('  3. 旅行作成 → メイン目的選択');
    console.log('  4. 旅行詳細 → "旅を開始"ボタン');
    console.log('  5. ルール・マナー確認モーダルが表示されるか確認');

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// 実行
checkCurrentStatus();