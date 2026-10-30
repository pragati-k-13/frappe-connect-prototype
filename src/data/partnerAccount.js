// The partner firm's own records: customers, link requests, Partner-pays
// billing, the team, and the CRM. What Customers, Billing, Team and Settings
// read. See PARTNER-VIEW-PLAN.md §2, §3, §5 and §8.
//
// ⚠️ Every company, person and figure is invented, like `data/partnership.js`.
// Amounts come from that file's contributions, so a customer's MRR here, its
// invoices and the Partnership total can't disagree.

import { OPEN_MONTH, TIERS, contributionMonths, contributionsFor, firmFor } from './partnership'

// ── Customers ───────────────────────────────────────────────────────────────
// `source` 'connect' | 'own'. `billing` 'customer' | 'partner'. `stage`
// 'onboarding' | 'live' | 'churned'. `linked` is when the partner code was
// linked; `codeShared` is for a customer added by hand who hasn't linked yet.
const SILVER_CUSTOMERS = [
  { name: 'Halcyon', contact: 'Ritu Sharma', email: 'ritu@halcyon.example', source: 'own', billing: 'customer', stage: 'live', linked: '2023-04-11', region: 'Mumbai' },
  { name: 'Kestrel', contact: 'Arjun Nair', email: 'arjun@kestrel.example', source: 'connect', billing: 'partner', stage: 'live', linked: '2025-08-02', region: 'Mumbai', project: 'Stock and purchase on ERPNext' },
  { name: 'Vantage', contact: 'Lena Fischer', email: 'lena@vantage.example', source: 'own', billing: 'customer', stage: 'live', linked: '2024-02-19', region: 'Frankfurt' },
  { name: 'Tessellate', contact: 'Priya Menon', email: 'priya@tessellate.example', source: 'connect', billing: 'customer', stage: 'live', linked: '2025-11-20', region: 'Mumbai', project: 'Payroll on Frappe HR' },
  { name: 'Meridian', contact: 'Vikram Shah', email: 'vikram@meridian.example', source: 'own', billing: 'partner', stage: 'live', linked: '2024-06-07', region: 'Mumbai' },
  { name: 'Orenda', contact: 'Omar Haddad', email: 'omar@orenda.example', source: 'own', billing: 'customer', stage: 'live', linked: '2025-01-15', region: 'Bahrain' },
  { name: 'Silverpine', contact: 'Neha Kulkarni', email: 'neha@silverpine.example', source: 'own', billing: 'partner', stage: 'live', linked: '2024-09-30', region: 'Mumbai' },
  { name: 'Bluecrest', contact: 'Dev Patel', email: 'dev@bluecrest.example', source: 'own', billing: 'customer', stage: 'live', linked: '2025-05-12', region: 'Mumbai' },
  { name: 'Rivermark Textiles', contact: 'Kavya Iyer', email: 'kavya@rivermark.example', source: 'connect', billing: 'customer', stage: 'onboarding', region: 'Mumbai', project: 'Manufacturing on ERPNext' },
  { name: 'Coastal Traders', contact: 'Sameer Joshi', email: 'sameer@coastal.example', source: 'own', billing: 'customer', stage: 'onboarding', codeShared: '2026-10-21', region: 'Mumbai' },
  { name: 'Granite Works', contact: 'Rohan Das', email: 'rohan@granite.example', source: 'own', billing: 'customer', stage: 'churned', linked: '2023-09-01', region: 'Mumbai' },
]

const BEGINNER_CUSTOMERS = [
  { name: 'Aurelia', contact: 'Maya Haddad', email: 'maya@aurelia.example', source: 'own', billing: 'customer', stage: 'live', linked: '2026-08-28', region: 'Bahrain' },
  { name: 'Brightwell Foods', contact: 'Tom Okafor', email: 'tom@brightwell.example', source: 'own', billing: 'customer', stage: 'live', linked: '2026-10-04', region: 'Bahrain' },
]

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

// Each customer's sites and its MRR, from its open-month invoice.
export const customersFor = (tier, state) => {
  const rows = contributionsFor(tier, OPEN_MONTH, state)
  return (tier === 'beginner' ? BEGINNER_CUSTOMERS : SILVER_CUSTOMERS).map((c) => {
    const inv = rows.find((r) => r.customer === c.name)
    return {
      ...c,
      id: slug(c.name),
      mrr: inv?.converted ?? 0,
      sites: (inv?.sites ?? []).map((s, i) => ({
        ...s,
        currency: inv.currency,
        region: c.region,
        status: c.stage === 'churned' ? 'Suspended' : 'Active',
        apps: i === 0 ? ['ERPNext', 'Frappe HR'] : ['ERPNext'],
      })),
    }
  })
}

