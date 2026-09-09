// The country a business operates from — the one question the signup screen
// asks that isn't about the person.
//
// ⚠️ A SUBSET, deliberately. Production reads the full ISO 3166 list and
// pre-selects from the request's IP. This list is long enough to exercise the
// control and to cover every region the directory knows, and short enough to
// read in review.
//
// `region` is the whole reason the question exists. Country is what a person
// can answer; region is what the app actually uses — it prices the packs
// (`REGION_PRICING` in `data/packs.js`) and it's one of the two dimensions
// partners are matched on (`answers.region` in the store). Nothing downstream
// knows what a country is, so signup writes the region and the country is only
// ever the input to it.
//
// ⚠️ The region taxonomy (`REGIONS` in `data/quiz.js`) has six values and no
// Oceania, so Australia and New Zealand are filed under `asia` — which the
// directory used to call "Asia Pacific". If those become real markets the
// taxonomy needs a seventh row, not a wider reading of this one.
export const COUNTRIES = [
  { label: 'India', value: 'IN', region: 'india' },

  { label: 'Australia', value: 'AU', region: 'asia' },
  { label: 'Bangladesh', value: 'BD', region: 'asia' },
  { label: 'China', value: 'CN', region: 'asia' },
  { label: 'Indonesia', value: 'ID', region: 'asia' },
  { label: 'Japan', value: 'JP', region: 'asia' },
  { label: 'Malaysia', value: 'MY', region: 'asia' },
  { label: 'Nepal', value: 'NP', region: 'asia' },
  { label: 'New Zealand', value: 'NZ', region: 'asia' },
  { label: 'Pakistan', value: 'PK', region: 'asia' },
  { label: 'Philippines', value: 'PH', region: 'asia' },
  { label: 'Singapore', value: 'SG', region: 'asia' },
  { label: 'South Korea', value: 'KR', region: 'asia' },
  { label: 'Sri Lanka', value: 'LK', region: 'asia' },
  { label: 'Thailand', value: 'TH', region: 'asia' },
  { label: 'Vietnam', value: 'VN', region: 'asia' },

  { label: 'Bahrain', value: 'BH', region: 'middle-east' },
  { label: 'Israel', value: 'IL', region: 'middle-east' },
  { label: 'Jordan', value: 'JO', region: 'middle-east' },
  { label: 'Kuwait', value: 'KW', region: 'middle-east' },
  { label: 'Lebanon', value: 'LB', region: 'middle-east' },
  { label: 'Oman', value: 'OM', region: 'middle-east' },
  { label: 'Qatar', value: 'QA', region: 'middle-east' },
  { label: 'Saudi Arabia', value: 'SA', region: 'middle-east' },
  { label: 'Turkey', value: 'TR', region: 'middle-east' },
  { label: 'United Arab Emirates', value: 'AE', region: 'middle-east' },

  { label: 'Egypt', value: 'EG', region: 'africa' },
  { label: 'Ethiopia', value: 'ET', region: 'africa' },
  { label: 'Ghana', value: 'GH', region: 'africa' },
  { label: 'Kenya', value: 'KE', region: 'africa' },
  { label: 'Morocco', value: 'MA', region: 'africa' },
  { label: 'Nigeria', value: 'NG', region: 'africa' },
  { label: 'Rwanda', value: 'RW', region: 'africa' },
  { label: 'South Africa', value: 'ZA', region: 'africa' },
  { label: 'Tanzania', value: 'TZ', region: 'africa' },
  { label: 'Uganda', value: 'UG', region: 'africa' },

  { label: 'Belgium', value: 'BE', region: 'europe' },
  { label: 'Denmark', value: 'DK', region: 'europe' },
  { label: 'France', value: 'FR', region: 'europe' },
  { label: 'Germany', value: 'DE', region: 'europe' },
  { label: 'Ireland', value: 'IE', region: 'europe' },
  { label: 'Italy', value: 'IT', region: 'europe' },
  { label: 'Netherlands', value: 'NL', region: 'europe' },
  { label: 'Norway', value: 'NO', region: 'europe' },
  { label: 'Poland', value: 'PL', region: 'europe' },
  { label: 'Portugal', value: 'PT', region: 'europe' },
  { label: 'Spain', value: 'ES', region: 'europe' },
  { label: 'Sweden', value: 'SE', region: 'europe' },
  { label: 'Switzerland', value: 'CH', region: 'europe' },
  { label: 'United Kingdom', value: 'GB', region: 'europe' },

  { label: 'Argentina', value: 'AR', region: 'americas' },
  { label: 'Brazil', value: 'BR', region: 'americas' },
  { label: 'Canada', value: 'CA', region: 'americas' },
  { label: 'Chile', value: 'CL', region: 'americas' },
  { label: 'Colombia', value: 'CO', region: 'americas' },
  { label: 'Mexico', value: 'MX', region: 'americas' },
  { label: 'Peru', value: 'PE', region: 'americas' },
  { label: 'United States', value: 'US', region: 'americas' },
]

// ⚠️ Stands in for GeoIP, the same way `inferredRegion` does in the store. A
// real build resolves this server-side on first paint; hardcoding the common
// case is what makes the interaction (an answer already filled in, which you
// can change) reviewable at all.
export const INFERRED_COUNTRY = 'IN'

// The menu's own order: India, then everything else alphabetically. The list
// above is grouped by region because that's how it's maintained and reviewed;
// nobody looks for a country by continent in a dropdown.
//
// India leads rather than sitting under I because it's the pre-selected answer
// and the only market whose pricing is real — a reader who opens the menu
// should find the current value at the top, not two thirds of the way down.
export const COUNTRY_OPTIONS = [
  ...COUNTRIES.filter((c) => c.value === INFERRED_COUNTRY),
  ...COUNTRIES.filter((c) => c.value !== INFERRED_COUNTRY).sort((a, b) =>
    a.label.localeCompare(b.label),
  ),
].map(({ label, value }) => ({ label, value }))

export const regionForCountry = (code) => COUNTRIES.find((c) => c.value === code)?.region ?? null
