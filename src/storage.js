// ─── Local persistence ────────────────────────────────────────────────────────
//
// The score survives reloads via localStorage, under the same key prefix as the
// locale setting. Every access is guarded: the API throws outright in some
// privacy modes, and setItem throws when the quota is full. Losing a save is
// never worth breaking the app over, so failures are silent and non-fatal.

const SCORE_KEY    = 'metronomicon_score';
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

// Returns the saved score, or null when there is nothing usable to restore.
// A blank saved score counts as nothing — booting into an empty editor is
// more confusing than booting into the default.
export function loadScore() {
  try {
    const text = storage()?.getItem(SCORE_KEY);
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

// Returns true if the score was stored, false if persistence is unavailable.
export function saveScore(text) {
  const s = storage();
  if (!s) return false;
  try {
    if (text && text.trim()) s.setItem(SCORE_KEY, text);
    else s.removeItem(SCORE_KEY);
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
