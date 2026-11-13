// The partner side of Messages: one firm's inbox, seeded.
//
// ⚠️ ONE FIRM, TWO THREADS, and the pair is the point. A broadcast reaches a
// partner anonymously and the company's name and contact arrive only when the
// company shortlists the quote. One thread before that moment and one after is
// the only way to see both states of the sidebar without a second persona.
//
// Software@Work because the business demo already has them shortlisted on the
// warehouse project, so the second thread is the same conversation seen from
// the other side. Farhan is one of their invented team names in
// `data/messages.js`, and Northwind and Meera are the business demo's own
// invented company and viewer. The second company is invented here and never
// named — which is also its state.

const hoursAgo = (h) => Date.now() - h * 3_600_000

export const PARTNER_SELF = {
  partnerId: 'software-work',
  person: 'Farhan Qureshi',
}

// ── Leads ───────────────────────────────────────────────────────────────────
// Every thread is a lead (see the plan's Messages section). Each carries:
//   stage    one of the PRM portal's stages, set by what happens in Connect,
//            then by CRM sync, then by hand
//   owner    the team member it's assigned to (a `data/partnerAccount.js` id)
//   closed   { stage, reason } once it's Won, Lost, Junk or Closed
//
// ⚠️ The leads after the first two are invented here too.
//
// Only Connect briefs live here. A lead Frappe passes on, or one the firm
// finds itself, isn't on Connect: that business has no reason to sign up just
// to message the partner, so the partner works it in their own CRM.

export const PRM_LOST_REASONS = [
  // "Lost to competitor" is the PRM portal's own; the rest stand in for its
  // list until it's copied across.
  'Lost to competitor',
  'No budget',
  'Not responding',
  'Chose another product',
  'Other',
]

