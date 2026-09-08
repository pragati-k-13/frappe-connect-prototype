// The three qualifying questions Frappe Connect asks before it will show a
// listing. Kept as data, not markup, so the sequence can be reordered or
// extended without touching the page component.
//
// Every question is skippable (see `stores/connect.js` — a skipped answer is
// null, which the results filter treats as "no constraint"). That was an open
// question on the wireframe; it's built as designed here so the behaviour is
// reviewable rather than theoretical.
//
// INDUSTRIES, REGIONS and the counts below are the REAL taxonomy, taken from
// the live partner directory:
//   • industry groups + segments — `window.page_data.industry_groups` on
//     frappe.io/partners/list
//   • region groupings and per-country counts — frappe.io/partners/regions
// Re-lift them from those two pages when the directory changes.

// Every group has real sub-segments, so the second-level question applies to
// all four — not just Manufacturing, as the first wireframe assumed.
export const INDUSTRIES = [
  {
    value: 'manufacturing',
    label: 'Manufacturing',
    segments: [
      'Automotive Manufacturing',
      'Chemical Manufacturing',
      'Discrete Manufacturing',
      'Electronics Manufacturing',
      'Food and Beverages',
      'Furniture Manufacturing',
      'Jewellery Manufacturing',
      'Medical Device Manufacturing',
      'Pharmaceutical Manufacturing',
      'Process Manufacturing',
      'Steel Manufacturing',
      'Textile Manufacturing',
    ],
  },
  {
    value: 'services',
    label: 'Services',
    segments: [
      'Aviation Industry',
      'Banking, Insurance and Broking',
      'Consulting',
      'Education',
      'Engineering and Construction',
      'Healthcare',
      'Hospitals',
      'Hotels, Restaurants and Cafes',
      'Logistics',
      'Nonprofit',
      'Professional services',
      'Real Estate',
      'Software Development',
      'Telecommunications',
    ],
  },
  {
    value: 'trading',
    label: 'Trading and Distribution',
    segments: ['E-commerce', 'Goods Trading'],
  },
  {
    value: 'others',
    label: 'Others',
    segments: [
      'Agriculture',
      'Fast Moving Consumer Goods',
      'Finance',
      'Government',
      'Livestock',
      'Rental Business',
      'Retail',
    ],
  },
]

// Real partner counts. Africa is a chip here (the wireframe left it to the map)
// because at 14 partners it outranks Europe; hiding it would be arbitrary.
//
// India is NOT a region of its own, though it is 71 of Asia's 90 and the
// wireframe drew it as its own chip. It's a country, and now that the filter
// lists every country the programme covers, a region list with one country in it
// reads as a mistake — India sat as a peer of Asia while being the first thing
// inside it. It's a country row under "All of Asia" instead.
//
// The India/rest-of-Asia split still earns its keep in the placeholder content:
// reviewer names, company suffixes, migration paths and localisation apps that
// would all be wrong on a Singapore partner. That hangs off `market` in
// `data/partners.js`, which is a country where it needs to be one.
//
// `countries` is the real per-region country list from the same page, re-lifted
// later than the `count` figures above — which is why some of them no longer
// add up: the directory now reads India alone at 73, Middle East 35 and
// Americas 10. The counts are left as they were on purpose, because
// `MAP_REGIONS` totals them to the "155+ Partners" the marketing page claims;
// re-lift all of it together or not at all.
//
// ⚠️ Alphabetical, which is NOT the order anyone reads. The results filter sorts
// each group by partner count, most first — the source page's own order — and
// falls back to this one for the ties. So what this order actually decides is
// how the long tail of countries at 0 is read, and alphabetical is the only
// answer to that. See `geoOptions` in `pages/ResultsPage.vue`.
//
// ⚠️ "United Arab Emirates", not the directory's "UAE". These strings are
// matched against a partner's own country, which is derived from the last comma
// field of its city ('Dubai, United Arab Emirates' — see `data/partners.js`),
// so the long form is the one that can match. A country here that matches no
// partner simply reads 0; that is most of them, since only 13 partners are
// seeded against a directory of 155.
export const REGIONS = [
  // "Asia", not the directory's "Asia Pacific", which is what this row now
  // covers country for country. The short form is the one the label set can
  // afford: it's read in a row of five where "Middle East" already sets the
  // width, and in a 160px filter trigger.
  {
    value: 'asia',
    label: 'Asia',
    count: 90,
    countries: [
      'Australia',
      'Bangladesh',
      'China',
      'India',
      'Indonesia',
      'Myanmar',
      'Pakistan',
      'Philippines',
      'Singapore',
      'Sri Lanka',
      'Thailand',
      'Vietnam',
    ],
  },
  {
    value: 'middle-east',
    label: 'Middle East',
    count: 32,
    countries: [
      'Bahrain',
      'Egypt',
      'Iraq',
      'Jordan',
      'Kuwait',
      'Libya',
      'Oman',
      'Qatar',
      'Saudi Arabia',
      'United Arab Emirates',
      'Yemen',
    ],
  },
  {
    value: 'africa',
    label: 'Africa',
    count: 14,
    countries: [
      'Congo - Kinshasa',
      'Ghana',
      'Kenya',
      'Mauritius',
      'Nigeria',
      'South Africa',
      'Tanzania',
      'Uganda',
    ],
  },
  {
    value: 'europe',
    label: 'Europe',
    count: 11,
    countries: [
      'France',
      'Germany',
      'Italy',
      'Malta',
      'Netherlands',
      'Spain',
      'Switzerland',
      'United Kingdom',
    ],
  },
  { value: 'americas', label: 'Americas', count: 9, countries: ['Canada', 'United States'] },
]

