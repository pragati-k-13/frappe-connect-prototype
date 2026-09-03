// Seed partners for the mock. Shapes here are the contract the results list
// renders against — a real implementation would fill these from the Partner
// doctype.
//
// Names, countries and logos are REAL, lifted from
// `frappe.io/partners/list?country=…`. The app list and the industry segments
// are the directory's own vocabularies (`window.page_data` on the same page).
//
// Which partner does which industry or app is INVENTED, as are rates, ratings,
// review counts, response times, story counts and packs — the public directory
// doesn't publish any of it. Don't quote these numbers.
//
// `initials` and `color` are the fallback avatar for a partner with no logo
// file. Every partner here has one, so they're currently unused — see
// `data/logos.js`.

// The directory's real app list. No counts: the directory doesn't publish them
// and inventing them next to real app names would read as fact.
export const APPS = [
  { value: 'erpnext', label: 'ERPNext' },
  { value: 'frappe-hr', label: 'Frappe HR' },
  { value: 'crm', label: 'CRM' },
  { value: 'helpdesk', label: 'Helpdesk' },
  { value: 'insights', label: 'Insights' },
  { value: 'drive', label: 'Drive' },
  { value: 'learning', label: 'Learning' },
  { value: 'education', label: 'Education' },
  { value: 'school', label: 'School' },
  { value: 'lending', label: 'Lending' },
  { value: 'framework', label: 'Framework' },
]

// ⚠️ Costs are invented, and they were repriced once. They used to be rupee
// strings — ₹80,000 for the 40-hour pack — which works out at ₹2,000/hr, about
// $24. Partner rates are $60–140/hr, so the estimator would have quoted three
// to six times the pack price for identical hours, in the same section of the
// same page. ₹80,000 for 40 hours of consulting isn't plausible in any
// currency; the symbol was never the problem.
//
// They're now each `hours × $70`, a benchmark below every partner's rate, so a
// pack reads as the discounted fixed-scope product it is: Tridots Tech at $85
// estimates $3,400 bespoke against the $2,800 pack for the same 40 hours.
// `hours` is the number both surfaces derive from, so they can't drift.
export const STARTER_PACKS = [
  {
    value: 'core-erpnext',
    name: 'Core ERPNext',
    modules: 'Finance + Sales + Purchase + Inventory',
    hours: 40,
    validity: '30 days',
    cost: '$2,800',
  },
  {
    value: 'manufacturing',
    name: 'Manufacturing',
    modules: 'Core ERPNext + Manufacturing',
    hours: 70,
    validity: '60 days',
    cost: '$4,900',
  },
  {
    value: 'all-in-one',
    name: 'All in one',
    modules: 'Core ERPNext + Manufacturing + Frappe HR',
    hours: 100,
    validity: '90 days',
    cost: '$7,000',
  },
  {
    value: 'frappe-hr',
    name: 'Frappe HR',
    modules: 'Frappe HR',
    hours: 30,
    validity: '30 days',
    cost: '$2,100',
  },
]

// `tier` is 'gold' | 'silver' | 'bronze' — the three levels of the partner
// programme, drawn from Frappe's own partner badge set. Gold renders as a
// labelled badge, the other two as the seal alone. See `components/TierIcon.vue`.
//
// `industries` holds real segment names from `quiz.js`; the results filter maps
// them up to their group via GROUP_OF_SEGMENT rather than string-matching.
//
// `id` is also the logo filename — drop `<id>.<ext>` into `assets/partners/`.
//
// `tagline` is the one-line positioning statement under the name on the profile
// page. Tridots Tech's is the real line from the design file; the rest are
// written here as neutral placeholders — no founding dates, no superlatives, no
// claims that could read as fact about a real company. Optional: the profile
// header falls back to a factual line built from `city` and `stories`.
// The id every partner is keyed by, derived from the name rather than stored.
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// Partner Maturity Model level, shown in the profile's About column. Invented,
// and derived from tier rather than stored per partner so the two can't
// contradict each other — a bronze partner at PMM 5 would just look like a bug.
const PMM_BY_TIER = { gold: 5, silver: 3, bronze: 2 }

