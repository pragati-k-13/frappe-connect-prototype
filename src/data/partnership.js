// The partner's standing with Frappe: tier, criteria, audits, contributions.
// What Partnership and Contributions read. See PARTNER-VIEW-PLAN.md §1.
//
// ⚠️ TWO FIRMS, ONE PER DEMO TIER. Bronze-and-up is Software@Work, the firm
// the Messages seed already belongs to, shown at Silver so there is a next tier
// to work toward (Gold has none). Beginner is an INVENTED firm: putting a real,
// listed partner at Beginner would claim something false about them.
//
// ⚠️ Every figure below is invented: MRR, invoices, audits, dates, the partner
// managers. The tier thresholds are frappe.io/partners/plans as of this branch,
// and the Beginner milestones are the list Frappe's partner team circulated.
// Both are expected to change (open question 13), which is why they live here
// and nowhere else.

// ── The rubric ──────────────────────────────────────────────────────────────
// `mrr` is in INR, the currency the seeded firms are judged in. Beginner has
// no floor of its own: it is everyone below Bronze.
export const TIERS = {
  beginner: { key: 'beginner', label: 'Beginner', listing: 'Not listed in the directory yet' },
  bronze: {
    key: 'bronze',
    label: 'Bronze',
    mrr: 63_000,
    consultants: 2,
    pmm: 3,
    discount: 15,
    leadDays: 30,
    listing: 'Full profile in the directory',
  },
  silver: {
    key: 'silver',
    label: 'Silver',
    mrr: 2_50_000,
    consultants: 3,
    pmm: 4,
    discount: 20,
    leadDays: 60,
    listing: 'Full profile in the directory',
  },
  gold: {
    key: 'gold',
    label: 'Gold',
    mrr: 6_30_000,
    consultants: 4,
    pmm: 5,
    discount: 25,
    leadDays: 60,
    listing: 'Full profile, top of the directory',
  },
}

const NEXT = { beginner: 'bronze', bronze: 'silver', silver: 'gold', gold: null }
export const nextTier = (key) => (NEXT[key] ? TIERS[NEXT[key]] : null)

// ── Money and dates ─────────────────────────────────────────────────────────
const fmt = {
  INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
}
export const money = (amount, currency = 'INR') => fmt[currency].format(amount)

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const dayYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const shortDate = (iso) => day.format(new Date(iso))
export const longDate = (iso) => dayYear.format(new Date(iso))

// The demo's "today". Fixed, so start-by dates read the same on every run.
export const TODAY = '2026-10-30'
export const addDays = (iso, n) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ── Partner managers ────────────────────────────────────────────────────────
// Invented people at Frappe. `.example` addresses can't reach a real inbox.
// There's no rule for who handles what, so they carry no topic.
const MANAGERS = [
  { name: 'Aditi Rao', email: 'aditi.rao@frappe.example' },
  { name: 'Karan Mehta', email: 'karan.mehta@frappe.example' },
]

// ── The two firms ───────────────────────────────────────────────────────────
const FIRMS = {
  beginner: {
    name: 'Lumen Digital',
    person: 'Sana Malik',
    code: 'Lm7QpR2xTa',
    currency: 'USD',
  },
  'bronze-up': {
    partnerId: 'software-work',
    name: 'Software@Work',
    person: 'Farhan Qureshi',
    code: 'EyZnHMkVq1',
    currency: 'INR',
  },
}
export const firmFor = (tier) => FIRMS[tier] ?? FIRMS['bronze-up']

// Beginner to Bronze. `done` is the date it was reached; the first undone one
// is the next step. USD, because that is how Frappe states them.
const BEGINNER = {
  tier: 'beginner',
  consultants: 1,
  milestones: [
    { key: 'cert-1', label: '1st certification', done: '2026-08-12', to: 'team' },
    { key: 'cert-2', label: '2nd certification', todo: '1 more certification', to: 'team' },
    { key: 'mrr-100', label: '$100 MRR', done: '2026-09-03', to: 'contributions' },
    { key: 'mrr-300', label: '$300 MRR', todo: '$136 more MRR', to: 'contributions' },
    {
      key: 'bronze',
      label: 'Bronze criteria',
      todo: 'A PMM 3 audit and the rest of Bronze',
    },
  ],
  audits: [],
}

