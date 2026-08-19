// ─── Parser tests ─────────────────────────────────────────────────────────────
//
// Run with: npm test   (node --test test/)
//
// parseScore(text) returns:
//   measures   sparse array indexed 1..endAt, state per *written* measure
//   seq        flat playback order, all repeats and jumps expanded
//   endAt      last measure of the piece
//   segnoAt    measure carrying $, or null
//   codaAt     measure carrying the Coda directive, or null
//   warnings   array of strings (English when no locale table is passed)
//   loopScore  true when the score has no explicit end and loops from m.1

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseScore } from '../src/parser.js';

const parse = text => parseScore(text);
const seqOf = text => parseScore(text).seq;

describe('basics', () => {
  test('a single measure sets time signature and tempo', () => {
    const { measures, endAt, seq } = parse('1| 4/4 1/4=120');
    assert.equal(endAt, 1);
    assert.deepEqual(seq, [1]);
    assert.equal(measures[1].numerator, 4);
    assert.equal(measures[1].denominator, 4);
    assert.equal(measures[1].tempoBPM, 120);
    assert.equal(measures[1].tempoDenom, 4);
    assert.equal(measures[1].tempoDotted, false);
  });

  test('defaults are 4/4 at quarter=120', () => {
    const { measures } = parse('1|');
    assert.equal(measures[1].numerator, 4);
    assert.equal(measures[1].denominator, 4);
    assert.equal(measures[1].tempoBPM, 120);
  });

  test('state carries forward to undeclared measures', () => {
    const { measures } = parse('1| 4/4 1/4=90\n5| 3/4\n8|');
    assert.equal(measures[3].numerator, 4);
    assert.equal(measures[6].numerator, 3);
    assert.equal(measures[8].numerator, 3);
    assert.equal(measures[8].tempoBPM, 90);   // tempo persists across the change
  });

  test('a score with no end marker is a practice loop', () => {
    const { endAt, seq, loopScore } = parse('1| 4/4, 1/4=120\n2| 7/8 (2+2+3)\n3| 4/4\n4| 5/4');
    assert.equal(loopScore, true);
    assert.equal(endAt, 4);
    assert.deepEqual(seq, [1, 2, 3, 4]);
  });

  test('a double barline ends the score', () => {
    const { endAt, loopScore, measures } = parse('1| 4/4 1/4=120\n8||');
    assert.equal(loopScore, false);
    assert.equal(endAt, 8);
    assert.equal(measures[8].isEnd, true);
  });

  test('measures after the final double barline are dropped', () => {
    const { endAt, seq } = parse('1| 4/4 1/4=120\n4||\n9| 3/4');
    assert.equal(endAt, 4);
    assert.deepEqual(seq, [1, 2, 3, 4]);
  });

  test('comments and blank lines are ignored', () => {
    const { measures, endAt } = parse(`
# Symphony No. 5
1| 4/4 1/4=120    # first bar
// a comment line

3| 3/4
`);
    assert.equal(endAt, 3);
    assert.equal(measures[3].numerator, 3);
  });

  test('lines may be given out of order', () => {
    const { measures, endAt } = parse('5| 3/4\n1| 4/4 1/4=90');
    assert.equal(endAt, 5);
    assert.equal(measures[1].numerator, 4);
    assert.equal(measures[5].numerator, 3);
  });

  test('unparseable lines are skipped', () => {
    const { endAt, measures } = parse('1| 4/4 1/4=120\nnonsense here\n3| 3/4');
    assert.equal(endAt, 3);
    assert.equal(measures[3].numerator, 3);
  });
});

describe('barline separators', () => {
  for (const sep of ['|', ':']) {
    test(`'${sep}' is a normal barline`, () => {
      const { measures } = parse(`1${sep} 4/4 1/4=120`);
      assert.equal(measures[1].barline, sep);
    });
  }

  test('each separator is recorded on its measure', () => {
    const { measures } = parse('1|: 4/4 1/4=120\n4:|\n5||:\n8:||');
    assert.equal(measures[1].barline, '|:');
    assert.equal(measures[4].barline, ':|');
    assert.equal(measures[5].barline, '||:');
    assert.equal(measures[8].barline, ':||');
  });
});