// The "Partner vision" section: a leadership quote, then the same three
// questions every partner in the directory answers, with their answers and
// working-style tags.
//
// ⚠️⚠️ EVERY WORD BELOW IS INVENTED, and it is by far the most fabricated data
// in this mock — a mission statement put in the mouth of a real, named company.
// Nobody at these firms said any of it. It exists so the section's shape can be
// reviewed: quote length, how the two-line headings wrap, how many tags fit on
// a row. Replace wholesale with the partners' own words before this is shown to
// anyone outside the team.
//
// ⚠️ The `author` names are invented too, and they are the one field here that
// could be mistaken for fact: they read as a statement about who runs a real
// company. Only Tridots Tech's is real, and only because it came out of the
// design file. Each of the others is a plausible-for-the-region placeholder
// and none of them is a person — if any happens to collide with a real name at
// that firm, that is coincidence, not research. `visionFor()` still falls back
// to attributing the quote to the company if an entry has no author at all.
//
// A tag is a string, or `{ label, hint }` when it needs the info icon.
const VISION = {
  'tridots-tech': {
    author: { name: 'Rajarajan Anbalagan', role: 'CEO & Founder' },
    quote:
      'I believe technology should serve business goals, not complicate them. My leadership philosophy combines clear strategy with disciplined execution, ensuring every initiative delivers measurable value.',
    why: 'We aim for excellence in every line of code, every UI interaction, and every customer conversation. We focus on implementations for mid-sized manufacturing and distribution businesses. Our core strength is migrating companies off spreadsheets and legacy systems onto modern software, with deep experience in inventory, operations, and multi-location workflows. We also handle custom app development and third-party integrations (accounting, e-commerce, logistics) for teams with deeper needs.',
    together: {
      text: 'Transparency, honesty, and trust form the core of our work ethic. We believe in doing the right thing even when no one is watching. We have dedicated teams working with you to ensure quality, focus, and accountability.',
      tags: [
        'Team syncs',
        'Remote team syncs',
        // ⚠️ Hint copy is a guess. "Offline" reads as in-person here, but the
        // design shows the icon without its tooltip.
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Async updates',
      ],
    },
    success: {
      text: 'Good is never enough. With 15+ years of experience, we understand that implementation doesn’t end at handoff, but is built via on-ground involvement through strategy, setup, and execution, with visible results in 6–8 months. We train your team so improvements stay in place long after we’ve left.',
      tags: ['Maintenance packages', 'Knowledge transfer'],
    },
  },

  'software-work': {
    author: { name: 'Anuja Deshmukh', role: 'Managing Director' },
    quote:
      'An ERP is a set of decisions about how a business runs, not a piece of software you install. We would rather spend a week arguing about a workflow than a year unpicking the wrong one.',
    why: 'We work with discrete manufacturers and trading businesses in and around Mumbai, usually at the point where a spreadsheet-and-Tally setup has stopped scaling. Payroll and people processes are where we go deepest — Frappe HR alongside ERPNext, one system rather than two that disagree.',
    together: {
      text: 'One project lead, named on day one, who stays with you to go-live. Weekly demos on your own data rather than a slide deck, so what you sign off on is what you will actually use.',
      tags: ['Dedicated project lead', 'Weekly demos', 'Shared backlog', 'Async updates'],
    },
    success: {
      text: 'Month-end closing without a spreadsheet in sight. We consider a rollout finished when your finance team stops asking us for help, not when the last ticket is closed.',
      tags: ['Admin training', 'Post-go-live support'],
    },
  },

  'new-indictrans': {
    author: { name: 'Shreyas Kulkarni', role: 'Director' },
    quote:
      'Public institutions and schools do not need the fastest software. They need software that still works in five years, with staff who can run it themselves.',
    why: 'Process manufacturing, education and government, largely in Maharashtra. Regulated environments and public procurement are slow and specific, and we have learnt to work inside them rather than around them.',
    together: {
      text: 'We plan around your academic or audit calendar, not ours. Documentation is written as we go, in the language your staff actually use.',
      tags: ['Team syncs', 'Documentation handover', 'Phased rollout'],
    },
    success: {
      text: 'Your own team running the system without us. We build in Frappe Learning courses for staff turnover, because in an institution the person we trained will eventually move on.',
      tags: ['Knowledge transfer', 'Admin training'],
    },
  },

  '8848-digital': {
    author: { name: 'Nikhil Ranade', role: 'Co-founder' },
    quote:
      'Manufacturing runs on the shop floor, not in a boardroom. If the operator will not use it, it does not matter how good the report looks.',
    why: 'Automotive and pharmaceutical manufacturing, where traceability is not optional. We spend the first fortnight of any project on the floor, watching how work actually moves before we configure anything.',
    together: {
      text: 'Short cycles with something working at the end of each one. Insights dashboards go up early, so you can see your own numbers while decisions are still open.',
      tags: ['Weekly demos', 'Shared backlog', 'Team syncs'],
    },
    success: {
      text: 'A plant manager who checks the system before walking the floor. Quality and batch traceability have to survive an audit, so we test them against your last one.',
      tags: ['Maintenance packages', 'Admin training', 'Knowledge transfer'],
    },
  },

  'greycube-technologies': {
    author: { name: 'Sanya Fernandes', role: 'Founder' },
    quote:
      'Small teams do not need the whole of ERPNext. They need the eight screens they will use every day, set up properly.',
    why: 'Trading, retail and e-commerce businesses, usually under fifty people. We are a small studio and we take on work at that size deliberately — it is where a careful setup makes the most difference.',
    together: {
      text: 'Direct access to the people doing the work, no account manager in between. Most questions are answered the same day.',
      tags: ['Single point of contact', 'Async updates'],
    },
    success: {
      text: 'Orders, stock and invoices in one place, and nobody reconciling marketplaces by hand at the weekend.',
      tags: ['Post-go-live support'],
    },
  },

  wahni: {
    author: { name: 'Vivek Menon', role: 'Chief Executive' },
    quote:
      'We would rather turn down a project than staff it badly. Everything we have built has come from work we were able to see through properly.',
    why: 'Food and beverage, retail, healthcare and education across Kerala and the Gulf. Multi-outlet businesses are our centre of gravity — kitchens, clinics and campuses that need one system across several sites.',
    together: {
      text: 'A named team per project, and a helpdesk your staff can reach directly rather than through us. Site visits during the first month.',
      tags: [
        'Team syncs',
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Remote team syncs',
        'Async updates',
      ],
    },
    success: {
      text: 'Every outlet closing its day the same way. We keep a support retainer open afterwards because multi-site businesses keep opening sites.',
      tags: ['Maintenance packages', 'Admin training'],
    },
  },

  hybrowlabs: {
    author: { name: 'Aditya Kale', role: 'Founder & CTO' },
    quote:
      'Most of what a growing company needs already exists in the Frappe framework. Our job is usually to build less, not more.',
    why: 'Software companies, e-commerce and professional services. We are framework-first: custom apps, integrations and portals on top of Frappe, for teams whose processes do not fit a standard ERP.',
    together: {
      text: 'Everything in a shared backlog you can read at any time. Async by default, because our clients are rarely in one timezone.',
      tags: ['Async updates', 'Shared backlog', 'Remote team syncs'],
    },
    success: {
      text: 'Code you could hand to another team without apology. We hand over the repository, the tests and the deployment, not just a login.',
      tags: ['Documentation handover', 'Knowledge transfer'],
    },
  },

  'finbyz-tech': {
    author: { name: 'Chirag Mehta', role: 'Managing Partner' },
    quote:
      'Finance teams are the ones who live with an ERP after everyone else has moved on. We design for them first.',
    why: 'Chemical manufacturing, trading, logistics and finance, out of Ahmedabad. Costing, import-export documentation and multi-currency are the parts other implementations tend to leave half-finished.',
    together: {
      text: 'Fortnightly reviews with your finance lead in the room. Insights reports are built alongside the rollout, not after it.',
      tags: ['Team syncs', 'Weekly demos', 'Async updates'],
    },
    success: {
      text: 'A closing you trust without a parallel spreadsheet. If the numbers are still being checked by hand, the project is not done.',
      tags: ['Maintenance packages', 'Admin training'],
    },
  },

  alyf: {
    author: { name: 'Jonas Weber', role: 'Managing Director' },
    quote:
      'German mid-sized companies are asked to choose between software that does not fit and software they cannot afford. Open source is the third option.',
    why: 'Discrete manufacturing, real estate and rental businesses in the DACH region. We know what German accounting, DATEV exports and works-council processes require, and we build for GDPR from the start rather than retrofitting it.',
    together: {
      text: 'Documentation and training in German; project management in English if your team prefers. Fixed-scope phases with a price per phase.',
      tags: ['Phased rollout', 'Team syncs', 'Documentation handover'],
    },
    success: {
      text: 'A system your Steuerberater signs off without comment, and a team that does not need us for day-to-day changes.',
      tags: ['Knowledge transfer', 'Post-go-live support'],
    },
  },

  'craft-interactive': {
    author: { name: 'Rania Haddad', role: 'Managing Director' },
    quote:
      'A business in the Gulf is rarely in one country. We plan for the second and third entity before you have opened them.',
    why: 'Trading, retail, construction and hospitality across the UAE and Saudi Arabia. VAT, e-invoicing and multi-entity consolidation are routine for us, and we work in Arabic and English throughout.',
    together: {
      text: 'A local team you can meet, and an on-site presence during go-live week. Weekly written updates so decisions are on the record.',
      tags: [
        'Team syncs',
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Weekly demos',
        'Async updates',
      ],
    },
    success: {
      text: 'Filing compliantly in every jurisdiction you operate in, from one system. We stay on retainer through your first full year of returns.',
      tags: ['Maintenance packages', 'Post-go-live support', 'Knowledge transfer'],
    },
  },

  'kingstech-services': {
    author: { name: 'Tan Wei Lin', role: 'Director' },
    quote:
      'A rollout across four countries is not four rollouts. Do it once, properly, and let each market configure what it genuinely needs.',
    why: 'Trading, e-commerce, logistics and professional services across Singapore and South-East Asia. Regional groups running one ERP over several jurisdictions are the work we take on most.',
    together: {
      text: 'One project lead in Singapore, delivery across timezones. Written decisions rather than meetings wherever a meeting is not required.',
      tags: ['Single point of contact', 'Async updates', 'Remote team syncs'],
    },
    success: {
      text: 'One chart of accounts, several tax regimes, and a group consolidation that does not need a spreadsheet.',
      tags: ['Documentation handover', 'Post-go-live support'],
    },
  },

  navari: {
    author: { name: 'Achieng Otieno', role: 'Managing Director' },
    quote:
      'Software built elsewhere assumes reliable power and reliable connectivity. We build for the conditions our clients actually work in.',
    why: 'Agriculture, trading, logistics and nonprofits across East Africa. Mobile money, offline-tolerant workflows and donor reporting are the parts that have to work before anything else does.',
    together: {
      text: 'Field visits, not just calls — a lot of what we implement is used by people away from a desk. Training in Swahili and English.',
      tags: [
        { label: 'Offline', hint: 'In person, at your site or ours, on request.' },
        'Team syncs',
        'Async updates',
      ],
    },
    success: {
      text: 'A cooperative or a programme office reporting on its own numbers, on time, without our help.',
      tags: ['Admin training', 'Knowledge transfer'],
    },
  },

  korecent: {
    author: { name: 'Marcus Reed', role: 'President' },
    quote:
      'In regulated manufacturing, an ERP is part of your quality system. We treat it that way from the first workshop.',
    why: 'Medical device manufacturing, healthcare and professional services in North America. Validation, traceability and audit trails are the reason clients come to us rather than the cheapest option.',
    together: {
      text: 'Structured phases with documented sign-off at each one, because that documentation is what an auditor will ask for.',
      tags: ['Phased rollout', 'Team syncs', 'Documentation handover'],
    },
    success: {
      text: 'Passing an audit on the system rather than in spite of it, and a quality team that can produce a trace in minutes.',
      tags: ['Maintenance packages', 'Knowledge transfer', 'Post-go-live support'],
    },
  },
}

