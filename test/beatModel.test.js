// ─── Beat model tests ─────────────────────────────────────────────────────────
//
// Run with: npm test   (node --test test/)
//
// getBeatPattern() turns a measure's state into the list of clicks to play:
//   weight 3 = measure downbeat, 2 = primary beat, 1 = subdivision, 0 = rest
//   durationUnits = length of the click in denominator units (may be fractional)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPrimaryGroups, getBeatPattern, groupUnits,
  groupingShortLabel, groupingFullLabel,
  oneDenomUnitSec, tickDurationSec,
} from '../src/beatModel.js';
import { parseScore } from '../src/parser.js';

const measure = text => parseScore(text).measures[1];
const weights = pattern => pattern.map(t => t.weight);
const durations = pattern => pattern.map(t => t.durationUnits);
const totalUnits = pattern => pattern.reduce((s, t) => s + t.durationUnits, 0);

describe('groupUnits', () => {
  test('a plain group is its own size', () => assert.equal(groupUnits(3), 3));
  test('a tuplet group reports its span', () =>
    assert.equal(groupUnits({ units: 2, div: 3, slots: [1, 1, 1] }), 2));
});

describe('getPrimaryGroups', () => {
  test('simple meters are one group per beat', () => {
    assert.deepEqual(getPrimaryGroups({ numerator: 4, denominator: 4 }), [1, 1, 1, 1]);
    assert.deepEqual(getPrimaryGroups({ numerator: 3, denominator: 4 }), [1, 1, 1]);
    assert.deepEqual(getPrimaryGroups({ numerator: 2, denominator: 2 }), [1, 1]);
  });

  test('compound meters group in threes', () => {
    assert.deepEqual(getPrimaryGroups({ numerator: 6,  denominator: 8 }), [3, 3]);
    assert.deepEqual(getPrimaryGroups({ numerator: 9,  denominator: 8 }), [3, 3, 3]);
    assert.deepEqual(getPrimaryGroups({ numerator: 12, denominator: 8 }), [3, 3, 3, 3]);
  });

  test('an odd meter without a grouping falls back to one beat per unit', () => {
    assert.deepEqual(getPrimaryGroups({ numerator: 7, denominator: 8 }), [1, 1, 1, 1, 1, 1, 1]);
  });

  test('an explicit grouping wins', () => {
    assert.deepEqual(
      getPrimaryGroups({ numerator: 7, denominator: 8, grouping: [2, 2, 3] }), [2, 2, 3]);
  });
});

describe('primary beats only', () => {
  test('4/4 is a downbeat and three primaries', () => {
    const p = getBeatPattern(measure('1| 4/4 1/4=120'), 0);
    assert.deepEqual(weights(p), [3, 2, 2, 2]);
    assert.deepEqual(durations(p), [1, 1, 1, 1]);
  });

  test('6/8 is two dotted-quarter beats', () => {
    const p = getBeatPattern(measure('1| 6/8 1/4.=60'), 0);
    assert.deepEqual(weights(p), [3, 2]);
    assert.deepEqual(durations(p), [3, 3]);
  });

  test('7/8 as 2+2+3 is three uneven beats', () => {
    const p = getBeatPattern(measure('1| 7/8 (2+2+3) 1/4=120'), 0);
    assert.deepEqual(weights(p), [3, 2, 2]);
    assert.deepEqual(durations(p), [2, 2, 3]);
  });

  test('regrouping the same meter changes where the beats fall', () => {
    const p = getBeatPattern(measure('1| 7/8 (3+2+2) 1/4=120'), 0);
    assert.deepEqual(durations(p), [3, 2, 2]);
  });
});

