// 入力値検証・サニタイゼーションユーティリティ
import DOMPurify from 'dompurify';
import validator from 'validator';

/**
 * テキスト入力のサニタイゼーション
 * XSS攻撃を防ぐためHTMLタグを除去
 */
export const sanitizeText = (input) => {
  if (!input) return '';
  // HTMLタグを除去し、エスケープ処理
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true 
  });
  return validator.escape(cleaned).trim();
};

/**
 * メールアドレスの検証とサニタイゼーション
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: false, value: '' };
  
  const trimmed = email.trim().toLowerCase();
  const isValid = validator.isEmail(trimmed);
  
  return {
    isValid,
    value: isValid ? trimmed : '',
    error: !isValid ? 'メールアドレスの形式が正しくありません' : null
  };
};

/**
 * URLの検証とサニタイゼーション
 */
export const validateURL = (url) => {
  if (!url) return { isValid: false, value: '' };
  
  const trimmed = url.trim();
  const isValid = validator.isURL(trimmed, {
    protocols: ['http', 'https'],
    require_protocol: true
  });
  
  return {
    isValid,
    value: isValid ? trimmed : '',
    error: !isValid ? 'URLの形式が正しくありません' : null
  };
};

/**
 * 日付の検証
 */
export const validateDate = (date) => {
  if (!date) return { isValid: false, value: '' };
  
  const isValid = validator.isDate(date);
  return {
    isValid,
    value: isValid ? date : '',
    error: !isValid ? '日付の形式が正しくありません' : null
  };
};

/**
 * 旅行タイトルの検証
 */
export const validateTripTitle = (title) => {
  if (!title) {
    return { isValid: false, value: '', error: 'タイトルは必須です' };
  }
  
  const sanitized = sanitizeText(title);
  
  if (sanitized.length < 1) {
    return { isValid: false, value: '', error: 'タイトルは必須です' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, value: sanitized.substring(0, 100), error: 'タイトルは100文字以内で入力してください' };
  }
  
  return { isValid: true, value: sanitized, error: null };
};

/**
 * 旅先方面の検証（i18n対応）
 */
export const validateDestination = (destination) => {
  // i18n対応：日本語と英語の両方の地域名を許可
  const validDestinationsJa = [
    '北海道（道北）', '北海道（道東）', '北海道（道南）', '北海道（道央）',
    '東北方面', '北陸方面', '関東方面', '甲信越地方',
    '中部・東海方面', '近畿方面', '中国方面', '四国方面', '九州方面'
  ];

  const validDestinationsEn = [
    'Hokkaido (Dohoku)', 'Hokkaido (Doto)', 'Hokkaido (Donan)', 'Hokkaido (Doo)',
    'Tohoku Region', 'Hokuriku Region', 'Kanto Region', 'Koshinetsu Region',
    'Chubu/Tokai Region', 'Kinki Region', 'Chugoku Region', 'Shikoku Region', 'Kyushu Region'
  ];

  const validDestinations = [...validDestinationsJa, ...validDestinationsEn];

  if (!destination) {
    return { isValid: true, value: '', error: null }; // 任意項目
  }

  if (!validDestinations.includes(destination)) {
    return { isValid: false, value: '', error: '無効な旅先方面です / Invalid destination' };
  }

  return { isValid: true, value: destination, error: null };
};

/**
 * メモ・備考の検証
 */
export const validateNote = (note) => {
  if (!note) return { isValid: true, value: '', error: null }; // 任意項目
  
  const sanitized = sanitizeText(note);
  
  if (sanitized.length > 1000) {
    return { isValid: false, value: sanitized.substring(0, 1000), error: 'メモは1000文字以内で入力してください' };
  }
  
  return { isValid: true, value: sanitized, error: null };
};

/**
 * パスワード強度チェック
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, strength: 0, error: 'パスワードは必須です' };
  }
  
  const errors = [];
  let strength = 0;
  
  // 最小長チェック
  if (password.length < 8) {
    errors.push('8文字以上必要です');
  } else {
    strength += 25;
  }
  
  // 大文字を含むか
  if (/[A-Z]/.test(password)) {
    strength += 25;
  } else {
    errors.push('大文字を含めてください');
  }
  
  // 小文字を含むか
  if (/[a-z]/.test(password)) {
    strength += 25;
  } else {
    errors.push('小文字を含めてください');
  }
  
  // 数字を含むか
  if (/[0-9]/.test(password)) {
    strength += 25;
  } else {
    errors.push('数字を含めてください');
  }
  
  return {
    isValid: errors.length === 0,
    strength,
    error: errors.length > 0 ? errors.join('、') : null
  };
};

/**
 * SQLインジェクション対策
 * Supabaseのクエリビルダーを使用するため、基本的には不要だが、
 * 生のSQLを使う場合のためのエスケープ処理
 */
export const escapeSQLString = (str) => {
  if (!str) return '';
  return str.replace(/['";\\]/g, '\\$&');
};