// No invented people: a partner with no real named author has the quote
// attributed to the company itself. See the warning above.
const visionFor = (name) => {
  const v = VISION[slug(name)]
  if (!v) return null
  return { ...v, author: v.author ?? { name, role: 'Leadership team' } }
}

// Certified members, per certification. Frappe's programme certifies people on
// ERPNext and on the Framework, so a partner's entry is "how many of our team
// hold each" — two ERPNext certifications and one Framework, in the design's
// own example.
//
// ⚠️ The counts are invented, like `rate` and `rating`. Kept as an explicit
// per-partner table rather than derived from tier: the whole point of the row
// is that it varies partner to partner, and a formula would make every gold
// partner identical. Replace wholesale when the directory publishes them; a
// missing certification is simply left out rather than shown as zero.
const CERTIFIED_MEMBERS = {
  'tridots-tech': { erpnext: 2, framework: 1 },
  'software-work': { erpnext: 4, framework: 2 },
  'new-indictrans': { erpnext: 3, framework: 2 },
  '8848-digital': { erpnext: 5, framework: 1 },
  'greycube-technologies': { erpnext: 2, framework: 3 },
  wahni: { erpnext: 3, framework: 1 },
  hybrowlabs: { erpnext: 2, framework: 2 },
  'finbyz-tech': { erpnext: 4, framework: 1 },
  alyf: { erpnext: 2 },
  'craft-interactive': { erpnext: 3 },
  'kingstech-services': { erpnext: 1, framework: 1 },
  navari: { erpnext: 2 },
  korecent: { erpnext: 1 },
}

