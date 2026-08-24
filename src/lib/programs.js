/**
 * A small illustrative set of program profiles, used only by the hand threshold
 * widget. Each entry is the average of one counter over a window, in the same
 * arbitrary units the traces use.
 *
 * The point of the set is that ordinary software covers a very wide range on
 * every counter, wide enough to sit on both sides of any single cut. Nothing
 * here is measured.
 */

export const PROGRAMS = [
  { name: 'Video compression', kind: 'benign', misses: 8, refs: 34, hits: 95, instructions: 95 },
  { name: 'Web server', kind: 'benign', misses: 14, refs: 40, hits: 70, instructions: 120 },
  { name: 'Database scan', kind: 'benign', misses: 26, refs: 72, hits: 55, instructions: 80 },
  { name: 'Compiler build', kind: 'benign', misses: 18, refs: 46, hits: 88, instructions: 135 },
  { name: 'In-memory cache', kind: 'benign', misses: 5, refs: 20, hits: 130, instructions: 150 },
  { name: 'Numerical solver', kind: 'benign', misses: 24, refs: 105, hits: 28, instructions: 145 },
  { name: 'Graph analytics', kind: 'benign', misses: 30, refs: 78, hits: 32, instructions: 70 },
  { name: 'Prime+Probe', kind: 'attack', misses: 22, refs: 60, hits: 30, instructions: 140 },
  { name: 'Flush+Reload', kind: 'attack', misses: 19, refs: 52, hits: 45, instructions: 155 },
  { name: 'Flush+Flush', kind: 'attack', misses: 12, refs: 38, hits: 26, instructions: 130 },
]

export const AXES = [
  { key: 'misses', label: 'LLC misses', attackSide: 'high' },
  { key: 'refs', label: 'LLC references', attackSide: 'high' },
  { key: 'hits', label: 'L1 hits', attackSide: 'low' },
  { key: 'instructions', label: 'Instructions', attackSide: 'high' },
]

export function axisFor(key) {
  return AXES.find((axis) => axis.key === key) ?? AXES[0]
}

/** Upper bound of the drawn axis for one counter. */
export function axisMax(key) {
  return Math.max(...PROGRAMS.map((program) => program[key])) * 1.15
}

function flagsAttack(axis, value, threshold) {
  return axis.attackSide === 'high' ? value >= threshold : value <= threshold
}

/**
 * How a single hand set cut does. False alarms and missed attacks are counted
 * separately, because the two failures are not interchangeable.
 */
export function scoreThreshold(key, threshold) {
  const axis = axisFor(key)
  let falseAlarms = 0
  let missed = 0
  const marks = PROGRAMS.map((program) => {
    const called = flagsAttack(axis, program[key], threshold)
    const wrong = called !== (program.kind === 'attack')
    if (wrong && called) falseAlarms += 1
    if (wrong && !called) missed += 1
    return { program, called, wrong }
  })
  return { marks, falseAlarms, missed, errors: falseAlarms + missed }
}

/** The fewest mistakes any cut on this counter alone can make. */
export function bestThreshold(key) {
  let best = null
  for (const program of PROGRAMS) {
    const result = scoreThreshold(key, program[key])
    if (!best || result.errors < best.errors) {
      best = { threshold: program[key], errors: result.errors }
    }
  }
  return best
}

/* -------------------------------------------------------------------------
   A model that reads all four counters together
   ------------------------------------------------------------------------- */

const WEIGHTS = { instructions: 1, hits: -0.9, refs: -0.45, misses: 0.6 }

export function modelScore(program) {
  let total = 0
  for (const [key, weight] of Object.entries(WEIGHTS)) total += weight * program[key]
  return total
}

/** Boundary and axis, derived from the profiles rather than written down. */
export function modelFit() {
  const scores = PROGRAMS.map((program) => ({ program, score: modelScore(program) }))
  const attacks = scores.filter((entry) => entry.program.kind === 'attack')
  const benign = scores.filter((entry) => entry.program.kind === 'benign')

  const lowestAttack = Math.min(...attacks.map((entry) => entry.score))
  const highestBenign = Math.max(...benign.map((entry) => entry.score))
  const boundary = (lowestAttack + highestBenign) / 2

  const all = scores.map((entry) => entry.score)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const pad = (max - min) * 0.1

  const marks = scores.map(({ program, score }) => {
    const called = score >= boundary
    return { program, score, called, wrong: called !== (program.kind === 'attack') }
  })

  return {
    boundary,
    min: min - pad,
    max: max + pad,
    marks,
    errors: marks.filter((mark) => mark.wrong).length,
  }
}
