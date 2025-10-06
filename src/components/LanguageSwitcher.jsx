import React from 'react';
import { useTranslation } from 'react-i18next';

import { supportedLanguages } from '../i18n';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation();

  const handleChange = (event) => {
    const nextLocale = event.target.value;
    i18n.changeLanguage(nextLocale);
  };

  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <span className="language-switcher__label">{t('common.language_switch')}</span>
      <select
        className="language-switcher__select"
        onChange={handleChange}
        value={currentLanguage?.split('-')[0] || supportedLanguages[0].code}
      >
        {supportedLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