// A customer's invoices over the months on record, newest first.
export const customerInvoices = (tier, state, name) =>
  contributionMonths()
    .map((m) => {
      const inv = contributionsFor(tier, m.key, state).find((r) => r.customer === name)
      return inv ? { ...inv, month: m.label, open: Boolean(m.open) } : null
    })
    .filter(Boolean)

// ── Link requests ───────────────────────────────────────────────────────────
// A customer entered the partner code in Frappe Cloud. `matches` names a
// customer added by hand with the same email or company.
const SILVER_REQUESTS = [
  {
    id: 'req-coastal',
    company: 'Coastal Traders',
    contact: 'Sameer Joshi',
    email: 'sameer@coastal.example',
    at: '2026-10-29',
    matches: 'coastal-traders',
    sites: [{ name: 'coastal-traders.frappe.cloud', plan: 'Business', region: 'Mumbai' }],
  },
  {
    id: 'req-elmwood',
    company: 'Elmwood Retail',
    contact: 'Hannah Cole',
    email: 'hannah@elmwood.example',
    at: '2026-10-27',
    sites: [
      { name: 'elmwood.frappe.cloud', plan: 'Business', region: 'London' },
      { name: 'elmwood-staging.frappe.cloud', plan: 'Starter', region: 'London' },
    ],
  },
]
export const linkRequestsFor = (tier) => (tier === 'beginner' ? [] : SILVER_REQUESTS)

// ── Billing (Partner pays) ──────────────────────────────────────────────────
// What Frappe billed for each Partner-pays customer, the tier discount taken
// off, and what the partner paid. The partner's own account bills on the same
// invoice. Customer-pays customers aren't here: the partner pays nothing.
export const billingFor = (tier, state, monthKey) => {
  const firm = firmFor(tier)
  const discount = tier === 'beginner' ? 0 : TIERS.silver.discount
  const partnerPays = new Set(customersFor(tier, state).filter((c) => c.billing === 'partner').map((c) => c.name))
  const month = contributionMonths().find((m) => m.key === monthKey)
  const rows = contributionsFor(tier, monthKey, state)
    .filter((r) => r.own || partnerPays.has(r.customer))
    .map((r) => {
      const off = Math.round((r.converted * discount) / 100)
      return { ...r, billed: r.converted, off, paid: r.converted - off }
    })
  const total = rows.reduce((sum, r) => sum + r.paid, 0)
  return {
    month,
    currency: firm.currency,
    discount,
    rows,
    total,
    invoice: `FC-${monthKey.replace('-', '')}-0193`,
    // September is the seeded unpaid month, so the flag has somewhere to show.
    status: month?.open ? 'accruing' : monthKey === '2026-09' ? 'unpaid' : 'paid',
  }
}

// ── Team ────────────────────────────────────────────────────────────────────
// Every person has at least one role, as on Frappe Cloud's team page. A
// consultant who only needs to count toward tier is a Member (view-only).
// `cert` is the linked certificate, if any: `full` says it counts toward tier.
const SILVER_TEAM = [
  { name: 'Farhan Qureshi', email: 'farhan@softwarework.example', roles: ['owner'], cert: { name: 'ERPNext', full: true, issued: '2022-06-14', expires: '2027-06-14' } },
  { name: 'Anuja Deshmukh', email: 'anuja@softwarework.example', roles: ['owner'], cert: { name: 'ERPNext', full: true, issued: '2021-03-02', expires: '2027-03-02' } },
  { name: 'Rahul Verma', email: 'rahul@softwarework.example', roles: ['sales'], cert: null },
  { name: 'Ishita Bose', email: 'ishita@softwarework.example', roles: ['finance'], cert: null },
  { name: 'Manoj Pillai', email: 'manoj@softwarework.example', roles: ['member'], cert: { name: 'Framework', full: true, issued: '2023-11-20', expires: '2026-12-20' } },
  { name: 'Sneha Rao', email: 'sneha@softwarework.example', roles: ['member'], cert: { name: 'ERPNext', full: true, issued: '2024-01-09', expires: '2027-01-09' } },
  { name: 'Aakash Gupta', email: 'aakash@softwarework.example', roles: ['sales'], cert: { name: 'ERPNext', full: true, issued: '2024-08-17', expires: '2027-08-17' } },
  { name: 'Pooja Shetty', email: 'pooja@softwarework.example', roles: ['member'], cert: { name: 'Accounting module', full: false, issued: '2025-02-11', expires: '2027-02-11' } },
]

const BEGINNER_TEAM = [
  { name: 'Sana Malik', email: 'sana@lumen.example', roles: ['owner', 'sales', 'finance'], cert: { name: 'ERPNext', full: true, issued: '2026-08-12', expires: '2028-08-12' } },
  { name: 'Yusuf Karim', email: 'yusuf@lumen.example', roles: ['sales'], cert: null },
]

