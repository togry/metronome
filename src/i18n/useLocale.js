// ─── useLocale hook ───────────────────────────────────────────────────────────
// Returns [t, locale, setLocale] and triggers a re-render when the locale changes.

import { useState, useEffect } from 'react';
import { t, getLocale, setLocale as _setLocale, onLocaleChange, LOCALES } from './index.js';

export { LOCALES };

export function useLocale() {
  const [locale, setLocaleState] = useState(getLocale);

  useEffect(() => {
    return onLocaleChange(code => setLocaleState(code));
  }, []);

  return [t, locale, _setLocale];
}

