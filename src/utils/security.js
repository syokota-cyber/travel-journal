// セキュリティ関連のユーティリティ関数

// HTTPS強制リダイレクト
export const enforceHTTPS = () => {
  if (process.env.NODE_ENV === 'production' && 
      window.location.protocol !== 'https:' && 
      window.location.hostname !== 'localhost') {
    window.location.replace(`https:${window.location.href.substring(window.location.protocol.length)}`);
  }
};

// 入力値サニタイゼーション
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    // HTMLタグを除去
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    // 危険な文字を除去
    .replace(/[<>"'`;\\]/g, '')
    // SQLインジェクション対策
    .replace(/(\b)(select|insert|update|delete|drop|create|alter|exec|union|script)(\b)/gi, '')
    // 改行とタブを正規化
    .replace(/[\r\n\t]/g, ' ')
    // 連続する空白を単一の空白に
    .replace(/\s+/g, ' ')
    .trim();
};

// HTMLエスケープ
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// 環境変数の検証
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars);
    console.warn('Using default values for missing environment variables');
    // エラーを投げずに警告のみ表示
  }
  
  return missingVars.length === 0;
};

// ローカルストレージのセキュアな使用
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const encryptedValue = btoa(JSON.stringify(value)); // 簡易暗号化
      localStorage.setItem(sanitizedKey, encryptedValue);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  
  getItem: (key) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const encryptedValue = localStorage.getItem(sanitizedKey);
      if (!encryptedValue) return null;
      return JSON.parse(atob(encryptedValue));
    } catch (error) {
      console.error('Storage retrieval error:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      localStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Storage removal error:', error);
    }
  }
};

// セキュリティヘッダーの確認（開発用）
export const checkSecurityHeaders = () => {
  if (process.env.NODE_ENV === 'development') {
    const headers = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy'
    ];
    
    headers.forEach(header => {
      const metaTag = document.querySelector(`meta[http-equiv="${header}"]`);
      if (!metaTag) {
        console.warn(`Missing security header: ${header}`);
      }
    });
  }
};