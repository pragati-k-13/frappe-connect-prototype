import { MAX_INDUSTRIES } from './format'
import { COUNTRY_OPTIONS, INDUSTRIES } from './quiz'

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

// ⚠️ NO COMPANY NAME. It was the first field here and it is now asked at
// sign-up, with the person's own name, because of a rule this section holds to:
// every question in it changes the recommendation. Country sets the pricing
// market and the partner pool, the size band is the threshold that sends a
// business to custom work, the industry picks a pack. A company's name changes
// nothing that happens before the account exists — and for custom work it is
// deliberately withheld from partners until a bid is approved, so collecting it
// in the first ten seconds bought nobody anything.
//
// The country list is the directory's own, grouped by region — see
// `COUNTRY_OPTIONS`. Re-exported rather than imported twice: this file is what
// the intake form reads.
export { COUNTRY_OPTIONS }

// ⚠️ INDIA ONLY, FOR NOW, on every form that asks the country — sign-up, the
// company questions and settings. The full list still shows, so the forms
// read as ones that will open to other markets, but only India can be picked:
// Starter Packs are priced, taxed and scoped for India alone (see
// `REGION_PRICING`). Lift it here and all three open together.
export const SELECTABLE_COUNTRY = 'India'
export const COUNTRY_OPTIONS_INDIA_ONLY = COUNTRY_OPTIONS.map((g) => ({
  ...g,
  options: g.options.map((o) => ({ ...o, disabled: o.value !== SELECTABLE_COUNTRY })),
}))

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

