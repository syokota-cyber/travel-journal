// 旅先方面の選択肢定数
// Tree-shakingを防ぐため、強制的にコンソールにログを出力
const DESTINATIONS_LIST = [
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
  console.log('Destinations loaded:', DESTINATIONS_LIST.length, 'items');
}

export const DESTINATIONS = DESTINATIONS_LIST;
export default DESTINATIONS;