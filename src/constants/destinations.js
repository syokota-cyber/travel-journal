// 旅先方面の選択肢定数
// i18n対応のため、キーベースの配列に変更

// 各方面のキー（データベースに保存される値）
export const DESTINATION_KEYS = [
  'hokkaidoDohoku',
  'hokkaidoDoto',
  'hokkaidoDonan',
  'hokkaidoDoo',
  'tohoku',
  'hokuriku',
  'kanto',
  'koshinetsu',
  'chubuTokai',
  'kinki',
  'chugoku',
  'shikoku',
  'kyushu'
];

// i18n対応の方面名取得関数
// t: i18nのt関数
export const getDestinationName = (key, t) => {
  return t(`destinations.${key}`);
};

// 全ての方面を取得（i18n対応）
export const getDestinations = (t) => {
  return DESTINATION_KEYS.map(key => ({
    key,
    name: getDestinationName(key, t)
  }));
};

// 後方互換性のため、日本語の配列も維持（既存データ対応）
const DESTINATIONS_LIST_JA = [
  '北海道（道北）',
  '北海道（道東）',
  '北海道（道南）',
  '北海道（道央）',
  '東北方面',
  '北陸方面',
  '関東方面',
  '甲信越地方',
  '中部・東海方面',
  '近畿方面',
  '中国方面',
  '四国方面',
  '九州方面'
];

// デバッグ用（ビルド時に含まれることを保証）
if (process.env.NODE_ENV === 'development') {
  console.log('Destinations loaded:', DESTINATION_KEYS.length, 'items');
}

// 後方互換性のため維持
export const DESTINATIONS = DESTINATIONS_LIST_JA;
export default DESTINATIONS;