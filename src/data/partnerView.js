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

export const partnerThreads = () => [
  {
    id: 'pv-northwind',
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
]