export const partnerThreads = () => [
  {
    id: 'pv-northwind',
    stage: 'Negotiation',
    owner: 'farhan-qureshi',
    probability: 'Warm',
    project: 'Warehouse barcode workflow',
    brief: {
      scope:
        'Barcode scanning on goods receipt, wired into our WMS. Today it is a numbered folder per delivery and a spreadsheet nobody trusts, so stock on hand is a guess by Friday. We supply rail and defence subcontractors and are audited against IRIS and ISO 9001 every year, so it needs e-invoicing, opening balances from Tally, and a part-by-part audit trail we can show an auditor.',
      modules: { erpnext: ['inventory', 'manufacturing'] },
      budget: 'inr-2',
      country: 'India',
      segments: ['Discrete Manufacturing'],
      employees: '11 to 50',
      cities: [],
      tiers: [],
      timeline: 'none',
      operations: 'disconnected',
      apps: [],
      problems: ['visibility', 'integration'],
    },
    // What shortlisting shares: who they are and how to reach them. Null until
    // then — everything else came with the brief.
    company: {
      name: 'Northwind',
      contact: 'Meera Iyer',
      email: 'meera@northwind.example',
      phone: '+91 98200 55731',
    },
    messages: [
      { id: 'n1', from: 'them', kind: 'brief', at: hoursAgo(6) },
      {
        id: 'n2',
        from: 'you',
        kind: 'bid',
        at: hoursAgo(4),
        bid: {
          price: '₹9,75,000',
          weeks: 7,
          note: 'This covers configuration, data migration and training. Integrations are quoted separately once we know which systems have to talk to each other.',
        },
      },
      { id: 'n3', from: 'them', kind: 'shared', at: hoursAgo(3) },
      {
        id: 'n4',
        from: 'you',
        kind: 'text',
        at: hoursAgo(2),
        body: '<p>Thanks for sharing the details. Could we put half an hour in the diary this week to walk through the warehouse side before we firm up the estimate?</p>',
      },
    ],
  },
  // From an address at a company the firm already linked itself, so the lead
  // asks whether it's that customer. See "Lead to customer" in the plan.
  {
    id: 'pv-halcyon',
    // Halcyon asked Frappe for a partner, and Frappe suggested this firm.
    origin: 'referral',
    stage: 'Negotiation',
    owner: 'anuja-deshmukh',
    probability: 'Hot',
    project: 'Payroll for three new stores',
    brief: {
      scope:
        'We are opening three stores in Pune and want their staff on payroll and attendance in the same system as our Mumbai stores, with shift rosters the store managers can change themselves.',
      modules: { hrms: ['payroll', 'attendance'] },
      budget: 'inr-1',
      country: 'India',
      segments: ['Retail'],
      employees: '51 to 200',
      cities: [],
      tiers: [],
      timeline: 'quarter',
      operations: 'disconnected',
      apps: [],
      problems: ['manual-work'],
    },
    company: { name: 'Halcyon Retail', contact: 'Ritu Sharma', email: 'ritu@halcyon.example', phone: '+91 98200 41120' },
    messages: [
      { id: 'h1', from: 'them', kind: 'brief', at: hoursAgo(52) },
      {
        id: 'h2',
        from: 'you',
        kind: 'bid',
        at: hoursAgo(40),
        bid: { price: '₹2,40,000', weeks: 4, note: 'Payroll and attendance for the three stores, with rosters store managers can edit.' },
      },
      { id: 'h3', from: 'them', kind: 'shared', at: hoursAgo(30) },
      { id: 'h4', from: 'them', kind: 'text', at: hoursAgo(7), body: '<p>Can the Pune stores go live before the Mumbai payroll run on the 1st?</p>' },
    ],
  },
  {
    id: 'pv-anonymous',
    stage: 'Proposal/Quotation',
    owner: 'rahul-verma',
    project: 'Batch tracking for spice exports',
    brief: {
      scope:
        'We blend and pack spices for export and every batch has to be traceable back to the supplier lots it came from. Today that lives in paper batch sheets and a shared spreadsheet, and a buyer audit takes two people a week to answer.',
      modules: { erpnext: ['inventory', 'purchase', 'manufacturing'] },
      budget: 'inr-1',
      country: 'India',
      segments: ['Food and Beverages'],
      employees: '51 to 200',
      cities: [],
      tiers: [],
      timeline: 'quarter',
      operations: 'manual',
      apps: [],
      problems: ['manual-work', 'visibility'],
    },
    company: null,
    messages: [
      { id: 'a1', from: 'them', kind: 'brief', at: hoursAgo(28) },
      {
        id: 'a2',
        from: 'you',
        kind: 'bid',
        at: hoursAgo(20),
        bid: {
          price: '₹4,20,000',
          weeks: 6,
          note: 'Batch and lot tracking are standard in ERPNext stock, so most of this is configuration and moving the batch sheets across. The buyer audit report is the one piece we would build.',
        },
      },
    ],
  },
  {
    id: 'pv-pharma',
    stage: 'Open',
    owner: null,
    project: 'Stock and expiry for a pharma distributor',
    brief: {
      scope:
        'We distribute generic medicines to around 400 pharmacies in western Maharashtra. Batches and expiry dates live in Tally and a spreadsheet, and near-expiry stock is found too late to return to the manufacturer.',
      modules: { erpnext: ['inventory', 'selling', 'purchase'] },
      budget: 'inr-2',
      country: 'India',
      segments: ['Pharmaceutical Manufacturing'],
      employees: '51 to 200',
      cities: [],
      tiers: [],
      timeline: 'quarter',
      operations: 'disconnected',
      apps: [],
      problems: ['visibility'],
    },
    company: null,
    messages: [{ id: 'p1', from: 'them', kind: 'brief', at: hoursAgo(9) }],
  },
  {
    id: 'pv-lost',
    stage: 'Lost',
    owner: 'rahul-verma',
    closed: { stage: 'Lost', reason: 'Lost to competitor' },
    project: 'Payroll for a textile mill',
    brief: {
      scope: 'Payroll and attendance for 600 workers across two shifts, replacing a vendor system that no longer gets updates.',
      modules: { hrms: ['payroll', 'attendance'] },
      budget: 'inr-1',
      country: 'India',
      segments: ['Textile Manufacturing'],
      employees: '201 to 1000',
      cities: [],
      tiers: [],
      timeline: 'quarter',
      operations: 'disconnected',
      apps: [],
      problems: ['manual-work'],
    },
    company: null,
    messages: [
      { id: 'x1', from: 'them', kind: 'brief', at: hoursAgo(24 * 20) },
      {
        id: 'x2',
        from: 'you',
        kind: 'bid',
        at: hoursAgo(24 * 19),
        bid: { price: '₹3,80,000', weeks: 5, note: 'Payroll, attendance and the shift roster, with two weeks of parallel runs.' },
      },
    ],
  },
]

