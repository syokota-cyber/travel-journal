# 🧹 プロジェクト大掃除計画

## 📊 現状の深刻さ

**異常な数字:**
- MDファイル: **2,155個** (通常5-10個)
- JSファイル: **51個** (通常15-20個)
- ルートディレクトリのファイル: **40個以上**

**問題:**
- 管理不能な状態
- どれが最新版か不明
- 動作に必要なファイルが特定困難

## 🎯 整理方針

### **Phase 1: 必須ファイルの特定**

#### **React App Core (絶対必要)**
```
✅ 保持必須:
- package.json, package-lock.json
- src/App.jsx (最新版のみ)
- src/index.jsx
- src/components/*.jsx (最新版のみ)
- src/lib/supabase.js
- public/index.html
- vercel.json
```

#### **Supabase Integration (必要)**
```
✅ 保持:
- supabase/migrations/*.sql
- .env (環境変数)
- .env.vercel (Vercel設定)
```

### **Phase 2: 削除対象ファイル**

#### **重複ファイル (即座削除)**
```
❌ 削除対象:
- src/App.js (App.jsxがあるため)
- src/components/*.js (対応する.jsxがあるため)
- src/index.js (index.jsxがあるため)
```

#### **一時ファイル (削除)**
```
❌ 削除:
- connection-test.js
- simple-insert-test.js  
- check-*.js
- test-auth.js
- execute-sql.js
```

#### **古いドキュメント (統合・削除)**
```
❌ 削除・統合:
- REVIEW_STATE_PERSISTENCE_FIX_V1.md
- REVIEW_STATE_PERSISTENCE_FIX_V2.md  
- REVIEW_STATE_PERSISTENCE_FIX_V3.md
- API_KEY_FIX_GUIDE.md
- AUTHENTICATION_TROUBLESHOOTING_COMPREHENSIVE.md
- TEMPORARY_SOLUTION.md
- RECOVERY_PLAN.md
```

### **Phase 3: 統合・再整理**

#### **必要最小限のドキュメント構成**
```
📁 docs/ (新規作成)
├── README.md (プロジェクト概要)
├── SETUP.md (環境構築手順)
├── DEPLOYMENT.md (デプロイ手順)
├── TROUBLESHOOTING.md (トラブルシューティング)
└── CLAUDE_RULES.md (AI作業ルール)
```

#### **クリーンなフォルダ構成**
```
travel-journal/
├── docs/ (ドキュメント集約)
├── src/ (Reactアプリ)
├── supabase/ (DB設定)
├── public/ (静的ファイル)
├── package.json
├── vercel.json
├── .env
└── .gitignore
```

## 🗂️ ファイル分類表

### **🟢 保持 (Core Files)**
- `src/App.jsx`, `src/index.jsx`
- `src/components/*.jsx` (最新版)
- `src/lib/supabase.js`
- `package.json`, `vercel.json`
- `supabase/migrations/*.sql`

### **🟡 要確認 (Review Needed)**
- 複数バージョンが存在するコンポーネント
- 機能が重複するドキュメント

### **🔴 削除 (Delete)**
- `.js` ファイル（対応する`.jsx`がある場合）
- `*_V1.md`, `*_V2.md` (古いバージョン)
- `test-*.js`, `check-*.js` (一時ファイル)
- `TEMP_*.md`, `FIX_*.md` (解決済み問題)

## ⚡ 実行手順

### **Step 1: バックアップ作成**
```bash
# 現在の状態をバックアップ
cp -r travel-journal travel-journal-backup-$(date +%Y%m%d)
```

### **Step 2: 重複ファイル削除**
```bash
# .js ファイルで対応する .jsx があるものを削除
find src -name "*.js" -exec rm {} \;
```

### **Step 3: 一時ファイル削除**
```bash
# テスト・デバッグファイル削除
rm -f *-test.js check-*.js connection-test.js simple-insert-test.js
```

### **Step 4: ドキュメント整理**
```bash
# docs フォルダ作成
mkdir docs

# 重要ドキュメントのみ移動・統合
# 残りは削除
```

### **Step 5: 動作確認**
```bash
# クリーンアップ後の動作テスト
npm start
```

## 📋 整理後の管理ルール

### **ファイル作成ルール**
1. **一時ファイル禁止**: テスト用ファイルは即座削除
2. **重複ファイル禁止**: `.js` と `.jsx` の併存禁止
3. **ドキュメント統合**: 同じトピックは1ファイルに集約

### **命名規則**
- コンポーネント: `ComponentName.jsx`
- ドキュメント: `TOPIC.md` (V1, V2等の番号禁止)
- 設定ファイル: 標準名のみ使用

### **定期整理**
- 週1回: 不要ファイルの確認・削除
- 月1回: プロジェクト構造の見直し

## 🎯 期待される効果

### **管理性向上**
- ファイル数: 2,155個 → 50個以下
- 必要ファイルの即座特定
- 新規参加者の理解容易性

### **開発効率向上**
- ビルド時間短縮
- IDE動作の軽量化
- Git操作の高速化

### **保守性向上**
- 最新版ファイルの明確化
- 設定変更の影響範囲特定
- デプロイ時のトラブル減少

---

**📅 実行予定**: 即座実行推奨  
**⚠️ リスク**: バックアップ必須  
**🎯 目標**: 管理可能なプロジェクト構造の確立