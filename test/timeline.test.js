// ─── Timeline geometry tests ──────────────────────────────────────────────────
//
// The strip is drawn from this and clicks are resolved with it. When the two
// used separate copies they drifted apart by the container's 2px border and
// clicks near the end of a line landed on the wrong measure, so the property
// that matters most here is that drawing and hit-testing are each other's
// inverse.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { timelineGeometry } from '../src/timeline.js';

describe('timeline geometry', () => {
  test('a short piece fits on one line', () => {
    const g = timelineGeometry(802, 8, false);
    assert.equal(g.lineCount, 1);
    assert.deepEqual(g.lines, [{ start: 1, end: 8 }]);
  });

  test('a long piece wraps, and the lines tile the piece exactly', () => {
    const g = timelineGeometry(402, 200, false);
    assert.ok(g.lineCount > 1, 'expected wrapping');
    assert.equal(g.lines[0].start, 1);
    assert.equal(g.lines[g.lines.length - 1].end, 200);
    for (let i = 1; i < g.lines.length; i++)
      assert.equal(g.lines[i].start, g.lines[i - 1].end + 1, `gap before line ${i}`);
  });

  test('slots never fall below the minimum touch size', () => {
    for (const mobile of [false, true]) {
      const g = timelineGeometry(402, 500, mobile);
      assert.ok(g.filledSlotPx >= (mobile ? 22 : 26) - 1e-9,
        `slot ${g.filledSlotPx} too small for mobile=${mobile}`);
    }
  });

  test('a line never draws wider than the container', () => {
    const g = timelineGeometry(402, 200, false);
    const lastOnLine = g.lines[0].end;
    assert.ok(g.xInLine(lastOnLine, 1) + g.filledSlotPx <= g.width + 1);
  });

  test('hit-testing inverts drawing across every measure', () => {
    for (const [w, total, mobile] of [[802, 8, false], [402, 200, false], [360, 64, true]]) {
      const g = timelineGeometry(w, total, mobile);
      for (const line of g.lines) {
        const li = g.lines.indexOf(line);
        for (let mn = line.start; mn <= line.end; mn++) {
          // click the middle of where the measure was drawn
          const x = g.xInLine(mn, line.start) + g.filledSlotPx / 2;
          assert.equal(g.measureAt(li, x), mn, `w=${w} total=${total} m.${mn}`);
        }
      }
    }
  });

  test('clicks are clamped to the piece', () => {
    const g = timelineGeometry(802, 8, false);
    assert.equal(g.measureAt(0, -50), 1);
    assert.equal(g.measureAt(0, 100000), 8);
  });

  test('the border is subtracted once, by the geometry itself', () => {
    assert.equal(timelineGeometry(402, 10, false).width, 400);
  });

  test('a degenerate container does not produce NaN or zero slots', () => {
    for (const w of [0, 1, 2, 3]) {
      const g = timelineGeometry(w, 10, false);
      assert.ok(Number.isFinite(g.filledSlotPx) && g.filledSlotPx > 0, `width ${w}`);
      assert.ok(g.lineCount >= 1);
    }
  });
});
