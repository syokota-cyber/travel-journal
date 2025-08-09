# 📂 プロジェクト管理規則 - Travel Journal

## 🎯 基本方針
- **ファイル数最小化**: 必要最低限のファイルのみ保持
- **明確な階層構造**: 用途別の明確な分類
- **重複禁止**: 同じ目的のファイルは1つのみ
- **命名統一**: 一貫した命名規則

## 📁 標準ディレクトリ構造

```
travel-journal/
├── 📁 docs/                    # ドキュメント専用
│   ├── PROJECT_MANAGEMENT_RULES.md  # この管理規則
│   ├── CLAUDE.md               # AI作業ルール
│   ├── TROUBLESHOOTING.md      # トラブル対応
│   └── DEPLOYMENT.md           # デプロイ手順
├── 📁 src/                     # Reactアプリケーション
│   ├── 📁 components/          # UIコンポーネント
│   ├── 📁 contexts/            # React Context
│   ├── 📁 lib/                 # 外部ライブラリ設定
│   ├── 📁 utils/               # ユーティリティ関数
│   ├── 📁 data/                # 静的データ・モック
│   └── 📁 i18n/                # 国際化（必要時のみ）
├── 📁 supabase/               # データベース関連
│   └── 📁 migrations/          # DB変更履歴
├── 📁 public/                 # 静的ファイル
├── 📄 package.json            # 依存関係
├── 📄 vercel.json             # デプロイ設定
├── 📄 .env                    # 環境変数
├── 📄 .gitignore              # Git除外設定
└── 📄 README.md               # プロジェクト概要
```

## 🚫 禁止事項

### **ルートディレクトリ禁止ファイル**
```
❌ 絶対に作成禁止:
- test-*.js, check-*.js (一時テストファイル)
- debug-*.*, temp-*.* (デバッグファイル)
- *_V1.md, *_V2.md (バージョン番号付きドキュメント)
- *.sql (ルートディレクトリのSQLファイル)
- connection-test.js, simple-test.js (接続テスト)
```

### **重複ファイル禁止**
```
❌ 同時存在禁止:
- Component.js + Component.jsx → .jsx のみ
- index.js + index.jsx → .jsx のみ  
- App.js + App.jsx → .jsx のみ
```

### **命名規則違反**
```
❌ 禁止パターン:
- FIX_*, TEMP_*, DEBUG_* (一時的な名前)
- 日本語ファイル名
- スペース含有ファイル名
- 特殊文字（@, #, %, など）
```

## ✅ 作成・編集ルール

### **新規ファイル作成時**

#### **1. 作成前チェック**
```bash
# 同類ファイルの存在確認
find . -name "*類似名*" -not -path "*/node_modules/*"

# 適切なディレクトリの確認
ls -la docs/ src/ supabase/
```

#### **2. 適切な配置先決定**
| ファイル種別 | 配置先 | 例 |
|-------------|--------|-----|
| **ドキュメント** | `docs/` | 設計書、手順書、ルール |
| **Reactコンポーネント** | `src/components/` | UI部品 |
| **ユーティリティ** | `src/utils/` | 共通関数 |
| **データベース** | `supabase/migrations/` | SQLファイル |
| **設定** | ルート | package.json, .env |

#### **3. 命名規則**
```
✅ 正しい命名:
- TripDetail.jsx (PascalCase: Reactコンポーネント)
- supabase.js (camelCase: ユーティリティ)  
- DEPLOYMENT.md (UPPER_CASE: ドキュメント)
- 20250809_add_features.sql (日付+説明: Migration)
```

### **ファイル編集時**

#### **1. 編集前確認**
- [ ] これは最新版のファイルか？
- [ ] 重複ファイルは存在しないか？
- [ ] 適切なディレクトリに配置されているか？

#### **2. 編集後処理**
- [ ] 一時ファイルを作成していないか？
- [ ] 古いバックアップファイルは削除したか？
- [ ] テスト・デバッグファイルは削除したか？

## 🧹 定期メンテナンス

### **毎回のセッション終了時**
```bash
# 不要ファイル確認・削除
find . -name "test-*" -o -name "debug-*" -o -name "temp-*" | xargs rm -f

# 重複確認
find src -name "*.js" -exec ls -la {} \; | grep -v node_modules
```

