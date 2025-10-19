// © 2025 Campingcar Travel Tips.com. All rights reserved.

/**
 * 記事分析ダッシュボード
 * クリック数統計と人気記事を表示する管理画面
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import TopArticlesTable from './TopArticlesTable';
import ClicksStats from './ClicksStats';
import '../../styles/admin.css';

const ArticleAnalyticsDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>{t('admin.title', 'Article Analytics Dashboard')}</h1>
        <p className="admin-subtitle">
          {t('admin.subtitle', 'Track article clicks and popular content')}
        </p>
      </div>

      {/* 統計カード */}
      <ClicksStats />

      {/* 人気記事トップ10 */}
      <TopArticlesTable />
    </div>
  );
};

export default ArticleAnalyticsDashboard;
