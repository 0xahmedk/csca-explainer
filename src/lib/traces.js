/**
 * Synthetic hardware-performance-counter traces.
 *
 * Everything here is deterministic: the same seed and the same load level
 * always produce the same samples, so sections 3, 4 and 5 can render the very
 * same two traces without passing arrays between them. Nothing in this file is
 * measured. It is a hand-built illustration of counter behaviour, calibrated
 * to make one argument legible.
 *
 * Units: one sample is a last-level-cache miss count for a single 50 µs
 * interval, as a `perf`-style counter would report it on a bare-metal Intel
 * host. A detector window is 32 samples, 1.6 ms of wall clock.
 */

export const SAMPLE_US = 50
export const WINDOW_SAMPLES = 32
export const WINDOWS_PER_VIEW = 8
export const VIEW_SAMPLES = WINDOW_SAMPLES * WINDOWS_PER_VIEW // 256 samples = 12.8 ms
export const WINDOW_US = WINDOW_SAMPLES * SAMPLE_US
export const VIEW_US = VIEW_SAMPLES * SAMPLE_US

/** Seed of the trace pair that sections 3 and 5 share with section 4. */
export const SHARED_VIEW_SEED = 'view|0'

/* -------------------------------------------------------------------------
   Calibration
   The attacker's probe loop is indifferent to how busy the host is, so its
   mean activity is fixed. The tenant's is not: it starts well below the
   attacker and overtakes it as the machine fills up.
   ------------------------------------------------------------------------- */

const ATTACKER_MEAN = 22
const TENANT_IDLE_MEAN = 8
const TENANT_HEAVY_MEAN = 32
const ATTACKER_FLOOR = 3
const TENANT_FLOOR = 1.5

export function tenantMeanFor(load) {
  return TENANT_IDLE_MEAN + (TENANT_HEAVY_MEAN - TENANT_IDLE_MEAN) * Math.pow(clamp01(load), 1.1)
}

export function attackerMean() {
  return ATTACKER_MEAN
}

