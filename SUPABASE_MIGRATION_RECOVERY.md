# 🚀 Supabase Migration完全復旧手順

## 📊 発見された Migration ファイル

✅ **完全なデータセットを発見！**  
`/Users/syokota_mac/Desktop/claude-code/learning-projects/camping-car-apps/supabase/migrations/`

### 📁 利用可能なファイル
```
20240730_create_tables.sql           - 基本テーブル構造
20250131_purpose_checklist_tables.sql - 目的・チェックリスト関連
20250131_insert_purposes_data.sql     - メイン・サブ目的データ
20250131_insert_default_items.sql     - デフォルト持ち物データ  
20250131_enable_rls.sql              - セキュリティ設定
20250135_all_data_and_rls.sql        - 統合データ+RLS
20250201_create_rules_manners.sql     - 旅行マナー機能
20250201_insert_rules_data.sql       - マナーデータ
20250201_create_trip_reviews.sql     - レビュー機能
20250803_add_family_pet_other_purposes.sql - 追加目的
```

## ⚡ 制限解除後の即座復旧

### **Method 1: Supabase CLI使用（推奨）**

```bash
# プロジェクトディレクトリに移動
cd /Users/syokota_mac/Desktop/claude-code/learning-projects/camping-car-apps

# Supabase CLIでログイン（未ログインの場合）
supabase login

# プロジェクトをリンク
supabase link --project-ref rwxllvnuuxabvgxpeuma

# マイグレーション実行（全体）
supabase db push

# または個別実行
supabase db reset --db-url "postgresql://postgres:[password]@db.rwxllvnuuxabvgxpeuma.supabase.co:5432/postgres"
```

### **Method 2: SQL Editorで個別実行**

制限解除確認後、以下の順序で実行：

#### **Step 1: テーブル構造作成**
```sql
-- 20250131_purpose_checklist_tables.sql の内容実行
-- CREATE TABLEステートメントすべて
```

#### **Step 2: データ投入**
```sql  
-- 20250131_insert_purposes_data.sql 実行
-- メイン目的（16件）+ サブ目的（11件）

-- 20250131_insert_default_items.sql 実行  
-- 各目的に対応する持ち物データ
```

#### **Step 3: セキュリティ設定**
```sql
-- 20250131_enable_rls.sql 実行
-- Row Level Security有効化
```

## 📋 復旧後確認項目

### **データ件数確認**
```sql
SELECT 'main_purposes' as table_name, COUNT(*) as count FROM main_purposes
UNION ALL
SELECT 'sub_purposes', COUNT(*) FROM sub_purposes  
UNION ALL
SELECT 'default_items', COUNT(*) FROM default_items;
```

**期待する結果:**
- main_purposes: 16件
- sub_purposes: 11件  
- default_items: 85件（各目的×5件）

### **アプリ動作確認**
```bash
# 開発サーバー再起動
cd travel-journal
lsof -ti:3000 | xargs kill -9 && npm start
```

**確認項目:**
- [x] ログイン機能
- [ ] メイン目的表示（16件）
- [ ] サブ目的表示（11件）
- [ ] 持ち物提案表示  
- [ ] 新規旅行作成
- [ ] データ保存

## 💡 Migration内容の詳細

### **メイン目的 (16件)**
```
観光, SUP・カヤック, サイクリング, スキー・スノーボード,
登山・ハイキング, フルーツ狩り, 夜景撮影, 天体観測,
日の出・夕陽撮影, 海水浴・シュノーケリング, 潮干狩り,
花見, 紅葉狩り, 野鳥観察, 釣り, 鉄道撮影
```

### **サブ目的 (11件)**  
```
温泉, 道の駅, バーベキュー, キャンプ場, RVパーク,
地元グルメ, 地元特産品店, 展望台, 文化財・史跡訪問,
国立公園, 景勝地
```

### **持ち物テンプレート**
各メイン目的に対して5件ずつの専門的な持ち物リスト

## 🚨 注意事項

### **1. 実行前の制限解除確認**
```bash
# テスト用の簡単な接続確認
node connection-test.js
# "relation does not exist" エラーが出なくなったら実行可能
```

### **2. データの重複防止**  
- Migrationファイルには `INSERT` のみ
- テーブルのデータは事前にクリアされている想定
- 重複が心配な場合は `DELETE` を先に実行

### **3. RLS (Row Level Security)**
- セキュリティポリシーも Migration に含まれる
- 認証済みユーザーのアクセス制御が自動適用

## ⏰ 復旧予想時間

- **Migration実行**: 1-2分
- **アプリ再起動**: 1分  
- **動作確認**: 3-5分
- **合計**: 約10分で完全復旧

---

**📅 作成**: 2025年8月9日  
**🎯 優位性**: 元々のデータ構造を完全復元  
**🔒 安全性**: 既存のRLSポリシー維持