describe('rehearsal marks', () => {
  test('an explicit mark in brackets', () => {
    assert.equal(parse('1| 4/4 1/4=120\n12| [A]').measures[12].rehearsal, 'A');
  });

  test('a bracketed measure number becomes its own mark', () => {
    assert.equal(parse('[12]| 4/4 1/4=120').measures[12].rehearsal, '12');
  });

  test('marks do not carry forward', () => {
    const { measures } = parse('1| 4/4 1/4=120\n12| [A]\n16||');
    assert.equal(measures[12].rehearsal, 'A');
    assert.equal(measures[13].rehearsal, undefined);
  });

  test('a bare double barline mid-score is marked with its measure number', () => {
    const { measures } = parse('1| 4/4 1/4=120\n8||\n16||');
    assert.equal(measures[8].rehearsal, '8');
  });

  test('the final double barline is not marked — it ends the piece', () => {
    const { measures, endAt } = parse('1| 4/4 1/4=120\n8||\n16||');
    assert.equal(endAt, 16);
    assert.equal(measures[16].rehearsal, undefined);
  });
});

describe('groupings', () => {
  test('explicit grouping with +', () => {
    assert.deepEqual(parse('1| 7/8 (2+2+3) 1/4=120').measures[1].grouping, [2, 2, 3]);
  });

  test('compact grouping without +', () => {
    assert.deepEqual(parse('1| 7/8 (223) 1/4=120').measures[1].grouping, [2, 2, 3]);
  });

  test('a bare time signature inherits its remembered grouping', () => {
    const { measures } = parse(`1| 4/4 1/4=120
4| 7/8 (2+2+3)
10| 4/4
19| 7/8`);
    assert.deepEqual(measures[19].grouping, [2, 2, 3]);
  });

  test('a grouping-only line keeps the time signature and updates the memory', () => {
    const { measures } = parse(`1| 7/8 (2+2+3) 1/4=120
5| (3+2+2)
8| 4/4
12| 7/8`);
    assert.equal(measures[5].numerator, 7);
    assert.equal(measures[5].denominator, 8);
    assert.deepEqual(measures[5].grouping, [3, 2, 2]);
    assert.deepEqual(measures[12].grouping, [3, 2, 2]);   // later bare 7/8 inherits the newer one
  });

  test('a single-element grouping tiles to fill the measure', () => {
    assert.deepEqual(parse('1| 6/8 (3) 1/4=120').measures[1].grouping, [3, 3]);
  });

  test('a single tuplet element tiles across the measure', () => {
    const g = parse('1| 4/4 ([3:21]) 1/4=120').measures[1].grouping;
    assert.equal(g.length, 4);
    for (const el of g) assert.deepEqual(el, { units: 1, div: 3, slots: [2, 1] });
  });

  test('a single element that does not divide the measure warns and is ignored', () => {
    const { measures, warnings } = parse('1| 7/8 (2) 1/4=120');
    assert.equal(measures[1].grouping, null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.1.*does not divide/);
  });
});

describe('tuplets', () => {
  const groupingOf = text => parse(text).measures[1].grouping;

  test('compact slots', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+1+[3:21]) 1/4=120')[3],
      { units: 1, div: 3, slots: [2, 1] });
  });

  test('equal triplet', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+1+[3:111]) 1/4=120')[3],
      { units: 1, div: 3, slots: [1, 1, 1] });
  });

  test('a leading integer spans several denominator units', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+2[3:111]) 1/4=120')[2],
      { units: 2, div: 3, slots: [1, 1, 1] });
  });

  test('dots are rests', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+1+[3:.11]) 1/4=120')[3],
      { units: 1, div: 3, slots: ['rest', 1, 1] });
  });

  test('a rest in the middle', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+1+[3:1.1]) 1/4=120')[3],
      { units: 1, div: 3, slots: [1, 'rest', 1] });
  });

  test('explicit slots separated by +', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+1+[5:1+1+1+1+1]) 1/4=120')[3],
      { units: 1, div: 5, slots: [1, 1, 1, 1, 1] });
  });

  test('uneven slots: double-dotted eighth plus thirty-second', () => {
    assert.deepEqual(groupingOf('1| 4/4 (1+1+1+[8:71]) 1/4=120')[3],
      { units: 1, div: 8, slots: [7, 1] });
  });

  test('slots that do not sum to the divisor are rejected', () => {
    // Left unchecked this yields a NaN beat duration, which stalls the
    // scheduler silently — no clicks, no error, playback stuck.
    const { measures, warnings } = parse('1| 4/4 (1+1+1+[3:22]) 1/4=120');
    assert.equal(measures[1].grouping, null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.1.*malformed grouping/);
  });

  test('a malformed single-element grouping is rejected before tiling', () => {
    const { measures, warnings } = parse('1| 4/4 ([3:22]) 1/4=120');
    assert.equal(measures[1].grouping, null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.1.*malformed grouping/);
    assert.doesNotMatch(warnings[0], /NaN/);
  });

  test('a zero-length beat group is rejected', () => {
    // A zero duration would spin the scheduler's lookahead loop forever.
    const { measures, warnings } = parse('1| 4/4 (2+2+0) 1/4=120');
    assert.equal(measures[1].grouping, null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.1/);
  });

  test('a rejected grouping is not remembered for later bare references', () => {
    const { measures } = parse('1| 4/4 1/4=120\n3| 7/8 (1+1+1+[3:22])\n5| 4/4\n7| 7/8');
    assert.equal(measures[3].grouping, null);
    assert.equal(measures[7].grouping, null);
  });

  test('a mixed measure of tuplets and plain beats', () => {
    const g = groupingOf('1| 6/4 ([2:11]+[3:.11]+[2:11]+[3:.11]+2) 1/4=120');
    assert.equal(g.length, 5);
    assert.deepEqual(g[1], { units: 1, div: 3, slots: ['rest', 1, 1] });
    assert.equal(g[4], 2);
  });
});