/* -------------------------------------------------------------------------
   Deterministic randomness
   ------------------------------------------------------------------------- */

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function hashSeed(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* -------------------------------------------------------------------------
   Shapes
   Both generators produce an unscaled shape; the caller then scales it to the
   mean the calibration above asks for. Doing it in that order means the
   relative texture of a trace and its absolute level are set independently.
   ------------------------------------------------------------------------- */

/**
 * Attacker: flush a line, wait, time the reload, repeat. Each round leaves a
 * sharp spike that decays as the loop re-primes. Moderate amplitude, near-fixed
 * rhythm, a little jitter from scheduling, and no dependence on system load.
 */
function attackerShape(rand, length) {
  const out = new Float64Array(length)
  for (let i = 0; i < length; i += 1) out[i] = 0.1 + rand() * 0.06

  const period = 14 // ~700 µs per probe round
  let t = rand() * period
  while (t < length + 8) {
    const amplitude = 0.92 + rand() * 0.16
    const start = Math.round(t)
    for (let d = 0; d < 7; d += 1) {
      const i = start + d
      if (i >= 0 && i < length) out[i] += amplitude * Math.exp(-d / 1.7)
    }
    t += period + (rand() - 0.5) * 2.2
  }
  return out
}

/**
 * Tenant: a video-compression service. Honest work, but hard on the cache,
 * irregular bursts of frame processing over a wandering baseline, with no
 * stable period. Both the burst rate and the burst size grow with system load.
 */
function tenantShape(rand, length, load) {
  const out = new Float64Array(length)

  let base = 0.2
  for (let i = 0; i < length; i += 1) {
    base += (rand() - 0.5) * 0.03
    if (base < 0.1) base = 0.1
    if (base > 0.34) base = 0.34
    out[i] = base + rand() * 0.05
  }

  const meanGap = 46 - 34 * load // idle: sparse bursts. heavy: nearly back to back.
  let t = rand() * meanGap
  while (t < length) {
    const span = Math.max(3, Math.round(4 + rand() * (7 + 26 * load)))
    const amplitude = (0.35 + rand() * 0.75) * (0.7 + 1.5 * load)
    const start = Math.round(t)
    for (let d = 0; d < span; d += 1) {
      const i = start + d
      if (i >= length) break
      const envelope = Math.sin((Math.PI * (d + 0.5)) / span)
      out[i] += amplitude * envelope * (0.75 + rand() * 0.5)
    }
    t += span + 4 + rand() * meanGap
  }
  return out
}

/** Affine-scale a shape so its mean lands exactly on the calibration target. */
function scaleToMean(shape, targetMean, floor) {
  let min = Infinity
  let sum = 0
  for (let i = 0; i < shape.length; i += 1) {
    if (shape[i] < min) min = shape[i]
    sum += shape[i]
  }
  const mean = sum / shape.length
  const span = mean - min
  const out = new Float64Array(shape.length)
  if (span <= 1e-9) {
    out.fill(targetMean)
    return out
  }
  const gain = (targetMean - floor) / span
  for (let i = 0; i < shape.length; i += 1) {
    const value = floor + (shape[i] - min) * gain
    out[i] = value > 0 ? value : 0
  }
  return out
}

/**
 * @param {'attacker' | 'tenant'} kind
 * @param {number} load  0 = idle host, 1 = heavily loaded host
 * @param {string} seed  any stable string; the same seed always replays
 * @param {number} length in samples
 */
export function makeTrace({ kind, load = 0, seed = SHARED_VIEW_SEED, length = VIEW_SAMPLES }) {
  const rand = mulberry32(hashSeed(`${kind}|${seed}`))
  if (kind === 'attacker') {
    return scaleToMean(attackerShape(rand, length), ATTACKER_MEAN, ATTACKER_FLOOR)
  }
  return scaleToMean(tenantShape(rand, length, clamp01(load)), tenantMeanFor(load), TENANT_FLOOR)
}

/* -------------------------------------------------------------------------
   The detector's first step
   A window of 32 counter samples is collapsed into four numbers. These four are
   what a Random Forest or an XGBoost model is actually handed; the samples
   themselves are discarded at this point.
   ------------------------------------------------------------------------- */

export const FEATURES = [
  { key: 'mean', label: 'Mean' },
  { key: 'variance', label: 'Variance' },
  { key: 'peak', label: 'Peak' },
  { key: 'range', label: 'Range' },
]

export function windowFeatures(trace, start = 0, length = WINDOW_SAMPLES) {
  let sum = 0
  let peak = -Infinity
  let trough = Infinity
  for (let i = start; i < start + length; i += 1) {
    const v = trace[i]
    sum += v
    if (v > peak) peak = v
    if (v < trough) trough = v
  }
  const mean = sum / length

  let sq = 0
  for (let i = start; i < start + length; i += 1) {
    const d = trace[i] - mean
    sq += d * d
  }

  return { mean, variance: sq / length, peak, range: peak - trough }
}

/* -------------------------------------------------------------------------
   The detector
   Trained the way the literature trains one: on a quiet machine. The threshold
   is fitted to separate attacker windows from tenant windows at idle, and then
   never touched again. Everything the figure shows follows from that choice.
   ------------------------------------------------------------------------- */

const WEIGHTS = { mean: 0.45, variance: 0.2, peak: 0.25, range: 0.1 }
const TRAIN_BLOCKS = 60

function percentile(values, q) {
  const sorted = Float64Array.from(values).sort()
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))
  return sorted[index]
}

function collectFeatures(kind, load, tag, blocks) {
  const rows = []
  for (let b = 0; b < blocks; b += 1) {
    const trace = makeTrace({ kind, load, seed: `${tag}|${b}` })
    for (let w = 0; w < WINDOWS_PER_VIEW; w += 1) {
      rows.push(windowFeatures(trace, w * WINDOW_SAMPLES))
    }
  }
  return rows
}

let cachedDetector = null

