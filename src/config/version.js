// ============================================
// 🔖 バージョン管理 - Single Source of Truth
// ============================================
// 
// ⚠️ 重要: このファイルがバージョン情報の唯一の管理場所です
// 更新時は必ず VERSION_UPDATE_CHECKLIST.md を参照してください
//
// 次回更新予定: Phase 2 (Git タグ運用) - 2025年8月29日
// ============================================

export const CURRENT_VERSION = "2.7.0";
export const RELEASE_DATE = "2025-10-08";

// ============================================
// 開発者向け詳細履歴（技術的詳細を含む）
// ============================================
export const VERSION_HISTORY_DETAILED = [
  {
    version: "2.7.0",
    date: "2025年10月8日",
    features: [
      "🌐 マスターデータの多言語対応（日本語/英語）",
      "🎯 メイン目的・サブ目的の英語表示",
      "🎒 推奨持ち物の英語表示",
      "📋 ルール・マナーの英語表示",
      "🔄 言語切り替え時のリアルタイム反映"
    ]
  },
  {
    version: "2.6.0",
    date: "2025年8月31日",
    features: [
      "🔑 Google OAuth認証機能追加",
      "✉️ メール確認機能の実装（新規登録時）",
      "📧 確認メールの日本語テンプレート設定",
      "🔄 動的リダイレクトURL対応",
      "🔒 認証フローのセキュリティ強化"
    ]
  },
  {
    version: "2.5.0",
    date: "2025年8月29日",
    features: [
      "📊 管理ダッシュボード実装（管理者専用）",
      "📈 統計表示: ユーザー数・旅行記録数",
      "🎯 人気の目的地 TOP5 分析",
      "📋 最近の旅行記録一覧表示",
      "🔒 厳重なアクセス制御とセキュリティ強化"
    ]
  },
  {
    version: "2.4.0",
    date: "2025年8月22日",
    features: [
      "📜 利用規約更新: Cookie利用条項追加（第12条）",
      "📜 利用規約更新: 同意条項追加（第13条）",
      "⚖️ 法的コンプライアンス強化"
    ]
  },
  {
    version: "2.3.0",
    date: "2025年8月20日",
    features: [
      "🔒 セキュリティ強化: 入力値検証・サニタイゼーション実装",
      "🔒 CSP（Content Security Policy）によるXSS攻撃防御",
      "🔒 エラーハンドリングの統一化",
      "📅 旅行日程: 開始日入力時に終了日を翌日に自動設定",
      "📋 更新履歴の表示機能追加"
    ]
  },
  {
    version: "2.2.0",
    date: "2025年8月19日",
    features: [
      "🗺️ 旅先方面機能: 13の方面から選択可能",
      "📍 カレンダー表示: 旅先方面を表示",
      "🔄 本番環境データ同期システム追加",
      "🐛 マスターデータの重複問題を解決"
    ]
  },
  {
    version: "2.1.0",
    date: "2025年8月15日",
    features: [
      "📊 達成度計算の統一: メイン70% + サブ30%",
      "🎯 達成度表示の精度改善",
      "📋 持ち物活用度を参考値として明確化"
    ]
  },
  {
    version: "2.0.0",
    date: "2025年8月13日",
    features: [
      "🔐 Row Level Security (RLS) 全面対応",
      "📧 カスタムSMTP設定（Resend）",
      "🛡️ セキュリティポリシーの強化",
      "📊 Security Advisor対応完了"
    ]
  }
];