describe('once per measure', () => {
  test('4/4 is a single downbeat spanning the bar', () => {
    const p = getBeatPattern(measure('1| 4/4 1/4=120'), -1);
    assert.equal(p.length, 1);
    assert.equal(p[0].weight, 3);
    assert.equal(p[0].durationUnits, 4);
  });

  test('the click lasts the whole measure whatever the meter', () => {
    for (const [score, units] of [['1| 3/4 1/4=120', 3], ['1| 5/4 1/4=120', 5],
                                  ['1| 6/8 1/4.=60', 6], ['1| 2/2 1/2=60', 2]]) {
      const p = getBeatPattern(measure(score), -1);
      assert.equal(p.length, 1, score);
      assert.equal(p[0].durationUnits, units, score);
    }
  });

  test('an odd meter collapses regardless of its grouping', () => {
    const p = getBeatPattern(measure('1| 7/8 (2+2+3) 1/4=120'), -1);
    assert.deepEqual(p, [{ weight: 3, durationUnits: 7 }]);
  });

  test('tuplets collapse too — nothing sounds between downbeats', () => {
    const p = getBeatPattern(measure('1| 4/4 ([3:21]) 1/4=120'), -1);
    assert.equal(p.length, 1);
    assert.equal(p[0].weight, 3);
    assert.ok(Math.abs(p[0].durationUnits - 4) < 1e-9);
  });

  test('a measure of rests still gives one audible downbeat', () => {
    const p = getBeatPattern(measure('1| 4/4 (1+1+[3:.11]+[3:.11]) 1/4=120'), -1);
    assert.equal(p.length, 1);
    assert.equal(p[0].weight, 3);
    assert.equal(p[0].rest, undefined);
  });

  test('the measure lasts as long as it would at any other setting', () => {
    for (const score of ['1| 4/4 1/4=120', '1| 7/8 (2+2+3) 1/4=120', '1| 6/8 1/4.=60']) {
      const m = measure(score);
      const once = getBeatPattern(m, -1);
      const sec  = once[0].durationUnits * tickDurationSec(m, once, 0, 1);
      const beats = getBeatPattern(m, 0);
      const secBeats = beats.reduce((s, t, i) => s + t.durationUnits * tickDurationSec(m, beats, i, 1), 0);
      assert.ok(Math.abs(sec - secBeats) < 1e-9, score);
    }
  });
});

