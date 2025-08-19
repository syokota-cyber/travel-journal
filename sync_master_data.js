#!/usr/bin/env node
/**
 * 本番環境 → 開発環境 マスターデータ同期スクリプト
 * 
 * 使用方法:
 *   node sync_master_data.js
 * 
 * 前提条件:
 *   - ローカルのSupabaseが起動している
 *   - 本番環境のAPIキーが設定されている
 *   - production_*.jsonファイルが存在する
 * 
 * 実行される処理:
 *   1. 本番環境からマスターデータを取得 (curl)
 *   2. 開発環境のマスターデータをクリア
 *   3. 本番データを開発環境に投入
 *   4. 同期履歴を記録
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// 設定
const CONFIG = {
  PRODUCTION_URL: 'https://rwxllvnuuxabvgxpeuma.supabase.co',
  PRODUCTION_KEY: process.env.PRODUCTION_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eGxsdm51dXhhYnZneHBldW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTg2MzksImV4cCI6MjA2OTQzNDYzOX0.G39Y6jMLK8whv4ayZxOOUb54Z2ohiprMjYE-Au8Edv0',
  LOCAL_DB: 'postgresql://postgres:postgres@localhost:54322/postgres',
  TABLES: [
    { name: 'main_purposes', columns: ['id', 'name', 'display_order'] },
    { name: 'sub_purposes', columns: ['id', 'name', 'display_order'] },
    { name: 'default_items', columns: ['id', 'main_purpose_id', 'name', 'display_order'] },
    { name: 'travel_rules', columns: ['id', 'main_purpose_id', 'rule_category', 'rule_title', 'rule_description', 'is_required', 'display_order', 'created_at', 'updated_at'] }
  ]
};

/**
 * ログ出力
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type] || '📝';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * 本番環境からマスターデータを取得
 */
function fetchProductionData() {
  log('本番環境からマスターデータを取得中...', 'info');
  
  CONFIG.TABLES.forEach(table => {
    try {
      const filename = `production_${table.name}.json`;
      const cmd = `curl -s "${CONFIG.PRODUCTION_URL}/rest/v1/${table.name}?select=*" -H "apikey: ${CONFIG.PRODUCTION_KEY}"`;
      
      log(`📥 ${table.name} データを取得中...`);
      const result = execSync(cmd, { encoding: 'utf8' });
      
      // JSONの妥当性をチェック
      const data = JSON.parse(result);
      if (!Array.isArray(data)) {
        throw new Error(`Invalid data format for ${table.name}`);
      }
      
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      log(`📁 ${filename} に ${data.length} 件のデータを保存`, 'success');
      
    } catch (error) {
      log(`${table.name} の取得に失敗: ${error.message}`, 'error');
      throw error;
    }
  });
}

/**
 * 開発環境のマスターデータをクリア
 */
