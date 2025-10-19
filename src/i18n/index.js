import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enTerms from './locales/en/terms.json';
import enAdmin from './locales/en/admin.json';
import jaCommon from './locales/ja/common.json';
import jaTerms from './locales/ja/terms.json';
import jaAdmin from './locales/ja/admin.json';

export const defaultNS = 'common';

export const supportedLanguages = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' }
];

export const namespaces = [defaultNS, 'terms', 'admin'];

const resources = {
  en: {
    [defaultNS]: enCommon,
    terms: enTerms,
    admin: enAdmin
  },
  ja: {
    [defaultNS]: jaCommon,
    terms: jaTerms,
    admin: jaAdmin
  }
};

export const initI18n = (options = {}) => {
  if (!i18n.isInitialized) {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources,
        defaultNS,
        fallbackLng: 'ja',
        ns: namespaces,
        supportedLngs: supportedLanguages.map((lang) => lang.code),
        load: 'languageOnly',
        interpolation: {
          escapeValue: false
        },
        detection: {
          order: ['querystring', 'localStorage', 'navigator'],
          caches: ['localStorage']
        },
        react: {
          useSuspense: false
        },
        ...options
      });
  }

  return i18n;
};

export default i18n;
