// ─── Beat Model ───────────────────────────────────────────────────────────────
//
// All functions are pure — no React dependency.
//
// Primary groups (in denominator units):
//   2/2           → [1, 1]
//   2/4, 3/4, 4/4 → [1, 1, ...]
//   6/8, 9/8, 12/8 → groups of 3 (dotted quarter)
//   odd meters    → explicit grouping array
//
// Grouping elements may be:
//   number                   — plain beat group (integer denom-units)
//   { units, div, slots }    — tuplet: fills `units` denom-units, divided into
//                              `div` equal parts; slots = array of numbers (click
//                              durations in parts) or 'rest' (silent part)

// Return the denom-unit size of a grouping element (plain or tuplet)
export function groupUnits(g) {
  return typeof g === 'object' ? g.units : g;
}

export function getPrimaryGroups(mState) {
  const { numerator, denominator, grouping } = mState;
  if (grouping) return grouping;
  if (denominator === 8 && numerator % 3 === 0) return Array(numerator / 3).fill(3);
  return Array(numerator).fill(1);
}

// subdivTargetDenom: 0 = primary beats only; 4/8/16/32 = subdivide to that note value
export function getBeatPattern(mState, subdivTargetDenom) {
  const { denominator } = mState;
  const groups = getPrimaryGroups(mState);

  const primaryStarts = new Set();
  let cur = 0;
  for (const g of groups) { primaryStarts.add(cur); cur += groupUnits(g); }

  const pattern = [];
  let unitPos   = 0;

  groups.forEach((g, gi) => {
    const isMeasureDownbeat = gi === 0;

    if (typeof g === 'object') {
      // ── Tuplet group ──────────────────────────────────────────────────────
      // Always plays as written regardless of subdivide setting.
      // durationUnits is fractional: each part = g.units / g.div denom-units.
      const partDur = g.units / g.div;
      g.slots.forEach((slot, si) => {
        const isRest = slot === 'rest';
        const parts  = isRest ? 1 : slot;
        const dur    = parts * partDur;
        const weight = isRest ? 0
          : (isMeasureDownbeat && si === 0) ? 3
          : si === 0 ? 2
          : 1;
        pattern.push({ weight, durationUnits: dur, rest: isRest });
      });
    } else {
      // ── Plain group ───────────────────────────────────────────────────────
      if (subdivTargetDenom === 0) {
        pattern.push({ weight: isMeasureDownbeat ? 3 : 2, durationUnits: g });
      } else {
        const rawSubs = g * subdivTargetDenom / denominator;
        const numSubs = Number.isInteger(rawSubs) && rawSubs >= 1 ? rawSubs : 1;
        const subDur  = g / numSubs;
        for (let s = 0; s < numSubs; s++) {
          const globalUnit = unitPos + s * subDur;
          let weight;
          if (isMeasureDownbeat && s === 0)                                                    weight = 3;
          else if (s === 0)                                                                     weight = 2;
          else if (Number.isInteger(globalUnit) && primaryStarts.has(Math.round(globalUnit))) weight = 2;
          else                                                                                  weight = 1;
          pattern.push({ weight, durationUnits: subDur });
        }
      }
    }
    unitPos += groupUnits(g);
  });

  return pattern;
}

// Short label for a grouping: plain numbers joined by '+', tuplet groups shown as N*
// e.g. [2, {units:1,div:3,...}, 1] → "2+1*+1"
export function groupingShortLabel(groups) {
  return groups.map(g =>
    typeof g === 'object' ? `${g.units > 1 ? g.units : ''}*` : String(g)
  ).join('+');
}

// Full label for display above the flash dots, e.g. "2+[3:21]+1"
export function groupingFullLabel(groups) {
  return groups.map(g => {
    if (typeof g !== 'object') return String(g);
    const slotsStr = g.slots.map(s => s === 'rest' ? '.' : String(s)).join('');
    return `${g.units > 1 ? g.units : ''}[${g.div}:${slotsStr}]`;
  }).join('+');
}
export function oneDenomUnitSec(mState, tempoScale) {
  const { tempoBPM, tempoDenom, tempoDotted, denominator } = mState;
  const dotFactor = tempoDotted ? 1.5 : 1;
  return (tempoDenom / denominator) * (60 / (tempoBPM * tempoScale * dotFactor));
}

// Compute per-tick duration accounting for rit/accel interpolation
export function tickDurationSec(mState, pattern, tickIdx, tempoScale) {
  if (!mState.ritAccelSpan) return oneDenomUnitSec(mState, tempoScale);

  const span = mState.ritAccelSpan;
  let unitsInMeasure = 0;
  for (let ti = 0; ti < tickIdx; ti++) unitsInMeasure += pattern[ti].durationUnits;
  const unitOffset = mState.ritAccelOffset + unitsInMeasure;
  const fraction   = Math.min(1, unitOffset / span.totalUnits);

  const dotS = span.startDotted  ? 1.5 : 1;
  const dotT = span.targetDotted ? 1.5 : 1;
  const secPerUnitStart  = (span.startDenom  / mState.denominator) * (60 / (span.startBPM  * tempoScale * dotS));
  const secPerUnitTarget = (span.targetDenom / mState.denominator) * (60 / (span.targetBPM * tempoScale * dotT));
  return secPerUnitStart + (secPerUnitTarget - secPerUnitStart) * fraction;
}
