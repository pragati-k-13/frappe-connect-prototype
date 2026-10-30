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
      workStyle: '',
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
      workStyle: 'onsite',
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
      workStyle: '',
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
      workStyle: 'onsite',
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
