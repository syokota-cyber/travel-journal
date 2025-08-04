// モックデータ
export const mockTrips = [
  {
    id: 'trip-1',
    title: '2024年夏 富士山周遊の旅',
    startDate: '2024-07-15',
    endDate: '2024-07-17',
    status: 'completed',
    mainPurposes: [
      {
        id: 'main-1',
        name: '富士山5合目観光',
        category: 'sightseeing',
        priority: 'high',
        achieved: true,
        satisfaction: 5,
        memo: '天気も良く最高の景色だった'
      },
      {
        id: 'main-2',
        name: '河口湖でカヤック体験',
        category: 'activity',
        priority: 'high',
        achieved: true,
        satisfaction: 4,
        memo: '風が強かったが楽しめた'
      },
      {
        id: 'main-3',
        name: '星空撮影',
        category: 'activity',
        priority: 'medium',
        achieved: false,
        satisfaction: null,
        memo: '曇りで断念'
      }
    ],
    subPurposes: [
      {
        id: 'sub-1',
        name: '道の駅なるさわ',
        category: 'roadstation',
        achieved: true,
        satisfaction: 3,
        memo: '富士山の湧き水が美味しかった'
      },
      {
        id: 'sub-2',
        name: 'ほうとう不動',
        category: 'food',
        achieved: true,
        satisfaction: 5,
        memo: '名物ほうとうは絶品！'
      }
    ],
    items: [
      {
        id: 'item-1',
        name: '寝袋',
        category: 'bedding',
        quantity: 2,
        packed: true,
        usage: 'well',
        nextTime: true
      },
      {
        id: 'item-2',
        name: 'カセットコンロ',
        category: 'cooking',
        quantity: 1,
        packed: true,
        usage: 'little',
        nextTime: true
      },
      {
        id: 'item-3',
        name: '焚き火台',
        category: 'outdoor',
        quantity: 1,
        packed: true,
        usage: 'unused',
        nextTime: false
      }
    ],
    review: {
      overallMemo: '初めての富士山周遊旅行は大満足だった',
      improvements: '星空撮影のために天気予報をもっと詳しくチェックすべきだった',
      bestMoment: 'カヤックから見た逆さ富士が最高だった'
    }
  },
  {
    id: 'trip-2',
    title: '2024年秋 紅葉狩りツアー',
    startDate: '2024-10-20',
    endDate: '2024-10-22',
    status: 'planning',
    mainPurposes: [
      {
        id: 'main-4',
        name: '日光東照宮参拝',
        category: 'sightseeing',
        priority: 'high',
        achieved: false,
        satisfaction: null,
        memo: ''
      },
      {
        id: 'main-5',
        name: '華厳の滝観光',
        category: 'nature',
        priority: 'high',
        achieved: false,
        satisfaction: null,
        memo: ''
      }
    ],
    subPurposes: [
      {
        id: 'sub-3',
        name: '日光湯元温泉',
        category: 'onsen',
        achieved: false,
        satisfaction: null,
        memo: ''
      }
    ],
    items: [
      {
        id: 'item-4',
        name: '防寒着',
        category: 'seasonal',
        quantity: 2,
        packed: false,
        usage: null,
        nextTime: true
      }
    ],
    review: null
  }
];

// カテゴリ定義
export const categories = {
  mainPurposes: {
    nature: '自然体験',
    activity: 'アクティビティ',
    sightseeing: '観光',
    event: 'イベント',
    custom: 'その他'
  },
  subPurposes: {
    roadstation: '道の駅',
    onsen: '温泉',
    food: 'グルメ',
    shopping: '買い物',
    facility: '施設'
  },
  items: {
    bedding: '寝具',
    cooking: '調理器具',
    outdoor: 'アウトドア用品',
    hygiene: '衛生用品',
    safety: '安全用品',
    activity: 'アクティビティ用品',
    seasonal: '季節用品'
  }
};

// 達成度計算関数
export const calculateAchievementRate = (purposes) => {
  if (!purposes || purposes.length === 0) return 0;
  const achieved = purposes.filter(p => p.achieved).length;
  return Math.round((achieved / purposes.length) * 100);
};

// 満足度平均計算関数
export const calculateAverageSatisfaction = (purposes) => {
  const rated = purposes.filter(p => p.satisfaction);
  if (rated.length === 0) return 0;
  const total = rated.reduce((sum, p) => sum + p.satisfaction, 0);
  return (total / rated.length).toFixed(1);
};

// 道具活用率計算関数
export const calculateItemUsageRate = (items) => {
  if (!items || items.length === 0) return 0;
  const used = items.filter(i => i.usage === 'well' || i.usage === 'little').length;
  return Math.round((used / items.length) * 100);
};