require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function restoreRulesAndManners() {
  console.log('🔧 ルール・マナーテーブルの復元開始...\n');

  try {
    // 1. まず既存のテーブルを確認
    console.log('📋 既存テーブルの確認...');
    const { data: existingRules, error: checkError } = await supabase
      .from('travel_rules')
      .select('*')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('⚠️ travel_rulesテーブルが存在しません。作成します...\n');
      
      // テーブル作成SQLを実行
      const createTableSQL = `
        -- ルール・マナーテーブルの作成
        CREATE TABLE IF NOT EXISTS travel_rules (
            id BIGSERIAL PRIMARY KEY,
            main_purpose_id UUID REFERENCES main_purposes(id) ON DELETE CASCADE,
            rule_category VARCHAR(50) NOT NULL,
            rule_title VARCHAR(100) NOT NULL,
            rule_description TEXT NOT NULL,
            is_required BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- インデックス作成
        CREATE INDEX IF NOT EXISTS idx_travel_rules_main_purpose_id ON travel_rules(main_purpose_id);
        CREATE INDEX IF NOT EXISTS idx_travel_rules_category ON travel_rules(rule_category);
        CREATE INDEX IF NOT EXISTS idx_travel_rules_display_order ON travel_rules(display_order);
      `;

      // Supabase SQL Editorで実行する必要があることを通知
      console.log('❗ 以下のSQLをSupabase SQL Editorで実行してください:');
      console.log('-------------------------------------------');
      console.log(createTableSQL);
      console.log('-------------------------------------------\n');
      console.log('実行後、このスクリプトを再実行してください。');
      return;
    }

    if (existingRules && existingRules.length > 0) {
      console.log('✅ travel_rulesテーブルは既に存在し、データがあります');
      
      // 既存データの確認
      const { data: rulesCount } = await supabase
        .from('travel_rules')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 現在のルール数: ${rulesCount}件\n`);
      console.log('❓ 既存データを削除して再作成しますか？ (y/n)');
      // 実際のプロンプトは省略（手動確認が必要）
      return;
    }

    // 2. メイン目的のIDを取得
    console.log('🎯 メイン目的を取得中...');
    const { data: mainPurposes, error: purposesError } = await supabase
      .from('main_purposes')
      .select('id, name')
      .order('display_order');

    if (purposesError) {
      console.error('❌ メイン目的の取得エラー:', purposesError);
      return;
    }

    console.log(`✅ ${mainPurposes.length}個のメイン目的を取得\n`);

    // 3. ルールデータを挿入
    console.log('📝 ルールデータを挿入中...');
    
    // 全般的なルール（全ての目的に適用）
    const generalRules = [
      {
        rule_category: 'general',
        rule_title: 'ゴミの持ち帰り',
        rule_description: 'ゴミは必ず持ち帰り、現地に残さないようにしましょう。自然環境の保護にご協力ください。',
        is_required: true,
        display_order: 1
      },
      {
        rule_category: 'general',
        rule_title: 'アイドリング禁止',
        rule_description: '不要なアイドリングは避け、環境に配慮した運転を心がけましょう。',
        is_required: true,
        display_order: 2
      },
      {
        rule_category: 'general',
        rule_title: '地元住民への配慮',
        rule_description: '地元住民の生活に迷惑をかけない行動を心がけ、騒音や駐車マナーに注意しましょう。',
        is_required: true,
        display_order: 3
      }
    ];

    // 各メイン目的に全般的なルールを追加
    for (const purpose of mainPurposes) {
      for (const rule of generalRules) {
        const { error } = await supabase
          .from('travel_rules')
          .insert({
            main_purpose_id: purpose.id,
            ...rule
          });
        
        if (error) {
          console.error(`❌ ルール挿入エラー (${purpose.name}):`, error.message);
        }
      }
    }
    
    console.log('✅ 全般的なルールを挿入完了');

    // 特定目的用のルール
    const specificRules = [
      {
        namePattern: ['登山', 'ハイキング'],
        rules: [
          {
            rule_category: 'specific',
            rule_title: '登山届けの提出',
            rule_description: '登山届けが必要なエリアでは、必ず事前に提出してください。安全確保のために重要です。',
            is_required: true,
            display_order: 10
          }
        ]
      },
      {
        namePattern: ['釣り'],
        rules: [
          {
            rule_category: 'specific',
            rule_title: '遊漁券の購入',
            rule_description: '遊漁券が必要なエリアでは事前に購入してください。現地の釣具店や組合で購入できます。',
            is_required: true,
            display_order: 10
          },
          {
            rule_category: 'specific',
            rule_title: '遊漁禁止エリアの確認',
            rule_description: '遊漁禁止エリアには絶対に立ち入らないでください。事前に禁止区域を確認しましょう。',
            is_required: true,
            display_order: 11
          }
        ]
      },
      {
        namePattern: ['海水浴', 'シュノーケリング'],
        rules: [
          {
            rule_category: 'specific',
            rule_title: '遊泳禁止エリアの確認',
            rule_description: '遊泳禁止エリアには絶対に入らないでください。安全のため、指定された海水浴場を利用しましょう。',
            is_required: true,
            display_order: 10
          }
        ]
      },
      {
        namePattern: ['撮影', '夜景', '日の出'],
        rules: [
          {
            rule_category: 'specific',
            rule_title: '私有地への立ち入り禁止',
            rule_description: '撮影のために私有地に無断で立ち入ることは禁止されています。必ず許可を得てから撮影してください。',
            is_required: true,
            display_order: 10
          },
          {
            rule_category: 'specific',
            rule_title: '肖像権への配慮',
            rule_description: '人物が写る撮影では、必ず事前に許可を得てください。特に子供の撮影には注意が必要です。',
            is_required: true,
            display_order: 11
          }
        ]
      },
      {
        namePattern: ['観光'],
        rules: [
          {
            rule_category: 'specific',
            rule_title: '文化財の保護',
            rule_description: '史跡や文化財では、指定されたルールを守り、損傷させないよう注意してください。',
            is_required: true,
            display_order: 10
          }
        ]
      }
    ];

    // 特定目的用のルールを追加
    for (const purposeRules of specificRules) {
      const matchingPurposes = mainPurposes.filter(p => 
        purposeRules.namePattern.some(pattern => p.name.includes(pattern))
      );

      for (const purpose of matchingPurposes) {
        console.log(`📍 ${purpose.name}用のルールを追加中...`);
        for (const rule of purposeRules.rules) {
          const { error } = await supabase
            .from('travel_rules')
            .insert({
              main_purpose_id: purpose.id,
              ...rule
            });
          
          if (error) {
            console.error(`❌ ルール挿入エラー (${purpose.name}):`, error.message);
          }
        }
      }
    }

    console.log('✅ 特定目的用のルールを挿入完了\n');

    // 4. 結果確認
    const { data: finalCount } = await supabase
      .from('travel_rules')
      .select('*', { count: 'exact', head: true });

    console.log('🎉 ルール・マナーデータの復元完了！');
    console.log(`📊 合計${finalCount}件のルールを作成しました`);

    // サンプル表示
    const { data: sampleRules } = await supabase
      .from('travel_rules')
      .select('rule_title, rule_category')
      .limit(5);

    console.log('\n📝 サンプルルール:');
    sampleRules.forEach(rule => {
      console.log(`  - [${rule.rule_category}] ${rule.rule_title}`);
    });

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// 実行
restoreRulesAndManners();