// Silver, working toward Gold. The demo's Partnership state picks one of these
// on top. Each state changes only the facts that make it that state.
const SILVER = {
  tier: 'silver',
  consultants: 5,
  pmm: 4,
  audit: { status: 'none' },
  audits: [
    { date: '2026-03-14', auditor: 'Aditi Rao', pmm: 4, tier: 'Silver' },
    { date: '2024-11-02', auditor: 'Karan Mehta', pmm: 3, tier: 'Bronze' },
  ],
}

// `scale` grows every invoice, so Contributions still adds up to the MRR
// Partnership shows: the two figures are never seeded separately.
const STATES = {
  working: {},
  ready: { scale: 1.3 },
  requested: { scale: 1.3, audit: { status: 'requested', requested: TODAY } },
  scheduled: {
    scale: 1.3,
    audit: { status: 'scheduled', date: '2026-12-18', auditor: 'Aditi Rao' },
  },
  'at-risk': {
    consultants: 2,
    risk: {
      criterion: 'Certified consultants',
      tier: 'Silver',
      detail: '2 of the 3 Silver needs, since a certificate expired on 12 Oct',
      fixBy: '2026-12-11',
      review: '2026-12-31',
    },
  },
}

export const PARTNERSHIP_STATES = [
  { key: 'working', label: 'Working toward Gold' },
  { key: 'ready', label: 'Ready for an audit' },
  { key: 'scheduled', label: 'Audit scheduled' },
  { key: 'at-risk', label: 'At risk' },
]

// MRR is the sum of the month's contributions, so the two pages can't disagree.
const total = (rows) => rows.reduce((sum, r) => sum + r.converted, 0)

export const standingFor = (tier, state = 'working') => {
  const firm = firmFor(tier)
  const base = tier === 'beginner' ? BEGINNER : { ...SILVER, ...(STATES[state] ?? {}) }
  const mrr = {
    current: total(contributionsFor(tier, '2026-10', state)),
    lastMonth: total(contributionsFor(tier, '2026-09', state)),
    currency: firm.currency,
    updated: '2 hours ago',
  }
  return { ...base, mrr, firm, managers: MANAGERS }
}

// ── Contributions ───────────────────────────────────────────────────────────
// Every Frappe Cloud invoice behind MRR, by month. `amount` is in the
// invoice's own currency; `rate` is INR per USD on the invoice date, so the
// conversion is visible rather than a fixed figure. `own` is the partner's
// own Frappe Cloud account, which bills too.
// Customers are the invented clients from `assets/clients`.
const MONTHS = [
  { key: '2026-10', label: 'October 2026', open: true },
  { key: '2026-09', label: 'September 2026' },
  { key: '2026-08', label: 'August 2026' },
]
export const contributionMonths = () => MONTHS

const SITES = {
  Northwind: [['northwind.frappe.cloud', 'Business'], ['northwind-uat.frappe.cloud', 'Starter']],
  Meridian: [['meridian.frappe.cloud', 'Business']],
  Halcyon: [['halcyon-erp.frappe.cloud', 'Business'], ['Dedicated server, Mumbai', 'n2-standard-4']],
  Silverpine: [['silverpine.frappe.cloud', 'Business']],
  Bluecrest: [['bluecrest.frappe.cloud', 'Starter']],
  Tessellate: [['tessellate.frappe.cloud', 'Business'], ['tessellate-hr.frappe.cloud', 'Starter']],
  Orenda: [['orenda.frappe.cloud', 'Business']],
  Vantage: [['vantage-ops.frappe.cloud', 'Business']],
  'Software@Work': [['softwarework.frappe.cloud', 'Starter']],
  Aurelia: [['aurelia.frappe.cloud', 'Starter']],
  Kestrel: [['kestrel.frappe.cloud', 'Business']],
}