// ⚠️ Invented, and uniform by region. Real migration paths, but not sourced
// from any partner's own listing — Tally and SAP are simply the two ERPNext
// migrations that actually come up in India, QuickBooks the common one outside
// it. Replace per partner when the directory publishes them.
const MIGRATIONS_BY_REGION = {
  india: ['Tally to ERPNext', 'SAP to ERPNext'],
}
const DEFAULT_MIGRATIONS = ['QuickBooks to ERPNext', 'SAP to ERPNext']

const P = (
  name,
  {
    tier,
    city,
    region,
    initials,
    color,
    rate,
    rating,
    reviews,
    responds,
    stories,
    industries,
    apps,
    packs,
    // ⚠️ Every partner has one, and only Tridots Tech's is real (it came out
    // of the design file). The other twelve are invented straplines — the same
    // register a company writes about itself in, put in a real company's
    // mouth. They echo that partner's `VISION` copy so the profile reads
    // consistently, and they replace what used to be a generated
    // "city · N success stories" line, which said nothing the page didn't
    // already show twice.
    tagline = null,
    // ⚠️ Only set where the value came out of the design file. Inventing a
    // street address or an award for a real, named company asserts something
    // about a real business, so these stay empty and the profile falls back to
    // the city — same rule `tagline` already follows.
    address = null,
    accolades = [],
  },
) => ({
  id: slug(name),
  name,
  tagline,
  address,
  accolades,
  pmm: PMM_BY_TIER[tier] ?? 1,
  // Real: `city` is scraped, and the country is its last comma field.
  countries: [city.split(',').pop().trim()],
  // `[{ app, members }]`, highest count first, zeroes dropped.
  certifications: Object.entries(CERTIFIED_MEMBERS[slug(name)] ?? {})
    .filter(([, members]) => members > 0)
    .map(([app, members]) => ({ app, members }))
    .sort((a, b) => b.members - a.members),
  migrations: MIGRATIONS_BY_REGION[region] ?? DEFAULT_MIGRATIONS,
  vision: visionFor(name),
  tier,
  city,
  region,
  initials,
  color,
  rate,
  rating,
  reviews,
  responds,
  stories,
  industries,
  apps,
  packs,
})