// ============================================
// エンドユーザー向け履歴（分かりやすい表現）
// ============================================
export const VERSION_HISTORY = [
  {
    version: "2.7.0",
    date: "2025年10月8日",
    features: [
      "🌐 英語表示に対応しました",
      "🎯 メイン目的・サブ目的が英語で表示されます",
      "🎒 持ち物リストも英語表示に対応",
      "📋 ルール・マナーを英語で確認できます"
    ]
  },
  {
    version: "2.6.0",
    date: "2025年8月31日",
    features: [
      "🔑 Googleアカウントでかんたんログイン",
      "✉️ 新規登録時にメール確認でセキュリティ向上",
      "📧 日本語の確認メールでわかりやすく",
      "🔒 より安全で便利なログイン体験"
    ]
  },
  {
    version: "2.5.0",
    date: "2025年8月29日",
    features: [
      "🔒 システム全体のセキュリティ強化",
      "⚡ アプリの動作速度を改善",
      "🐛 各種不具合の修正"
    ]
  },
  {
    version: "2.4.0",
    date: "2025年8月22日",
    features: [
      "📜 利用規約を更新しました",
      "🍪 プライバシーポリシーの明確化",
      "⚖️ より透明性の高いサービス運営"
    ]
  },
  {
    version: "2.3.0",
    date: "2025年8月20日",
    features: [
      "🔒 セキュリティを強化しました",
      "📅 日程入力がもっと便利に",
      "📋 更新履歴を確認できるようになりました"
    ]
  },
  {
    version: "2.2.0",
    date: "2025年8月19日",
    features: [
      "🗺️ 旅先を地域別に選べるようになりました",
      "📍 カレンダーに旅先情報を表示",
      "🐛 表示の不具合を修正"
    ]
  },
  {
    version: "2.1.0",
    date: "2025年8月15日",
    features: [
      "📊 旅行の達成度がより正確に",
      "🎯 目的別の進捗がわかりやすく",
      "📋 持ち物チェックがさらに便利に"
    ]
  },
  {
    version: "2.0.0",
    date: "2025年8月13日",
    features: [
      "🔐 大切な旅行データを安全に保護",
      "📧 メール通知機能の改善",
      "🛡️ プライバシー保護を強化"
    ]
  }
];

// セマンティックバージョニング説明（開発者向け）
export const VERSION_RULES = {
  major: "破壊的変更・大規模リニューアル",
  minor: "新機能追加・機能改善",
  patch: "バグ修正・小さな調整"
};

// ============================================
// 表示設定
// ============================================
// 開発環境: 詳細履歴を表示
// 本番環境: エンドユーザー向け履歴を表示
export const isDevelopment = process.env.NODE_ENV === 'development';

// ============================================
// English version history
// ============================================
export const VERSION_HISTORY_EN = [
  {
    version: "2.7.0",
    date: "October 8, 2025",
    features: [
      "🌐 Multi-language support for master data (Japanese/English)",
      "🎯 English display for main and sub purposes",
      "🎒 English display for recommended items",
      "📋 English display for rules and manners"
    ]
  },
  {
    version: "2.6.0",
    date: "August 31, 2025",
    features: [
      "🔑 Easy login with Google account",
      "✉️ Email verification for new registrations",
      "📧 Japanese confirmation emails",
      "🔒 Safer and more convenient login experience"
    ]
  },
  {
    version: "2.5.0",
    date: "August 29, 2025",
    features: [
      "🔒 System-wide security enhancements",
      "⚡ Improved app performance",
      "🐛 Various bug fixes"
    ]
  },
  {
    version: "2.4.0",
    date: "August 22, 2025",
    features: [
      "📜 Updated Terms of Service",
      "🍪 Clarified Privacy Policy",
      "⚖️ More transparent service operation"
    ]
  },
  {
    version: "2.3.0",
    date: "August 20, 2025",
    features: [
      "🔒 Enhanced security",
      "📅 More convenient date input",
      "📋 Update history now available"
    ]
  },
  {
    version: "2.2.0",
    date: "August 19, 2025",
    features: [
      "🗺️ Select destinations by region",
      "📍 Display destination info on calendar",
      "🐛 Fixed display issues"
    ]
  },
  {
    version: "2.1.0",
    date: "August 15, 2025",
    features: [
      "📊 More accurate trip achievement rate",
      "🎯 Clearer progress by purpose",
      "📋 More convenient item checklist"
    ]
  },
  {
    version: "2.0.0",
    date: "August 13, 2025",
    features: [
      "🔐 Secure protection of your travel data",
      "📧 Improved email notifications",
      "🛡️ Enhanced privacy protection"
    ]
  }
];

// UpdateHistory.jsxで使用する履歴を選択
export const DISPLAY_VERSION_HISTORY = isDevelopment
  ? VERSION_HISTORY_DETAILED  // 開発者向け
  : VERSION_HISTORY;          // エンドユーザー向け

// 言語に応じて適切な履歴を返す関数
export const getVersionHistory = (language) => {
  if (isDevelopment) {
    return VERSION_HISTORY_DETAILED;
  }
  return language === 'en' ? VERSION_HISTORY_EN : VERSION_HISTORY;
};