### **週次メンテナンス（毎週金曜日）**
```bash
# ファイル数統計
echo "MDファイル: $(find . -name '*.md' -not -path './node_modules/*' | wc -l)"
echo "JSファイル: $(find . -name '*.js' -not -path './node_modules/*' | wc -l)"  
echo "JSXファイル: $(find . -name '*.jsx' -not -path './node_modules/*' | wc -l)"

# 基準値チェック (異常値検出)
# MD: 15個以下, JS: 10個以下, JSX: 25個以下
```

### **月次監査（毎月1日）**
1. **構造確認**: 標準ディレクトリ構造との比較
2. **命名確認**: 規則違反ファイルの検出
3. **重複確認**: 同機能ファイルの統合
4. **不要確認**: 使用されていないファイル削除

## 🚨 アラート・対応

### **ファイル数アラート基準**
```
🚨 緊急対応必要:
- MDファイル 20個超過
- JSファイル 15個超過  
- ルートファイル 15個超過

🟡 注意レベル:
- MDファイル 15個超過
- JSファイル 10個超過
- ルートファイル 12個超過
```

### **検出時対応**
```bash
# 緊急時一括クリーンアップ
./scripts/emergency-cleanup.sh

# または手動実行
find . -name "temp-*" -o -name "test-*" -o -name "debug-*" -delete
find src -name "*.js" -exec rm {} \; # .jsx存在時のみ
```

## 📋 チェックリスト

### **新規ファイル作成時**
- [ ] 適切なディレクトリに配置
- [ ] 命名規則に準拠
- [ ] 重複ファイルなし
- [ ] 必要最小限の内容

### **ファイル編集時** 
- [ ] 最新版を編集
- [ ] 一時ファイル未作成
- [ ] バックアップファイル削除

### **セッション終了時**
- [ ] test-*, temp-*, debug-* ファイル削除
- [ ] 重複ファイル確認・統合
- [ ] ファイル数基準値内

### **コミット前**
- [ ] .gitignore 確認
- [ ] 不要ファイル除外
- [ ] 構造清潔性確認

## 🛠️ 自動化スクリプト

### **クリーンアップスクリプト**
```bash
#!/bin/bash
# scripts/cleanup.sh

echo "🧹 プロジェクトクリーンアップ開始..."

# 一時ファイル削除
find . -name "test-*" -o -name "debug-*" -o -name "temp-*" -delete
echo "✅ 一時ファイル削除完了"

# 重複JSファイル削除（.jsx存在時）
for js_file in $(find src -name "*.js" -not -path "*/node_modules/*"); do
    jsx_file="${js_file%.*}.jsx"
    if [ -f "$jsx_file" ]; then
        rm "$js_file"
        echo "🗑️  削除: $js_file (対応する.jsxが存在)"
    fi
done

# 統計表示
echo "📊 現在のファイル数:"
echo "  MD: $(find . -name '*.md' -not -path './node_modules/*' | wc -l)"
echo "  JS: $(find . -name '*.js' -not -path './node_modules/*' | wc -l)"
echo "  JSX: $(find . -name '*.jsx' -not -path './node_modules/*' | wc -l)"

echo "✨ クリーンアップ完了"
```

### **使用方法**
```bash
# 実行権限付与
chmod +x scripts/cleanup.sh

# クリーンアップ実行
./scripts/cleanup.sh

# 定期実行設定（cron）
# 0 18 * * 5 cd /path/to/project && ./scripts/cleanup.sh
```

## 📖 運用例

### **新機能開発時**
1. **計画**: `docs/` に設計書作成
2. **実装**: `src/components/` に新コンポーネント
3. **テスト**: 一時ファイル作成→完了後削除
4. **完了**: 不要ファイル削除→コミット

### **バグ修正時**
1. **調査**: 既存ファイルのみ編集
2. **修正**: 一時デバッグファイル作成可
3. **確認**: デバッグファイル削除
4. **完了**: 修正ファイルのみコミット

### **ドキュメント更新時**
1. **更新**: 既存ファイル編集
2. **統合**: 重複内容の統合
3. **削除**: 古いバージョン削除
4. **完了**: 最新版のみ保持

---

## 🔄 このルールの更新

### **更新タイミング**
- プロジェクト規模変更時
- 新技術導入時  
- 問題発生・解決時

### **更新プロセス**
1. 問題特定・分析
2. ルール改定案作成
3. テスト適用
4. 本ルール更新

---

**📅 作成日**: 2025年8月9日  
**🎯 対象**: Travel Journal プロジェクト  
**⚡ 適用**: 即座適用・厳守必須  
**🔄 更新**: 問題発生時随時更新