// Expiring: within 60 days of the demo's today.
const EXPIRING_BY = '2026-12-29'

export const teamFor = (tier, state) => {
  const base = tier === 'beginner' ? BEGINNER_TEAM : SILVER_TEAM
  // At risk: three certificates have lapsed, leaving the 2 Partnership shows.
  const lapsed = state === 'at-risk' ? new Set(['Manoj Pillai', 'Sneha Rao', 'Aakash Gupta']) : new Set()
  return base.map((p) => {
    const cert = p.cert ? { ...p.cert } : null
    let status = 'none'
    if (cert) {
      if (lapsed.has(p.name)) {
        status = 'expired'
        cert.expires = '2026-10-12'
      } else status = cert.expires <= EXPIRING_BY ? 'expiring' : 'certified'
    }
    return { ...p, id: slug(p.name), cert, status, counts: Boolean(cert?.full) && status !== 'expired' }
  })
}

export const ROLE_LABEL = { owner: 'Owner', sales: 'Sales', finance: 'Finance', member: 'Member' }

// What each role is for, in the Roles tab. The full table is in the plan.
export const ROLES = [
  { key: 'owner', label: 'Owner', desc: 'Everything, including the team, audits, link requests and settings' },
  { key: 'sales', label: 'Sales', desc: 'Leads, quotes and customers' },
  { key: 'finance', label: 'Finance', desc: 'Billing, Contributions and customer invoices' },
  { key: 'member', label: 'Member', desc: 'View-only: standing, team, profile and resources' },
]

// ── CRM sync ────────────────────────────────────────────────────────────────
// Prefilled mappings for the two CRMs Frappe makes. Status names are each
// app's own lead statuses; the stages are the PRM portal's.
export const PRM_STAGES = [
  'Open', 'Qualification', 'Demo/Making', 'Proposal/Quotation', 'Follow Up',
  'Negotiation', 'Ready to Close', 'Won', 'Lost', 'Junk', 'Closed',
]

export const CRMS = {
  'frappe-crm': {
    label: 'Frappe CRM',
    statuses: [
      ['New', 'Open'],
      ['Contacted', 'Qualification'],
      ['Nurture', 'Follow Up'],
      ['Qualified', 'Proposal/Quotation'],
      ['Unqualified', 'Lost'],
      ['Junk', 'Junk'],
    ],
  },
  erpnext: {
    label: 'ERPNext',
    statuses: [
      ['Lead', 'Open'],
      ['Open', 'Qualification'],
      ['Replied', 'Follow Up'],
      ['Opportunity', 'Proposal/Quotation'],
      ['Quotation', 'Negotiation'],
      ['Converted', 'Won'],
      ['Lost Quotation', 'Lost'],
      ['Do Not Contact', 'Junk'],
    ],
  },
}

// ── Resources ───────────────────────────────────────────────────────────────
// From Frappe's partner guide. Real links; Connect only points at them.
export const RESOURCES = [
  {
    key: 'help',
    title: 'Help with a project',
    items: [
      { label: 'Frappe Support', href: 'https://support.frappe.io', note: 'Product tickets' },
      { label: 'Community forum', href: 'https://discuss.frappe.io', note: 'Questions answered by the community' },
      { label: 'Partner forum', href: 'https://partners.frappe.io', note: 'Partners and the Frappe team' },
      { label: 'Documentation', href: 'https://docs.frappe.io', note: 'Frappe, ERPNext and the apps' },
      { label: 'Co-deliver with a partner', href: 'https://frappe.io/partners/list', note: 'Work with an experienced partner' },
    ],
  },
  {
    key: 'selling',
    title: 'Selling',
    items: [
      { label: 'Sales Bootcamp', href: 'https://school.frappe.io/lms/courses/frappe-sales-bootcamp', note: 'Five hours of recorded sales training' },
      { label: 'Partner guide', href: 'https://docs.frappe.io/partner-guide/guide-for-new-partners', note: 'Tiers, leads and how to grow' },
    ],
  },
  {
    key: 'hiring',
    title: 'Hiring and certification',
    items: [
      { label: 'Certified participants', href: 'https://frappe.school/lms/certified-participants', note: 'People certified on Frappe School' },
      { label: 'Job openings', href: 'https://frappe.school/lms/job-openings', note: 'Post and find roles' },
    ],
  },
  {
    key: 'updates',
    title: 'Staying up to date',
    items: [
      { label: 'Frappe on YouTube', href: 'https://www.youtube.com/@frappetech', note: 'Demos and talks' },
      { label: 'Frappe Times', href: 'https://frappe.io/times', note: 'The newsletter' },
    ],
  },
]
