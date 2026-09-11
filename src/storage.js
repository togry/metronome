// ─── Local persistence ────────────────────────────────────────────────────────
//
// The score survives reloads via localStorage, under the same key prefix as the
// locale setting. Every access is guarded: the API throws outright in some
// privacy modes, and setItem throws when the quota is full. Losing a save is
// never worth breaking the app over, so failures are silent and non-fatal.

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
export function loadSettings() {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
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