function clearDevelopmentData() {
  log('開発環境のマスターデータをクリア中...', 'info');
  
  try {
    const tableNames = CONFIG.TABLES.map(t => t.name).join(', ');
    const cmd = `psql "${CONFIG.LOCAL_DB}" -c "TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;"`;
    
    execSync(cmd, { stdio: 'pipe' });
    log('🧹 開発環境のデータクリア完了', 'success');
    
  } catch (error) {
    log(`データクリアに失敗: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * SQLエスケープ処理
 */
function escapeSql(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // 文字列の場合、シングルクォートをエスケープ
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * 本番データを開発環境に投入
 */
function insertProductionData() {
  log('本番データを開発環境に投入中...', 'info');
  
  CONFIG.TABLES.forEach(table => {
    try {
      const filename = `production_${table.name}.json`;
      if (!fs.existsSync(filename)) {
        throw new Error(`File not found: ${filename}`);
      }
      
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      if (data.length === 0) {
        log(`⚠️ ${table.name} にデータがありません`, 'warning');
        return;
      }
      
      log(`📥 ${table.name} に ${data.length} 件のデータを投入中...`);
      
      // INSERT文を生成
      const columns = table.columns.join(', ');
      const values = data.map(row => {
        const rowValues = table.columns.map(col => escapeSql(row[col])).join(', ');
        return `(${rowValues})`;
      }).join(',\n  ');
      
      const sql = `INSERT INTO ${table.name} (${columns}) VALUES\n  ${values};`;
      
      // SQLファイルに保存して実行
      const sqlFile = `insert_${table.name}.sql`;
      fs.writeFileSync(sqlFile, sql);
      
      execSync(`psql "${CONFIG.LOCAL_DB}" -f ${sqlFile}`, { stdio: 'pipe' });
      log(`✅ ${table.name} への投入完了 (${data.length} 件)`, 'success');
      
    } catch (error) {
      log(`${table.name} の投入に失敗: ${error.message}`, 'error');
      throw error;
    }
  });
}

/**
 * データ同期の検証
 */
function verifySync() {
  log('データ同期の検証中...', 'info');
  
  try {
    // 各テーブルのレコード数を確認
    const countSql = CONFIG.TABLES.map(table => 
      `SELECT '${table.name}' as table_name, count(*) as count FROM ${table.name}`
    ).join('\nUNION ALL\n');
    
    const result = execSync(
      `psql "${CONFIG.LOCAL_DB}" -c "${countSql}" -t`,
      { encoding: 'utf8' }
    );
    
    log('📊 同期後のテーブル状況:', 'info');
    console.log(result);
    
    // 重複データの確認
    const duplicateCheckTables = ['main_purposes', 'sub_purposes'];
    for (const tableName of duplicateCheckTables) {
      const duplicateResult = execSync(
        `psql "${CONFIG.LOCAL_DB}" -c "SELECT count(*) - count(DISTINCT name) as duplicates FROM ${tableName}" -t`,
        { encoding: 'utf8' }
      );
      
      const duplicates = parseInt(duplicateResult.trim());
      if (duplicates > 0) {
        log(`⚠️ ${tableName} に ${duplicates} 件の重複があります`, 'warning');
      }
    }
    
    log('✅ データ同期検証完了', 'success');
    
  } catch (error) {
    log(`検証に失敗: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 同期履歴を記録
 */
function recordSyncHistory() {
  log('同期履歴を記録中...', 'info');
  
  try {
    const timestamp = new Date().toISOString();
    const version = `${new Date().toISOString().split('T')[0]}-${Date.now()}`;
    const historyEntry = `${timestamp}: Production master data sync completed (version: ${version})\n`;
    
    fs.appendFileSync('sync_history.log', historyEntry);
    
    // Gitコミット（オプション）
    if (process.argv.includes('--commit')) {
      try {
        execSync('git add production_*.json sync_history.log', { stdio: 'pipe' });
        execSync(`git commit -m "🔄 Production master data sync - ${version}"`, { stdio: 'pipe' });
        log('📝 Gitコミット完了', 'success');
      } catch (gitError) {
        log(`Gitコミットに失敗: ${gitError.message}`, 'warning');
      }
    }
    
    log('📋 同期履歴記録完了', 'success');
    
  } catch (error) {
    log(`履歴記録に失敗: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  const startTime = Date.now();
  
  try {
    log('🚀 本番環境 → 開発環境 マスターデータ同期開始', 'info');
    
    // 1. 本番データ取得
    fetchProductionData();
    
    // 2. 開発環境クリア
    clearDevelopmentData();
    
    // 3. データ投入
    insertProductionData();
    
    // 4. 検証
    verifySync();
    
    // 5. 履歴記録
    recordSyncHistory();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    log(`🎉 マスターデータ同期完了！ (実行時間: ${duration}秒)`, 'success');
    
  } catch (error) {
    log(`❌ 同期処理に失敗しました: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}

module.exports = {
  fetchProductionData,
  clearDevelopmentData,
  insertProductionData,
  verifySync,
  recordSyncHistory
};