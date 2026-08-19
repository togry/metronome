// ─── Render smoke test ────────────────────────────────────────────────────────
//
// The rest of the suite covers the pure modules, which means a component that
// throws during render still passes everything and still builds — the failure
// only shows up as a blank page in the browser. A hook whose dependency array
// names state declared further down is the easy way to cause it: the array is
// evaluated during render, so the consts are read in their temporal dead zone.
//
// This renders the real component through Vite's SSR pipeline, which executes
// the render body. Effects do not run, so it proves the app mounts, not that it
// behaves.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { renderToString } from 'react-dom/server';
import React from 'react';

const root = new URL('..', import.meta.url).pathname;

let server, Metronome;

before(async () => {
  server = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  Metronome = (await server.ssrLoadModule('/src/Metronome.jsx')).default;
});

after(async () => { await server?.close(); });

function fakeStorage(data = {}) {
  return {
    getItem:    k => (k in data ? data[k] : null),
    setItem:    (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
  };
}

describe('app renders', () => {
  test('with no saved state', () => {
    const html = renderToString(React.createElement(Metronome));
    assert.ok(html.length > 1000, 'expected a populated page');
    assert.match(html, /METRONOMICON/);
  });

  test('with a saved score', () => {
    globalThis.localStorage = fakeStorage({
      metronomicon_score: '1| 7/8 (2+2+3) 1/4=90\n8||',
    });
    try {
      assert.match(renderToString(React.createElement(Metronome)), /METRONOMICON/);
    } finally {
      delete globalThis.localStorage;
    }
  });

  test('with a saved score that does not parse', () => {
    // A score stored under a syntax that later changes must not be able to take
    // the app down on boot — that would leave no way to reach the editor to fix it.
    globalThis.localStorage = fakeStorage({
      metronomicon_score: '((( not a score at all ]]]',
    });
    try {
      assert.match(renderToString(React.createElement(Metronome)), /METRONOMICON/);
    } finally {
      delete globalThis.localStorage;
    }
  });

  test('with a corrupt settings blob', () => {
    globalThis.localStorage = fakeStorage({ metronomicon_settings: '{not json' });
    try {
      assert.match(renderToString(React.createElement(Metronome)), /METRONOMICON/);
    } finally {
      delete globalThis.localStorage;
    }
  });
});
