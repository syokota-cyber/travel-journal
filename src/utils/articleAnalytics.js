// © 2025 Campingcar Travel Tips.com. All rights reserved.

/**
 * 記事分析ユーティリティ
 * クリック数追跡とメタデータ管理
 */

import { supabase } from '../lib/supabase';

/**
 * 記事クリックを記録
 * @param {string} url - 記事URL
 * @returns {Promise<boolean>} - 成功/失敗
 */
export const trackArticleClick = async (url) => {
  try {
    // Rate Limiting: 同一記事への1分以内の連続クリックを防止
    const lastClickKey = `article_click_${url}`;
    const lastClickTime = localStorage.getItem(lastClickKey);
    const now = Date.now();

    if (lastClickTime && now - parseInt(lastClickTime) < 60000) {
      console.log('⏱️ Click rate limited (1 minute cooldown)');
      return false;
    }

    // 既存レコード確認
    const { data: existing } = await supabase
      .from('article_clicks')
      .select('url, click_count')
      .eq('url', url)
      .single();

    if (existing) {
      // 既存レコードの更新
      const { error } = await supabase
        .from('article_clicks')
        .update({
          click_count: existing.click_count + 1,
          last_clicked_at: new Date().toISOString()
        })
        .eq('url', url);

      if (error) throw error;
    } else {
      // 新規レコード作成
      const { error } = await supabase
        .from('article_clicks')
        .insert({
          url,
          click_count: 1,
          last_clicked_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    // クリック記録成功後、localStorageに最終クリック時刻を保存
    localStorage.setItem(lastClickKey, now.toString());

    console.log(`✅ Article click tracked: ${url}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to track article click:', error);
    return false;
  }
};

/**
 * 記事のクリック数を取得
 * @param {Array<string>} urls - 記事URL配列
 * @returns {Promise<Map<string, number>>} - URL→クリック数のマップ
 */
export const getArticleClicks = async (urls) => {
  try {
    const { data, error } = await supabase
      .from('article_clicks')
      .select('url, click_count')
      .in('url', urls);

    if (error) throw error;

    // MapでURL→クリック数の対応を作成
    const clickMap = new Map();
    data.forEach(({ url, click_count }) => {
      clickMap.set(url, click_count);
    });

    return clickMap;
  } catch (error) {
    console.error('❌ Failed to get article clicks:', error);
    return new Map();
  }
};

/**
 * 人気記事トップNを取得
 * @param {number} limit - 取得件数（デフォルト: 10）
 * @returns {Promise<Array<Object>>} - 人気記事リスト
 */
export const getTopArticles = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('article_clicks')
      .select('url, click_count, last_clicked_at')
      .order('click_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Failed to get top articles:', error);
    return [];
  }
};
