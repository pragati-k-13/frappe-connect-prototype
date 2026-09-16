import { INDUSTRIES } from './quiz'

// The company questions: what is asked, in what order, and what counts as an
// answer. Moved out of `CompanySignupDialog` when a SECOND surface started
// asking them — the contact wizard's first two steps — because the one thing
// worse than asking twice is asking two different questions and calling both
// "company details".
//
// The markup lives in `CompanyQuestions.vue`. This file is the catalogue and
// the rules; that one is the fields.

// ⚠️ PLACEHOLDER BANDS, invented — nothing in the repo defines sizes. The 50
// matters more than it looks: Starter Packs are scoped "for businesses running
// under 50 users", so this is the first answer that could tell someone the pack
// they picked doesn't fit them. Nothing acts on it yet.
export const COMPANY_SIZES = ['1 to 10', '11 to 50', '51 to 200', '201 to 500', 'More than 500']

// Industry AND segment in one grouped control, the same shape as the listing's
// industry filter and for the same reason: partners are tagged at the SEGMENT
// level ("Textile Manufacturing"), so the industry is a heading and the segments
// are the options. Asking for the group alone records something `matches()`
// cannot filter on.
//
// ⚠️ `MultiSelect`, not `Select`: frappe-ui's `Select` renders no groups at all,
// so a grouped list needs this one. Multi is also the truer answer — a business
// spanning "Discrete Manufacturing" and "Logistics" can say so.
export const SEGMENT_OPTIONS = INDUSTRIES.map((i) => ({
  group: i.label,
  key: i.value,
  options: i.segments.map((sg) => ({ label: sg, value: sg })),
}))

// What they are running today, by name. Optional, and the one question here
// whose answer a partner reads rather than a filter: "they are on Tally and
// three spreadsheets" is the sentence that starts a migration conversation.
//
// ⚠️ Invented, but not arbitrary — these are the systems an ERPNext migration
// actually comes from. "Spreadsheets only" is an answer, not an absence, which
// is why it is in the list rather than left to the empty state.
export const CURRENT_APPS = [
  'Spreadsheets only',
  'Tally',
  'Zoho',
  'QuickBooks',
  'Busy',
  'SAP',
  'Microsoft Dynamics',
  'Odoo',
  'Salesforce',
  'An in-house system',
  'Something else',
].map((label) => ({ label, value: label }))

// ⚠️ The one option that asks a question back. "Something else" names a system
// without naming it, so choosing it reveals a field for the name — offered, not
// demanded: the field is optional, as the question it belongs to is.
export const APPS_OTHER = 'Something else'

// ⚠️ A LADDER, not a list. The four rungs are meant to be mutually exclusive and
// in order of how much software is already in place, so a business can find
// itself in exactly one — which is what makes it single-select. The placeholder
// copy ("We manage everything on spreadsheets/paper") described tools; these
// describe a SITUATION, which is what a partner is actually scoping against.
export const OPERATIONS = [
  { value: 'manual', label: 'Spreadsheets, email and paper' },
  { value: 'accounting', label: 'Accounting software, everything else by hand' },
  { value: 'disconnected', label: 'Several systems that do not talk to each other' },
  { value: 'outgrown', label: 'An ERP that no longer fits how we work' },
]

// ⚠️ MULTI-select, unlike the ladder above: a business wants integration AND a
// faster close AND stock it can trust, and forcing one answer throws away the
// other two. Phrased as symptoms the visitor would recognise in their own week
// rather than as categories ("Lack of digitalization of processes") — nobody
// describes their month that way.
export const PROBLEMS = [
  { value: 'manual-work', label: 'Manual work that should be automated' },
  { value: 'integration', label: 'Systems that do not talk to each other' },
  { value: 'close', label: 'Month-end close and reporting take too long' },
  { value: 'visibility', label: 'No reliable view of stock and orders' },
  { value: 'fit', label: 'Our tools cannot handle how we actually work' },
  { value: 'scale', label: 'We are outgrowing what we have' },
]

export const emptyCompanyForm = () => ({
  company: '',
  employees: '',
  segments: [],
  apps: [],
  appsOther: '',
  operations: '',
  problems: [],
})

// ⚠️ ALL the validation is the FIRST step's. The second asks two questions and
// requires neither: they sharpen the match, they do not gate it, and a form that
// refuses to move on until you have opinions about your month-end close is a
// wall rather than a form.
//
// What "cannot proceed without answering" protects is the company, its size and
// its industry, which are what the matcher actually reads.
export const companyErrors = (form) => {
  const e = {}
  if (!form.company.trim()) e.company = 'Enter your company name'
  if (!form.employees) e.employees = 'Select a size'
  if (!form.segments.length) e.segments = 'Select an industry'
  return e
}

// What `saveCompany` is given. Trimmed here rather than at each call site, so
// two surfaces collecting the same answers cannot store them differently.
export const companyPayload = (form) => ({
  name: form.company.trim(),
  employees: form.employees,
  segments: form.segments,
  apps: form.apps,
  // Kept beside `apps` rather than folded into it: "Something else" is the
  // answer they gave, and this is what they meant by it. Merging the two would
  // read as a tenth option in the list nobody chose from.
  appsOther: form.appsOther.trim(),
  operations: form.operations,
  problems: form.problems,
})