// The industry options for a form that already has `picked`: once the limit is
// reached the rest are greyed out, so a fourth can't be picked at all.
export const segmentOptionsFor = (picked = []) =>
  picked.length < MAX_INDUSTRIES
    ? SEGMENT_OPTIONS
    : SEGMENT_OPTIONS.map((g) => ({
        ...g,
        options: g.options.map((o) => ({ ...o, disabled: !picked.includes(o.value) })),
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
  'HubSpot',
  'Zendesk',
  'Freshdesk',
  'Keka',
  'greytHR',
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
// `short`: the answer as the requirements dialog's company card shows it, one
// line at a third of the dialog, and about the company rather than in its
// voice ("its system", not "how we work"), since partners read it too. The
// question keeps `label`, where the business is answering. Shown only through
// `setupShort` in format.js, and only when they named no tools.
export const OPERATIONS = [
  { value: 'manual', label: 'Spreadsheets, email and paper', short: 'Spreadsheets and email' },
  // ⚠️ APP-AGNOSTIC. These read as an ERP ladder ("accounting software", "an
  // ERP") when the project may be CRM, Helpdesk or HR. The values stay, so
  // saved answers still read.
  { value: 'accounting', label: 'One tool for part of it, the rest by hand', short: 'One tool, the rest by hand' },
  { value: 'disconnected', label: "Several tools that don't talk to each other", short: "Tools that don't connect" },
  { value: 'outgrown', label: 'A system that no longer fits how we work', short: 'Outgrown its system' },
]

// ⚠️ The first rung is the one that names no software, so it is the one rung
// that is not asked which systems — see `CURRENT_APPS`.
const OPERATIONS_MANUAL = 'manual'

// Only once a rung is picked. A value that matches no rung (an older or bad
// answer carried over from a previous project) picks nothing on screen, so it
// must not open the follow-up either.
export const asksApps = (operations) =>
  operations !== OPERATIONS_MANUAL && OPERATIONS.some((o) => o.value === operations)

// ── Step 3: what you want fixed ──────────────────────────────────────────────

// ⚠️ MULTI-select, unlike the ladder above: a business wants integration AND a
// faster close AND stock it can trust, and forcing one answer throws away the
// other two. Phrased as symptoms the visitor would recognise in their own week
// rather than as categories ("Lack of digitalization of processes") — nobody
// describes their month that way.
// `short`: the same answer as a 1–3 word name, for the requirements dialog's
// badges and its edit picker, where seven sentences read as a wall of text.
// Each must make sense on its own: it is shown without the sentence. Shown only
// through `fixShort` in format.js.
export const PROBLEMS = [
  { value: 'manual-work', label: 'Manual work that should be automated', short: 'Manual work' },
  // ⚠️ THE ONE PEOPLE PROBLEM, and it was added rather than found. Without it
  // the HR and Payroll pack could never be recommended off this question. See
  // `data/recommendation.js`.
  { value: 'people', label: 'Payroll, leave and attendance are run by hand', short: 'Payroll by hand', apps: ['frappe-hr'] },
  { value: 'close', label: 'Reports take too long to put together', short: 'Slow reports', apps: ['erpnext', 'insights'] },
  { value: 'visibility', label: 'No reliable view of stock and orders', short: 'No view of stock', apps: ['erpnext'] },
  { value: 'leads', label: 'Leads and follow-ups slip through the cracks', short: 'Lost leads', apps: ['crm'] },
  { value: 'support', label: 'Customer requests get lost or answered late', short: 'Slow customer replies', apps: ['helpdesk'] },
  { value: 'scale', label: 'We are outgrowing what we have', short: 'Outgrowing current tools' },
  // ⚠️ NO LONGER OFFERED: each repeated an answer on the step before ("Several
  // tools…", "A system that no longer fits"). Kept so saved answers still read.
  { value: 'integration', label: 'Tools that do not talk to each other', short: 'Disconnected tools', offered: false },
  { value: 'fit', label: 'Our tools cannot handle how we actually work', short: 'Tools that don\'t fit', offered: false },
]

// The options for a project: the ones for the apps it needs, plus the two
// that fit any app. No apps given (a surface that doesn't ask them) shows
// every offered option.
export const problemsFor = (apps = []) =>
  PROBLEMS.filter((p) => p.offered !== false && (!p.apps || !apps.length || p.apps.some((a) => apps.includes(a))))

// ⚠️ `countries` IS THE ANSWER, `country` IS ITS FIRST PICK. A business can be
// based in more than one country, so the question takes several. Thirty-odd
// readers (currency, budget bands, the city question, partner matching) want
// ONE home market, so `country` stays and is always `countries[0]` — set
// together by `CompanyQuestions`.
export const emptyCompanyForm = () => ({
  country: SELECTABLE_COUNTRY,
  countries: [SELECTABLE_COUNTRY],
  employees: '',
  segments: [],
  apps: [],
  appsOther: '',
  operations: '',
  problems: [],
})

// Brings `country` and `countries` back into step after a form is filled from
// older answers. A project saved before the question took several has only
// `country`, and an empty one blanked the home market while the default list
// still showed India — the field read "India" and failed as unanswered.
export const syncCountries = (form) => {
  const list = form.countries ?? []
  if (form.country && !list.includes(form.country)) form.countries = [form.country]
  else if (!form.country && list.length) form.country = list[0]
  return form
}

// ⚠️ EVERY STEP IS NOW REQUIRED, which is a reversal. These questions used to
// be optional past the first — they sharpened a partner match and a wider match
// is a fine outcome. They now produce a RECOMMENDATION, and there is no wider
// version of that: skipping "what do you want fixed" doesn't loosen the answer,
// it removes the only evidence there was for one. A screen that told someone
// what to buy on the strength of three blanks would be guessing and hiding it.
//
// Keyed by field, and the page asks only about the fields on the step it is on
// — see `stepErrors`.
export const companyErrors = (form) => {
  const e = {}
  if (!form.country) e.country = 'Select a country'
  if (!form.employees) e.employees = 'Select a size'
  if (!form.segments.length) e.segments = 'Select an industry'
  else if (form.segments.length > MAX_INDUSTRIES) e.segments = `Pick up to ${MAX_INDUSTRIES}`
  if (!OPERATIONS.some((o) => o.value === form.operations)) e.operations = 'Pick the closest description'
  if (!form.problems.length) e.problems = 'Pick at least one'
  return e
}

// Which fields belong to which step, so a page can validate the step it is on
// without knowing what the other two ask. The intake walks these one at a time;
// the contact wizard shows the same three.
export const STEP_FIELDS = {
  1: ['country', 'employees', 'segments'],
  2: ['operations'],
  3: ['problems'],
}

export const stepErrors = (form, step) => {
  const all = companyErrors(form)
  return Object.fromEntries((STEP_FIELDS[step] ?? []).filter((k) => all[k]).map((k) => [k, all[k]]))
}

export const stepComplete = (form, step) => Object.keys(stepErrors(form, step)).length === 0

// What `saveCompany` is given. Trimmed here rather than at each call site, so
// two surfaces collecting the same answers cannot store them differently.
export const companyPayload = (form) => ({
  country: form.country,
  countries: form.countries?.length ? [...form.countries] : [form.country].filter(Boolean),
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

// "Something else" is the option, not the answer: when they named the app,
// the name is what gets shown.
export const appsInUse = (company) =>
  (company?.apps ?? []).map((a) => (a === APPS_OTHER && company.appsOther ? company.appsOther : a))

// The answers that go out with a broadcast, anonymously, beside the scope.
// ⚠️ EVERYTHING BUT WHO THEY ARE. Operations, apps and problems describe
// thousands of businesses and are what a partner prices against; the name and
// the contact are what a dozen firms could use to call, and those wait for a
// shortlist.
export const sharedAnswers = (company) => ({
  operations: company?.operations ?? '',
  apps: appsInUse(company),
  problems: [...(company?.problems ?? [])],
})

// The same answers as label/value rows, for any surface that prints a brief.
export const answerRows = (brief) =>
  [
    { label: 'Current operations', value: operationsLabel(brief?.operations) },
    { label: 'Apps in use', value: (brief?.apps ?? []).join(', ') },
    { label: 'Problems to solve', value: problemLabels(brief?.problems).join(', ') },
  ].filter((r) => r.value)
