# 📅 日常運用ガイド - Travel Journal

## 🚀 セッション開始時のルーチン

### **Step 1: ヘルスチェック実行**
```bash
./scripts/health-check.sh
```
**確認項目:**
- プロジェクト構造の健全性
- ファイル数の基準値内確認
- 問題ファイルの早期検出

### **Step 2: 前回作業の確認**
```bash
# 最新のコミット確認
git log --oneline -5

# 未コミットファイル確認  
git status
```

### **Step 3: 開発サーバー起動**
```bash
npm start
```

## 🛠️ 開発作業中の注意事項

### **ファイル作成時のチェックリスト**
- [ ] **配置場所確認**: 適切なディレクトリ (docs/, src/, supabase/)
- [ ] **命名規則**: PascalCase(.jsx), UPPER_CASE(.md), camelCase(.js)
- [ ] **重複チェック**: 同機能ファイルの未存在
- [ ] **一時ファイル禁止**: test-, debug-, temp- プレフィックス使用しない

### **API設定変更時の必須プロセス**
```bash
# Step 1: 現在設定のバックアップ
echo "現在: $REACT_APP_SUPABASE_ANON_KEY" > backup-$(date +%Y%m%d).txt

# Step 2: 公式ドキュメント確認
# Supabase Dashboard → Settings → API

# Step 3: 1回限りの正確な変更
# 試行錯誤は絶対禁止

# Step 4: 単一機能テスト
# ログイン機能のみで動作確認
```

## 🔍 セッション中の定期確認

### **30分ごとの簡易チェック**
```bash
# 一時ファイル確認
ls -la | grep -E "(test-|debug-|temp-)"

# ファイル数簡易確認
echo "MD: $(find . -name '*.md' -not -path './node_modules/*' | wc -l), JS: $(find . -name '*.js' -not -path './node_modules/*' | wc -l)"
```

### **1時間ごとの中間確認**
```bash
# 重複ファイル確認
find src -name "*.js" | xargs -I {} sh -c 'jsx="${1%.*}.jsx"; [ -f "$jsx" ] && echo "重複: $1"' _ {}
```

## 🧹 セッション終了時の必須作業

### **Step 1: クリーンアップ実行**
```bash
./scripts/cleanup.sh
```

### **Step 2: 最終ヘルスチェック**
```bash
./scripts/health-check.sh
```
**期待結果:** グレード A または B

### **Step 3: 開発サーバー停止**
```bash
lsof -ti:3000 | xargs kill -9
```

### **Step 4: 変更のコミット**
```bash
# 変更確認
git status
git diff

# コミット (適切なメッセージで)
git add .
git commit -m "機能改善: 具体的な変更内容"
```

## ⚠️ 緊急時対応

### **ファイル数基準値超過時**
```bash
# 緊急クリーンアップ
find . -name "test-*" -o -name "debug-*" -o -name "temp-*" -delete
find src -name "*.js" -exec rm {} \;  # .jsx存在確認後

# ヘルスチェック再実行
./scripts/health-check.sh
```

### **API制限・エラー発生時**
1. **即座停止**: 追加のAPI試行を完全停止
2. **ルール確認**: `docs/CLAUDE.md` のAPI安全規則確認
3. **1回修正**: 公式ドキュメント確認後の正確な1回修正
4. **動作確認**: 単一機能での動作テスト

### **アプリ起動失敗時**
```bash
# node_modules 再インストール
rm -rf node_modules package-lock.json
npm install

# ポート競合確認
lsof -ti:3000 | xargs kill -9

# 再起動
npm start
```

## 📊 週次・月次メンテナンス

### **毎週金曜日（週次）**
```bash
# 完全ヘルスチェック
./scripts/health-check.sh

# 統計確認
echo "今週の統計:"
echo "コミット数: $(git log --oneline --since='1 week ago' | wc -l)"
echo "変更ファイル数: $(git diff --name-only HEAD~7 | wc -l)"
```

### **毎月1日（月次監査）**
1. **プロジェクト構造レビュー**
2. **不要ファイル完全削除**
3. **ドキュメント統合・更新**
4. **ルール見直し・改善**

## 🎯 品質基準

### **ファイル数基準**
```
🌟 優秀レベル:
- MDファイル ≤ 10個
- JSファイル ≤ 5個
- ルートファイル ≤ 10個

✅ 良好レベル:
- MDファイル ≤ 15個  
- JSファイル ≤ 10個
- ルートファイル ≤ 15個

⚠️ 要改善:
- 上記基準超過
```

### **プロジェクト健全性指標**
- **A**: 完璧 - 問題なし
- **B**: 良好 - 軽微な問題 (1-2件)
- **C**: 要注意 - 要改善 (3-5件)  
- **D**: 危険 - 緊急対応必要 (6件以上)

## 💡 ベストプラクティス

### **効率的な開発のために**
1. **セッション開始**: 必ずヘルスチェックから
2. **作業中**: 30分ごとの軽いチェック
3. **セッション終了**: クリーンアップ→ヘルスチェック→コミット

### **問題予防のために**
1. **ファイル作成**: 必要最小限のみ
2. **命名**: 統一規則の厳守
3. **整理**: 作業完了と同時に不要ファイル削除

### **長期保守のために**
1. **週次**: 健全性確認
2. **月次**: 構造見直し
3. **四半期**: ルール改善

---

**📖 関連ドキュメント:**
- `docs/PROJECT_MANAGEMENT_RULES.md` - 詳細管理規則
- `docs/CLAUDE.md` - AI作業安全規則
- `scripts/cleanup.sh` - 自動クリーンアップ
- `scripts/health-check.sh` - プロジェクト診断

---

**📅 作成**: 2025年8月9日  
**🔄 更新**: 問題発生時・改善時随時  
**🎯 目的**: 日常運用の完全自動化・標準化