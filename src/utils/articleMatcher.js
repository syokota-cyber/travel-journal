// © 2025 Campingcar Travel Tips.com. All rights reserved.

/**
 * 記事マッチングユーティリティ
 * 旅行の方面・季節・メイン目的に基づいて適切な記事を選別
 */

/**
 * 日付から季節を判定
 * @param {string} dateString - YYYY-MM-DD形式の日付
 * @returns {string} - "春", "夏", "秋", "冬"
 */
export const getSeason = (dateString) => {
  if (!dateString) return '春';

  const month = new Date(dateString).getMonth() + 1;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
};

/**
 * 方面と記事の地域がマッチするか判定
 * @param {string} destination - 旅行の方面（例: "北海道", "北海道（道東）", "関東"）
 * @param {Array<string>} regions - 記事の地域配列（例: ["北海道"], ["関東", "甲信越"]）
 * @returns {boolean}
 */
export const matchRegion = (destination, regions) => {
  if (!destination || !regions || regions.length === 0) return false;

  // 括弧内の地域名と「方面」を除去
  // 例: "北海道（道東）" → "北海道", "九州方面" → "九州"
  const cleanDestination = destination
    .replace(/[（(].*?[）)]/g, '')  // 括弧を除去
    .replace(/方面/g, '')           // 「方面」を除去
    .trim();

  // デバッグログ
  console.log('🔍 matchRegion debug:', {
    original: destination,
    cleaned: cleanDestination,
    articleRegions: regions
  });

  // 方面と地域の対応表
  const regionMapping = {
    '北海道': ['北海道'],
    '東北': ['東北'],
    '関東': ['関東'],
    '甲信越': ['甲信越'],
    '北陸': ['北陸'],
    '東海': ['東海', '中部'],
    '近畿': ['近畿', '関西'],
    '中国': ['中国'],
    '四国': ['四国'],
    '九州': ['九州']
  };

  const targetRegions = regionMapping[cleanDestination] || [cleanDestination];
  const match = regions.some(region => targetRegions.includes(region));

  console.log('🔍 matchRegion result:', {
    targetRegions,
    match
  });

  return match;
};

/**
 * 季節がマッチするか判定
 * @param {string} season - "春", "夏", "秋", "冬"
 * @param {Array<string>} articleSeasons - 記事の季節配列
 * @returns {boolean}
 */
export const matchSeason = (season, articleSeasons) => {
  if (!articleSeasons || articleSeasons.length === 0) return false;
  return articleSeasons.includes('all') || articleSeasons.includes(season);
};

/**
 * マッチスコアを計算
 * @param {Object} trip - 旅行オブジェクト
 * @param {Object} article - 記事オブジェクト
 * @param {string} season - 判定された季節
 * @returns {number} - マッチスコア
 */
const calculateMatchScore = (trip, article, season) => {
  let score = 0;

  // 方面マッチ（基本点）: +10点
  score += 10;

  // 季節マッチ
  if (article.季節.includes(season)) {
    // 完全マッチ: +5点
    score += 5;
  } else if (article.季節.includes('all')) {
    // "all"（通年）: +3点
    score += 3;
  }

  // 将来の拡張: メイン目的とテーマの関連性マッチング
  // if (trip.mainPurposes && article.テーマ) {
  //   score += matchPurposeTheme(trip.mainPurposes, article.テーマ);
  // }

  return score;
};

/**
 * 旅行に適合する記事をフィルタリング
 * @param {Object} trip - { destination, start_date, mainPurposes }
 * @param {Array<Object>} articles - 記事配列
 * @returns {Array<Object>} - スコア順にソートされた適合記事リスト
 */
export const filterArticles = (trip, articles) => {
  if (!trip || !articles || articles.length === 0) return [];
  if (!trip.destination || !trip.start_date) return [];

  const season = getSeason(trip.start_date);

  return articles
    .filter(article => {
      // 1. 方面マッチング（必須条件）
      const regionMatch = matchRegion(trip.destination, article.地域);
      if (!regionMatch) return false;

      // 2. 季節マッチング（推奨条件）
      const seasonMatch = matchSeason(season, article.季節);
      if (!seasonMatch) return false;

      return true;
    })
    .map(article => ({
      ...article,
      matchScore: calculateMatchScore(trip, article, season)
    }))
    .sort((a, b) => b.matchScore - a.matchScore); // スコア降順
};

/**
 * デバッグ用: マッチング情報を出力
 * @param {Object} trip
 * @param {Array<Object>} matchedArticles
 */
export const logMatchingInfo = (trip, matchedArticles) => {
  const season = getSeason(trip.start_date);
  console.log('🔍 記事マッチング情報:');
  console.log(`  方面: ${trip.destination}`);
  console.log(`  計画月: ${trip.start_date} (${season})`);
  console.log(`  マッチ件数: ${matchedArticles.length}件`);

  if (matchedArticles.length > 0) {
    console.log('  上位3件:');
    matchedArticles.slice(0, 3).forEach((article, index) => {
      console.log(`    ${index + 1}. ${article.テーマ} (スコア: ${article.matchScore})`);
    });
  }
};
