// © 2025 Campingcar Travel Tips.com. All rights reserved.

/**
 * 人気記事トップ10テーブル
 * クリック数順に記事を表示
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTopArticles } from '../../utils/articleAnalytics';

const TopArticlesTable = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopArticles = async () => {
      setLoading(true);
      const data = await getTopArticles(10);
      setArticles(data);
      setLoading(false);
    };

    fetchTopArticles();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>{t('admin.topArticles', 'Top 10 Popular Articles')}</h2>
        <div className="loading-message">{t('admin.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h2>{t('admin.topArticles', 'Top 10 Popular Articles')}</h2>

      {articles.length === 0 ? (
        <p className="no-data-message">
          {t('admin.noArticles', 'No article data available yet.')}
        </p>
      ) : (
        <div className="table-container">
          <table className="articles-table">
            <thead>
              <tr>
                <th className="rank-column">{t('admin.rank', 'Rank')}</th>
                <th className="url-column">{t('admin.article', 'Article')}</th>
                <th className="clicks-column">{t('admin.clicks', 'Clicks')}</th>
                <th className="date-column">{t('admin.lastClicked', 'Last Clicked')}</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, index) => (
                <tr key={article.url}>
                  <td className="rank-column">
                    <span className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="url-column">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-url"
                    >
                      <span className="domain">{extractDomain(article.url)}</span>
                      <span className="url-icon">↗</span>
                    </a>
                  </td>
                  <td className="clicks-column">
                    <span className="click-count">{article.click_count.toLocaleString()}</span>
                  </td>
                  <td className="date-column">
                    {formatDate(article.last_clicked_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopArticlesTable;
