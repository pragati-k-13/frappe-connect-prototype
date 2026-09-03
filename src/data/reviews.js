// Reviews for the partner profile's Reviews section.
//
// ⚠️⚠️⚠️ READ THIS BEFORE SCREENSHOTTING THE SECTION.
//
// Every review below is FABRICATED, and this is the most sensitive placeholder
// data in the whole mock. The partners are real, named companies. A made-up
// testimonial — praise or criticism — attributed to a made-up customer reads
// exactly like real customer feedback about a real business, and a screenshot
// of this section is indistinguishable from one of a live directory.
//
// Nobody said any of this. No such reviewer exists. The caveats ("rates on the
// higher side") are template text, not anyone's opinion of anyone.
//
// It exists so the section's SHAPE is reviewable: how a two-line body sits
// against a one-line one, where the timestamp lands, how many tags fit on a
// row, what four rows plus a "View all" looks like. Replace the whole module
// with real reviews, or gate the section off, before this leaves the team.
//
// Generated rather than hand-written, and DETERMINISTIC: a partner's reviews
// are a pure function of their id, so they don't reshuffle on every render.
// Random-per-render placeholder content can't be design-reviewed — the layout
// you just commented on would be gone by the time anyone looked.

// FNV-1a, 32-bit, followed by an avalanche step.
//
// ⚠️ The finalizer is not optional here. Every `pick()` below is `seed % len`
// with a pool of 6 or 8, so it reads only the bottom 3 bits — and FNV-1a's low
// bits barely mix. Worse, appending a field name shifts every id's low bits by
// the same amount, so seeding each field separately did NOT break the
// collisions: `tridots-tech` and `new-indictrans` agreed mod 8 on the name,
// body AND trade pools at once, and their profiles showed the same four
// reviews verbatim.
//
// This is MurmurHash3's finalizer, whose whole job is to push high-bit entropy
// down into the low bits. With it, `% 8` is usable. Without it, the modulus has
// to change instead.
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

const pick = (arr, seed) => arr[seed % arr.length]

// ⚠️ One seed per FIELD, not one per partner. Indexing every pool off a single
// `hash(id)` means two partners whose hash agrees modulo the pool lengths get
// byte-identical review lists — `tridots-tech` and `new-indictrans` did, as did
// two other pairs, and flipping between those profiles showed the same four
// reviews verbatim. Hashing the field name in makes the fields independent, so
// a collision in one no longer implies a collision in all of them.
const seedFor = (id, field) => hash(`${id}:${field}`)

// Reviewers are the partner's own customers, so the names follow the partner's
// market rather than coming from one global pool — a Nairobi partner reviewed
// entirely by Gujarati names would read as an obvious copy-paste.
const NAMES = {
  india: [
    'Rahul Mishra',
    'Ananya Krishnan',
    'Devika Nair',
    'Harsh Vora',
    'Sneha Kulkarni',
    'Imran Qureshi',
    'Priyanka Rao',
    'Tarun Bhatia',
  ],
  europe: [
    'Katrin Vogel',
    'Stefan Brenner',
    'Marta Nowak',
    'Lukas Hoffmann',
    'Elena Rossi',
    'Pieter de Vries',
  ],
  'middle-east': [
    'Omar Al-Farsi',
    'Layla Nasser',
    'Khalid Rahman',
    'Fatima Siddiqui',
    'Yusuf Darwish',
    'Noor Abbas',
  ],
  asia: [
    'Lim Wei Sheng',
    'Nurul Hakim',
    'Grace Tan',
    'Ravi Chandran',
    'Mei Ling Chua',
    'Arif Yusof',
  ],
  africa: [
    'Wanjiru Kamau',
    'Samuel Odhiambo',
    'Grace Mwangi',
    'Peter Kiptoo',
    'Amina Hassan',
    'Joseph Mutua',
  ],
  americas: [
    'Dana Whitfield',
    'Carlos Ferreira',
    'Megan Doyle',
    'Andre Boucher',
    'Nicole Barrett',
    'Trevor Lang',
  ],
}

