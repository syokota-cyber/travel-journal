import React from 'react';
import { I18nextProvider } from 'react-i18next';

import i18n, { initI18n } from '../i18n';

initI18n();

const I18nProvider = ({ children }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

export default I18nProvider;