describe('tempo', () => {
  test('quarter-note tempo', () => {
    const { measures } = parse('1| 4/4 1/4=90');
    assert.equal(measures[1].tempoBPM, 90);
    assert.equal(measures[1].tempoDenom, 4);
    assert.equal(measures[1].tempoDotted, false);
  });

  test('dotted tempo for compound meter', () => {
    const { measures } = parse('1| 6/8 1/4.=60');
    assert.equal(measures[1].tempoBPM, 60);
    assert.equal(measures[1].tempoDenom, 4);
    assert.equal(measures[1].tempoDotted, true);
  });

  test('a tempo change does not disturb the time signature', () => {
    const { measures } = parse('1| 7/8 (2+2+3) 1/4=90\n5| 1/4=120');
    assert.equal(measures[5].numerator, 7);
    assert.deepEqual(measures[5].grouping, [2, 2, 3]);
    assert.equal(measures[5].tempoBPM, 120);
  });

  test('a time signature is not mistaken for a tempo mark', () => {
    const { measures } = parse('1| 4/4 1/4=120\n5| 6/8');
    assert.equal(measures[5].numerator, 6);
    assert.equal(measures[5].denominator, 8);
    assert.equal(measures[5].tempoBPM, 120);
  });
});

describe('rit / accel', () => {
  test('rit spans from its measure to the next tempo mark', () => {
    const { measures } = parse('1| 4/4 1/4=160\n3| rit 1/4=60\n7| 1/4=60');
    const span = measures[3].ritAccelSpan;
    assert.ok(span, 'measure 3 should carry a span');
    assert.equal(span.kind, 'rit');
    assert.equal(span.startBPM, 160);
    assert.equal(span.targetBPM, 60);
    assert.equal(span.endMn, 7);
    assert.equal(span.totalUnits, 16);           // four 4/4 bars, m.3-6
    assert.equal(measures[3].ritAccelOffset, 0);
    assert.equal(measures[6].ritAccelOffset, 12);
    assert.equal(measures[7].ritAccelSpan, undefined);   // arrival bar is outside the curve
  });

  test('accel is recognised as well', () => {
    const { measures } = parse('1| 4/4 1/4=60\n3| accel 1/4=160\n7| 1/4=160');
    assert.equal(measures[3].ritAccelSpan.kind, 'accel');
    assert.equal(measures[3].ritAccelSpan.targetBPM, 160);
  });

  test('the target tempo may be omitted and taken from the next tempo mark', () => {
    const { measures, warnings } = parse('1| 4/4 1/4=120 rit\n5| 1/4=60\n7| 1/4=120');
    assert.deepEqual(warnings, []);
    const span = measures[1].ritAccelSpan;
    assert.ok(span, 'measure 1 should carry a span');
    assert.equal(span.startBPM, 120);
    assert.equal(span.targetBPM, 60);
    assert.equal(span.endMn, 5);
  });

  test('a tempo restores the tempo in effect before the rit', () => {
    const { measures } = parse('1| 4/4 1/4=120\n4| rit 1/4=60\n5| a tempo\n8||');
    assert.equal(measures[4].ritAccelSpan.targetBPM, 60);
    assert.equal(measures[4].ritAccelSpan.isAtempo, true);
    assert.equal(measures[5].tempoBPM, 120);
    assert.equal(measures[7].tempoBPM, 120);   // and stays restored
  });

  test('a tempo without a target tempo on the rit warns', () => {
    const { warnings } = parse('1| 4/4 1/4=120\n4| rit\n5| a tempo');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.4.*needs a target tempo/);
  });

  test('a rit with no target and no following tempo mark warns', () => {
    const { warnings } = parse('1| 4/4 1/4=120\n4| rit\n8||');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.4/);
  });

  test('a rit with an explicit target and no following mark runs to the end', () => {
    const { measures, warnings } = parse('1| 4/4 1/4=120\n4| rit 1/4=60\n8||');
    assert.deepEqual(warnings, []);
    assert.equal(measures[4].ritAccelSpan.endMn, 9);   // endAt + 1
    assert.equal(measures[8].ritAccelSpan.targetBPM, 60);
  });
});

