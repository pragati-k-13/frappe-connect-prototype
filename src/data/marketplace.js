// Apps a partner has published to the Frappe Marketplace — the "Marketplace
// contributions" section of the profile.
//
// ⚠️ Every app here is INVENTED, and this is the most attributable placeholder
// data in the mock after the reviews: it credits a real, named company with
// building and publishing a specific product. Nothing in the directory says who
// publishes what, so none of it can be checked. Read this before screenshotting
// the section, and replace it with the real marketplace listing before anyone
// outside the team sees it.
//
// It's invented but not arbitrary. An app is only ever drawn from something the
// directory already says about that partner:
//   • a localisation app comes from their REGION — the German partner gets the
//     German compliance app, not the Indian one;
//   • a product app comes from an app they actually implement (`partner.apps`),
//     so nobody is publishing a CRM add-on for a CRM they don't work in.
// Same rule as the story segments in `stories.js`.
//
// Deterministic per partner id, for the same reason as the reviews and stories:
// content that reshuffles between renders can't be design-reviewed.

// FNV-1a plus MurmurHash3's finalizer. The finalizer is load-bearing — every
// pick here is `seed % len` over pools of two or three, which reads only the
// lowest bits, and raw FNV-1a barely mixes those. See the long note in
// `reviews.js` for what that cost the first time.
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

// Localisation and compliance work, keyed by the partner's own region. These
// are the apps a partner builds because of where they operate.
const BY_REGION = {
  india: ['GST and E-Invoicing', 'TDS Automation', 'India Payroll Compliance'],
  europe: ['Germany Compliance', 'SEPA Direct Debit', 'EU VAT and OSS Returns'],
  'middle-east': ['UAE VAT Compliance', 'Arabic Print Formats'],
  asia: ['SST Compliance', 'Regional Payment Gateways'],
  africa: ['EFD Fiscal Receipts', 'Mobile Money Payments'],
  americas: ['US Sales Tax Nexus', 'ACH Payments'],
}

// Product work, keyed by an app the partner implements. These are the apps a
// partner builds because of what they do.
const BY_APP = {
  erpnext: ['Warehouse Barcode Scanner', 'Rate Contract Management'],
  crm: ['WhatsApp for CRM', 'Lead Enrichment'],
  'frappe-hr': ['Biometric Attendance Bridge', 'Shift Roster Planner'],
  helpdesk: ['CSAT Surveys', 'Ticket Deflection Rules'],
  insights: ['Scheduled Report Digests'],
  drive: ['Bulk Folder Permissions'],
  learning: ['Certificate Templates'],
  school: ['Timetable Generator'],
  framework: ['Audit Trail Viewer'],
}

// ⚠️ How many apps each partner has published — invented, and an explicit table
// rather than a formula so it reads as data to be replaced, and so the shape of
// the section is deliberate rather than emergent.
//
// Five of the thirteen publish nothing, which is the realistic majority and the
// case that decides whether the section renders at all. Tridots has two, so the
// divided list is reviewable on the partner the design file uses.
const COUNTS = {
  'tridots-tech': 2,
  'software-work': 0,
  'new-indictrans': 1,
  '8848-digital': 3,
  'greycube-technologies': 0,
  wahni: 1,
  hybrowlabs: 0,
  'finbyz-tech': 2,
  alyf: 1,
  'craft-interactive': 1,
  'kingstech-services': 0,
  navari: 1,
  korecent: 0,
}

// Ratings run 3.4–4.8 in tenths. Nothing is perfect and nothing is unpublishably
// bad: a marketplace listing with a 1.2 would have been pulled, and a wall of
// 5.0s is the giveaway that the numbers were decorative.
const ratingFor = (seed) => Math.round((3.4 + (seed % 15) * 0.1) * 10) / 10

// 18–437 reviews. The spread matters more than the values — a section where
// every app has a similar count can't show whether the layout survives "(9)"
// next to "(412)".
const reviewsFor = (seed) => 18 + (seed % 420)

// The apps one partner has published, most-reviewed first — the order the
// marketplace itself would use, so the strongest contribution leads.
export const contributionsFor = (partner) => {
  const total = COUNTS[partner.id] ?? 0
  if (!total) return []

  // The region app first, then product apps drawn from the partner's own stack.
  // Concatenating gives a pool at least as long as any partner's count, and
  // slicing keeps the region app in whenever there is one to have.
  //
  // ⚠️ The region pool is ROTATED per partner rather than read from the top.
  // Eight of the thirteen partners are Indian, and without this every one of
  // them published an app called "GST and E-Invoicing" — true enough to life,
  // but on a directory two profiles showing the identical listing read as a
  // copy-paste bug rather than as two partners in the same market.
  const region = BY_REGION[partner.region] ?? []
  const off = region.length ? seedFor(partner.id, 'region') % region.length : 0
  const rotated = [...region.slice(off), ...region.slice(0, off)]
  const products = partner.apps.flatMap((app) => BY_APP[app] ?? [])
  const pool = [...rotated.slice(0, 1), ...products, ...rotated.slice(1)]

  // ⚠️ Ratings are made distinct WITHIN a partner. There are only fifteen
  // possible values, so two of a partner's apps landing on the same one is a
  // one-in-fifteen event — and it happened to Tridots, the partner the design
  // file uses, where two rows reading "3.9" looks like the number is decorative
  // rather than like a coincidence. Stepping to the next free bucket keeps the
  // values deterministic and keeps the spread visible.
  const used = new Set()
  const distinctRating = (seed) => {
    let r = ratingFor(seed)
    while (used.has(r)) r = ratingFor(Math.round(r * 10) - 34 + 1)
    used.add(r)
    return r
  }

  return pool
    .slice(0, total)
    .map((name, i) => ({
      id: `${partner.id}-app-${i}`,
      name,
      rating: distinctRating(seedFor(partner.id, `app-${i}-${name}`)),
      reviews: reviewsFor(seedFor(partner.id, `reviews-${i}-${name}`)),
    }))
    .sort((a, b) => b.reviews - a.reviews)
}