export const PARTNERS = [
  P('Tridots Tech', {
    // The real line, taken from the design file.
    tagline: 'Empowering Businesses Through Thoughtful Technology Since 2006',
    // Both also straight from the design file, which is why this one partner
    // has them and the other twelve don't.
    address:
      'No. 100, Lake View Estate, Kundrathur Main Road, Porur, Chennai 600116, Tamil Nadu, India',
    accolades: [{ title: 'Partner of the Year', year: 2026 }],
    tier: 'gold',
    city: 'Chennai, India',
    region: 'india',
    initials: 'TT',
    color: '#3b82f6',
    rate: 85,
    rating: 4.5,
    reviews: 12,
    responds: '5h',
    stories: 6,
    // Seven, so the profile card's `+2` overflow state is reviewable — every
    // other partner sits at or under the five-chip cap. Invented, like every
    // partner's industry list.
    industries: [
      'Textile Manufacturing',
      'Retail',
      'Healthcare',
      'Education',
      'Logistics',
      'Automotive Manufacturing',
      'Chemical Manufacturing',
    ],
    apps: ['erpnext', 'helpdesk', 'crm'],
    packs: ['core-erpnext', 'manufacturing', 'all-in-one'],
  }),
  P('Software@Work', {
    tagline: 'Running payroll, plants and pipelines on one system since 2011',
    tier: 'gold',
    city: 'Mumbai, India',
    region: 'india',
    initials: 'SW',
    color: '#8b5cf6',
    rate: 85,
    rating: 4.4,
    reviews: 18,
    responds: '4h',
    stories: 9,
    industries: ['Discrete Manufacturing', 'Professional services', 'Goods Trading', 'Logistics'],
    apps: ['erpnext', 'frappe-hr', 'crm'],
    packs: ['core-erpnext', 'manufacturing', 'all-in-one'],
  }),
  P('New Indictrans', {
    tagline: 'Open source for institutions that keep records for decades',
    tier: 'silver',
    city: 'Pune, India',
    region: 'india',
    initials: 'NI',
    color: '#14b8a6',
    rate: 70,
    rating: 4.5,
    reviews: 12,
    responds: '5h',
    stories: 3,
    industries: ['Process Manufacturing', 'Education', 'Government'],
    apps: ['erpnext', 'helpdesk', 'learning'],
    packs: ['core-erpnext', 'frappe-hr'],
  }),
  P('8848 Digital', {
    tagline: 'Traceability from the shop floor up',
    tier: 'gold',
    city: 'Pune, India',
    region: 'india',
    initials: '88',
    color: '#f59e0b',
    rate: 90,
    rating: 4.6,
    reviews: 22,
    responds: '3h',
    stories: 8,
    industries: [
      'Automotive Manufacturing',
      'Pharmaceutical Manufacturing',
      'Discrete Manufacturing',
      'Retail',
    ],
    apps: ['erpnext', 'crm', 'frappe-hr', 'insights'],
    packs: ['core-erpnext', 'manufacturing', 'all-in-one'],
  }),
  P('Greycube Technologies', {
    tagline: 'A small studio setting up ERPNext properly for small teams',
    tier: 'bronze',
    city: 'Mumbai, India',
    region: 'india',
    initials: 'GC',
    color: '#64748b',
    rate: 75,
    rating: 4.3,
    reviews: 9,
    responds: '6h',
    stories: 0,
    industries: ['Goods Trading', 'E-commerce', 'Retail'],
    apps: ['erpnext', 'helpdesk'],
    packs: ['core-erpnext'],
  }),
  P('Wahni', {
    tagline: 'One system across every outlet, from Kerala to the Gulf',
    tier: 'gold',
    city: 'Kochi, India',
    region: 'india',
    initials: 'WA',
    color: '#00b4f5',
    rate: 65,
    rating: 4.6,
    reviews: 21,
    responds: '3h',
    stories: 5,
    industries: ['Food and Beverages', 'Retail', 'Healthcare', 'Education'],
    apps: ['erpnext', 'helpdesk', 'frappe-hr', 'school'],
    packs: ['core-erpnext', 'manufacturing', 'frappe-hr'],
  }),
  P('Hybrowlabs', {
    tagline: 'Building less on Frappe, so you maintain less',
    tier: 'silver',
    city: 'Pune, India',
    region: 'india',
    initials: 'HL',
    color: '#0ea5e9',
    rate: 60,
    rating: 4.2,
    reviews: 8,
    responds: '7h',
    stories: 2,
    industries: ['Software Development', 'E-commerce', 'Professional services'],
    apps: ['erpnext', 'crm', 'drive', 'framework'],
    packs: ['core-erpnext', 'frappe-hr'],
  }),
  P('Finbyz Tech', {
    tagline: 'Built for the finance team that lives in the ERP',
    tier: 'silver',
    city: 'Ahmedabad, India',
    region: 'india',
    initials: 'FB',
    color: '#22c55e',
    rate: 70,
    rating: 4.4,
    reviews: 15,
    responds: '5h',
    stories: 7,
    industries: ['Chemical Manufacturing', 'Goods Trading', 'Finance', 'Logistics'],
    apps: ['erpnext', 'frappe-hr', 'insights'],
    packs: ['core-erpnext', 'manufacturing'],
  }),
  P('ALYF', {
    tagline: 'Open source ERP for the German Mittelstand',
    tier: 'silver',
    city: 'Munich, Germany',
    region: 'europe',
    initials: 'AL',
    color: '#a855f7',
    rate: 130,
    rating: 4.7,
    reviews: 6,
    responds: '8h',
    stories: 1,
    industries: ['Discrete Manufacturing', 'Real Estate', 'Rental Business'],
    apps: ['erpnext', 'crm'],
    packs: ['core-erpnext', 'manufacturing'],
  }),
  P('Craft Interactive', {
    tagline: 'Multi-entity, multi-currency, across the Gulf since 2012',
    tier: 'gold',
    city: 'Dubai, United Arab Emirates',
    region: 'middle-east',
    initials: 'CI',
    color: '#ef4444',
    rate: 100,
    rating: 4.5,
    reviews: 14,
    responds: '4h',
    stories: 4,
    industries: [
      'Goods Trading',
      'Retail',
      'Engineering and Construction',
      'Hotels, Restaurants and Cafes',
    ],
    apps: ['erpnext', 'helpdesk', 'crm'],
    packs: ['core-erpnext', 'all-in-one'],
  }),
  P('Kingstech Services', {
    tagline: 'One rollout, several jurisdictions, out of Singapore',
    tier: 'bronze',
    city: 'Singapore',
    region: 'asia',
    initials: 'KS',
    color: '#ec4899',
    rate: 110,
    rating: 4.3,
    reviews: 11,
    responds: '5h',
    stories: 0,
    industries: ['Goods Trading', 'E-commerce', 'Logistics', 'Professional services'],
    apps: ['erpnext', 'helpdesk', 'crm'],
    packs: ['core-erpnext', 'all-in-one'],
  }),
  P('Navari', {
    tagline: 'Software built for the conditions East Africa actually works in',
    tier: 'bronze',
    city: 'Nairobi, Kenya',
    region: 'africa',
    initials: 'NV',
    color: '#f97316',
    rate: 80,
    rating: 4.5,
    reviews: 9,
    responds: '6h',
    stories: 2,
    industries: ['Agriculture', 'Goods Trading', 'Nonprofit', 'Logistics'],
    apps: ['erpnext', 'helpdesk', 'frappe-hr'],
    packs: ['core-erpnext'],
  }),
  P('Korecent', {
    tagline: 'ERP as part of your quality system, not beside it',
    tier: 'silver',
    city: 'Chicago, United States',
    region: 'americas',
    initials: 'KO',
    color: '#06b6d4',
    rate: 140,
    rating: 4.4,
    reviews: 7,
    responds: '6h',
    stories: 3,
    industries: ['Medical Device Manufacturing', 'Healthcare', 'Professional services'],
    apps: ['erpnext', 'frappe-hr', 'crm', 'insights'],
    packs: ['core-erpnext', 'frappe-hr'],
  }),
]

export const SUCCESS_STORIES = [
  {
    id: 'mcf',
    tag: 'Services',
    title: 'MCF manages 20,000 annual members, bookings & accounting with ERPNext',
    // Placeholder art: a two-stop gradient standing in for a photo, so the
    // mock stays asset-free. Swap for real imagery at build time.
    //
    // Grey, like the gallery placeholders — a saturated gradient reads as a
    // chosen brand treatment rather than a missing photo. The three differ by
    // value only, so the cards stay distinguishable without a palette.
    art: ['#d1d5db', '#8b919a'],
  },
  {
    id: 'mandpeshwar',
    tag: 'Services',
    title:
      'Mandpeshwar Civic Federation manages 20,000 annual members, bookings & accounting with ERPNext',
    art: ['#b6bcc4', '#6b7280'],
  },
  {
    id: 'sree-arka',
    tag: 'Services',
    title:
      'How ERPNext helped Sree Arka Greentech transform end-to-end Lead & Project Management systems',
    art: ['#c9ced5', '#5a606a'],
  },
]
