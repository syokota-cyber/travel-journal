import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);

  return (
    <>
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <button
              className="footer-link"
              onClick={() => setShowGuideModal(true)}
            >
              {t('common.guide')}
            </button>
            <span className="footer-separator">|</span>
            <button
              className="footer-link"
              onClick={() => setShowBugReportModal(true)}
            >
              {t('common.report_bug')}
            </button>
          </div>
          <div className="footer-copyright">
            {t('common.copyright')}
          </div>
        </div>
      </footer>

      {/* 使い方ガイドモーダル */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowGuideModal(false)}>×</button>
            <h2>{t('common.guide')}</h2>
            
            <div className="guide-section">
              <h3>{t('guide.basicFeatures')}</h3>
              <ul>
                <li>{t('guide.tripCreation')}</li>
                <li>{t('guide.purposeSetting')}</li>
                <li>{t('guide.customSubPurposes')}</li>
                <li>{t('guide.itemsList')}</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>{t('guide.limitations')}</h3>
              <ul>
                <li>{t('guide.monthlyLimit')}</li>
                <li>{t('guide.yearlyLimit')}</li>
              </ul>
            </div>

            <div className="guide-section">
              <h3>{t('guide.usefulFeatures')}</h3>
              <ul>
                <li>{t('guide.dateOverlapCheck')}</li>
                <li>{t('guide.postTripReview')}</li>
                <li>{t('guide.achievementCalculation')}</li>
                <li>{t('guide.percentageReview')}</li>
                <li>{t('guide.dataExportFeature')}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 不具合報告モーダル */}
      {showBugReportModal && (
        <div className="modal-overlay" onClick={() => setShowBugReportModal(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBugReportModal(false)}>×</button>
            <h2>{t('common.report_bug')}</h2>
            
            <div className="guide-section">
              <p dangerouslySetInnerHTML={{ __html: t('bugReport.description') }} />

              <div style={{textAlign: 'center', margin: '20px 0'}}>
                <button
                  className="btn-primary"
                  onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSf3ixzjq-Z7GMHP1XJLtI2uY6nG1jxjlie0WQODjVfzh2KmUw/viewform', '_blank', 'noopener,noreferrer')}
                  style={{padding: '12px 24px', fontSize: '16px'}}
                >
                  {t('bugReport.openFormButton')}
                </button>
              </div>
            </div>

            <div className="guide-section">
              <h3>{t('bugReport.infoTitle')}</h3>
              <ul>
                <li><strong>{t('bugReport.problemDetail')}</strong>: {t('bugReport.problemDetailDesc')}</li>
                <li><strong>{t('bugReport.occurredDate')}</strong>: {t('bugReport.occurredDateDesc')}</li>
                <li><strong>{t('bugReport.environment')}</strong>: {t('bugReport.environmentDesc')}</li>
                <li><strong>{t('bugReport.errorMessage')}</strong>: {t('bugReport.errorMessageDesc')}</li>
              </ul>
              <p>{t('bugReport.helpNote')}</p>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export default Footer;