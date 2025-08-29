// エラーハンドリングユーティリティ
// 本番環境では詳細エラーを隠蔽し、開発環境では詳細を表示

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * エラーレベルの定義
 */
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * エラーをログに記録
 */
const logError = (error, level = ErrorLevel.ERROR, context = {}) => {
  const errorId = Date.now();
  
  if (isDevelopment) {
    // 開発環境：詳細情報を表示
    console.group(`🚨 Error [${level}] - ID: ${errorId}`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Context:', context);
    console.groupEnd();
  } else {
    // 本番環境：最小限の情報のみ
    console.error(`Error ID: ${errorId}`);
  }
  
  return errorId;
};

/**
 * ユーザー向けエラーメッセージの生成
 */
export const getUserFriendlyMessage = (error, context = '') => {
  // 既知のエラーパターンのマッピング
  const errorMappings = {
    'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
    'User already registered': 'このメールアドレスは既に登録されています',
    'Network request failed': 'ネットワーク接続に問題があります。しばらくしてから再試行してください',
    'Permission denied': 'この操作を実行する権限がありません',
    'Invalid email': 'メールアドレスの形式が正しくありません',
    'Password should be at least': 'パスワードは8文字以上必要です',
    'Email not confirmed': 'メールアドレスの確認が完了していません',
    'Rate limit exceeded': 'アクセスが集中しています。しばらくしてから再試行してください'
  };
  
  // エラーメッセージのマッチング
  const errorMessage = error.message || '';
  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (errorMessage.includes(pattern)) {
      return friendlyMessage;
    }
  }
  
  // デフォルトメッセージ
  if (isDevelopment) {
    return `エラーが発生しました: ${errorMessage}`;
  } else {
    return 'エラーが発生しました。しばらくしてから再試行してください。';
  }
};

/**
 * APIエラーハンドリング
 */
export const handleAPIError = (error, operation = 'API呼び出し') => {
  const errorId = logError(error, ErrorLevel.ERROR, { operation });
  const userMessage = getUserFriendlyMessage(error, operation);
  
  return {
    success: false,
    errorId,
    message: userMessage,
    debugInfo: isDevelopment ? {
      originalError: error.message,
      stack: error.stack,
      operation
    } : undefined
  };
};

/**
 * 認証エラーハンドリング
 */
export const handleAuthError = (error) => {
  const errorId = logError(error, ErrorLevel.WARNING, { type: 'authentication' });
  const userMessage = getUserFriendlyMessage(error, '認証');
  
  return {
    success: false,
    errorId,
    message: userMessage,
    requiresAction: error.message?.includes('Email not confirmed') ? 'confirm_email' : null
  };
};

/**
 * データベースエラーハンドリング
 */
export const handleDatabaseError = (error, table = '') => {
  const errorId = logError(error, ErrorLevel.ERROR, { type: 'database', table });
  
  // RLSエラーの特別処理
  if (error.message?.includes('row-level security') || error.code === '42501') {
    return {
      success: false,
      errorId,
      message: 'データへのアクセス権限がありません。ログイン状態を確認してください。'
    };
  }
  
  const userMessage = getUserFriendlyMessage(error, 'データベース操作');
  return {
    success: false,
    errorId,
    message: userMessage
  };
};

/**
 * フォームエラーハンドリング
 */
export const handleFormError = (errors) => {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }
  
  const errorMessages = Object.entries(errors)
    .filter(([_, error]) => error)
    .map(([field, error]) => `${field}: ${error}`);
  
  if (errorMessages.length === 0) {
    return null;
  }
  
  return {
    success: false,
    message: '入力内容に問題があります',
    details: errorMessages,
    fields: errors
  };
};

/**
 * 非同期処理のエラーハンドリングラッパー
 */
export const withErrorHandling = async (fn, errorHandler = handleAPIError) => {
  try {
    return await fn();
  } catch (error) {
    return errorHandler(error);
  }
};

/**
 * React Error Boundary用のエラーハンドラー
 */
export const handleComponentError = (error, errorInfo) => {
  const errorId = logError(error, ErrorLevel.CRITICAL, { 
    componentStack: errorInfo.componentStack 
  });
  
  if (!isDevelopment) {
    // 本番環境では、エラー追跡サービスに送信
    // 例: Sentry, LogRocket等
    // sendErrorToTrackingService(error, errorInfo, errorId);
  }
  
  return {
    errorId,
    message: 'アプリケーションでエラーが発生しました。ページを再読み込みしてください。'
  };
};

export default {
  ErrorLevel,
  getUserFriendlyMessage,
  handleAPIError,
  handleAuthError,
  handleDatabaseError,
  handleFormError,
  withErrorHandling,
  handleComponentError
};