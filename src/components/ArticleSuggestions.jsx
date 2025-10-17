// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { filterArticles, getSeason, logMatchingInfo } from '../utils/articleMatcher';

/**
 * 記事おすすめコンポーネント
 * 旅行の方面・季節に基づいて関連記事を表示
 */
const ArticleSuggestions = ({ trip }) => {
  const { t, i18n } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadArticles = async () => {
      console.log('📰 ArticleSuggestions - trip data:', trip);

      // 必須データの確認
      if (!trip || !trip.destination || !trip.start_date) {
        console.log('⚠️ ArticleSuggestions - Missing data:', {
          hasTrip: !!trip,
          destination: trip?.destination,
          startDate: trip?.start_date
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 言語に応じたJSONファイルを読み込み
        const language = i18n.language === 'en' ? 'en' : 'ja';
        const fileName = language === 'en' ? 'articles_en.json' : 'articles.json';
        const response = await fetch(`/data/${fileName}`);
        if (!response.ok) {
          throw new Error(language === 'en'
            ? 'Failed to load article data'
            : '記事データの読み込みに失敗しました');
        }

        const data = await response.json();

        // 記事をフィルタリング
        const filteredArticles = filterArticles(trip, data, language);

        // デバッグ情報をコンソール出力
        if (process.env.NODE_ENV === 'development') {
          logMatchingInfo(trip, filteredArticles, language);
        }

        // 上位5件を表示
        setArticles(filteredArticles.slice(0, 5));
      } catch (error) {
        console.error('記事読み込みエラー:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [trip, i18n.language]); // 言語切り替えにも反応

  // デバッグ用：常に表示枠を表示
  console.log('📰 ArticleSuggestions - Render state:', { loading, error, articlesCount: articles.length });

  const language = i18n.language === 'en' ? 'en' : 'ja';

  // ローディング中
  if (loading) {
    return (
      <div className="article-suggestions loading">
        <div className="article-suggestions-header">
          <h3>📰 {t('articleSuggestions.title')}</h3>
        </div>
        <p>{t('articleSuggestions.loading')}</p>
      </div>
    );
  }

  // エラー発生時
  if (error) {
    return (
      <div className="article-suggestions error">
        <div className="article-suggestions-header">
          <h3>📰 {t('articleSuggestions.title')}</h3>
        </div>
        <p>⚠️ {t('articleSuggestions.loadError')}: {error}</p>
      </div>
    );
  }

  // 記事が見つからない場合も枠は表示（デバッグ用）
  if (articles.length === 0) {
    const season = getSeason(trip?.start_date, language);
    return (
      <div className="article-suggestions">
        <div className="article-suggestions-header">
          <h3>📰 {t('articleSuggestions.title')}</h3>
          <p className="suggestion-note">
            {trip?.destination && trip?.start_date
              ? t('articleSuggestions.noMatch', { destination: trip.destination, season })
              : t('articleSuggestions.noData')}
          </p>
        </div>
        <div className="article-note">
          <p>💡 デバッグ: Trip={JSON.stringify({ destination: trip?.destination, startDate: trip?.start_date })}</p>
        </div>
      </div>
    );
  }

  // 季節を取得（表示用）
  const season = getSeason(trip.start_date, language);

  return (
    <div className="article-suggestions">
      <div className="article-suggestions-header">
        <h3>📰 {t('articleSuggestions.title')}</h3>
        <p className="suggestion-note">
          {t('articleSuggestions.subtitle', { destination: trip.destination, season })}
        </p>
      </div>

      <ul className="article-list">
        {articles.map((article, index) => {
          const theme = language === 'en' ? article.Theme : article.テーマ;
          return (
            <li key={index} className="article-item">
              <a
                href={article.URL}
                target="_blank"
                rel="noopener noreferrer"
                className="article-link"
              >
                <div className="article-content">
                  <span className="article-icon">🔗</span>
                  <span className="article-theme">{theme}</span>
                </div>
                <span className="article-arrow">→</span>
              </a>
            </li>
          );
        })}
      </ul>

      <div className="article-note">
        <p>💡 {t('articleSuggestions.openInNewTab')}</p>
      </div>
    </div>
  );
};

export default ArticleSuggestions;
