// ─── Beat Model ───────────────────────────────────────────────────────────────
//
// All functions are pure — no React dependency.
//
// Primary groups (in denominator units):
//   2/2           → [1, 1]
//   2/4, 3/4, 4/4 → [1, 1, ...]
//   6/8, 9/8, 12/8 → groups of 3 (dotted quarter)
//   odd meters    → explicit grouping array

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
  for (const g of groups) { primaryStarts.add(cur); cur += g; }

  if (subdivTargetDenom === 0) {
    return groups.map((g, i) => ({ weight: i === 0 ? 3 : 2, durationUnits: g }));
  }

  const pattern = [];
  let unitPos   = 0;

  groups.forEach((g, gi) => {
    const rawSubs  = g * subdivTargetDenom / denominator;
    const numSubs  = Number.isInteger(rawSubs) && rawSubs >= 1 ? rawSubs : 1;
    const subDur   = g / numSubs;

    for (let s = 0; s < numSubs; s++) {
      const globalUnit = unitPos + s * subDur;
      let weight;
      if (gi === 0 && s === 0)                                                    weight = 3;
      else if (s === 0)                                                            weight = 2;
      else if (Number.isInteger(globalUnit) && primaryStarts.has(Math.round(globalUnit))) weight = 2;
      else                                                                         weight = 1;
      pattern.push({ weight, durationUnits: subDur });
    }
    unitPos += g;
  });

  return pattern;
}

// Seconds per one denominator unit at the current tempo and rehearsal scale
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
