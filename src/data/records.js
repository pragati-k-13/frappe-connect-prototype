// What a lead or customer record carries besides its own facts: follow-ups
// the team logged and the activity history. Keyed by record id — a lead's
// thread id (`pv-…`) or a customer's id. The partner's additions sit in
// `stores/partnerAccount.js`; these are the seeds.
//
// ⚠️ Invented, like the rest of the partner demo.

const day = (iso, h = 10) => new Date(`${iso}T${String(h).padStart(2, '0')}:00:00`).getTime()

export const FOLLOW_UP_MODES = ['Call', 'Demo', 'Email', 'Meeting']

// `by` is a Team id; `spokeTo` is free text, since it's whoever picked up.
const FOLLOW_UPS = {
  'pv-northwind': [
    { id: 'f-nw-2', at: day('2026-10-29', 16), by: 'farhan-qureshi', mode: 'Call', spokeTo: 'Meera Iyer', notes: 'Walked through goods receipt. They want barcode labels printed at the dock, not the office.' },
    { id: 'f-nw-1', at: day('2026-10-24', 11), by: 'farhan-qureshi', mode: 'Demo', spokeTo: 'Meera Iyer', notes: 'Stock entry and batch tracking. Asked about Tally opening balances.' },
  ],
  'pv-anonymous': [
    { id: 'f-an-1', at: day('2026-10-27', 15), by: 'rahul-verma', mode: 'Email', spokeTo: '', notes: 'Sent the quote breakdown through Connect. No reply yet.' },
  ],
  kestrel: [
    { id: 'f-ks-3', at: day('2026-10-21', 12), by: 'rahul-verma', mode: 'Meeting', spokeTo: 'Arjun Nair', notes: 'Quarterly review. Asked for a second warehouse next year.' },
    { id: 'f-ks-2', at: day('2026-09-04', 10), by: 'farhan-qureshi', mode: 'Call', spokeTo: 'Arjun Nair', notes: 'Purchase approvals slow. Agreed to add a second approver.' },
    { id: 'f-ks-1', at: day('2025-08-12', 14), by: 'farhan-qureshi', mode: 'Demo', spokeTo: 'Arjun Nair', notes: 'Training for the stores team.' },
  ],
  halcyon: [
    { id: 'f-hc-1', at: day('2026-10-02', 11), by: 'anuja-deshmukh', mode: 'Call', spokeTo: 'Ritu Sharma', notes: 'Renewal is in March. Happy with support.' },
  ],
  'rivermark-textiles': [
    { id: 'f-rm-1', at: day('2026-10-28', 15), by: 'rahul-verma', mode: 'Meeting', spokeTo: 'Kavya Iyer', notes: 'Kick-off. Project champion is Kavya; BOMs come from the floor supervisor.' },
  ],
}

