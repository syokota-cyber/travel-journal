// © 2025 Campingcar Travel Tips.com. All rights reserved.

import React from 'react';
import { useTranslation } from 'react-i18next';

const TermsOfService = ({ onClose }) => {
  const { t } = useTranslation('terms');
  const noticeItemsRaw = t('notice.items', { returnObjects: true });
  const noticeItems = Array.isArray(noticeItemsRaw) ? noticeItemsRaw : [];

  const sectionsRaw = t('sections', { returnObjects: true });
  const sectionEntries =
    sectionsRaw && typeof sectionsRaw === 'object' && !Array.isArray(sectionsRaw)
      ? Object.entries(sectionsRaw)
      : [];

  return (
    <div className="terms-modal">
      <div className="terms-content">
        <h2>{t('modal_title')}</h2>
        <div className="terms-text">
          <div className="service-notice">
            <h3>{t('notice.title')}</h3>
            <p>
              <strong>{t('notice.intro')}</strong>
            </p>
            <ul>
              {noticeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {sectionEntries.map(([sectionKey, section]) => {
            const lines = Array.isArray(section.items) ? section.items : [];

            return (
              <div key={sectionKey} className="terms-section">
                <h3>{section.title}</h3>
                <p>
                  {lines.map((line, index) => (
                    <React.Fragment key={`${sectionKey}-${index}`}>
                      {line}
                      {index < lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            );
          })}

          <p className="terms-date">
            {t('effective_date')}<br />
            {t('operator')}
          </p>
        </div>
        <button className="terms-close-btn" onClick={onClose}>
          {t('close_button')}
        </button>
      </div>
    </div>
  );
};

export default TermsOfService;