export function getDetector() {
  if (cachedDetector) return cachedDetector

  const attackerRows = collectFeatures('attacker', 0, 'train-a', TRAIN_BLOCKS)
  const idleTenantRows = collectFeatures('tenant', 0, 'train-t', TRAIN_BLOCKS)
  const pool = attackerRows.concat(idleTenantRows)

  // Standardise each feature against the training pool.
  const mu = {}
  const sigma = {}
  for (const { key } of FEATURES) {
    let sum = 0
    for (const row of pool) sum += row[key]
    const mean = sum / pool.length
    let sq = 0
    for (const row of pool) sq += (row[key] - mean) ** 2
    mu[key] = mean
    sigma[key] = Math.sqrt(sq / pool.length) || 1
  }

  const raw = (features) => {
    let total = 0
    for (const { key } of FEATURES) {
      total += WEIGHTS[key] * ((features[key] - mu[key]) / sigma[key])
    }
    return total
  }

  const attackerScores = attackerRows.map(raw)
  const tenantScores = idleTenantRows.map(raw)

  // Sweep for the threshold with the best balanced accuracy on the idle
  // training set, then sit in the middle of the range that achieves it.
  const all = attackerScores.concat(tenantScores)
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  let best = -Infinity
  let bestLo = lo
  let bestHi = lo
  for (let s = 0; s <= 400; s += 1) {
    const candidate = lo + ((hi - lo) * s) / 400
    let hits = 0
    for (const score of attackerScores) if (score >= candidate) hits += 1
    let quiet = 0
    for (const score of tenantScores) if (score < candidate) quiet += 1
    const balanced = hits / attackerScores.length / 2 + quiet / tenantScores.length / 2
    if (balanced > best + 1e-9) {
      best = balanced
      bestLo = candidate
      bestHi = candidate
    } else if (balanced > best - 1e-9) {
      bestHi = candidate
    }
  }

  // Bar scaling: wide enough to hold a heavily loaded tenant, so the bars can
  // be read against a fixed axis as the slider moves.
  const heavyTenantRows = collectFeatures('tenant', 1, 'scale-t', 20)
  const display = {}
  for (const { key } of FEATURES) {
    const values = attackerRows.concat(heavyTenantRows).map((row) => row[key])
    display[key] = percentile(values, 0.98) || 1
  }

  cachedDetector = {
    mu,
    sigma,
    weights: WEIGHTS,
    threshold: (bestLo + bestHi) / 2,
    display,
    score: raw,
  }
  return cachedDetector
}

export function decide(features, detector) {
  const score = detector.score(features)
  return { score, isAttack: score >= detector.threshold }
}

/* -------------------------------------------------------------------------
   Readouts
   ------------------------------------------------------------------------- */

const fprCache = new Map()

/** Share of the tenant's windows flagged as an attack, over `blocks * 8` windows. */
export function falseAlarmRate(load, detector, blocks = 40) {
  const key = clamp01(load).toFixed(2)
  const hit = fprCache.get(key)
  if (hit !== undefined) return hit

  let flagged = 0
  let total = 0
  for (let b = 0; b < blocks; b += 1) {
    const trace = makeTrace({ kind: 'tenant', load, seed: `fpr|${key}|${b}` })
    for (let w = 0; w < WINDOWS_PER_VIEW; w += 1) {
      if (decide(windowFeatures(trace, w * WINDOW_SAMPLES), detector).isAttack) flagged += 1
      total += 1
    }
  }
  const rate = flagged / total
  fprCache.set(key, rate)
  return rate
}

let cachedRecall = null

/** Share of attacker windows still caught. Load never touches this. */
export function attackerRecall(detector, blocks = 40) {
  if (cachedRecall !== null) return cachedRecall
  let hits = 0
  let total = 0
  for (let b = 0; b < blocks; b += 1) {
    const trace = makeTrace({ kind: 'attacker', seed: `recall|${b}` })
    for (let w = 0; w < WINDOWS_PER_VIEW; w += 1) {
      if (decide(windowFeatures(trace, w * WINDOW_SAMPLES), detector).isAttack) hits += 1
      total += 1
    }
  }
  cachedRecall = hits / total
  return cachedRecall
}

/**
 * The verdicts for the tenant's windows, as a running log ending at absolute
 * window index `end`. Deterministic, so a paused figure and a running one agree.
 */
