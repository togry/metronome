// ─── i18n index ───────────────────────────────────────────────────────────────
// Detects browser locale, allows override via localStorage.
// Usage:
//   import { t, setLocale, locale, LOCALES } from './i18n/index.js';
//   t.appTitle        // → string
//   t.patternClicks(3) // → '3 clicks'

import en from './en.js';
import no from './no.js';

export const LOCALES = {
  en: { label: 'EN', flag: '🇬🇧', strings: en },
  no: { label: 'NO', flag: '🇳🇴', strings: no },
};

const STORAGE_KEY = 'metronomicon_locale';

function detectLocale() {
  const stored = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES[stored]) return stored;
  const lang = (navigator.language || 'en').split('-')[0].toLowerCase();
  return LOCALES[lang] ? lang : 'en';
}

// Reactive locale — components that need to re-render on change should
// subscribe via the onChange mechanism below, or (simpler) just read from
// the React state produced by useLocale().
let _locale = detectLocale();
const _listeners = new Set();

export function getLocale() { return _locale; }

export function setLocale(code) {
  if (!LOCALES[code] || code === _locale) return;
  _locale = code;
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, code);
  _listeners.forEach(fn => fn(code));
}

export function onLocaleChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Proxy that always returns strings from the current locale,
// falling back to English for any missing key.
export const t = new Proxy({}, {
  get(_, key) {
    return LOCALES[_locale]?.strings[key] ?? LOCALES.en.strings[key];
  },
});
