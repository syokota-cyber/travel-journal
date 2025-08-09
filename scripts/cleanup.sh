#!/bin/bash
# 🧹 Travel Journal プロジェクトクリーンアップスクリプト
# 使用方法: ./scripts/cleanup.sh

echo "🧹 Travel Journal クリーンアップ開始..."
echo "📅 実行日時: $(date)"

# 現在のディレクトリ確認
if [[ ! -f "package.json" ]]; then
    echo "❌ エラー: プロジェクトルートディレクトリで実行してください"
    exit 1
fi

echo ""
echo "📊 クリーンアップ前の状況:"
echo "  MDファイル: $(find . -name '*.md' -not -path './node_modules/*' | wc -l)"
echo "  JSファイル: $(find . -name '*.js' -not -path './node_modules/*' | wc -l)"
echo "  JSXファイル: $(find . -name '*.jsx' -not -path './node_modules/*' | wc -l)"

# Step 1: 一時ファイル削除
echo ""
echo "🗑️  Step 1: 一時ファイル削除中..."
TEMP_FILES=$(find . -name "test-*" -o -name "debug-*" -o -name "temp-*" -o -name "check-*" | wc -l)
if [ "$TEMP_FILES" -gt 0 ]; then
    find . -name "test-*" -o -name "debug-*" -o -name "temp-*" -o -name "check-*" -delete
    echo "   ✅ $TEMP_FILES 個の一時ファイルを削除"
else
    echo "   ✅ 一時ファイルはありません"
fi

# Step 2: 重複JSファイル削除
echo ""
echo "🔄 Step 2: 重複JSファイル確認中..."
DUPLICATE_COUNT=0

for js_file in $(find src -name "*.js" -not -path "*/node_modules/*"); do
    jsx_file="${js_file%.*}.jsx"
    if [ -f "$jsx_file" ]; then
        rm "$js_file"
        echo "   🗑️  削除: $js_file (対応する.jsxが存在)"
        ((DUPLICATE_COUNT++))
    fi
done

if [ "$DUPLICATE_COUNT" -eq 0 ]; then
    echo "   ✅ 重複JSファイルはありません"
else
    echo "   ✅ $DUPLICATE_COUNT 個の重複JSファイルを削除"
fi

# Step 3: 古いバージョンドキュメント削除
echo ""
echo "📄 Step 3: 古いバージョンドキュメント確認中..."
OLD_DOCS=$(find . -name "*_V[0-9]*.md" -o -name "*_v[0-9]*.md" | wc -l)
if [ "$OLD_DOCS" -gt 0 ]; then
    find . -name "*_V[0-9]*.md" -o -name "*_v[0-9]*.md" -delete
    echo "   ✅ $OLD_DOCS 個の古いドキュメントを削除"
else
    echo "   ✅ 古いバージョンドキュメントはありません"
fi

# Step 4: ルートディレクトリのSQLファイル削除
echo ""
echo "🗄️  Step 4: ルートディレクトリのSQLファイル確認中..."
ROOT_SQL=$(find . -maxdepth 1 -name "*.sql" | wc -l)
if [ "$ROOT_SQL" -gt 0 ]; then
    find . -maxdepth 1 -name "*.sql" -delete
    echo "   ✅ $ROOT_SQL 個のルートSQLファイルを削除"
else
    echo "   ✅ ルートディレクトリのSQLファイルはありません"
fi

# Step 5: 最終統計
echo ""
echo "📊 クリーンアップ後の状況:"
MD_COUNT=$(find . -name '*.md' -not -path './node_modules/*' | wc -l)
JS_COUNT=$(find . -name '*.js' -not -path './node_modules/*' | wc -l)
JSX_COUNT=$(find . -name '*.jsx' -not -path './node_modules/*' | wc -l)

echo "  MDファイル: $MD_COUNT"
echo "  JSファイル: $JS_COUNT"
echo "  JSXファイル: $JSX_COUNT"

# Step 6: アラート確認
echo ""
echo "🚨 基準値チェック:"

if [ "$MD_COUNT" -gt 20 ]; then
    echo "  ❌ 緊急: MDファイル数が20個を超過 ($MD_COUNT個)"
elif [ "$MD_COUNT" -gt 15 ]; then
    echo "  🟡 注意: MDファイル数が15個を超過 ($MD_COUNT個)"
else
    echo "  ✅ MDファイル数正常 ($MD_COUNT個 ≤ 15個)"
fi

if [ "$JS_COUNT" -gt 15 ]; then
    echo "  ❌ 緊急: JSファイル数が15個を超過 ($JS_COUNT個)"
elif [ "$JS_COUNT" -gt 10 ]; then
    echo "  🟡 注意: JSファイル数が10個を超過 ($JS_COUNT個)"
else
    echo "  ✅ JSファイル数正常 ($JS_COUNT個 ≤ 10個)"
fi

# Step 7: 推奨アクション
echo ""
echo "💡 推奨アクション:"

if [ "$MD_COUNT" -gt 15 ] || [ "$JS_COUNT" -gt 10 ]; then
    echo "  📋 ファイル統合・整理を検討してください"
    echo "  📖 詳細: docs/PROJECT_MANAGEMENT_RULES.md 参照"
fi

echo "  🧪 動作確認: npm start でアプリケーション起動テスト推奨"
echo ""
echo "✨ クリーンアップ完了!"
echo "📅 完了時刻: $(date)"