// Company names are built rather than listed, so a reviewer's firm reads as
// theirs: surname + trade + the legal suffix that market actually uses.
const TRADES = [
  'Foodtech',
  'Textiles',
  'Industries',
  'Logistics',
  'Agro',
  'Engineering',
  'Retail',
  'Pharma',
]
const SUFFIX = {
  india: 'Pvt Ltd',
  europe: 'GmbH',
  'middle-east': 'LLC',
  asia: 'Pte Ltd',
  africa: 'Ltd',
  americas: 'Inc',
}

// `stars` and `recommend` travel with the body so the two never contradict the
// words — a 3-star review reading "flawless" is the kind of detail that derails
// a design review into a data conversation. Half steps are in here because the
// row renders one decimal (`4.5`), and a column of `4.0`s makes that format
// look pointless.
//
// Spread on purpose: ten bodies from 2.5 to 5.0, three of them not
// recommending. A profile where every review is four stars and every row says
// "Would recommend" doesn't show what the section looks like when it isn't.
//
// ⚠️ The low-rated ones are deliberately about PROCESS — timelines, chasing,
// scope — not competence or conduct. Fabricated criticism of a real, named
// company is the sharpest edge in this file (see the warning at the top); mild
// and procedural is as far as placeholder copy should go.
const BODIES = [
  {
    text: 'Went live on the date we agreed, which is not something I expected. Training for our own staff was thorough enough that we have barely needed support since.',
    stars: 5,
    recommend: true,
  },
  {
    text: 'They understood our processes before proposing anything, which saved us from a rebuild six months later. Would work with them again.',
    stars: 5,
    recommend: true,
  },
  {
    text: 'Strong on the finance side and very patient with our questions. Scoping took longer than we would have liked, but the result matches what we asked for.',
    stars: 4.5,
    recommend: true,
  },
  {
    text: 'My experience with the team was fantastic. They were always eager to help, and while the costs are somewhat high, the outcomes are truly impressive.',
    stars: 4.5,
    recommend: true,
  },
  {
    text: 'The crew here is remarkably helpful and well-informed. Their rates might be on the pricier side, but the level of service and execution is unparalleled.',
    stars: 4,
    recommend: true,
  },
  {
    text: 'Honest and helping staff… Bit expensive but worth the money for best implementation',
    stars: 4,
    recommend: true,
  },
  {
    text: 'Solid implementation and a team that stayed available through a messy migration. Documentation could have been better.',
    stars: 4,
    recommend: true,
  },
  {
    text: 'Good technical work. Communication was slower than we expected once we were past go-live, so budget for chasing if you need quick turnarounds.',
    stars: 3.5,
    recommend: false,
  },
  {
    text: 'The implementation works and the team knew the product well. It took roughly twice as long as scoped, and we ended up coordinating a lot of it ourselves.',
    stars: 3,
    recommend: false,
  },
  {
    text: 'Fine for the core setup, less so for anything bespoke. We hired separately for two of the integrations we had asked about at the start.',
    stars: 2.5,
    recommend: false,
  },
]

// The summary chips above the list. `caution` renders an info icon instead of a
// check — see `PartnerReviewsSection.vue`. Counts are how many reviews mention
// the theme, so they overlap and don't sum to the review total.
const THEMES = [
  { label: 'Professional', sentiment: 'positive' },
  { label: 'Quick responses', sentiment: 'positive' },
  { label: 'Deep expertise', sentiment: 'positive' },
  { label: 'Clear communication', sentiment: 'positive' },
  { label: 'On time', sentiment: 'positive' },
  { label: 'Higher rates', sentiment: 'caution' },
  { label: 'Slow follow-ups', sentiment: 'caution' },
]

