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
import { reviewsFor } from './reviews'

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

// ⚠️ `fcSites` and `years` are invented per partner — a site count and a
// tenure are both claims the directory would have to source. They're an
// explicit table rather than a formula so they read as data to be replaced,
// and so two partners don't end up with suspiciously round matching numbers.
const STATS = {
  'tridots-tech': { fcSites: 800, years: 17 },
  'software-work': { fcSites: 540, years: 14 },
  'new-indictrans': { fcSites: 190, years: 19 },
  '8848-digital': { fcSites: 610, years: 8 },
  'greycube-technologies': { fcSites: 70, years: 11 },
  wahni: { fcSites: 430, years: 10 },
  hybrowlabs: { fcSites: 260, years: 6 },
  'finbyz-tech': { fcSites: 350, years: 12 },
  alyf: { fcSites: 45, years: 5 },
  'craft-interactive': { fcSites: 480, years: 13 },
  'kingstech-services': { fcSites: 60, years: 7 },
  navari: { fcSites: 90, years: 9 },
  korecent: { fcSites: 210, years: 15 },
}

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

// The three numbers above the stories.
//
// The middle one has been through two rewrites, and the reasoning is worth
// keeping. It started as a client-retention rate: a claim nobody can check
// without asking the partner for their books, so the wrong thing for a
// directory profile. Then it was the certification count — verifiable, since
// Frappe issues the certificates, but it says what a partner *is qualified
// for*, not whether the work went well, which is the one thing this section is
// about.
//
// It's now the share of reviewers who would recommend them. That's a success
// signal, it's computed from the reviews the platform already holds, and it
// needs no validating — the same reasoning that keeps `fcSites` a Frappe Cloud
// figure rather than a self-reported one. Over ALL of a partner's reviews, not
// the four the profile renders: see the note in `reviews.js`.
export const statsFor = (partner) => {
  const s = STATS[partner.id]
  if (!s) return []
  const { recommendRate } = reviewsFor(partner)
  return [
    { key: 'sites', value: `${s.fcSites}+`, label: 'FC sites' },
    // A partner with no reviews yet has no rate to quote, so the card drops
    // rather than showing a hopeful 0%.
    ...(recommendRate === null
      ? []
      : [{ key: 'recommend', value: `${recommendRate}%`, label: 'Would recommend' }]),
    { key: 'years', value: `${s.years}y`, label: 'Years operating' },
  ]
}

// `{ pinned, rest }`. `pinned` is the one story the partner has chosen to lead
// with, rendered full width; `rest` is everything else, in the grid. A pinned
// story is deliberately NOT repeated in the grid — the design's mock shows it
// twice, which reads as a duplicate rather than emphasis.
//
// Not every partner pins one. Two thirds of those with something to pin do,
// which is what makes the un-pinned layout (grid only, no lead) reviewable.
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

  const pins = total >= 2 && seedFor(partner.id, 'pin') % 3 !== 0
  return pins ? { pinned: items[0], rest: items.slice(1) } : { pinned: null, rest: items }
}
