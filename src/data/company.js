import { INDUSTRIES } from './quiz'

// The company questions: what is asked, in what order, and what counts as an
// answer. Moved out of `CompanySignupDialog` when a SECOND surface started
// asking them — the contact wizard's first two steps — because the one thing
// worse than asking twice is asking two different questions and calling both
// "company details".
//
// The markup lives in `CompanyQuestions.vue`. This file is the catalogue and
// the rules; that one is the fields.

// ⚠️ THE STEP COUNT LIVES HERE, because three things have to agree on it:
// `CompanyQuestions`, which renders one step at a time; the two dialogs and the
// page that drive it; and their progress bars, which fill one segment per step.
// The contact wizard is this plus one — its own last step is the requirements —
// so it says `COMPANY_STEPS + 1` rather than repeating a number.
export const COMPANY_STEPS = 3

// ── Step 1: who you are ──────────────────────────────────────────────────────

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

// ── Step 2: what you run today ───────────────────────────────────────────────

// What they are running today, by name. Optional, and the one question here
// whose answer a partner reads rather than a filter: "they are on Tally and
// three spreadsheets" is the sentence that starts a migration conversation.
//
// ⚠️ A FOLLOW-UP TO THE LADDER, not a question of its own. It used to sit a step
// earlier with "Spreadsheets only" at the top of the list — so a business on
// spreadsheets and paper said so twice, and everyone else named their systems
// before being asked what they were for. It is now asked after the rung, of the
// three rungs that have anything to name, and that option is gone with it.
//
// ⚠️ Invented, but not arbitrary — these are the systems an ERPNext migration
// actually comes from.
export const CURRENT_APPS = [
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

// ⚠️ The first rung is the one that names no software, so it is the one rung
// that is not asked which systems — see `CURRENT_APPS`.
const OPERATIONS_MANUAL = 'manual'

export const asksApps = (operations) => Boolean(operations) && operations !== OPERATIONS_MANUAL

// ── Step 3: what you want fixed ──────────────────────────────────────────────

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

// ⚠️ ALL the validation is the FIRST step's. Steps 2 and 3 require nothing: they
// sharpen the match, they do not gate it, and a form that refuses to move on
// until you have opinions about your month-end close is a wall rather than a
// form.
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

// The store keeps what was CHOSEN — `'disconnected'`, `['close', 'visibility']` —
// because that is what a matcher filters on. Anything that shows these answers
// back to the person who gave them has to come through here first: printing the
// stored value put the word "disconnected" in front of a customer, in a panel
// whose whole job is to show them what their partner received.
export const operationsLabel = (value) => OPERATIONS.find((o) => o.value === value)?.label ?? ''

export const problemLabels = (values) =>
  (values ?? []).map((v) => PROBLEMS.find((p) => p.value === v)?.label).filter(Boolean)