describe('repeat expansion', () => {
  test('a simple repeat plays twice', () => {
    assert.deepEqual(seqOf('1|: 4/4 1/4=120\n4:|'), [1, 2, 3, 4, 1, 2, 3, 4]);
  });

  test('measures outside the repeat play once', () => {
    assert.deepEqual(seqOf('1| 4/4 1/4=120\n2|:\n3:|\n5||'),
      [1, 2, 3, 2, 3, 4, 5]);
  });

  test('a single-measure repeat plays that bar twice', () => {
    assert.deepEqual(seqOf('1| 4/4 1/4=120\n2|:|\n4||'), [1, 2, 2, 3, 4]);
  });

  test('back-to-back repeat sections', () => {
    assert.deepEqual(seqOf('1|: 4/4 1/4=120\n2:|\n3||:\n4:|\n5||'),
      [1, 2, 1, 2, 3, 4, 3, 4, 5]);
  });

  test('a close repeat with no open repeat anywhere repeats from m.1', () => {
    const { seq, warnings } = parse('1| 4/4 1/4=120\n4:|');
    assert.deepEqual(seq, [1, 2, 3, 4, 1, 2, 3, 4]);
    assert.deepEqual(warnings, []);
  });

  test('a close repeat after an earlier repeat, with nothing open, warns', () => {
    const { warnings } = parse('1|: 4/4 1/4=120\n2:|\n4:|');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.4.*no matching open repeat/);
  });

  test(':|| with no matching open repeat warns and does not repeat', () => {
    const { seq, warnings } = parse('1| 4/4 1/4=120\n4:||');
    assert.deepEqual(seq, [1, 2, 3, 4]);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.4.*use '\|\|' to end the score/);
  });

  test(':|| with a matching open repeat repeats and ends the score', () => {
    const { seq, endAt, loopScore } = parse('1|: 4/4 1/4=120\n4:||');
    assert.deepEqual(seq, [1, 2, 3, 4, 1, 2, 3, 4]);
    assert.equal(endAt, 4);
    assert.equal(loopScore, false);
  });

  test('a nested repeat warns', () => {
    // Nested repeat signs are not standard notation — repetition at a larger
    // scale is written with D.C./D.S. instead.
    const { warnings } = parse('1|: 4/4 1/4=120\n2|:\n3:|\n4:|\n5||');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.2.*m\.1.*nested repeats/);
  });

  test('a nested repeat still terminates and pairs innermost-first', () => {
    // Degenerate input; this pins that it produces something sane. Each
    // close-repeat fires once per walk, so the inner repeat is not re-armed
    // when the outer one jumps back.
    const { seq } = parse('1|: 4/4 1/4=120\n2|:\n3:|\n4:|\n5||');
    assert.deepEqual(seq, [1, 2, 3, 2, 3, 4, 1, 2, 3, 4, 5]);
  });

  test('sequential repeat sections do not warn', () => {
    const { warnings } = parse('1|: 4/4 1/4=120\n2:|\n3||:\n4:|\n5||');
    assert.deepEqual(warnings, []);
  });

  test('a repeat left open when another opens warns', () => {
    const { warnings } = parse('1|: 4/4 1/4=120\n5|:\n8:|\n9||');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /m\.5.*m\.1/);
  });
});

