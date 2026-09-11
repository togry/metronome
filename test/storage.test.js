// ─── Persistence tests ────────────────────────────────────────────────────────
//
// storage.js reads the localStorage global at call time, so these tests swap in
// fakes — including ones that throw, which is what privacy modes and a full
// quota actually do.

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadScores, saveScores, loadSettings, saveSettings } from '../src/storage.js';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem:    k => (k in data ? data[k] : null),
    setItem:    (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
  };
}

function withStorage(s) { globalThis.localStorage = s; }

afterEach(() => { delete globalThis.localStorage; });

describe('score persistence', () => {
  test('a saved list is restored in order', () => {
    withStorage(fakeStorage());
    assert.equal(saveScores(['1| 7/8 (2+2+3) 1/4=90', '1| 4/4']), true);
    assert.deepEqual(loadScores(), ['1| 7/8 (2+2+3) 1/4=90', '1| 4/4']);
  });

  test('nothing saved means an empty list, not null', () => {
    withStorage(fakeStorage());
    assert.deepEqual(loadScores(), []);
  });

  test('blank entries are dropped on the way in and out', () => {
    withStorage(fakeStorage());
    saveScores(['1| 4/4', '   ', '']);
    assert.deepEqual(loadScores(), ['1| 4/4']);
  });

  test('saving an empty list clears the stored one', () => {
    const s = fakeStorage({ metronomicon_scores: '["1| 4/4"]' });
    withStorage(s);
    saveScores([]);
    assert.equal('metronomicon_scores' in s.data, false);
  });

  test('multi-line scores survive intact', () => {
    withStorage(fakeStorage());
    const score = '# Title\n1| 4/4 1/4=90\n5| 3/4\n9||';
    saveScores([score]);
    assert.deepEqual(loadScores(), [score]);
  });

  test('corrupt or non-array JSON is discarded', () => {
    for (const raw of ['{not json', '{"a":1}', '"a string"', '42']) {
      withStorage(fakeStorage({ metronomicon_scores: raw }));
      assert.deepEqual(loadScores(), [], raw);
    }
  });

  test('non-string entries are filtered out', () => {
    withStorage(fakeStorage({ metronomicon_scores: '["1| 4/4", 5, null, {"x":1}]' }));
    assert.deepEqual(loadScores(), ['1| 4/4']);
  });
});

describe('settings persistence', () => {
  test('settings round-trip', () => {
    withStorage(fakeStorage());
    assert.equal(saveSettings({ theme: 'light', subdivIdx: 3, tempoScale: 80 }), true);
    assert.deepEqual(loadSettings(), { theme: 'light', subdivIdx: 3, tempoScale: 80 });
  });

  test('nothing saved yields an empty object, not null', () => {
    withStorage(fakeStorage());
    assert.deepEqual(loadSettings(), {});
  });

  test('a blob missing keys restores what it has', () => {
    // A settings blob written by an older version must not lose the keys it
    // does carry just because a newer one expects more.
    withStorage(fakeStorage({ metronomicon_settings: '{"theme":"light"}' }));
    const s = loadSettings();
    assert.equal(s.theme, 'light');
    assert.equal(s.subdivIdx ?? 1, 1);   // caller's fallback still applies
  });

  test('corrupt JSON is discarded', () => {
    withStorage(fakeStorage({ metronomicon_settings: '{not json' }));
    assert.deepEqual(loadSettings(), {});
  });

  test('a non-object blob is discarded', () => {
    for (const raw of ['[1,2,3]', '"a string"', '42', 'null']) {
      withStorage(fakeStorage({ metronomicon_settings: raw }));
      assert.deepEqual(loadSettings(), {}, raw);
    }
  });

  test('false and zero survive the round trip', () => {
    // These are the values a naive `||` fallback would silently discard.
    withStorage(fakeStorage());
    saveSettings({ countInEnabled: false, btLatency: 0, tempoScale: 100 });
    const s = loadSettings();
    assert.equal(s.countInEnabled ?? true, false);
    assert.equal(s.btLatency ?? 250, 0);
  });

  test('score and settings are stored separately', () => {
    const store = fakeStorage();
    withStorage(store);
    saveScores(['1| 4/4']);
    saveSettings({ theme: 'light' });
    assert.deepEqual(JSON.parse(store.data.metronomicon_scores), ['1| 4/4']);
    assert.equal(loadSettings().theme, 'light');
  });
});

describe('when storage is unavailable', () => {
  test('no localStorage at all', () => {
    assert.deepEqual(loadScores(), []);
    assert.equal(saveScores(['1| 4/4']), false);
    assert.deepEqual(loadSettings(), {});
    assert.equal(saveSettings({ theme: 'light' }), false);
  });

  test('a quota-exceeded write is reported, not thrown', () => {
    withStorage({
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceededError'); },
      removeItem: () => {},
    });
    assert.equal(saveScores(['1| 4/4']), false);
  });

  test('a throwing read falls back to nothing', () => {
    withStorage({
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => {},
      removeItem: () => {},
    });
    assert.deepEqual(loadScores(), []);
  });
});