// `kind`: 'created' | 'change' (`field`, `from`, `to`) | 'note' (`text`).
// `by` is a display name: Frappe and the customer act here too.
const ACTIVITY = {
  'pv-northwind': [
    { id: 'a-nw-1', at: day('2026-10-30', 4), by: 'Connect', kind: 'created', text: 'sent this brief' },
    { id: 'a-nw-2', at: day('2026-10-30', 5), by: 'Farhan Qureshi', kind: 'change', field: 'Assigned to', from: 'Unassigned', to: 'Farhan Qureshi' },
    { id: 'a-nw-3', at: day('2026-10-30', 6), by: 'Farhan Qureshi', kind: 'change', field: 'Stage', from: 'Open', to: 'Qualification' },
    { id: 'a-nw-4', at: day('2026-10-30', 6), by: 'Farhan Qureshi', kind: 'change', field: 'Stage', from: 'Qualification', to: 'Proposal/Quotation' },
    { id: 'a-nw-5', at: day('2026-10-30', 7), by: 'Meera Iyer', kind: 'note', text: 'shared their contact details' },
    { id: 'a-nw-6', at: day('2026-10-30', 8), by: 'Farhan Qureshi', kind: 'change', field: 'Stage', from: 'Proposal/Quotation', to: 'Negotiation' },
  ],
  'pv-anonymous': [
    { id: 'a-an-1', at: day('2026-10-26', 9), by: 'Connect', kind: 'created', text: 'sent this brief' },
    { id: 'a-an-2', at: day('2026-10-26', 11), by: 'Farhan Qureshi', kind: 'change', field: 'Assigned to', from: 'Unassigned', to: 'Rahul Verma' },
    { id: 'a-an-3', at: day('2026-10-27', 14), by: 'Rahul Verma', kind: 'change', field: 'Stage', from: 'Open', to: 'Proposal/Quotation' },
  ],
  kestrel: [
    { id: 'a-ks-1', at: day('2025-07-14', 10), by: 'Connect', kind: 'created', text: 'sent this brief' },
    { id: 'a-ks-2', at: day('2025-07-30', 16), by: 'Farhan Qureshi', kind: 'change', field: 'Stage', from: 'Negotiation', to: 'Won' },
    { id: 'a-ks-3', at: day('2025-08-02', 12), by: 'Arjun Nair', kind: 'note', text: 'linked their sites to your partner code' },
    { id: 'a-ks-4', at: day('2025-08-20', 9), by: 'Arjun Nair', kind: 'change', field: 'Billing', from: 'Customer pays', to: 'Partner pays' },
    { id: 'a-ks-5', at: day('2025-09-15', 9), by: 'Farhan Qureshi', kind: 'change', field: 'Stage', from: 'Onboarding', to: 'Live' },
  ],
}

// Facts the PRM keeps on a customer that the list doesn't need. `owner` is a
// Team id.
const CUSTOMER_FACTS = {
  halcyon: { phone: '+91 98200 41120', industry: 'Retail', country: 'India', owner: 'anuja-deshmukh' },
  kestrel: { phone: '+91 98670 22145', industry: 'Distribution', country: 'India', owner: 'farhan-qureshi' },
  vantage: { phone: '+49 69 2000 1144', industry: 'Services', country: 'Germany', owner: 'anuja-deshmukh' },
  tessellate: { phone: '+91 99300 51870', industry: 'Services', country: 'India', owner: 'rahul-verma' },
  meridian: { phone: '+91 98190 33012', industry: 'Manufacturing', country: 'India', owner: 'farhan-qureshi' },
  orenda: { phone: '+973 3612 4471', industry: 'Distribution', country: 'Bahrain', owner: 'anuja-deshmukh' },
  silverpine: { phone: '+91 98201 77310', industry: 'Food and beverage', country: 'India', owner: 'farhan-qureshi' },
  bluecrest: { phone: '+91 98923 10046', industry: 'Healthcare', country: 'India', owner: 'rahul-verma' },
  'rivermark-textiles': { phone: '+91 98336 90218', industry: 'Manufacturing', country: 'India', owner: 'rahul-verma' },
  'coastal-traders': { phone: '', industry: 'Distribution', country: 'India', owner: 'rahul-verma' },
  'granite-works': { phone: '+91 98210 66503', industry: 'Manufacturing', country: 'India', owner: 'farhan-qureshi' },
  aurelia: { phone: '+973 3390 2210', industry: 'Retail', country: 'Bahrain', owner: 'sana-malik' },
  'brightwell-foods': { phone: '+973 3655 1408', industry: 'Food and beverage', country: 'Bahrain', owner: 'sana-malik' },
}

export const followUpsSeed = (id) => FOLLOW_UPS[id] ?? []
export const activitySeed = (id) => ACTIVITY[id] ?? []
export const customerFacts = (id) => CUSTOMER_FACTS[id] ?? {}

// Leads only: how likely it is to close. The PRM's three, optional.
export const PROBABILITY = ['Hot', 'Warm', 'Cold']
