// © 2025 Campingcar Travel Tips.com. All rights reserved.

/**
 * 記事マッチングユーティリティ
 * 旅行の方面・季節・メイン目的に基づいて適切な記事を選別
 */

/**
 * 日付から季節を判定
 * @param {string} dateString - YYYY-MM-DD形式の日付
 * @param {string} language - 'ja' or 'en'
 * @returns {string} - 日本語: "春", "夏", "秋", "冬" / 英語: "spring", "summer", "autumn", "winter"
 */
export const getSeason = (dateString, language = 'ja') => {
  if (!dateString) return language === 'en' ? 'spring' : '春';

  const month = new Date(dateString).getMonth() + 1;
  let season;
  if (month >= 3 && month <= 5) season = language === 'en' ? 'spring' : '春';
  else if (month >= 6 && month <= 8) season = language === 'en' ? 'summer' : '夏';
  else if (month >= 9 && month <= 11) season = language === 'en' ? 'autumn' : '秋';
  else season = language === 'en' ? 'winter' : '冬';

  return season;
};

/**
 * 方面と記事の地域がマッチするか判定
 * @param {string} destination - 旅行の方面（例: "北海道", "北海道（道東）", "関東"）
 * @param {Array<string>} regions - 記事の地域配列（例: ["北海道"], ["関東", "甲信越"], ["Hokkaido"], ["Kanto"]）
 * @param {string} language - 'ja' or 'en'
 * @returns {boolean}
 */
export const matchRegion = (destination, regions, language = 'ja') => {
  if (!destination || !regions || regions.length === 0) return false;

  // 括弧内の地域名と「方面」、英語の「Region」を除去
  // 例: "北海道（道東）" → "北海道", "九州方面" → "九州", "Shikoku Region" → "Shikoku"
  const cleanDestination = destination
    .replace(/[（(].*?[）)]/g, '')  // 括弧を除去
    .replace(/方面/g, '')           // 「方面」を除去
    .replace(/\s+Region$/i, '')     // 英語の「Region」を除去
    .trim();

  // デバッグログ
  console.log('🔍 matchRegion debug:', {
    original: destination,
    cleaned: cleanDestination,
    articleRegions: regions,
    language
  });

  // スラッシュで区切られた地域名を分割（例: "Chubu/Tokai" → ["Chubu", "Tokai"]）
  const destinationParts = cleanDestination.split('/').map(part => part.trim());

  // 方面と地域の対応表（日本語・英語両対応）
  const regionMapping = {
    // 日本語
    '北海道': ['北海道', 'Hokkaido'],
    '東北': ['東北', 'Tohoku'],
    '関東': ['関東', 'Kanto'],
    '甲信越': ['甲信越', 'Koshinetsu', 'Koshietsu'],  // 表記ゆれ対応
    'Koshinetsu': ['甲信越', 'Koshinetsu', 'Koshietsu'],
    'Koshietsu': ['甲信越', 'Koshinetsu', 'Koshietsu'],
    '北陸': ['北陸', 'Hokuriku'],
    '東海': ['東海', '中部', 'Tokai', 'Chubu'],
    '中部': ['中部', '東海', 'Chubu', 'Tokai'],
    'Chubu': ['中部', '東海', 'Chubu', 'Tokai'],
    'Tokai': ['東海', '中部', 'Tokai', 'Chubu'],
    '近畿': ['近畿', '関西', 'Kinki'],
    '中国': ['中国', 'Chugoku'],
    '四国': ['四国', 'Shikoku', 'Shioku'],
    'Shikoku': ['四国', 'Shikoku', 'Shioku'],
    'Shioku': ['四国', 'Shikoku', 'Shioku'],
    '九州': ['九州', 'Kyushu', 'Kyusyu'],
    'Kyushu': ['九州', 'Kyushu', 'Kyusyu'],
    'Kyusyu': ['九州', 'Kyushu', 'Kyusyu']
  };

  // 各パートに対してマッチング
  let targetRegions = [];
  for (const part of destinationParts) {
    if (regionMapping[part]) {
      targetRegions = targetRegions.concat(regionMapping[part]);
    } else {
      targetRegions.push(part);
    }
  }

  const match = regions.some(region => targetRegions.includes(region));

  console.log('🔍 matchRegion result:', {
    targetRegions,
    match
  });

  return match;
};