// Every value coprime with `BODIES.length` (10) below its half, which is what
// makes each one visit ten distinct entries before repeating. If BODIES changes
// length, recompute this list — a stride sharing a factor with the length walks
// a short cycle and the same review shows up twice in one profile.
const BODY_STRIDES = [1, 3, 7, 9]

// How many of the partner's reviews the profile shows before "View all".
export const SHOWN = 4

export const reviewsFor = (partner) => {
  const names = NAMES[partner.region] ?? NAMES.india
  const suffix = SUFFIX[partner.region] ?? 'Ltd'
  const nameSeed = seedFor(partner.id, 'name')
  const bodySeed = seedFor(partner.id, 'body')
  const tradeSeed = seedFor(partner.id, 'trade')
  const ageSeed = seedFor(partner.id, 'age')
  const themeSeed = seedFor(partner.id, 'theme')
  // The STRIDE varies per partner too, not just the starting point. With a
  // fixed stride the body sequence has only as many possible values as the
  // pool has entries — ten, against thirteen partners — so three profiles
  // showed the same four review texts in the same order. Every value here is
  // coprime with `BODIES.length`, which is what keeps a single list free of
  // repeats; the four of them multiply the distinct sequences by four.
  const bodyStride = pick(BODY_STRIDES, seedFor(partner.id, 'bodyStride'))

  // Every review, not just the visible four. The success-story section quotes a
  // "would recommend" rate, and that has to be over the whole set — a
  // percentage of the four on screen would be a different number from the one
  // the label claims. Bodies repeat past the tenth, which is fine: only the
  // first four are rendered, and the stride keeps those distinct.
  const all = Array.from({ length: partner.reviews }, (_, i) => {
    // ⚠️ A stride only visits distinct entries if it's coprime with the pool
    // length. The name stride is 1 for exactly that reason: the regional pools
    // are 6 or 8 long, and a stride of 3 over 6 names walks 0,3,0,3 — Navari's
    // four reviews came out as two people reviewing twice each.
    //
    // Same trap for the others, and it bit once already: BODIES grew from 8
    // entries to 10, and the old stride of 5 walks 0,5,0,5 over 10. Bodies now
    // step by one of `BODY_STRIDES` and trades by 7 (coprime with 8). Re-check
    // both if a pool ever changes length again.
    const name = pick(names, nameSeed + i)
    const body = pick(BODIES, bodySeed + i * bodyStride)
    const surname = name.split(' ').pop()
    return {
      id: `${partner.id}-${i}`,
      name,
      company: `${surname} ${pick(TRADES, tradeSeed + i * 7)} ${suffix}`,
      // Stored as an age, not a date: a fixed ISO date would make the label
      // drift ("3 months ago" becoming "2 years ago") every time the mock is
      // opened later, which looks like a bug rather than placeholder data.
      monthsAgo: 2 + ((ageSeed + i * 11) % 10),
      ...body,
    }
  })

  // Two positive themes and one caution, matching the design. Counts scale off
  // the review total so a partner with 12 reviews doesn't claim 40 mentions.
  const positives = THEMES.filter((t) => t.sentiment === 'positive')
  const cautions = THEMES.filter((t) => t.sentiment === 'caution')
  const tags = [
    { ...pick(positives, themeSeed), count: Math.max(2, Math.round(partner.reviews * 0.42)) },
    // +3 against a pool of 5 is coprime, so the two positives never collide.
    { ...pick(positives, themeSeed + 3), count: Math.max(2, Math.round(partner.reviews * 0.33)) },
    { ...pick(cautions, themeSeed), count: Math.max(1, Math.round(partner.reviews * 0.25)) },
  ]

  const recommending = all.filter((r) => r.recommend).length
  return {
    // The rows on screen. The rest of `all` exists only to be counted.
    items: all.slice(0, SHOWN),
    tags,
    // Rounded here rather than at the call site, so every surface quoting it
    // quotes the same integer.
    recommendRate: partner.reviews ? Math.round((recommending / partner.reviews) * 100) : null,
  }
}
