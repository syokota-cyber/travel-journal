// © 2025 Campingcar Travel Tips.com. All rights reserved.

/**
 * クリック統計カード
 * 総クリック数、総記事数、平均クリック数を表示
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAnalyticsStats } from '../../utils/articleAnalytics';

const ClicksStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalArticles: 0,
    averageClicks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await getAnalyticsStats();
      setStats(data);
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-section">
        <h2>{t('admin.statistics', 'Statistics')}</h2>
        <div className="loading-message">{t('admin.loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h2>{t('admin.statistics', 'Statistics')}</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalClicks.toLocaleString()}</div>
            <div className="stat-label">{t('admin.totalClicks', 'Total Clicks')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalArticles.toLocaleString()}</div>
            <div className="stat-label">{t('admin.totalArticles', 'Total Articles')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageClicks.toLocaleString()}</div>
            <div className="stat-label">{t('admin.averageClicks', 'Average Clicks')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClicksStats;
