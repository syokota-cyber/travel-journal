// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React, { useState, useEffect } from 'react';
import { filterArticles, getSeason, logMatchingInfo } from '../utils/articleMatcher';

/**
 * 記事おすすめコンポーネント
 * 旅行の方面・季節に基づいて関連記事を表示
 */
const ArticleSuggestions = ({ trip }) => {
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

        // JSONファイルを読み込み
        const response = await fetch('/data/articles.json');
        if (!response.ok) {
          throw new Error('記事データの読み込みに失敗しました');
        }

        const data = await response.json();

        // 記事をフィルタリング
        const filteredArticles = filterArticles(trip, data);

        // デバッグ情報をコンソール出力
        if (process.env.NODE_ENV === 'development') {
          logMatchingInfo(trip, filteredArticles);
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
  }, [trip]); // trip全体を依存配列に追加

  // デバッグ用：常に表示枠を表示
  console.log('📰 ArticleSuggestions - Render state:', { loading, error, articlesCount: articles.length });

  // ローディング中
  if (loading) {
    return (
      <div className="article-suggestions loading">
        <div className="article-suggestions-header">
          <h3>📰 おすすめ記事</h3>
        </div>
        <p>おすすめ記事を読み込み中...</p>
      </div>
    );
  }

  // エラー発生時
  if (error) {
    return (
      <div className="article-suggestions error">
        <div className="article-suggestions-header">
          <h3>📰 おすすめ記事</h3>
        </div>
        <p>⚠️ 記事の読み込みに失敗しました: {error}</p>
      </div>
    );
  }

  // 記事が見つからない場合も枠は表示（デバッグ用）
  if (articles.length === 0) {
    return (
      <div className="article-suggestions">
        <div className="article-suggestions-header">
          <h3>📰 おすすめ記事</h3>
          <p className="suggestion-note">
            {trip?.destination && trip?.start_date
              ? `${trip.destination}・${getSeason(trip.start_date)}の記事を検索中...（該当なし）`
              : '方面と日程を設定すると、おすすめ記事が表示されます'}
          </p>
        </div>
        <div className="article-note">
          <p>💡 デバッグ: Trip={JSON.stringify({ destination: trip?.destination, startDate: trip?.start_date })}</p>
        </div>
      </div>
    );
  }

  // 季節を取得（表示用）
  const season = getSeason(trip.start_date);

  return (
    <div className="article-suggestions">
      <div className="article-suggestions-header">
        <h3>📰 おすすめ記事</h3>
        <p className="suggestion-note">
          {trip.destination}・{season}の時期に適したおすすめ情報
        </p>
      </div>

      <ul className="article-list">
        {articles.map((article, index) => (
          <li key={index} className="article-item">
            <a
              href={article.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="article-link"
            >
              <div className="article-content">
                <span className="article-icon">🔗</span>
                <span className="article-theme">{article.テーマ}</span>
              </div>
              <span className="article-arrow">→</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="article-note">
        <p>💡 記事は新しいタブで開きます</p>
      </div>
    </div>
  );
};

export default ArticleSuggestions;
