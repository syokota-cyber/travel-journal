/**
 * i18n対応マスターデータヘルパー関数
 *
 * Supabaseのマスターデータ（main_purposes, sub_purposes, default_items, travel_rules）
 * に対して、現在の言語設定に応じたフィールド値を返すユーティリティ関数群
 */

/**
 * 言語に応じたフィールド名を取得
 *
 * @param {Object} item - データアイテム
 * @param {string} fieldName - フィールド名（例: 'name', 'rule_title'）
 * @param {string} language - 言語コード ('ja' | 'en')
 * @returns {string} - 言語に応じたフィールド値
 *
 * @example
 * const purpose = { name: '観光', name_en: 'Sightseeing' };
 * getLocalizedField(purpose, 'name', 'en'); // 'Sightseeing'
 * getLocalizedField(purpose, 'name', 'ja'); // '観光'
 */
export const getLocalizedField = (item, fieldName, language) => {
  // 英語の場合は _en サフィックス付きフィールドを確認
  if (language === 'en') {
    const enFieldName = `${fieldName}_en`;
    // 英語フィールドが存在し、値がある場合はそれを返す
    if (item[enFieldName]) {
      return item[enFieldName];
    }
  }

  // 日本語の場合、または英語フィールドが存在しない場合は日本語フィールドを返す
  return item[fieldName] || '';
};

/**
 * データ配列を言語対応に変換
 *
 * @param {Array} dataArray - データ配列
 * @param {Array} fieldMappings - フィールドマッピング定義
 * @param {string} language - 言語コード ('ja' | 'en')
 * @returns {Array} - 言語対応されたデータ配列
 *
 * @example
 * const purposes = [
 *   { id: 1, name: '観光', name_en: 'Sightseeing' },
 *   { id: 2, name: '登山', name_en: 'Hiking' }
 * ];
 *
 * const localized = localizeData(
 *   purposes,
 *   [{ source: 'name', target: 'displayName' }],
 *   'en'
 * );
 * // [
 * //   { id: 1, name: '観光', name_en: 'Sightseeing', displayName: 'Sightseeing' },
 * //   { id: 2, name: '登山', name_en: 'Hiking', displayName: 'Hiking' }
 * // ]
 */
export const localizeData = (dataArray, fieldMappings, language) => {
  if (!Array.isArray(dataArray)) {
    return [];
  }

  return dataArray.map((item) => {
    const localizedItem = { ...item };

    fieldMappings.forEach(({ source, target }) => {
      localizedItem[target] = getLocalizedField(item, source, language);
    });

    return localizedItem;
  });
};

/**
 * main_purposes データを言語対応に変換
 *
 * @param {Array} mainPurposes - メイン目的データ配列
 * @param {string} language - 言語コード ('ja' | 'en')
 * @returns {Array} - 言語対応されたメイン目的データ
 */
export const localizeMainPurposes = (mainPurposes, language) => {
  return localizeData(
    mainPurposes,
    [{ source: 'name', target: 'displayName' }],
    language
  );
};

/**
 * sub_purposes データを言語対応に変換
 *
 * @param {Array} subPurposes - サブ目的データ配列
 * @param {string} language - 言語コード ('ja' | 'en')
 * @returns {Array} - 言語対応されたサブ目的データ
 */
export const localizeSubPurposes = (subPurposes, language) => {
  return localizeData(
    subPurposes,
    [{ source: 'name', target: 'displayName' }],
    language
  );
};

/**
 * default_items データを言語対応に変換
 *
 * @param {Array} defaultItems - 推奨持ち物データ配列
 * @param {string} language - 言語コード ('ja' | 'en')
 * @returns {Array} - 言語対応された推奨持ち物データ
 */
export const localizeDefaultItems = (defaultItems, language) => {
  return localizeData(
    defaultItems,
    [{ source: 'name', target: 'displayName' }],
    language
  );
};

/**
 * travel_rules データを言語対応に変換
 *
 * @param {Array} travelRules - ルール・マナーデータ配列
 * @param {string} language - 言語コード ('ja' | 'en')
 * @returns {Array} - 言語対応されたルール・マナーデータ
 */
export const localizeTravelRules = (travelRules, language) => {
  return localizeData(
    travelRules,
    [
      { source: 'rule_title', target: 'displayTitle' },
      { source: 'rule_description', target: 'displayDescription' }
    ],
    language
  );
};

/**
 * useTranslation フックと統合したデータ取得用ヘルパー
 *
 * @param {Object} i18n - react-i18next の i18n インスタンス
 * @returns {Object} - 言語対応ヘルパー関数群
 *
 * @example
 * import { useTranslation } from 'react-i18next';
 * import { createI18nDataHelpers } from '@/utils/i18nDataHelper';
 *
 * const MyComponent = () => {
 *   const { i18n } = useTranslation();
 *   const { localizeMainPurposes, localizeDefaultItems } = createI18nDataHelpers(i18n);
 *
 *   const [mainPurposes, setMainPurposes] = useState([]);
 *
 *   useEffect(() => {
 *     fetchMainPurposes().then(data => {
 *       setMainPurposes(localizeMainPurposes(data));
 *     });
 *   }, [i18n.language]);
 * };
 */
export const createI18nDataHelpers = (i18n) => {
  const currentLanguage = i18n.language;

  return {
    localizeMainPurposes: (data) => localizeMainPurposes(data, currentLanguage),
    localizeSubPurposes: (data) => localizeSubPurposes(data, currentLanguage),
    localizeDefaultItems: (data) => localizeDefaultItems(data, currentLanguage),
    localizeTravelRules: (data) => localizeTravelRules(data, currentLanguage),
    getLocalizedField: (item, fieldName) =>
      getLocalizedField(item, fieldName, currentLanguage)
  };
};