// [customer, INR amount or USD amount, currency, own]
const SILVER_INVOICES = {
  '2026-10': [
    ['Halcyon', 1_42_400, 'INR'],
    ['Northwind', 96_350, 'INR'],
    ['Vantage', 980, 'USD'],
    ['Tessellate', 61_200, 'INR'],
    ['Meridian', 38_900, 'INR'],
    ['Orenda', 520, 'USD'],
    ['Silverpine', 24_480, 'INR'],
    ['Bluecrest', 6_900, 'INR'],
    ['Software@Work', 8_260, 'INR', true],
  ],
  '2026-09': [
    ['Halcyon', 1_48_100, 'INR'],
    ['Northwind', 1_02_760, 'INR'],
    ['Vantage', 1_040, 'USD'],
    ['Tessellate', 63_880, 'INR'],
    ['Meridian', 41_200, 'INR'],
    ['Orenda', 560, 'USD'],
    ['Silverpine', 26_150, 'INR'],
    ['Bluecrest', 7_340, 'INR', false, 'unpaid'],
    ['Software@Work', 8_260, 'INR', true],
  ],
  '2026-08': [
    ['Halcyon', 1_39_900, 'INR'],
    ['Northwind', 99_420, 'INR'],
    ['Vantage', 1_010, 'USD'],
    ['Tessellate', 58_700, 'INR'],
    ['Meridian', 39_600, 'INR'],
    ['Orenda', 540, 'USD'],
    ['Silverpine', 25_300, 'INR'],
    ['Software@Work', 8_260, 'INR', true],
  ],
}

const BEGINNER_INVOICES = {
  '2026-10': [
    ['Aurelia', 96, 'USD'],
    ['Kestrel', 44, 'USD'],
    ['Lumen Digital', 24, 'USD', true],
  ],
  '2026-09': [
    ['Aurelia', 88, 'USD'],
    ['Lumen Digital', 24, 'USD', true],
  ],
  '2026-08': [['Lumen Digital', 24, 'USD', true]],
}

const RATE = { '2026-10': 84.1, '2026-09': 83.6, '2026-08': 83.4 }
const LAST_DAY = { '2026-10': '2026-10-31', '2026-09': '2026-09-30', '2026-08': '2026-08-31' }

export const contributionsFor = (tier, monthKey, state = 'working') => {
  const firm = firmFor(tier)
  const scale = tier === 'beginner' ? 1 : (STATES[state]?.scale ?? 1)
  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS[0]
  const table = tier === 'beginner' ? BEGINNER_INVOICES : SILVER_INVOICES
  return (table[month.key] ?? []).map(([customer, raw, currency, own = false, status], i) => {
    const amount = Math.round(raw * scale)
    const sites = SITES[customer] ?? SITES[firm.name] ?? [[`${customer.toLowerCase()}.frappe.cloud`, 'Starter']]
    const split = sites.map(([name, plan], j) => ({
      name,
      plan,
      amount: j === sites.length - 1 ? amount - Math.round((amount * 0.3) * (sites.length - 1)) : Math.round(amount * 0.3),
    }))
    const converted =
      currency === firm.currency
        ? amount
        : firm.currency === 'INR'
          ? Math.round(amount * RATE[month.key])
          : Math.round(amount / RATE[month.key])
    return {
      id: `${month.key}-${i}`,
      customer,
      own,
      invoice: `INV-${month.key.slice(2).replace('-', '')}${String(410 + i * 37).padStart(4, '0')}`,
      amount,
      currency,
      converted,
      rate: currency === firm.currency ? null : RATE[month.key],
      date: LAST_DAY[month.key],
      status: month.open ? 'accruing' : (status ?? 'paid'),
      sites: split,
    }
  })
}
