#!/bin/bash
# 📊 Travel Journal プロジェクト健康チェックスクリプト
# 使用方法: ./scripts/health-check.sh

echo "🔍 Travel Journal プロジェクト健康チェック"
echo "📅 実行日時: $(date)"

# 現在のディレクトリ確認
if [[ ! -f "package.json" ]]; then
    echo "❌ エラー: プロジェクトルートディレクトリで実行してください"
    exit 1
fi

echo ""

# 1. ディレクトリ構造チェック
echo "📁 ディレクトリ構造チェック:"
REQUIRED_DIRS=("src" "docs" "supabase" "public")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/ 存在"
    else
        echo "  ❌ $dir/ 不存在"
    fi
done

# 2. ファイル数統計
echo ""
echo "📊 ファイル数統計:"
MD_COUNT=$(find . -name '*.md' -not -path './node_modules/*' | wc -l)
JS_COUNT=$(find . -name '*.js' -not -path './node_modules/*' | wc -l)
JSX_COUNT=$(find . -name '*.jsx' -not -path './node_modules/*' | wc -l)
ROOT_FILES=$(ls -1 *.* 2>/dev/null | wc -l)

echo "  MDファイル: $MD_COUNT"
echo "  JSファイル: $JS_COUNT"  
echo "  JSXファイル: $JSX_COUNT"
echo "  ルートファイル: $ROOT_FILES"

# 3. 基準値チェック
echo ""
echo "🚨 基準値チェック:"
ISSUES_COUNT=0

if [ "$MD_COUNT" -gt 20 ]; then
    echo "  ❌ 緊急: MDファイル数超過 ($MD_COUNT > 20)"
    ((ISSUES_COUNT++))
elif [ "$MD_COUNT" -gt 15 ]; then
    echo "  🟡 注意: MDファイル数要注意 ($MD_COUNT > 15)"
else
    echo "  ✅ MDファイル数正常 ($MD_COUNT ≤ 15)"
fi

if [ "$JS_COUNT" -gt 15 ]; then
    echo "  ❌ 緊急: JSファイル数超過 ($JS_COUNT > 15)"
    ((ISSUES_COUNT++))
elif [ "$JS_COUNT" -gt 10 ]; then
    echo "  🟡 注意: JSファイル数要注意 ($JS_COUNT > 10)"
else
    echo "  ✅ JSファイル数正常 ($JS_COUNT ≤ 10)"
fi

if [ "$ROOT_FILES" -gt 20 ]; then
    echo "  ❌ 緊急: ルートファイル数超過 ($ROOT_FILES > 20)"
    ((ISSUES_COUNT++))
elif [ "$ROOT_FILES" -gt 15 ]; then
    echo "  🟡 注意: ルートファイル数要注意 ($ROOT_FILES > 15)"
else
    echo "  ✅ ルートファイル数正常 ($ROOT_FILES ≤ 15)"
fi

# 4. 問題ファイル検出
echo ""
echo "🔍 問題ファイル検出:"

# 一時ファイル
TEMP_FILES=$(find . -name "test-*" -o -name "debug-*" -o -name "temp-*" -o -name "check-*" | wc -l)
if [ "$TEMP_FILES" -gt 0 ]; then
    echo "  ⚠️  一時ファイル発見: $TEMP_FILES個"
    find . -name "test-*" -o -name "debug-*" -o -name "temp-*" -o -name "check-*" | head -5 | sed 's/^/    /'
    if [ "$TEMP_FILES" -gt 5 ]; then
        echo "    ... 他$((TEMP_FILES - 5))個"
    fi
    ((ISSUES_COUNT++))
else
    echo "  ✅ 一時ファイルなし"
fi

# 重複JSファイル
DUPLICATE_JS=0
for js_file in $(find src -name "*.js" -not -path "*/node_modules/*"); do
    jsx_file="${js_file%.*}.jsx"
    if [ -f "$jsx_file" ]; then
        if [ "$DUPLICATE_JS" -eq 0 ]; then
            echo "  ⚠️  重複JSファイル発見:"
        fi
        echo "    $js_file (対応.jsx存在)"
        ((DUPLICATE_JS++))
    fi
done

if [ "$DUPLICATE_JS" -gt 0 ]; then
    ((ISSUES_COUNT++))
else
    echo "  ✅ 重複JSファイルなし"
fi

# バージョン付きドキュメント
OLD_DOCS=$(find . -name "*_V[0-9]*.md" -o -name "*_v[0-9]*.md" | wc -l)
if [ "$OLD_DOCS" -gt 0 ]; then
    echo "  ⚠️  古いバージョンドキュメント: $OLD_DOCS個"
    ((ISSUES_COUNT++))
else
    echo "  ✅ 古いバージョンドキュメントなし"
fi

# 5. 必須ファイル存在確認
echo ""
echo "📄 必須ファイル確認:"
REQUIRED_FILES=("package.json" "README.md" "src/App.jsx" "src/index.jsx" "vercel.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file 存在"
    else
        echo "  ❌ $file 不存在"
        ((ISSUES_COUNT++))
    fi
done

# 6. 総合評価
echo ""
echo "🎯 総合評価:"
if [ "$ISSUES_COUNT" -eq 0 ]; then
    echo "  🌟 優秀: 問題は検出されませんでした"
    GRADE="A"
elif [ "$ISSUES_COUNT" -le 2 ]; then
    echo "  ✅ 良好: 軽微な問題 ($ISSUES_COUNT件)"
    GRADE="B"
elif [ "$ISSUES_COUNT" -le 5 ]; then
    echo "  🟡 要注意: 問題あり ($ISSUES_COUNT件)"
    GRADE="C"
else
    echo "  ❌ 危険: 多数の問題 ($ISSUES_COUNT件)"
    GRADE="D"
fi

echo "  グレード: $GRADE"

# 7. 推奨アクション
echo ""
echo "💡 推奨アクション:"
if [ "$ISSUES_COUNT" -gt 0 ]; then
    echo "  🧹 ./scripts/cleanup.sh の実行を推奨"
    echo "  📖 docs/PROJECT_MANAGEMENT_RULES.md の確認推奨"
fi

if [ "$MD_COUNT" -gt 15 ] || [ "$JS_COUNT" -gt 10 ]; then
    echo "  📋 ファイル統合・整理の検討を推奨"
fi

echo "  🧪 npm start でアプリ動作確認を推奨"

echo ""
echo "✨ ヘルスチェック完了!"
echo "📅 完了時刻: $(date)"

# ログファイル出力
echo "$(date): Health Check - Grade: $GRADE, Issues: $ISSUES_COUNT" >> health-check.log