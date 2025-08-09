# 🗄️ Supabase統合管理ガイド

## 📂 データベース関連ファイルの配置

### **現在の実際構造**
```
camping-car-apps/
├── supabase/                      # データベース設定 (プロジェクト外)
│   ├── config.toml               # Supabase CLI設定
│   └── migrations/               # DB変更履歴
│       ├── 20250131_purpose_checklist_tables.sql    # テーブル定義
│       ├── 20250131_insert_purposes_data.sql        # メイン・サブ目的
│       ├── 20250131_insert_default_items.sql        # 持ち物テンプレート
│       ├── 20250131_enable_rls.sql                 # セキュリティ設定
│       └── 他のMigrationファイル
└── travel-journal/               # Reactアプリ
    ├── src/
    ├── docs/
    └── package.json
```

### **管理対象の明確化**

#### **🎯 travel-journal/ 内で管理すべきもの**
```
✅ 直接管理:
- src/ (React アプリケーション)
- docs/ (ドキュメント)  
- package.json (依存関係)
- scripts/ (自動化ツール)
```

#### **🔗 外部参照で管理すべきもの**
```
📋 参照管理:
- ../supabase/ (データベース設定)
  - テーブル構造の参照
  - マスターデータの確認
  - Migration履歴の追跡
```

## 📊 データの分類と役割

### **1. スキーマ定義 (テーブル構造)**
**📁 場所**: `../supabase/migrations/20250131_purpose_checklist_tables.sql`

```sql
-- マスターデータテーブル
main_purposes       (メイン目的マスター)
sub_purposes        (サブ目的マスター)  
default_items       (持ち物テンプレート)

-- ユーザーデータテーブル
trip_purposes       (個人の選択した目的)
trip_checklists     (個人の持ち物リスト)
```

### **2. マスターデータ (静的・基準データ)**
**📁 場所**: `../supabase/migrations/20250131_insert_*_data.sql`

#### **メイン目的 (16種類)**
```
観光, SUP・カヤック, サイクリング, スキー・スノーボード, 
登山・ハイキング, フルーツ狩り, 夜景撮影, 天体観測,
日の出・夕陽撮影, 海水浴・シュノーケリング, 潮干狩り,
花見, 紅葉狩り, 野鳥観察, 釣り, 鉄道撮影
```

#### **サブ目的 (11種類)**
```
温泉, 道の駅, バーベキュー, キャンプ場, RVパーク,
地元グルメ, 地元特産品店, 展望台, 文化財・史跡訪問,
国立公園, 景勝地
```

#### **持ち物テンプレート (85件)**
```
各メイン目的 × 5件の専門用品
例: SUP・カヤック → SUP本体, パドル, ライフジャケット...
```

### **3. ユーザーデータ (動的・個人データ)**
**🏠 格納**: Supabaseデータベース内 (リアルタイム)

```
個人の旅行計画 → trip_purposes
個人の持ち物   → trip_checklists
個人の評価     → trip_reviews
```

## 🔧 開発時のデータベース操作

### **Migration実行手順**
```bash
# プロジェクトルート (camping-car-apps/) で実行
cd /Users/syokota_mac/Desktop/claude-code/learning-projects/camping-car-apps

# Supabaseプロジェクトリンク確認
supabase status

# Migration実行 (制限解除後)
supabase db push

# 特定Migrationのみ実行
supabase db push --dry-run  # 確認
supabase db push            # 実行
```

### **データ確認方法**
```bash
# テーブル一覧確認
supabase db list

# データ確認 (SQL Editor使用)
# Supabase Dashboard → SQL Editor
SELECT * FROM main_purposes ORDER BY display_order;
SELECT * FROM sub_purposes ORDER BY display_order;
```

## 📋 管理ルールの統合

### **travel-journal/ プロジェクト管理ルール**

#### **✅ 直接管理対象**
```
- src/components/*.jsx     (React コンポーネント)
- docs/*.md               (ドキュメント)
- scripts/*.sh            (自動化スクリプト)
- package.json            (依存関係)
```

#### **🔗 参照管理対象**
```
- ../supabase/migrations/ (Migration ファイル)
  → 変更時は必ず確認・テスト
  → 新規Migration作成時は命名規則統一
```

#### **📊 ファイル数基準 (更新版)**
```
travel-journal/ 内:
- MDファイル ≤ 15個
- JSファイル ≤ 10個  
- JSXファイル ≤ 25個

参照対象 (../supabase/):
- Migrationファイル: 制限なし (履歴保持)
- 命名規則: YYYYMMDD_descriptive_name.sql
```

### **Supabase関連作業時の注意事項**

#### **🛑 絶対禁止**
```
❌ travel-journal/ 内でのSQL直接作成
❌ 一時的な*.sqlファイルのルート配置  
❌ Migration履歴の直接編集
❌ マスターデータの不用意な変更
```

#### **✅ 推奨方法**
```
✅ ../supabase/migrations/ での作業
✅ supabase CLI使用
✅ 変更前のバックアップ
✅ 段階的なMigration実行
```

## 🚨 緊急時対応

### **データベースアクセス不可時**
1. **制限確認**: Supabaseダッシュボードで制限状況確認
2. **Migration準備**: 制限解除後の即座実行準備
3. **モックデータ**: `src/data/mockData.js` での一時開発継続

### **Migration失敗時**
```bash
# ロールバック
supabase db reset

# 特定時点復元
supabase db reset --to-timestamp "2025-08-09T00:00:00Z"

# 手動修正後再実行
supabase db push
```

## 📚 参考コマンド集

### **日常操作**
```bash
# プロジェクトディレクトリ移動
cd /Users/syokota_mac/Desktop/claude-code/learning-projects/camping-car-apps

# Supabase状況確認
supabase status

# Migration状況確認  
supabase migration list

# ローカルDB起動 (開発時)
supabase start

# ローカルDB停止
supabase stop
```

### **データ確認**
```bash
# SQL実行 (CLI)
supabase db sql --file migrations/check_data.sql

# テーブル情報
supabase db describe main_purposes
```

## 🎯 統合管理の方針

### **責任分担**
- **travel-journal/**: React アプリの開発・UI/UX
- **../supabase/**: データベース構造・マスターデータ管理

### **連携方法**  
- Migration変更時は必ず動作確認
- 新規データ追加時はMigration作成
- 制限解除後の復旧はMigration一括実行

---

**📅 作成**: 2025年8月9日  
**🎯 目的**: Supabaseとプロジェクト管理の統合  
**🔗 関連**: PROJECT_MANAGEMENT_RULES.md, CLAUDE.md