# 🔄 データベース復旧戦略とデータ保護対策

## 📊 今回の問題分析

### **発生した問題**
- **症状**: メイン目的・サブ目的が表示されない
- **原因**: マスタデータの消失（テーブル構造は残存）
- **根本原因**: 初期データがGitで管理されていない

### **推測される消失経緯**
1. **8月7日頃**: 手動でSupabaseにデータ投入、正常動作
2. **8月8-9日**: 認証問題対応中にデータが消失
3. **Git復旧**: コードは復旧、データは復旧されず

---

## 🚀 即座の解決方法

### **Step 1: データ投入実行**
```sql
-- insert-data-only.sql を実行
-- ✅ 重複防止機能付き
-- ✅ 安全な実行
```

### **Step 2: 動作確認**
- メイン目的: 10種類表示確認
- サブ目的: 25種類表示確認  
- 持ち物: カテゴリと必需品表示確認

---

## 🛡️ 今後のデータ保護対策

### **1. 初期データのGit管理**
```bash
# データ投入SQLをGitに追加
git add insert-data-only.sql
git commit -m "feat: 初期マスタデータ投入SQL追加"
git push

# 今後のデータ変更も必ずGitで管理
```

### **2. データバックアップの定期実行**
```sql
-- 月1回実行推奨
-- Supabase SQL Editorで実行
COPY (SELECT * FROM main_purposes) TO '/tmp/main_purposes_backup.csv' CSV HEADER;
COPY (SELECT * FROM sub_purposes) TO '/tmp/sub_purposes_backup.csv' CSV HEADER;
COPY (SELECT * FROM item_categories) TO '/tmp/item_categories_backup.csv' CSV HEADER;
COPY (SELECT * FROM item_templates) TO '/tmp/item_templates_backup.csv' CSV HEADER;
```

### **3. 開発環境の分離**
```bash
# 本番用プロジェクト（現在）
PROD_PROJECT_ID=rwxllvnuuxabvgxpeuma

# 開発用プロジェクトの作成を推奨
DEV_PROJECT_ID=travel-journal-dev
```

### **4. データ検証スクリプトの定期実行**
```javascript
// weekly-data-check.js（週1回実行）
const checkEssentialData = async () => {
  const tables = ['main_purposes', 'sub_purposes', 'item_categories'];
  for (const table of tables) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (count === 0) {
      console.error(`🚨 ${table}のデータが消失しています！`);
      // Slack/Email通知ロジック
    }
  }
};
```

---

## 📋 チェックリスト（今後の開発）

### **データベース変更時**
- [ ] SQLファイルをGitにコミット
- [ ] 本番適用前にローカルで検証
- [ ] バックアップを事前取得
- [ ] 段階的適用（テーブル→データの順）

### **デバッグ・実験時**
- [ ] 本番環境での実験は避ける
- [ ] 開発環境での検証を優先
- [ ] データ変更前のスナップショット取得

### **定期メンテナンス**
- [ ] 月1回: データ整合性チェック
- [ ] 月1回: バックアップ実行
- [ ] 四半期1回: 復旧テスト実行

---

## 🔄 復旧手順書

### **緊急時（データ消失発生）**
1. **影響範囲の確認**
   ```bash
   node check-existing-tables.js
   ```

2. **バックアップからの復旧**
   ```sql
   -- バックアップファイルが存在する場合
   \copy main_purposes FROM '/path/to/backup.csv' CSV HEADER;
   ```

3. **初期データからの復旧**
   ```sql
   -- バックアップがない場合
   -- insert-data-only.sql を実行
   ```

4. **動作確認**
   ```bash
   node check-purpose-data.js
   node check-items-data.js
   ```

---

## 💡 学んだ教訓

### **GitとSupabaseの関係**
- **コード**: Git管理 ✅
- **スキーマ**: マイグレーションファイルで管理すべき
- **初期データ**: SQLファイルで管理すべき
- **ユーザーデータ**: Supabaseのみ（バックアップ重要）

### **開発フローの改善**
1. **スキーマ変更**: マイグレーションファイル作成
2. **初期データ**: シードファイル作成  
3. **Git管理**: 上記2つを必ずコミット
4. **本番適用**: 段階的かつ慎重に

### **リスク管理**
- 本番環境での直接操作を最小化
- 開発環境での十分な検証
- データベース操作の記録・履歴管理

---

**📅 作成日**: 2025年8月9日  
**📝 作成者**: Claude Code Assistant  
**🔄 次回レビュー**: 2025年9月9日