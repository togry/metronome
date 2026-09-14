// ─── Local persistence ────────────────────────────────────────────────────────
//
// The score survives reloads via localStorage, under the same key prefix as the
// locale setting. Every access is guarded: the API throws outright in some
// privacy modes, and setItem throws when the quota is full. Losing a save is
// never worth breaking the app over, so failures are silent and non-fatal.

import { SUBDIV_OPTIONS } from './constants.js';

const SCORES_KEY   = 'metronomicon_scores';
const SETTINGS_KEY = 'metronomicon_settings';

// Reading the global can itself throw when site data is blocked, so even the
// lookup is wrapped.
function storage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

// The score list, newest storage shape. Always returns an array; an empty one
// means "nothing to restore", and the caller supplies the default score.
// Entries that are blank are dropped — booting into an empty editor is more
// confusing than booting into the default.
export function loadScores() {
  try {
    const raw = storage()?.getItem(SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(x => typeof x === 'string' && x.trim());
  } catch {
    return [];
  }
}

export function saveScores(scores) {
  const s = storage();
  if (!s) return false;
  try {
    const keep = (scores || []).filter(x => typeof x === 'string' && x.trim());
    if (keep.length) s.setItem(SCORES_KEY, JSON.stringify(keep));
    else s.removeItem(SCORES_KEY);
    return true;
  } catch {
    return false;
  }
}

// Control settings, stored as one JSON blob. Always returns a plain object, so
// callers can read a key and fall back per setting — that way a blob written by
// an older version, missing keys a newer one expects, still restores what it can.
// Anything unreadable is discarded rather than repaired.
// What each setting is allowed to be. The UI already constrains these — a
// slider with a min and max, a <select> with three options — but the UI is not
// the only way they get set. They round-trip through localStorage, which is
// writable by anything sharing the origin, and on GitHub Pages a user site
// shares one origin across every repo published under it and every branch
// preview deployed beside the app.
//
// The values are not inert once restored. subdivIdx indexes an array and is
// dereferenced without a bounds check; countInBeats is a loop bound that
// allocates an oscillator per turn; tempoScale divides a tick duration, so 0
// yields Infinity and a negative runs the scheduler's clock backwards. So a
// setting that arrives out of range is dropped here rather than trusted, and
// the caller's own `?? default` supplies the value — the same path taken by a
// blob written before that setting existed.
const isBool  = v => typeof v === 'boolean';
const isNum   = (lo, hi) => v => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const isInt   = (lo, hi) => v => Number.isInteger(v) && v >= lo && v <= hi;
const isOneOf = (...ok) => v => ok.includes(v);

const SETTINGS_SCHEMA = {
  theme:           isOneOf('dark', 'light'),
  subdivIdx:       isInt(0, SUBDIV_OPTIONS.length - 1),
  tempoScale:      isInt(10, 150),    // the slider's own min/max
  btLatency:       isInt(0, 500),
  btUserSet:       isBool,
  countInEnabled:  isBool,
  countInOnRepeat: isBool,
  countInBeats:    isOneOf(2, 3, 4),
  countInDenom:    isOneOf(4, 8),
  scoreWidth:      isNum(180, 600),   // drag arithmetic can land on a fraction
  activeScore:     isInt(0, 9999),    // further clamped to the list's length
};

export function loadSettings() {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean = {};
    for (const [key, valid] of Object.entries(SETTINGS_SCHEMA))
      if (key in parsed && valid(parsed[key])) clean[key] = parsed[key];
    return clean;
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