describe('D.C. and D.S.', () => {
  test('DC al Fine returns to m.1 and stops at Fine', () => {
    assert.deepEqual(seqOf('1| 4/4 1/4=120\n4| Fine\n8| DC al Fine'),
      [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4]);
  });

  test('DS al Fine returns to the segno', () => {
    const { seq, segnoAt } = parse('1| 4/4 1/4=120\n3| $\n5| Fine\n8| DS al Fine');
    assert.equal(segnoAt, 3);
    assert.deepEqual(seq, [1, 2, 3, 4, 5, 6, 7, 8, 3, 4, 5]);
  });

  test('DS al Coda skips the coda on the first pass, then jumps to it', () => {
    const { seq, segnoAt, codaAt } = parse(`1| 4/4 1/4=120
5| $
9| @
12| DS al Coda
13| Coda
16||`);
    assert.equal(segnoAt, 5);
    assert.equal(codaAt, 13);
    assert.deepEqual(seq, [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,   // first pass, stops before the coda
      5, 6, 7, 8, 9,                            // back to the segno, out at @
      13, 14, 15, 16,                           // the coda
    ]);
  });

  test('DC al Coda jumps from m.1', () => {
    const { seq } = parse(`1| 4/4 1/4=120
3| @
5| DC al Coda
6| Coda
8||`);
    assert.deepEqual(seq, [1, 2, 3, 4, 5, 1, 2, 3, 6, 7, 8]);
  });

  test('the return pass is senza replica — repeats are not taken', () => {
    // The |: … :| plays twice on the way down, once after the D.C.
    const { seq } = parse('1|: 4/4 1/4=120\n2:|\n3| Fine\n5| DC al Fine');
    assert.deepEqual(seq, [1, 2, 1, 2, 3, 4, 5, 1, 2, 3]);
  });
});

describe('structural markers', () => {
  test('segno, coda jump and directives are recorded on their measures', () => {
    const { measures } = parse(`1| 4/4 1/4=120
5| $ 3/4
9| @
12| DS al Coda
13| Coda
16||`);
    assert.equal(measures[5].segno, true);
    assert.equal(measures[5].numerator, 3);      // marker does not swallow the rest of the line
    assert.equal(measures[9].codaJump, true);
    assert.equal(measures[12].directive, 'DS_CODA');
    assert.equal(measures[13].directive, 'CODA');
  });

  test('directives are case-insensitive and accept flexible spacing', () => {
    assert.equal(parse('1| 4/4 1/4=120\n5| ds  al  coda\n6| Coda\n8||').measures[5].directive, 'DS_CODA');
    assert.equal(parse('1| 4/4 1/4=120\n5| FINE\n8||').measures[5].directive, 'FINE');
  });

  test('a marked measure keeps its rehearsal mark and time signature', () => {
    const { measures } = parse('1| 4/4 1/4=90\n9|: [B] $ 7/8 (2+2+3)');
    assert.equal(measures[9].rehearsal, 'B');
    assert.equal(measures[9].segno, true);
    assert.equal(measures[9].numerator, 7);
    assert.deepEqual(measures[9].grouping, [2, 2, 3]);
    assert.equal(measures[9].barline, '|:');
  });
});

describe('the documented example scores', () => {
  test('the README structure example parses without warnings', () => {
    const { warnings, seq, endAt } = parse(`1|: 4/4, 1/4=90
8:| [A]
9|: $ 7/8 (2+2+3)
16:|| [B]
17|: 4/4
24:| @
25| [C] 1/4=120
32| DS al Coda
33| Coda
36||`);
    assert.deepEqual(warnings, []);
    assert.equal(endAt, 36);
    assert.ok(seq.length > 36, 'repeats should lengthen the sequence');
  });

  test('the README tuplet example parses without warnings', () => {
    const { warnings } = parse(`1: 4/4 1/4=90
3: (1+1+2[3:111])
5: (1+1+[3:111]+[3:111])
7: (1+1+2[5:11111])
9: ([3:21])
11: ([4:31])
13: ([8:71])
15: (1+1+[3:.11]+[3:.11])
17: (1+1+[4:..11]+[4:..11])
19: (1+1+[3:1.1]+[3:1.1])
21: ([3:.11]+[4:.111]+[5:.1111]+[6:.11111])
23: 6/4 ([2:11]+[3:.11]+[2:11]+[3:.11]+2)
25:`);
    assert.deepEqual(warnings, []);
  });

  test('the README rit example parses without warnings', () => {
    const { warnings } = parse(`1| 4/4 1/4=160
3| rit 1/4=60
7| 1/4=60 accel 1/4=160
8| 3/4
9| 7/8 (2+2+3)
11| 9/8
15| 3/4 1/4=160`);
    assert.deepEqual(warnings, []);
  });
});
