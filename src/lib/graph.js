/**
 * The counter graph.
 *
 * Nodes are the fourteen hardware counters, in the ranking order published by
 * Ghabbara and Trifa. Edges are how strongly two counters move together inside
 * one window, and they are recomputed for every window, which is what makes the
 * graph temporal.
 *
 * The coupling here is generated rather than measured. It is built to show the
 * shape of the hypothesis: a probe loop is a repeating hardware operation, so
 * the same clusters of counters should lock together again and again on the
 * loop's period, while a heavily loaded but honest workload drives many
 * counters hard at once without settling into any structure that repeats.
 */

export const GRAPH_COUNTERS = [
  { name: 'cache-references', short: 'refs' },
  { name: 'cache-misses', short: 'miss' },
  { name: 'CPU-cycles', short: 'cyc' },
  { name: 'instructions', short: 'inst' },
  { name: 'branches', short: 'br' },
  { name: 'branch-misses', short: 'br-m' },
  { name: 'L1-dcache-load-misses', short: 'L1d' },
  { name: 'L1-icache-load-misses', short: 'L1i' },
  { name: 'LLC-misses', short: 'LLC-m' },
  { name: 'iTLB-load-misses', short: 'iTLB' },
  { name: 'LLC-store-misses', short: 'LLC-s' },
  { name: 'LLC-loads', short: 'LLC-l' },
  { name: 'dTLB-load-misses', short: 'dTLB' },
  { name: 'branch-instructions', short: 'br-i' },
]

export const NODE_COUNT = GRAPH_COUNTERS.length

/** The probe loop closes every seven windows at this window length and step. */
export const PERIOD_WINDOWS = 7
export const TOTAL_WINDOWS = 21
export const EDGE_THRESHOLD = 0.45

/**
 * Which counters the probe loop drives together, and at what point in its
 * cycle. The memory cluster is the one named in the argument: cache references,
 * cache misses and the last level cache counters rising as one.
 */
const CLUSTERS = [
  { phase: 0, members: [0, 1, 8, 10, 11] },
  { phase: 0.34, members: [2, 3, 4, 13] },
  { phase: 0.67, members: [5, 6, 7, 9, 12] },
]

const PHASE = (() => {
  const out = new Array(NODE_COUNT).fill(0)
  for (const cluster of CLUSTERS) {
    for (const member of cluster.members) out[member] = cluster.phase
  }
  return out
})()

function noise(a, b, c) {
  let h = Math.imul(a * 73856093 + b * 19349663 + c * 83492791, 2654435761)
  h ^= h >>> 15
  h = Math.imul(h, 2246822519)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

/** Fixed strength of the link between two counters, independent of time. */
function affinity(i, j) {
  return 0.62 + 0.38 * noise(Math.min(i, j), Math.max(i, j), 7)
}

/**
 * How hard each counter is being driven in one window.
 *
 * The attacker's activity follows the loop's phase, so it comes back around.
 * The tenant's is high everywhere and different every time.
 */
function activity(kind, windowIndex) {
  const out = new Array(NODE_COUNT)
  if (kind === 'attacker') {
    const theta = (windowIndex % PERIOD_WINDOWS) / PERIOD_WINDOWS
    for (let i = 0; i < NODE_COUNT; i += 1) {
      const wave = 0.5 + 0.5 * Math.cos(2 * Math.PI * (theta - PHASE[i]))
      out[i] = Math.min(1, wave * (0.9 + 0.2 * noise(windowIndex, i, 3)))
    }
    return out
  }
  for (let i = 0; i < NODE_COUNT; i += 1) {
    out[i] = 0.45 + 0.55 * noise(windowIndex, i, 11)
  }
  return out
}

/** Upper triangle pair list, in a stable order. */
export const PAIRS = (() => {
  const pairs = []
  for (let i = 0; i < NODE_COUNT; i += 1) {
    for (let j = i + 1; j < NODE_COUNT; j += 1) pairs.push([i, j])
  }
  return pairs
})()

/** Edge weights for one window, one weight per pair, in PAIRS order. */
export function edgeWeights(kind, windowIndex) {
  const act = activity(kind, windowIndex)
  return PAIRS.map(([i, j], index) => {
    const jitter = 0.9 + 0.2 * noise(windowIndex, index, 5)
    return Math.min(1, act[i] * act[j] * affinity(i, j) * jitter)
  })
}

/** Only the pairs strong enough to draw. */
export function edgesToDraw(kind, windowIndex) {
  const weights = edgeWeights(kind, windowIndex)
  const edges = []
  weights.forEach((weight, index) => {
    if (weight >= EDGE_THRESHOLD) {
      edges.push({ from: PAIRS[index][0], to: PAIRS[index][1], weight })
    }
  })
  return edges
}

/** Pearson correlation between two weight vectors. */
function correlate(a, b) {
  const n = a.length
  let sumA = 0
  let sumB = 0
  for (let i = 0; i < n; i += 1) {
    sumA += a[i]
    sumB += b[i]
  }
  const meanA = sumA / n
  const meanB = sumB / n

  let num = 0
  let devA = 0
  let devB = 0
  for (let i = 0; i < n; i += 1) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num += da * db
    devA += da * da
    devB += db * db
  }
  const denominator = Math.sqrt(devA * devB)
  return denominator < 1e-12 ? 0 : num / denominator
}

/**
 * How much every window's coupling resembles the current one. This is where the
 * repetition shows: bands for the attacker, noise for the tenant.
 */
export function recurrenceRow(kind, currentWindow, total = TOTAL_WINDOWS) {
  const current = edgeWeights(kind, currentWindow)
  return Array.from({ length: total }, (_, w) => correlate(edgeWeights(kind, w), current))
}
