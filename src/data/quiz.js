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

// Real partner counts. India is split out of Asia Pacific because it is 71 of
// that region's 90 — the wireframe made the same call by eye, and the real
// numbers back it up. Africa is a chip here (the wireframe left it to the map)
// because at 14 partners it outranks Europe; hiding it would be arbitrary.
export const REGIONS = [
  { value: 'india', label: 'India', count: 71 },
  // "Asia", not the directory's "Asia Pacific": with India split out above, the
  // long form promises a breadth this row no longer covers, and it was the
  // widest label in a set that has to line up.
  { value: 'asia', label: 'Asia', count: 19 },
  { value: 'middle-east', label: 'Middle East', count: 32 },
  { value: 'africa', label: 'Africa', count: 14 },
  { value: 'europe', label: 'Europe', count: 11 },
  { value: 'americas', label: 'Americas', count: 9 },
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

// The map's stat row reads from the same numbers as the chips, so the two can't
// drift. Totals 156, which is the directory's "155+ Partners".
export const MAP_REGIONS = REGIONS.map((r) => ({ label: r.label, count: r.count }))

// Partner hub cities, plotted on the dotted world map. Real lat/lng, projected
// by `DottedWorldMap` with Frappe Cloud's own Mercator constants — `region`
// keys back into REGIONS above so a hub lights up when its region is answered.
export const HUB_CITIES = [
  { id: 'mumbai', region: 'india', lat: 19.08, lng: 72.88 },
  { id: 'bengaluru', region: 'india', lat: 12.97, lng: 77.59 },
  { id: 'delhi', region: 'india', lat: 28.61, lng: 77.21 },
  { id: 'ahmedabad', region: 'india', lat: 23.02, lng: 72.57 },
  { id: 'chennai', region: 'india', lat: 13.08, lng: 80.27 },

  { id: 'singapore', region: 'asia', lat: 1.35, lng: 103.82 },
  { id: 'jakarta', region: 'asia', lat: -6.2, lng: 106.85 },
  { id: 'manila', region: 'asia', lat: 14.6, lng: 120.98 },
  { id: 'sydney', region: 'asia', lat: -33.87, lng: 151.21 },
  { id: 'karachi', region: 'asia', lat: 24.86, lng: 67.01 },

  { id: 'riyadh', region: 'middle-east', lat: 24.71, lng: 46.68 },
  { id: 'dubai', region: 'middle-east', lat: 25.2, lng: 55.27 },
  { id: 'cairo', region: 'middle-east', lat: 30.04, lng: 31.24 },
  { id: 'doha', region: 'middle-east', lat: 25.29, lng: 51.53 },

  { id: 'nairobi', region: 'africa', lat: -1.29, lng: 36.82 },
  { id: 'dar-es-salaam', region: 'africa', lat: -6.79, lng: 39.21 },
  { id: 'lagos', region: 'africa', lat: 6.52, lng: 3.38 },
  { id: 'johannesburg', region: 'africa', lat: -26.2, lng: 28.05 },

  { id: 'munich', region: 'europe', lat: 48.14, lng: 11.58 },
  { id: 'paris', region: 'europe', lat: 48.86, lng: 2.35 },
  { id: 'milan', region: 'europe', lat: 45.46, lng: 9.19 },
  { id: 'madrid', region: 'europe', lat: 40.42, lng: -3.7 },
  { id: 'amsterdam', region: 'europe', lat: 52.37, lng: 4.9 },

  { id: 'chicago', region: 'americas', lat: 41.88, lng: -87.63 },
  { id: 'new-york', region: 'americas', lat: 40.71, lng: -74.0 },
  { id: 'san-francisco', region: 'americas', lat: 37.77, lng: -122.42 },
  { id: 'toronto', region: 'americas', lat: 43.65, lng: -79.38 },
]

// Segment → group lookup, so the results filter can ask "does this partner's
// industry sit inside the answered group?" without duplicating the table.
export const GROUP_OF_SEGMENT = Object.fromEntries(
  INDUSTRIES.flatMap((g) => g.segments.map((s) => [s, g.value])),
)