// Label only — the two options carried a sublabel each ("Fixed-scope starter
// packs, predictable cost, live in weeks" / "Scoped with the partner around your
// processes and integrations"). They explained the difference at the point of
// choice, but they also made the last question twice the height of the first
// two. Bring them back as a `description` on `Radio` if the distinction turns
// out not to land.
export const IMPLEMENTATION_TYPES = [
  // `short` is for the results filter, where the control is 160px wide and the
  // full label would truncate to "Standard implementat…". The quiz asks the
  // question with room to spare, so it uses `label`.
  { value: 'standard', label: 'Standard implementation for small businesses', short: 'Standard' },
  { value: 'custom', label: 'Customized implementation', short: 'Customized' },
]

// The chips the quiz asks "Where is your company based?" with — the one control
// that asks the geo dimension at BOTH of its granularities.
//
// India leads, and as a COUNTRY rather than a region: 71 of Asia's 90 partners
// are there, the wireframe asked for it by name, and it's the answer most
// visitors reach for first. The results filter says the same thing a different
// way, as the first country row inside Asia — and both can be true at once
// because region and country are one dimension held in two store fields. This
// chip flips `filters.countries`; the other five flip `answers.region`.
//
// ⚠️ India's 71 sits INSIDE Asia's 90, so these counts deliberately don't sum
// to the network's size the way the region counts do. Picking Asia is a
// superset of picking India and the numbers have to admit it. `MAP_REGIONS`
// below still totals 156, because it reads REGIONS — where India is a country
// and not a row of its own.
export const GEO_CHOICES = [
  { label: 'India', count: 71, country: 'India' },
  ...REGIONS.map((r) => ({ label: r.label, count: r.count, region: r.value })),
]

// The map's stat row reads from the same numbers as the region chips, so the two
// can't drift. Totals 156, which is the directory's "155+ Partners" — India is
// not a row here, so nothing is counted twice.
export const MAP_REGIONS = REGIONS.map((r) => ({ label: r.label, count: r.count }))

// Partner hub cities, plotted on the dotted world map. Real lat/lng, projected
// by `DottedWorldMap` with Frappe Cloud's own Mercator constants.
//
// Both halves of the geo dimension are tagged: `region` keys back into REGIONS
// above, `country` into that region's own country list — spelt exactly as it is
// there, since these strings are matched against the same answer. A hub lights
// up when either is answered, which is what lets the quiz's India chip light
// the five Indian hubs without India being a region.
export const HUB_CITIES = [
  { id: 'mumbai', region: 'asia', country: 'India', lat: 19.08, lng: 72.88 },
  { id: 'bengaluru', region: 'asia', country: 'India', lat: 12.97, lng: 77.59 },
  { id: 'delhi', region: 'asia', country: 'India', lat: 28.61, lng: 77.21 },
  { id: 'ahmedabad', region: 'asia', country: 'India', lat: 23.02, lng: 72.57 },
  { id: 'chennai', region: 'asia', country: 'India', lat: 13.08, lng: 80.27 },
  { id: 'singapore', region: 'asia', country: 'Singapore', lat: 1.35, lng: 103.82 },
  { id: 'jakarta', region: 'asia', country: 'Indonesia', lat: -6.2, lng: 106.85 },
  { id: 'manila', region: 'asia', country: 'Philippines', lat: 14.6, lng: 120.98 },
  { id: 'sydney', region: 'asia', country: 'Australia', lat: -33.87, lng: 151.21 },
  { id: 'karachi', region: 'asia', country: 'Pakistan', lat: 24.86, lng: 67.01 },

  { id: 'riyadh', region: 'middle-east', country: 'Saudi Arabia', lat: 24.71, lng: 46.68 },
  { id: 'dubai', region: 'middle-east', country: 'United Arab Emirates', lat: 25.2, lng: 55.27 },
  { id: 'cairo', region: 'middle-east', country: 'Egypt', lat: 30.04, lng: 31.24 },
  { id: 'doha', region: 'middle-east', country: 'Qatar', lat: 25.29, lng: 51.53 },

  { id: 'nairobi', region: 'africa', country: 'Kenya', lat: -1.29, lng: 36.82 },
  { id: 'dar-es-salaam', region: 'africa', country: 'Tanzania', lat: -6.79, lng: 39.21 },
  { id: 'lagos', region: 'africa', country: 'Nigeria', lat: 6.52, lng: 3.38 },
  { id: 'johannesburg', region: 'africa', country: 'South Africa', lat: -26.2, lng: 28.05 },

  { id: 'munich', region: 'europe', country: 'Germany', lat: 48.14, lng: 11.58 },
  { id: 'paris', region: 'europe', country: 'France', lat: 48.86, lng: 2.35 },
  { id: 'milan', region: 'europe', country: 'Italy', lat: 45.46, lng: 9.19 },
  { id: 'madrid', region: 'europe', country: 'Spain', lat: 40.42, lng: -3.7 },
  { id: 'amsterdam', region: 'europe', country: 'Netherlands', lat: 52.37, lng: 4.9 },

  { id: 'chicago', region: 'americas', country: 'United States', lat: 41.88, lng: -87.63 },
  { id: 'new-york', region: 'americas', country: 'United States', lat: 40.71, lng: -74.0 },
  { id: 'san-francisco', region: 'americas', country: 'United States', lat: 37.77, lng: -122.42 },
  { id: 'toronto', region: 'americas', country: 'Canada', lat: 43.65, lng: -79.38 },
]

// Segment → group lookup, so the results filter can ask "does this partner's
// industry sit inside the answered group?" without duplicating the table.
export const GROUP_OF_SEGMENT = Object.fromEntries(
  INDUSTRIES.flatMap((g) => g.segments.map((s) => [s, g.value])),
)
