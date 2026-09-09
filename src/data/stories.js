// Data for the partner profile's "Success stories" section: the three stats
// above it, and the stories themselves.
//
// ⚠️ The story titles are INVENTED, and so are the clients they name. Same
// hazard as `reviews.js`, one step milder: a fabricated case study attributed
// to a real partner claims work they may never have done. The clients are the
// same deliberately-fictional companies as the "worked with" strip
// (`CLIENTS` in `data/media.js`), which is the one thing keeping these from
// reading as real references.
//
// The SEGMENTS are real, in the sense that they're drawn from each partner's
// own `industries` — so a story's industry label is never something the
// directory doesn't already say about them.
//
// Deterministic per partner id, for the same reason as the reviews: content
// that reshuffles between renders can't be design-reviewed.

import { CLIENTS } from './media'
import { APPS } from './partners'

// FNV-1a plus MurmurHash3's finalizer. The finalizer is load-bearing — every
// `pick()` here is `seed % len` over pools of 8–10, which reads only the low
// bits, and raw FNV-1a barely mixes those. See the long note in `reviews.js`
// for what that cost the first time.
const hash = (str) => {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
const seedFor = (id, field) => hash(`${id}:${field}`)
const pick = (arr, seed) => arr[seed % arr.length]

// What the client company gets called. The base names come from `CLIENTS`, so
// the stories and the logo strip are about the same invented companies.
const TRADE = [
  'Foods',
  'Textiles',
  'Logistics',
  'Retail',
  'Labs',
  'Industries',
  'Health',
  'Learning',
]

// Outcomes, not adjectives. A case-study headline that says "transforms" and
// "leverages" tells a reader nothing, and it's also the register that makes
// placeholder copy hardest to tell from real copy.
const OUTCOMES = [
  'Improves Financial Operations',
  'Cuts Month-End Close from Ten Days to Two',
  'Consolidates Four Systems into One',
  'Brings Multi-Location Inventory into One View',
  'Replaces Spreadsheets Across Six Plants',
  'Moves Payroll and Attendance Off Paper',
  'Tracks Batch Traceability End to End',
  'Runs Procurement and Vendor Approvals in One Place',
  'Scales Order Management Through a Peak Season',
  'Standardises Reporting Across Three Regions',
]

// Strides coprime with each pool's length, so a partner's stories never repeat
// a client, an outcome or a segment until the pool is exhausted. `OUTCOMES` and
// `CLIENTS` are 10 long, `TRADE` is 8.
const STRIDES = { client: 3, trade: 3, outcome: 7 }

const appLabel = (value) => APPS.find((a) => a.value === value)?.label ?? value

// `{ pinned, rest }`. `pinned` is the one story the partner has chosen to lead
// with, rendered full width; `rest` is everything else, in the grid. A pinned
// story is deliberately NOT repeated in the grid — the design's mock shows it
// twice, which reads as a duplicate rather than emphasis.
//
// Not every partner pins one. Two thirds of those ELIGIBLE do, which is what
// makes the un-pinned layout (grid only, no lead) reviewable.
//
// ⚠️ Eligibility is FOUR stories. Pinning costs the grid its lead item, and the
// grid is three columns — so a lead is only worth it when a full row survives
// behind it. Below four it doesn't: at two, a full-width 4:1 banner was left
// with one lonely tile and two thirds of the row empty; at three, still a gap
// in the third column. Either way the banner read as the section and the
// remainder as an afterthought.
//
// Four is the shape of the grid, not a taste — change it with `sm:grid-cols-3`
// in `PartnerStoriesSection` and nowhere else.
export const storiesFor = (partner) => {
  const total = partner.stories
  if (!total) return { pinned: null, rest: [] }

  const clientSeed = seedFor(partner.id, 'client')
  const tradeSeed = seedFor(partner.id, 'trade')
  const outcomeSeed = seedFor(partner.id, 'outcome')
  const segmentSeed = seedFor(partner.id, 'segment')

  const items = Array.from({ length: total }, (_, i) => {
    const base = pick(CLIENTS, clientSeed + i * STRIDES.client).name
    const client = `${base} ${pick(TRADE, tradeSeed + i * STRIDES.trade)}`
    return {
      id: `${partner.id}-story-${i}`,
      // Real: one of the partner's own industries, so the label never claims
      // an industry the directory doesn't already list for them.
      segment: pick(partner.industries, segmentSeed + i),
      title: `${client} ${pick(OUTCOMES, outcomeSeed + i * STRIDES.outcome)} with ${appLabel(
        pick(partner.apps, clientSeed + i),
      )}`,
      // Index into the placeholder cover pool; the component resolves it.
      cover: i,
    }
  })

  const pins = total >= 4 && seedFor(partner.id, 'pin') % 3 !== 0
  return pins ? { pinned: items[0], rest: items.slice(1) } : { pinned: null, rest: items }
}
