# データベース構造とデータ保存方式

## 📊 現在のデータ保存状況

### ✅ Supabase（クラウドDB）で管理
以下のデータは正常にSupabaseで保存・管理されています：

#### 1. **trips** テーブル
- 旅行の基本情報（タイトル、日付、ステータス）
- ユーザーごとの旅行一覧
- **動作状況**: ✅ 正常

#### 2. **trip_purposes** テーブル
- 選択されたメイン目的・サブ目的
- カスタム目的の保存
- **動作状況**: ✅ 正常

#### 3. **trip_reviews** テーブル
- 旅行完了後のレビューデータ
- 目的達成度、持ち物活用度
- **動作状況**: ✅ 正常

#### 4. **main_purposes** テーブル（マスタデータ）
- メイン目的の選択肢
- **動作状況**: ✅ 正常

#### 5. **sub_purposes** テーブル（マスタデータ）
- サブ目的の選択肢
- **動作状況**: ✅ 正常

#### 6. **default_items** テーブル（マスタデータ）
- メイン目的に連動するおすすめ持ち物
- **動作状況**: ✅ 正常

#### 7. **rules_and_manners** テーブル（マスタデータ）
- ルール・マナー情報
- **動作状況**: ✅ 正常

---

### 📱 localStorage（ブラウザ）で管理
以下のデータはブラウザのlocalStorageで管理されています：

#### 1. **持ち物チェック状態**
- キー: `trip_${tripId}_checked_items`
- 内容: チェック済みアイテムのID配列
- 形式: JSON配列
- 例: `["item_699b3dd9-f284-402e-865c-41e53dfc9e83", ...]`

#### 2. **カスタム持ち物**
- キー: `trip_${tripId}_custom_items`
- 内容: カスタム追加されたアイテム
- 形式: JSONオブジェクト配列
- 例: `[{"id":"custom_1754545863932","name":"サングラス","isCustom":true}]`

#### 3. **認証トークン**
- Supabase認証用のトークン
- Cognito関連のトークン（AWS連携用）

---

## ⚠️ 存在しないテーブル（エラーの原因）

### ❌ **trip_items** テーブル
- **状態**: 存在しない
- **元の用途**: 持ち物の保存
- **代替方法**: localStorageで管理
- **エラーメッセージ**: `relation "public.trip_items" does not exist`

### ❌ **trip_checklists** テーブル
- **状態**: 存在しない
- **元の用途**: チェックリストの保存
- **代替方法**: localStorageで管理

---

## 🔄 データ同期の仕組み

### 現在の実装
1. **旅行基本情報**: Supabase ↔ フロントエンド
2. **持ち物データ**: localStorage（ブラウザ単体）
3. **レビューデータ**: Supabase ↔ フロントエンド

### 注意点
- 持ち物データはブラウザごとに独立
- 異なるデバイス間では同期されない
- ブラウザのデータクリアで持ち物情報は失われる

---

## 📈 今後の改善案

### Option 1: Supabaseテーブルの作成
```sql
-- trip_itemsテーブルの作成案
CREATE TABLE trip_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  is_checked BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_trip_items_trip_id ON trip_items(trip_id);
```

### Option 2: 現状維持
- localStorageでの管理を継続
- シンプルで高速
- オフライン対応

### Option 3: ハイブリッド方式
- 重要データはSupabase
- 一時データはlocalStorage
- 定期的な同期処理

---

## 📝 メンテナンスノート

**最終更新**: 2025-08-07
**更新者**: Claude Code
**次回レビュー予定**: 2025-09-01