export function tenantDecisionLog(load, detector, end, count) {
  const first = Math.max(0, end - count + 1)
  const log = []
  let cachedBlock = -1
  let trace = null
  for (let index = first; index <= end; index += 1) {
    const block = Math.floor(index / WINDOWS_PER_VIEW)
    if (block !== cachedBlock) {
      trace = makeTrace({ kind: 'tenant', load, seed: `view|${block}` })
      cachedBlock = block
    }
    const w = index % WINDOWS_PER_VIEW
    log.push(decide(windowFeatures(trace, w * WINDOW_SAMPLES), detector).isAttack)
  }
  return log
}

/* -------------------------------------------------------------------------
   Labels
   ------------------------------------------------------------------------- */

export function loadLabel(load) {
  if (load < 0.12) return 'idle'
  if (load < 0.38) return 'light'
  if (load < 0.64) return 'moderate'
  if (load < 0.86) return 'busy'
  return 'heavy'
}

/* -------------------------------------------------------------------------
   The four counters
   A real detector reads several counters at once through perf, not one. The
   misses counter is the primary signal and is generated exactly as above, so a
   figure that shows only misses and a figure that shows all four are showing
   the same samples. The other three are blended from the primary shape, which
   keeps them coherent with it while giving each its own texture.
   ------------------------------------------------------------------------- */

export const COUNTERS = [
  { key: 'misses', label: 'LLC misses', perf: 'LLC-load-misses' },
  { key: 'refs', label: 'LLC references', perf: 'LLC-loads' },
  { key: 'hits', label: 'L1 hits', perf: 'L1-dcache-loads' },
  { key: 'instructions', label: 'Instructions retired', perf: 'instructions' },
]

const COUNTER_PROFILE = {
  misses: { attacker: ATTACKER_MEAN, tenantIdle: TENANT_IDLE_MEAN, tenantHeavy: TENANT_HEAVY_MEAN },
  refs: { attacker: 60, tenantIdle: 34, tenantHeavy: 118 },
  hits: { attacker: 30, tenantIdle: 95, tenantHeavy: 190 },
  instructions: { attacker: 140, tenantIdle: 95, tenantHeavy: 150 },
}

export function counterMeanFor(kind, counter, load = 0) {
  const profile = COUNTER_PROFILE[counter] ?? COUNTER_PROFILE.misses
  if (kind === 'attacker') return profile.attacker
  return (
    profile.tenantIdle +
    (profile.tenantHeavy - profile.tenantIdle) * Math.pow(clamp01(load), 1.1)
  )
}

export function makeCounter({ kind, counter, load = 0, seed = SHARED_VIEW_SEED, length = VIEW_SAMPLES }) {
  const primary = makeTrace({ kind, load, seed, length })
  if (counter === 'misses') return primary

  const partner = makeTrace({ kind, load, seed: `${seed}|${counter}`, length })
  const blended = new Float64Array(length)
  for (let i = 0; i < length; i += 1) {
    blended[i] = 0.62 * primary[i] + 0.38 * partner[i]
  }
  const mean = counterMeanFor(kind, counter, load)
  return scaleToMean(blended, mean, mean * 0.15)
}

/** All four counters for one process. */
export function makeCounterSet({ kind, load = 0, seed = SHARED_VIEW_SEED, length = VIEW_SAMPLES }) {
  const set = {}
  for (const { key } of COUNTERS) {
    set[key] = makeCounter({ kind, counter: key, load, seed, length })
  }
  return set
}

/** Mean and population variance of one window, per counter. */
export function windowSummary(counterSet, start = 0, length = WINDOW_SAMPLES) {
  const summary = {}
  for (const { key } of COUNTERS) {
    const { mean, variance } = windowFeatures(counterSet[key], start, length)
    summary[key] = { mean, variance }
  }
  return summary
}

/* -------------------------------------------------------------------------
   Order
   ------------------------------------------------------------------------- */

/**
 * A seeded permutation of one window. Same seed, same permutation, so a
 * shuffled view can be reproduced and stepped back to.
 *
 * Every statistic in FEATURES is permutation invariant, which is the entire
 * point of the figure this feeds.
 */
export function shuffleWindow(values, seed) {
  const rand = mulberry32(hashSeed(`shuffle|${seed}`))
  const out = Float64Array.from(values)
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const swap = out[i]
    out[i] = out[j]
    out[j] = swap
  }
  return out
}
