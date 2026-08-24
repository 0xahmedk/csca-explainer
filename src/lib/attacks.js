/**
 * The two attack loops, as a small state machine.
 *
 * Both techniques are four steps that repeat. Everything a step displays is
 * derived from the technique, the iteration number and the step index, so the
 * figure holds no state beyond those three numbers and stepping backwards is
 * exact rather than approximate.
 */

export const WAYS = 8
export const SHARED_WAY = 3

/**
 * The victim is doing a square-and-multiply exponentiation with its private
 * key. Each iteration of the attack loop observes one bit of it.
 */
export const SECRET_BITS = [
  1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0,
]

const HIT_BASE = 62
const HIT_SPREAD = 16
const MISS_BASE = 275
const MISS_SPREAD = 55

export const TECHNIQUES = [
  {
    id: 'prime-probe',
    name: 'Prime+Probe',
    setNote: 'One cache set, eight ways. The attacker can use every way in it.',
    meter: {
      label: 'Probe time for the whole set',
      max: 1600,
      threshold: 800,
      activity: 'above',
      activityLabel: 'victim activity',
    },
    steps: [
      {
        key: 'prime',
        name: 'Prime',
        text: 'The attacker fills the cache set entirely with its own data, one line in every way. It now knows exactly what the set holds, because it put all of it there.',
      },
      {
        key: 'wait',
        name: 'Wait',
        text: 'The attacker stops touching the set and lets the victim run. If the victim accesses an address that maps to this set, the hardware has to evict one of the attacker’s lines to make room.',
      },
      {
        key: 'probe',
        name: 'Probe',
        text: 'The attacker re-reads its own lines and times every access. It is not reading the victim’s data. It is measuring how long its own data takes to come back.',
      },
      {
        key: 'read',
        name: 'Read',
        text: 'A slow access means that line is no longer in the cache, so it was evicted, so the victim used this set. Slow means victim activity. The probe has also refilled the set, which is where the next iteration starts.',
      },
    ],
  },
  {
    id: 'flush-reload',
    name: 'Flush+Reload',
    setNote: 'The same set. Way 3 holds a line the attacker and the victim genuinely share.',
    meter: {
      label: 'Reload time for the shared line',
      max: 400,
      threshold: 150,
      activity: 'below',
      activityLabel: 'victim activity',
    },
    steps: [
      {
        key: 'flush',
        name: 'Flush',
        text: 'The attacker evicts one specific line from the cache, a line it shares with the victim. That sharing comes from a shared library mapped into both address spaces, or from memory deduplication on the host.',
      },
      {
        key: 'wait',
        name: 'Wait',
        text: 'The attacker waits and lets the victim run. If the victim executes the code on that line, the hardware brings the line back into the cache.',
      },
      {
        key: 'reload',
        name: 'Reload',
        text: 'The attacker reads that same line and times the access.',
      },
      {
        key: 'read',
        name: 'Read',
        text: 'A fast access means the line was already back in the cache, so the victim put it there. Fast means victim activity, the exact opposite of Prime+Probe. The attacker’s own read has now cached the line, so the next iteration begins by flushing it again.',
      },
    ],
  },
]

export const STEP_COUNT = 4

export function techniqueById(id) {
  return TECHNIQUES.find((technique) => technique.id === id) ?? TECHNIQUES[0]
}

export function bitFor(iteration) {
  return SECRET_BITS[iteration % SECRET_BITS.length]
}

/** Deterministic 0..1 from an integer, so replays and back-steps match exactly. */
function mix(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 2654435761)
  h ^= h >>> 15
  h = Math.imul(h, 2246822519)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

function hitCycles(salt) {
  return Math.round(HIT_BASE + mix(salt) * HIT_SPREAD)
}

function missCycles(salt) {
  return Math.round(MISS_BASE + mix(salt) * MISS_SPREAD)
}

function evictedWays(iteration) {
  if (!bitFor(iteration)) return new Set()
  const count = 2 + Math.floor(mix(iteration * 977 + 5) * 3) // 2 to 4 ways
  const order = Array.from({ length: WAYS }, (_, way) => way).sort(
    (a, b) => mix(iteration * 31 + a) - mix(iteration * 31 + b),
  )
  return new Set(order.slice(0, count))
}

/**
 * Everything the figure draws for one (technique, iteration, step).
 *
 * `measured` turns on at the timing step. `activity` stays null until the read
 * step, because until then the attacker has a number but has not yet decided
 * what it means.
 */
export function attackState(techniqueId, iteration, step) {
  const bit = bitFor(iteration)
  const measured = step >= 2
  const decided = step >= 3

  if (techniqueId === 'flush-reload') {
    const present = bit === 1
    const value = present
      ? hitCycles(iteration * 13 + 1)
      : missCycles(iteration * 13 + 2)

    const lines = Array.from({ length: WAYS }, (_, way) => {
      if (way !== SHARED_WAY) return { state: 'other', muted: true }
      if (step === 0) return { state: 'empty', shared: true }
      return {
        state: present ? 'victim' : 'empty',
        shared: true,
        latency: measured ? value : undefined,
        flagged: decided && present,
      }
    })

    return {
      lines,
      measured,
      value: measured ? value : null,
      activity: decided ? present : null,
      bit,
    }
  }

  const evicted = evictedWays(iteration)
  const perWay = Array.from({ length: WAYS }, (_, way) =>
    evicted.has(way) ? missCycles(iteration * 101 + way) : hitCycles(iteration * 101 + way),
  )
  const total = perWay.reduce((sum, cycles) => sum + cycles, 0)

  const lines = Array.from({ length: WAYS }, (_, way) => {
    if (step === 0) return { state: 'attacker' }
    const wasEvicted = evicted.has(way)
    return {
      state: wasEvicted ? 'victim' : 'attacker',
      latency: measured ? perWay[way] : undefined,
      flagged: decided && wasEvicted,
    }
  })

  return {
    lines,
    measured,
    value: measured ? total : null,
    activity: decided ? evicted.size > 0 : null,
    bit,
  }
}

/** How many bits have been written down by the end of (iteration, step). */
export function recoveredCount(iteration, step) {
  return Math.min(SECRET_BITS.length, iteration + (step >= 3 ? 1 : 0))
}