/**
 * 季節がマッチするか判定
 * @param {string} season - "春", "夏", "秋", "冬" または "spring", "summer", "autumn", "winter"
 * @param {Array<string>} articleSeasons - 記事の季節配列
 * @returns {boolean}
 */
export const matchSeason = (season, articleSeasons) => {
  if (!articleSeasons || articleSeasons.length === 0) return false;
  // 大文字小文字を統一して比較
  const normalizedSeasons = articleSeasons.map(s => s.toLowerCase());
  return normalizedSeasons.includes('all') || normalizedSeasons.includes(season.toLowerCase());
};

/**
 * マッチスコアを計算
 * @param {Object} article - 記事オブジェクト
 * @param {string} season - 判定された季節
 * @param {string} language - 'ja' or 'en'
 * @returns {number} - マッチスコア
 */
const calculateMatchScore = (article, season, language = 'ja') => {
  let score = 0;

  // 方面マッチ（基本点）: +10点
  score += 10;

  // 季節マッチ（日本語・英語対応）
  const seasonField = language === 'en' ? (article.Season || []) : (article.季節 || []);
  const normalizedSeasons = seasonField.map(s => s.toLowerCase());
  const normalizedSeason = season.toLowerCase();

  if (normalizedSeasons.includes(normalizedSeason)) {
    // 完全マッチ: +5点
    score += 5;
  } else if (normalizedSeasons.includes('all')) {
    // "all"（通年）: +3点
    score += 3;
  }

  // 将来の拡張: メイン目的とテーマの関連性マッチング
  // if (trip.mainPurposes && (article.テーマ || article.Theme)) {
  //   score += matchPurposeTheme(trip.mainPurposes, article.テーマ || article.Theme);
  // }

  return score;
};

/**
 * 旅行に適合する記事をフィルタリング
 * @param {Object} trip - { destination, start_date, mainPurposes }
 * @param {Array<Object>} articles - 記事配列
 * @param {string} language - 'ja' or 'en'
 * @returns {Array<Object>} - スコア順にソートされた適合記事リスト
 */
export const filterArticles = (trip, articles, language = 'ja') => {
  if (!trip || !articles || articles.length === 0) return [];
  if (!trip.destination || !trip.start_date) return [];

  const season = getSeason(trip.start_date, language);

  return articles
    .filter(article => {
      // 1. 方面マッチング（必須条件）
      const regionField = language === 'en' ? (article.Location || []) : (article.地域 || []);
      const regionMatch = matchRegion(trip.destination, regionField, language);
      if (!regionMatch) return false;

      // 2. 季節マッチング（推奨条件）
      const seasonField = language === 'en' ? (article.Season || []) : (article.季節 || []);
      const seasonMatch = matchSeason(season, seasonField);
      if (!seasonMatch) return false;

      return true;
    })
    .map(article => ({
      ...article,
      matchScore: calculateMatchScore(article, season, language)
    }))
    .sort((a, b) => b.matchScore - a.matchScore); // スコア降順
};

/**
 * デバッグ用: マッチング情報を出力
 * @param {Object} trip
 * @param {Array<Object>} matchedArticles
 * @param {string} language - 'ja' or 'en'
 */
export const logMatchingInfo = (trip, matchedArticles, language = 'ja') => {
  const season = getSeason(trip.start_date, language);
  console.log('🔍 記事マッチング情報:');
  console.log(`  方面: ${trip.destination}`);
  console.log(`  計画月: ${trip.start_date} (${season})`);
  console.log(`  マッチ件数: ${matchedArticles.length}件`);

  if (matchedArticles.length > 0) {
    console.log('  上位3件:');
    matchedArticles.slice(0, 3).forEach((article, index) => {
      const theme = language === 'en' ? article.Theme : article.テーマ;
      console.log(`    ${index + 1}. ${theme} (スコア: ${article.matchScore})`);
    });
  }
};