describe('subdivision', () => {
  test('4/4 subdivided to 8ths', () => {
    const p = getBeatPattern(measure('1| 4/4 1/4=120'), 8);
    assert.equal(p.length, 8);
    assert.deepEqual(weights(p), [3, 1, 2, 1, 2, 1, 2, 1]);
    assert.deepEqual(durations(p), [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
  });

  test('4/4 subdivided to 16ths', () => {
    const p = getBeatPattern(measure('1| 4/4 1/4=120'), 16);
    assert.equal(p.length, 16);
    assert.deepEqual(weights(p).filter(w => w >= 2), [3, 2, 2, 2]);
    assert.equal(totalUnits(p), 4);
  });

  test('subdividing to the beat value itself changes nothing', () => {
    const p = getBeatPattern(measure('1| 4/4 1/4=120'), 4);
    assert.deepEqual(weights(p), [3, 2, 2, 2]);
  });

  test('groups that do not divide evenly are left alone', () => {
    // In 7/8 (2+2+3) at the quarter, the 2s divide but the 3 does not,
    // so every group stays a single click.
    const p = getBeatPattern(measure('1| 7/8 (2+2+3) 1/4=120'), 4);
    assert.deepEqual(weights(p), [3, 2, 2]);
    assert.deepEqual(durations(p), [2, 2, 3]);
  });

  test('6/8 subdivided to 8ths puts a subdivision inside each dotted beat', () => {
    const p = getBeatPattern(measure('1| 6/8 1/4.=60'), 8);
    assert.deepEqual(weights(p), [3, 1, 1, 2, 1, 1]);
    assert.equal(totalUnits(p), 6);
  });

  test('the pattern always fills exactly one measure', () => {
    for (const score of ['1| 4/4 1/4=120', '1| 3/4 1/4=120', '1| 6/8 1/4.=60',
                         '1| 7/8 (2+2+3) 1/4=120', '1| 5/8 (2+3) 1/4=120']) {
      const m = measure(score);
      for (const sub of [0, 4, 8, 16, 32])
        assert.equal(totalUnits(getBeatPattern(m, sub)), m.numerator,
          `${score} at subdivision ${sub}`);
    }
  });
});

describe('tuplets', () => {
  test('a swing beat tiled across 4/4', () => {
    const p = getBeatPattern(measure('1| 4/4 ([3:21]) 1/4=120'), 0);
    assert.equal(p.length, 8);
    assert.deepEqual(weights(p), [3, 1, 2, 1, 2, 1, 2, 1]);
    assert.deepEqual(durations(p).map(d => Math.round(d * 3)), [2, 1, 2, 1, 2, 1, 2, 1]);
    assert.equal(Math.round(totalUnits(p)), 4);
  });

  test('a quarter-note triplet spanning two beats', () => {
    const p = getBeatPattern(measure('1| 4/4 (1+1+2[3:111]) 1/4=120'), 0);
    assert.deepEqual(weights(p), [3, 2, 2, 1, 1]);
    assert.deepEqual(durations(p).slice(2).map(d => Math.round(d * 3)), [2, 2, 2]);
    // Tuplet durations are fractional, so the total is exact only to rounding.
    assert.ok(Math.abs(totalUnits(p) - 4) < 1e-9);
  });

  test('a rest slot is silent and marked', () => {
    const p = getBeatPattern(measure('1| 4/4 (1+1+[3:.11]+[3:.11]) 1/4=120'), 0);
    assert.equal(p[2].weight, 0);
    assert.equal(p[2].rest, true);
    assert.equal(p[3].rest, false);
    assert.ok(Math.abs(totalUnits(p) - 4) < 1e-9);
  });

  test('tuplets ignore the subdivide setting', () => {
    const m = measure('1| 4/4 ([3:111]) 1/4=120');
    assert.deepEqual(getBeatPattern(m, 0), getBeatPattern(m, 16));
  });

  test('a mixed measure of tuplets and plain beats fills the bar', () => {
    const p = getBeatPattern(measure('1| 6/4 ([2:11]+[3:.11]+[2:11]+[3:.11]+2) 1/4=120'), 0);
    assert.equal(Math.round(totalUnits(p) * 6) / 6, 6);
    assert.equal(p[0].weight, 3);
  });
});

describe('labels', () => {
  test('short labels abbreviate tuplets to a star', () => {
    assert.equal(groupingShortLabel([2, 2, 3]), '2+2+3');
    assert.equal(groupingShortLabel([2, { units: 1, div: 3, slots: [2, 1] }, 1]), '2+*+1');
    assert.equal(groupingShortLabel([{ units: 2, div: 3, slots: [1, 1, 1] }]), '2*');
  });

  test('full labels round-trip the written form', () => {
    assert.equal(groupingFullLabel([2, 2, 3]), '2+2+3');
    assert.equal(groupingFullLabel([{ units: 1, div: 3, slots: [2, 1] }]), '[3:21]');
    assert.equal(groupingFullLabel([{ units: 2, div: 3, slots: [1, 1, 1] }]), '2[3:111]');
    assert.equal(groupingFullLabel([{ units: 1, div: 3, slots: ['rest', 1, 1] }]), '[3:.11]');
  });
});

describe('tempo arithmetic', () => {
  test('quarter = 120 in 4/4 is half a second per unit', () => {
    assert.equal(oneDenomUnitSec(measure('1| 4/4 1/4=120'), 1), 0.5);
  });

  test('the rehearsal tempo scale divides the duration', () => {
    assert.equal(oneDenomUnitSec(measure('1| 4/4 1/4=120'), 2),   0.25);
    assert.equal(oneDenomUnitSec(measure('1| 4/4 1/4=120'), 0.5), 1);
  });

  test('a dotted tempo mark in compound meter', () => {
    // dotted quarter = 60 → each dotted-quarter beat is 1 s, so each 8th is 1/3 s
    const sec = oneDenomUnitSec(measure('1| 6/8 1/4.=60'), 1);
    assert.equal(Math.round(sec * 3000) / 1000, 1);
  });

  test('the tempo unit need not be the beat unit', () => {
    // quarter = 120 in 6/8: the 8th is half a quarter → 0.25 s
    assert.equal(oneDenomUnitSec(measure('1| 6/8 1/4=120'), 1), 0.25);
  });

  test('a measure with no curve ticks at a constant rate', () => {
    const m = measure('1| 4/4 1/4=120');
    const p = getBeatPattern(m, 0);
    for (let i = 0; i < p.length; i++)
      assert.equal(tickDurationSec(m, p, i, 1), 0.5);
  });

  test('a rit interpolates within the measure, not just at barlines', () => {
    // 120 → 60 over one 4/4 bar: 0.5 s/unit at the start, 1.0 s/unit at the end
    const { measures } = parseScore('1| 4/4 1/4=120\n2| rit 1/4=60\n3| 1/4=60');
    const m = measures[2];
    const p = getBeatPattern(m, 0);
    assert.equal(tickDurationSec(m, p, 0, 1), 0.5);    // fraction 0/4
    assert.equal(tickDurationSec(m, p, 2, 1), 0.75);   // fraction 2/4
    assert.equal(tickDurationSec(m, p, 3, 1), 0.875);  // fraction 3/4
  });

  test('a rit accumulates across the measures it spans', () => {
    const { measures } = parseScore('1| 4/4 1/4=120\n2| rit 1/4=60\n4| 1/4=60');
    const m3 = measures[3];
    const p3 = getBeatPattern(m3, 0);
    assert.equal(m3.ritAccelOffset, 4);
    assert.equal(tickDurationSec(m3, p3, 0, 1), 0.75);   // halfway through an 8-unit span
  });
});
