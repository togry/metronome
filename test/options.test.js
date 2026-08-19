// ─── Control option tests ─────────────────────────────────────────────────────
//
// The subdivide dropdown renders SUBDIV_OPTIONS by index and looks the label up
// in the active locale by the same index, so the three lists must stay aligned.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SUBDIV_OPTIONS } from '../src/constants.js';
import { LOCALES } from '../src/i18n/index.js';

describe('subdivide options', () => {
  test('once per measure is first, primary beats second', () => {
    assert.equal(SUBDIV_OPTIONS[0].targetDenom, -1);
    assert.equal(SUBDIV_OPTIONS[1].targetDenom, 0);
  });

  test('the rest subdivide to increasing note values', () => {
    assert.deepEqual(SUBDIV_OPTIONS.slice(2).map(o => o.targetDenom), [4, 8, 16, 32]);
  });

  test('every locale labels every option', () => {
    for (const [code, { strings }] of Object.entries(LOCALES)) {
      assert.equal(strings.subdivOptions.length, SUBDIV_OPTIONS.length,
        `locale '${code}' has ${strings.subdivOptions.length} labels for ${SUBDIV_OPTIONS.length} options`);
      for (const label of strings.subdivOptions)
        assert.ok(label && label.trim(), `locale '${code}' has a blank label`);
    }
  });
});