// ── A Beginner's leads ──────────────────────────────────────────────────────
// Lumen Digital, the Beginner firm in `data/partnership.js`: Bahrain, USD.
// Connect sends briefs from the first tier, so a Beginner works leads too.
// Two, so both sides of shortlisting show: one still anonymous and waiting on
// a reply, one where the company has shared its details after a quote.
// ⚠️ Invented here, like the rest.
export const beginnerThreads = () => [
  {
    id: 'bg-clinic',
    stage: 'Open',
    owner: null,
    project: 'Appointments and billing for three clinics',
    brief: {
      scope:
        'We run three outpatient clinics in Manama. Appointments are on paper and billing is in a spreadsheet, so insurance claims go out late and some never go out.',
      modules: { erpnext: ['selling', 'accounting'] },
      budget: 'usd-1',
      country: 'Bahrain',
      segments: ['Healthcare'],
      employees: '11 to 50',
      cities: [],
      tiers: [],
      timeline: 'quarter',
      operations: 'spreadsheets',
      apps: [],
      problems: ['manual'],
    },
    company: null,
    messages: [
      { id: 'c1', from: 'them', kind: 'brief', at: hoursAgo(5) },
    ],
  },
  {
    id: 'bg-bakery',
    stage: 'Proposal/Quotation',
    owner: 'sana-malik',
    probability: 'Warm',
    project: 'Stock and orders for a bakery chain',
    brief: {
      scope:
        'Six outlets and a central kitchen. Orders from outlets come over WhatsApp, and the kitchen bakes to a guess, so we throw away bread most evenings.',
      modules: { erpnext: ['inventory', 'manufacturing', 'selling'] },
      budget: 'usd-2',
      country: 'Bahrain',
      segments: ['Food and Beverage'],
      employees: '51 to 200',
      cities: [],
      tiers: [],
      timeline: 'none',
      operations: 'disconnected',
      apps: [],
      problems: ['visibility'],
    },
    company: { name: 'Crumb & Co', contact: 'Layla Haddad', email: 'layla@crumbandco.example', phone: '+973 3611 2290' },
    messages: [
      { id: 'b1', from: 'them', kind: 'brief', at: hoursAgo(50) },
      {
        id: 'b2',
        from: 'you',
        kind: 'bid',
        at: hoursAgo(30),
        bid: {
          price: '$14,500',
          weeks: 6,
          note: 'Outlet ordering, kitchen production plans from those orders, and stock across the outlets. Training for each outlet lead.',
        },
      },
      { id: 'b3', from: 'them', kind: 'shared', at: hoursAgo(26) },
      {
        id: 'b4',
        from: 'them',
        kind: 'text',
        at: hoursAgo(3),
        body: '<p>Thanks for the quote. Could the outlets order from a phone? Our leads are rarely at a computer.</p>',
      },
    ],
  },
]

// ── Leads from the firm's CRM ───────────────────────────────────────────────
// Only with CRM sync on. The business isn't on Connect, so there's no thread:
// a CRM lead is the deal's facts, and its stage belongs to the CRM. Won there
// makes the customer here. `organization` is the CRM's own, which settles the
// match to an existing customer without asking.
// ⚠️ Invented, like the rest.
export const crmLeads = (tier) =>
  tier === 'beginner'
    ? [
        {
          id: 'crm-dune',
          source: 'crm',
          stage: 'Proposal/Quotation',
          owner: 'yusuf-karim',
          project: 'Fleet and delivery tracking',
          need: 'Twelve trucks across Bahrain. Dispatch is on WhatsApp and proof of delivery is a photo nobody files.',
          company: { name: 'Dune Logistics', contact: 'Ali Mansoor', email: 'ali@dune.example', phone: '+973 3644 0912' },
          at: hoursAgo(30),
        },
      ]
    : [
        {
          id: 'crm-orchid',
          source: 'crm',
          stage: 'Negotiation',
          owner: 'rahul-verma',
          probability: 'Warm',
          project: 'Point of sale for 14 outlets',
          need: 'Replacing a billing app at 14 garment outlets, with stock moving between them every evening.',
          company: { name: 'Orchid Apparel', contact: 'Sneha Pillai', email: 'sneha@orchid.example', phone: '+91 98211 40327' },
          at: hoursAgo(26),
        },
        {
          id: 'crm-granite',
          source: 'crm',
          stage: 'Qualification',
          owner: 'farhan-qureshi',
          project: 'Second plant on ERPNext',
          need: 'A second stone-cutting plant in Rajasthan, on the same site as the first.',
          company: { name: 'Granite Works', contact: 'Rohan Das', email: 'rohan@granite.example', phone: '+91 98210 66503' },
          organization: 'Granite Works',
          at: hoursAgo(75),
        },
      ]
