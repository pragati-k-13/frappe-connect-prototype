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
//   source   'connect' (a brief) | 'frappe' (passed on by Frappe's team)
//   stage    one of the PRM portal's stages, set by what happens in Connect,
//            then by CRM sync, then by hand
//   owner    the team member it's assigned to (a `data/partnerAccount.js` id)
//   frappeOwner  who at Frappe passed it on, for 'frappe' leads
//   closed   { stage, reason } once it's Won, Lost, Junk or Closed
//
// ⚠️ The four leads after the first two are invented here too. Lakeshore and
// Harbor are passed on by Frappe, so they're named from the start.

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
    source: 'connect',
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
    source: 'connect',
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
    source: 'connect',
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
    id: 'pv-lakeshore',
    source: 'frappe',
    frappeOwner: 'Karan Mehta',
    stage: 'Qualification',
    owner: 'aakash-gupta',
    project: 'Clinic billing and pharmacy',
    brief: {
      scope:
        'Three outpatient clinics with a pharmacy at each. Billing is on a desktop tool per clinic and the pharmacies are on paper, so nobody can see stock across sites.',
      modules: { erpnext: ['accounts', 'inventory'] },
      budget: 'inr-2',
      country: 'India',
      segments: ['Healthcare'],
      employees: '51 to 200',
      cities: [],
      tiers: [],
      workStyle: 'onsite',
      timeline: 'quarter',
      operations: 'manual',
      apps: [],
      problems: ['visibility', 'manual-work'],
    },
    company: { name: 'Lakeshore Clinics', contact: 'Dr. Anita Rao', email: 'anita@lakeshore.example' },
    messages: [
      { id: 'l0', from: 'frappe', kind: 'passed', at: hoursAgo(74) },
      {
        id: 'l1',
        from: 'you',
        kind: 'text',
        at: hoursAgo(70),
        body: '<p>Hello Dr. Rao, Karan at Frappe passed on your details. Could you tell us how many billing counters each clinic runs?</p>',
      },
      {
        id: 'l2',
        from: 'them',
        kind: 'text',
        at: hoursAgo(5),
        body: '<p>Two at the main clinic and one at each of the others. We’d like the pharmacies sorted out first if possible.</p>',
      },
    ],
  },
  {
    id: 'pv-harbor',
    source: 'frappe',
    frappeOwner: 'Aditi Rao',
    stage: 'Open',
    owner: 'farhan-qureshi',
    // Nothing has moved for twelve days, so without a CRM sync the sidebar
    // asks once whether the firm is still working on it.
    stalled: true,
    project: 'Fleet and freight billing',
    brief: {
      scope: 'A freight forwarder with 40 trucks wants trip costing and customer billing in one place.',
      modules: { erpnext: ['accounts', 'projects'] },
      budget: 'inr-1',
      country: 'India',
      segments: ['Logistics'],
      employees: '11 to 50',
      cities: [],
      tiers: [],
      workStyle: '',
      timeline: 'none',
      operations: 'manual',
      apps: [],
      problems: ['manual-work'],
    },
    company: { name: 'Harbor Logistics', contact: 'Imran Shaikh', email: 'imran@harbor.example' },
    messages: [
      { id: 'h0', from: 'frappe', kind: 'passed', at: hoursAgo(24 * 13) },
      {
        id: 'h1',
        from: 'you',
        kind: 'text',
        at: hoursAgo(24 * 12),
        body: '<p>Hi Imran, Aditi at Frappe passed on your details. Would Thursday work for a short call about trip costing?</p>',
      },
    ],
  },
  {
    id: 'pv-lost',
    source: 'connect',
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
