// The Starter Pack catalogue.
//
// Everything here except the non-India prices is REAL: the module-by-module
// scope tables, what ships with every pack and what is strictly excluded come
// from "Starter Pack Scope Document – India" (ERPNext & Frappe HR); the terms
// come from the newer Starter Pack scope document (see `termsSectionsFor`). That document is the contract a customer buys,
// so this file is the one place its wording lives; the pack detail modal
// renders it rather than paraphrasing it.
//
// ⚠️ THE LINEUP AND THE HOURS ARE NEWER THAN THAT DOCUMENT. The packs are now
// named by their modules and priced at 5 hours each (10 for Manufacturing),
// which is a later pricing decision — the document still describes four
// nesting tiers of 30–100 hours. Where the two disagree, the lineup below
// wins and the scope tables are still the document's. `validity` is the one
// figure carried over from it unchanged, because the new sheet doesn't set
// one.
//
// ⚠️ The scope document is INDIA-ONLY. Its accounting scope names GST and TDS,
// its payroll scope names India tax configuration, and its prices are rupees
// plus 18% GST. Only India's prices are decided — see REGION_PRICING.

import { REGIONS } from './quiz'

// ⚠️⚠️ `frappe-hr` is the Frappe HR APP, and it is not ERPNext's HR module. A
// pack including `hrms`/`payroll` sells the app; `data/modules.js` carries a
// separate ERPNext `hr` module that the estimator prices. Don't conflate them.

// The three packs. `value` is the id partners are tagged with in
// `data/partners.js` — renaming one orphans every partner that sells it.
//
// ⚠️ EACH PACK IS NAMED BY THE MODULES IN IT, and that is the whole shape of
// the catalogue now. The old set was a ladder of tiers — Core ERPNext,
// Manufacturing (core plus production), All in one (all of it), Frappe HR —
// where three packs nested and a name like "All in one" told you nothing about
// what it contained. These are slices of PACK_SCOPE that a buyer combines:
// Accounts/Sales/Purchase/Stock, Manufacturing, HR and Payroll. The one
// exception is Manufacturing, which includes the core four — see its entry.
//
// Two consequences worth knowing before editing:
//
//   1. `tagline` can no longer describe contents ("Everything in Core ERPNext,
//      plus production") — the name does that, and the row prints them
//      together. It says who the pack is for.
//   2. EVERY OTHER RESTATEMENT OF THE MODULE LIST IS GONE, because the name is
//      that list and each of them printed it a second line later. With them
//      went the two display strings that fed them: `modules` (the comparison
//      table's Modules row on `/connect`) and `moduleList` (the catalogue
//      row's first detail line on `/connect/packs`). A one-module pack also
//      drops the heading in its scope panel — see `PackScope`. The rule when
//      adding a surface: say the hours, the price, the validity and the
//      scope, and let the name say the modules.
//
// ⚠️ HR and Payroll are the Frappe HR app's two modules, and the pack's `value`
// is `hrms` rather than `hr` ON PURPOSE: `data/modules.js` has an ERPNext `hr` module that the
// estimator prices, and these are not the same thing (see the warning above).
// A pack id of `hr` would put the two one typo apart.
//
// `areas` keys into PACK_SCOPE below, in the order the detail view lists them.
// The pack is exactly the sum of its areas, so a pack's coverage can't drift
// from the scope tables the way a hand-written summary would.
// Every pack is delivered WITHIN this many sessions, whatever its hours — a
// ceiling, not a count, so the copy says "within". The catalogue's "How it
// works" and each pack's page both say so.
export const SESSIONS_PER_PACK = 5

export const STARTER_PACKS = [
  {
    value: 'accounts-sales-purchase-stock',
    name: 'Core',
    // ⚠️ `tagline` is the pack's ONE line under its name, everywhere: the
    // catalogue card, the pack dialog and the pack page all print it. There
    // was a second line, `pitch`, on the dialog and the page — three surfaces,
    // two descriptions of one pack, so it went.
    tagline: 'For businesses that buy and sell goods or services',
    // ⚠️ `outcomes` and every area's `summary` are OUR copy, not the scope
    // document's. They are what a skimming reader takes away, so each one is
    // written only from rows in PACK_SCOPE — if a line promises something no
    // row covers, it is wrong, however well it sells.
    // Each outcome is an icon (named in `OUTCOME_ICONS`, PackDetailPage), a
    // title on its own line and a short body under it. ⚠️ Titles stay one line
    // four across (~22 characters); bodies may take two.
    outcomes: [
      { icon: 'invoice', title: 'Sales', body: 'From quotation to payment' },
      { icon: 'purchase', title: 'Purchases', body: 'From material request to payment' },
      { icon: 'stock', title: 'Stock', body: 'Transfers, reconciliation and balance' },
      { icon: 'books', title: 'Your books', body: 'Reconciled, with P&L and balance sheet' },
    ],
    // ⚠️ The document's own labels for these four are Accounting, Selling,
    // Buying and Stock. The pack is named in the pricing sheet's
    // vocabulary; the scope tables keep the document's. Same four modules.
    // ⚠️ `highlights` are the pack page's rows under the price: three, only
    // what a buyer would weigh — no flow or report restated for its own sake —
    // drawn from the module stars, each its star's icon and one sentence. The sentence NAMES
    // THE FEATURE in plain words — what it does, never how it feels; the
    // people reading know these terms from Tally and spreadsheets. One line at
    // the column's width, two at most. Every row is backed by a star in
    // PACK_SCOPE, which the page's full scope lists.
    highlights: [
      { icon: 'file-text', text: 'Sales and purchases tracked from first quote to payment' },
      { icon: 'arrow-left-right', text: 'Bank statements matched to your ledger' },
      { icon: 'chart-line', text: 'P&L and balance sheet from your own entries' },
    ],
    areas: ['accounting', 'selling', 'buying', 'inventory'],
    apps: ['erpnext'],
    hours: 5,
    validityDays: 30,
    validity: '30 days',
  },
  {
    value: 'manufacturing',
    name: 'Core + Manufacturing',
    // ⚠️ Says who the pack is for, like the other two — not what is in it. That
    // it ships with the core four is on its page and in its dialog, which list
    // all five modules.
    tagline: 'For businesses that make what they sell',
    outcomes: [
      { icon: 'bom', title: 'Bills of materials', body: 'What each product is made of' },
      { icon: 'factory', title: 'Shop floor', body: 'Work orders and job cards for every run' },
      { icon: 'stock', title: 'Production stock', body: 'Materials out, finished goods in' },
      { icon: 'core', title: 'The core four', body: 'Sales, purchases, stock and books' },
    ],
    // ⚠️ THE ONE PACK THAT CONTAINS ANOTHER. Manufacturing ships with the core
    // four, because production is planned against the stock and orders they
    // keep, so it costs the core pack's hours plus its own. The catalogue shows
    // the two as an either-or on one card. `supersedes` is what stops a basket
    // holding both and paying for the core twice — see `togglePack` in the
    // store and `recommendationFor`.
    supersedes: ['accounts-sales-purchase-stock'],
    // Two for production, then the core pack it ships with — named, not
    // repeated row by row.
    highlights: [
      { icon: 'layers', text: 'Bills of materials for what you make' },
      { icon: 'clipboard-list', text: 'Work orders and job cards, with materials and finished goods moved in stock' },
      { icon: 'package', text: 'Everything in Core' },
    ],
    areas: ['manufacturing', 'accounting', 'selling', 'buying', 'inventory'],
    apps: ['erpnext'],
    hours: 10,
    validityDays: 60,
    validity: '60 days',
  },
  {
    // ⚠️ ONE PACK, AND IT WAS TWO. HR and Payroll were sold apart, 5 hours each,
    // so a business could start with its people records and add salaries later.
    // They are one 10-hour pack again: payroll runs off the employee records
    // and attendance HR keeps, so nobody buys one without the other.
    //
    // `value` stays `hrms`: it is the id partners are tagged with in
    // `data/partners.js`, and the firms that sold HR still sell this.
    value: 'hrms',
    name: 'HR and Payroll',
    tagline: 'For people, leaves and salaries on one record',
    outcomes: [
      { icon: 'employee', title: 'Employee records', body: 'Every employee on one record' },
      { icon: 'attendance', title: 'Leave and attendance', body: 'Tracked against your policies' },
      { icon: 'expense', title: 'Expense claims', body: 'Submitted and approved in the system' },
      { icon: 'salary', title: 'Salary slips', body: 'Every cycle, with India’s standard tax' },
    ],
    highlights: [
      { icon: 'calendar-days', text: 'Leave, attendance and shifts tracked against your policies' },
      { icon: 'wallet', text: 'Salary slips every cycle, with income tax on Indian slabs' },
      { icon: 'receipt', text: 'Expense claims submitted and approved in the system' },
    ],
    areas: ['hrms', 'payroll'],
    apps: ['frappe-hr'],
    hours: 10,
    validityDays: 30,
    validity: '30 days',
  },
]

// Packs that cannot share a basket with `value`: the ones it supersedes and the
// ones that supersede it. Adding one takes the others out.
export const packConflicts = (value) => {
  const pack = STARTER_PACKS.find((p) => p.value === value)
  return [
    ...(pack?.supersedes ?? []),
    ...STARTER_PACKS.filter((p) => p.supersedes?.includes(value)).map((p) => p.value),
  ]
}

// Price is `hours × rate`, always — which is how the real India sheet is built:
// ₹10,000 for 5 hours, a flat ₹2,000/hr across every pack.
// That rate is unchanged from the sheet the old 30–100 hour packs were priced
// off (₹80,000 for 40 hours was the same ₹2,000), so the repricing is a change
// of hours and not of rate. Deriving rather than listing three prices per region
// means a pack's hours and its price cannot disagree.
//
// ⚠️ INDIA IS REAL. The other five rates are INVENTED — pricing for those
// regions isn't decided yet. They're each set below the local partner rates in
// `data/partners.js`, so a pack still reads as the discounted fixed-scope
// product it is, but don't quote any of them.
//
// One currency per region rather than per country: the directory groups
// partners this way (see `data/quiz.js`), and a mock that invents a rate for
// every market would assert far more than it knows.
//
// ⚠️ `taxRate` is set for INDIA ONLY, and the absence elsewhere is the point.
// 18% GST is in the scope document; no other market's rate has been decided, and
// a checkout that adds an invented VAT charges a number nobody agreed. Where it
// is null the checkout prints the tax line without a figure and the total is the
// subtotal — see `checkoutFor`.
const REGION_RATES = {
  india: { currency: 'INR', locale: 'en-IN', rate: 2000, tax: '18% GST', taxRate: 0.18, real: true },
  asia: { currency: 'USD', locale: 'en-US', rate: 40, tax: 'local taxes', taxRate: null },
  'middle-east': { currency: 'USD', locale: 'en-US', rate: 55, tax: 'local VAT', taxRate: null },
  africa: { currency: 'USD', locale: 'en-US', rate: 35, tax: 'local taxes', taxRate: null },
  europe: { currency: 'EUR', locale: 'en-IE', rate: 70, tax: 'local VAT', taxRate: null },
  americas: { currency: 'USD', locale: 'en-US', rate: 85, tax: 'sales tax', taxRate: null },
}

// The display name comes from the directory's own region list rather than being
// typed again here — the quiz, the map, the results filter and now the pack
// prices all have to call India "India" and the Middle East "Middle East", and
// two lists of the same six labels is one list too many.
// ⚠️ India is a PRICING MARKET here, not a region. The directory's taxonomy
// moved it inside Asia as a country (`REGIONS` in `data/quiz.js`), but the rate
// card is still per market and India's is the only real one — so this table
// keeps its own key and carries its own label rather than looking one up that
// no longer exists. The other five are region values and do resolve, but they
// are named here too: a price label should not go blank because a filter's
// taxonomy was reorganised.
const REGION_LABELS = { india: 'India' }

export const REGION_PRICING = Object.fromEntries(
  Object.entries(REGION_RATES).map(([value, rate]) => [
    value,
    {
      ...rate,
      label: REGION_LABELS[value] ?? REGIONS.find((r) => r.value === value)?.label ?? value,
    },
  ]),
)

// India is the default because it's the only priced region, and because it's 71
// of the directory's 156 partners.
export const DEFAULT_REGION = 'india'

// The pricing market a COUNTRY falls in.
//
// ⚠️ India is its own market and not Asia's, which is the whole reason this
// can't be a plain country-to-region lookup: the directory files India inside
// Asia (`REGIONS` in `data/quiz.js`), but India has the only real rate card —
// ₹2,000/hr — and Asia's is an invented $40. Reading India as Asia would quote
// an Indian business in dollars at a rate nobody agreed.
//
// Returns null for a country in no region, so callers can fall through to
// whatever they were doing before.
const REGION_OF_COUNTRY = Object.fromEntries(
  REGIONS.flatMap((r) => r.countries.map((c) => [c, r.value])),
)

export const marketFor = (country) =>
  country === 'India' ? 'india' : (REGION_OF_COUNTRY[country] ?? null)

// ⚠️ HOSTING IS EXTRA, and said wherever a pack's cost is: the packs need a
// Frappe Cloud plan of ₹820/month or USD 10/month and up (the scope
// document's eligibility term), billed later and separately — not at this
// checkout. Those two figures are the
// document's; every non-India market quotes the dollar one, since no other
// currency's plan price is set.
const HOSTING_FROM = { india: { amount: 820, currency: 'INR', locale: 'en-IN' } }
const HOSTING_FROM_USD = { amount: 10, currency: 'USD', locale: 'en-US' }
// The figure alone, for the bill's hosting row (`PackBasket`).
export const hostingFromFor = (region) => {
  const h = HOSTING_FROM[region] ?? HOSTING_FROM_USD
  return `from ${money(h.amount, h)}/month`
}
export const hostingLineFor = (region) => `Plus hosting ${hostingFromFor(region)}, billed later`

export const pricingFor = (region) => REGION_PRICING[region] ?? REGION_PRICING[DEFAULT_REGION]

// `Intl` rather than a symbol and a template string, because India groups
// digits differently: ₹1,40,000, not ₹140,000. Getting that wrong is the kind
// of detail an Indian reader notices immediately.
const money = (amount, { currency, locale }) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

// What a pack costs in a region, formatted. Tax is quoted separately — the
// source document prices ex-tax and says "GST (18%) applicable extra", so
// folding it in would misstate the invoice.
export const priceFor = (pack, region = DEFAULT_REGION) =>
  money(pack.hours * pricingFor(region).rate, pricingFor(region))

// What the checkout charges, broken into the lines it prints: one per pack,
// then the tax, then what leaves the account.
//
// ⚠️ TAKES A LIST, because a basket is the normal case now — the packs are
// disjoint modules and the recommendation screen ticks several at once. A
// single pack is a list of one; there is no second single-pack function, so no
// screen can quietly total a basket differently from the one that charges for
// it.
//
// ⚠️ THE ONLY PLACE THAT ADDS TAX. Everywhere else quotes ex-tax and says so —
// the catalogue's "before 18% GST", the pack page's fact row, the commercial
// terms' "charged on top" — because that is how the scope document prices. The
// checkout is where the buyer needs the figure that actually leaves the
// account, so this is the one function that produces it.
//
// `exact` is false where a market has no decided rate: the tax line then prints
// its label with no figure and `total` equals the subtotal, which is honest
// about what is known rather than quietly charging a made-up percentage.
export const checkoutFor = (packs, region = DEFAULT_REGION) => {
  const p = pricingFor(region)
  const list = [packs].flat().filter(Boolean)
  const hours = list.reduce((sum, pack) => sum + pack.hours, 0)
  const subtotal = hours * p.rate
  // Rounded to the currency's whole unit, matching `money`'s own formatting —
  // a total that doesn't equal the lines above it as printed is the kind of
  // arithmetic a buyer checks and a business gets a support ticket about.
  const tax = p.taxRate == null ? null : Math.round(subtotal * p.taxRate)
  return {
    // One line per pack, already formatted, so the checkout renders rather than
    // calculates. `hours` rides along because the basket's total effort is what
    // the pack window is measured in.
    lines: list.map((pack) => ({
      value: pack.value,
      name: pack.name,
      hours: pack.hours,
      price: money(pack.hours * p.rate, p),
    })),
    hours,
    subtotal: money(subtotal, p),
    taxLabel: p.tax,
    tax: tax == null ? null : money(tax, p),
    total: money(subtotal + (tax ?? 0), p),
    exact: tax != null,
  }
}

// THE THREE FACTS, worded once.
//
// ⚠️ This exists because the same pack was described four different ways across
// four screens of one purchase: "10 hrs of effort" on the catalogue and "10 hrs
// / Of implementation effort" on the pack page, "60 days to deliver" here and
// "60 days delivery time" in the booking panel — a wording `data/project.js`
// already carried a note about, because it had to pick one. A buyer crossing
// four screens should meet one object described one way; the only thing that
// changes is what they can do to it.
//
// Each fact carries both shapes it is needed in, and no surface composes its
// own: `line` for the one-line lists (catalogue row, booking panel), `value`
// plus `note` for the two-line row (the pack page). Adding a fifth surface
// means picking one of the two, not writing a fifth phrasing.
//
// ⚠️ "to deliver", NOT "delivery time". The scope document puts data readiness,
// approvals and user availability on the CUSTOMER and runs the validity clock
// regardless, so "60 days delivery time" reads as Frappe committing to finish
// inside the window — a promise the terms don't give. This is the line that
// kept drifting back; it lives here now so it can only be wrong in one place.
export const packFacts = (pack, region = DEFAULT_REGION) => {
  const price = priceFor(pack, region)
  return [
    {
      key: 'price',
      value: price,
      line: price,
      // The two conditions on the figure, and the payee is the one this flow
      // has to keep saying: a price beside a partner reads as the partner's.
      note: `To Frappe, before ${pricingFor(region).tax}`,
    },
    {
      key: 'effort',
      value: `${pack.hours} hrs`,
      line: `${pack.hours} hrs of effort`,
      note: 'Of implementation effort',
    },
    {
      key: 'delivery',
      value: pack.validity,
      line: `${pack.validity} to deliver`,
      note: 'To deliver, from the start date',
    },
  ]
}

// Hours beyond the pack are billed at the same rate the pack is priced at —
// the India sheet's ₹2,000/hr add-on rate is exactly its pack rate, so there's
// no bulk discount to model.
export const additionalHourRateFor = (region = DEFAULT_REGION) =>
  money(pricingFor(region).rate, pricingFor(region))

// The scope tables, in the scope documents' own wording (see the note on the
// ERPNext modules inside).
//
// Rows are ordered as printed — masters, then transactions, then reports, then
// settings, then exclusions — because that's the order the work happens in, and
// the exclusions read as the end of a list rather than as a warning bolted on.
// A pack renders only the areas it includes (see `areas` above).
// ⚠️ A row may carry `screenshot`, an imported image URL, and the pack page
// shows it beside that sub-section. None do yet; `PackScopeShot` stands in a
// named placeholder until they do.
// ⚠️ `stars` and `alsoSetUp` are what the pack page shows: three highlighted
// features per module, written from the rows below, and every other row's
// items as one plain list. HRMS and Payroll fit entirely in their stars. The
// `rows` are kept as the scope document's own wording and are no longer shown.
export const PACK_SCOPE = {
  // ⚠️ ACCOUNTING, SELLING, BUYING, INVENTORY AND MANUFACTURING are from the
  // newer "Starter Pack Scope" (ERPNext Starter Pack): guided walkthroughs of
  // the standard flows, not set-up of every master and report. HRMS and
  // Payroll below are still the India document's.
  accounting: {
    label: 'Accounting',
    summary: 'Journal entries and reconciliations, with the key financial reports.',
    stars: [
      { icon: 'arrow-left-right', title: 'Bank reconciliation', body: 'Statements matched to ledger' },
      { icon: 'banknote', title: 'Payment reconciliation', body: 'Payments matched to invoices' },
      { icon: 'chart-line', title: 'Financial statements', body: 'P&L, balance sheet, trial balance' },
    ],
    alsoSetUp: [
      'chart of accounts', 'fiscal year', 'journal entries', 'accounts receivable', 'accounts payable',
    ],
    // The pack page's scope (`PackDetailPage`, "What the sessions cover"): a
    // `flow` where the document walks a sequence, otherwise `items` and the
    // `reports` read from them.
    items: ['Journal entry', 'Payment reconciliation', 'Bank reconciliation'],
    reports: ['Profit and loss', 'Balance sheet', 'Trial balance', 'Accounts receivable', 'Accounts payable'],
    rows: [
      { area: 'Setup', items: ['Chart of Accounts', 'Fiscal Year'] },
      {
        area: 'Walkthrough',
        items: ['Journal Entry', 'Payment Reconciliation', 'Bank Reconciliation'],
      },
      {
        area: 'Reports',
        items: [
          'Profit & Loss Statement',
          'Balance Sheet',
          'Trial Balance',
          'Accounts Receivable',
          'Accounts Payable',
        ],
      },
      {
        area: 'Not included',
        items: [
          'Complex, custom, or multi-dimensional Accounting Dimension configuration',
          'Stock and Account Opening Balance import',
        ],
        excluded: true,
      },
    ],
  },
  selling: {
    label: 'Selling',
    summary: 'The order-to-cash flow, from quotation to payment.',
    stars: [
      { icon: 'file-text', title: 'Quotation → Order → Invoice', body: 'Each built from the previous' },
      { icon: 'truck', title: 'Delivery notes', body: 'Stock reduced on delivery' },
      { icon: 'banknote', title: 'Customer payments', body: 'Recorded against invoices' },
    ],
    alsoSetUp: [],
    flow: ['Quotation', 'Sales order', 'Delivery note', 'Sales invoice', 'Payment'],
    rows: [
      {
        area: 'Walkthrough',
        items: ['Quotation', 'Sales Order', 'Delivery Note', 'Sales Invoice', 'Payment'],
      },
    ],
  },
  buying: {
    label: 'Buying',
    summary: 'The procure-to-pay flow, from material request to payment.',
    stars: [
      { icon: 'shopping-cart', title: 'Request → Order → Receipt', body: 'Material request to goods in' },
      { icon: 'file-check', title: 'Purchase invoices', body: 'Supplier bills from the receipt' },
      { icon: 'banknote', title: 'Supplier payments', body: 'Recorded against bills' },
    ],
    alsoSetUp: [],
    flow: ['Material request', 'Purchase order', 'Purchase receipt', 'Purchase invoice', 'Payment'],
    rows: [
      {
        area: 'Walkthrough',
        items: [
          'Material Request',
          'Purchase Order',
          'Purchase Receipt',
          'Purchase Invoice',
          'Payment',
        ],
      },
    ],
  },
  inventory: {
    label: 'Stock',
    summary: 'Stock transfers and reconciliation, with the stock ledger and balance.',
    stars: [
      { icon: 'boxes', title: 'Stock transfers', body: 'Moved between warehouses' },
      { icon: 'scale', title: 'Stock reconciliation', body: 'Physical count matched to system' },
      { icon: 'building-2', title: 'Stock ledger and balance', body: 'Every movement and what’s left' },
    ],
    alsoSetUp: [],
    items: ['Stock transfer', 'Stock reconciliation'],
    reports: ['Stock ledger', 'Stock balance'],
    rows: [
      { area: 'Walkthrough', items: ['Stock Transfer', 'Stock Reconciliation'] },
      { area: 'Reports', items: ['Stock Ledger', 'Stock Balance Report'] },
      {
        area: 'Not included',
        items: [
          'Inventory Dimension configuration or consulting',
          'Quality feature configuration or consulting',
        ],
        excluded: true,
      },
    ],
  },
  manufacturing: {
    label: 'Manufacturing',
    summary: 'The standard production flow, from bill of materials to job card.',
    stars: [
      { icon: 'layers', title: 'Bills of materials', body: 'What each product is made of' },
      { icon: 'clipboard-list', title: 'Work orders and job cards', body: 'For each production run' },
      { icon: 'boxes', title: 'Production stock entries', body: 'Materials out, goods in' },
    ],
    alsoSetUp: [],
    flow: ['Bill of materials', 'Work order', 'Stock entry', 'Job card', 'Stock entry'],
    rows: [
      {
        area: 'Walkthrough',
        items: ['Bill of Materials', 'Work Order', 'Stock Entry', 'Job Card', 'Stock Entry'],
      },
      {
        area: 'Not included',
        items: [
          'Production and Capacity Planning',
          'Material Requirement Planning (MRP)',
          'Subcontracting',
        ],
        excluded: true,
      },
    ],
  },
  hrms: {
    label: 'HRMS',
    summary: 'Employee records, leave, attendance, shifts and expenses, with approvals.',
    stars: [
      { icon: 'contact', title: 'Employee master', body: 'Skills and certifications' },
      { icon: 'calendar-days', title: 'Leave, attendance and shifts', body: 'Policies, balances and shifts' },
      { icon: 'receipt', title: 'Expense claims', body: 'With a standard approval flow' },
    ],
    alsoSetUp: [],
    items: [
      'Employee master',
      'Leave policies',
      'Leave applications',
      'Attendance and shifts',
      'Expense claims',
      'Standard approval workflows',
      'Custom fields like skills and certifications',
    ],
    rows: [
      {
        area: 'Configuration',
        items: [
          'Employee master',
          'Leave management',
          'Attendance and shifts',
          'Leave policies',
          'Expense claims',
          'Standard approval workflows',
        ],
      },
      {
        area: 'Basic customization',
        items: ['Adding fields to HRMS doctypes, like skills and certifications'],
      },
      {
        area: 'Not included',
        items: ['Advanced KPI frameworks', 'Third-party integrations'],
        excluded: true,
      },
    ],
  },
  payroll: {
    label: 'Payroll',
    summary: 'Salary structures and slips every cycle, with India’s standard tax setup.',
    stars: [
      { icon: 'wallet', title: 'Salary structures', body: 'Earnings and deductions' },
      { icon: 'percent', title: 'Indian tax configuration', body: 'Income tax on standard slabs' },
      { icon: 'file-text', title: 'Salary slips', body: 'Every employee, every cycle' },
    ],
    alsoSetUp: [],
    items: ['Salary structures', 'Payroll cycle', 'Tax configuration for India', 'Salary slips'],
    rows: [
      {
        area: 'Setup',
        items: [
          'Salary structures',
          'Payroll cycle',
          'Standard tax configuration (India)',
          'Salary slip format',
        ],
      },
      {
        area: 'Not included',
        items: ['Multi-country payroll', 'Advanced scripted calculations'],
        excluded: true,
      },
    ],
  },
}

// The ERPNext scope document's two sections either side of the modules: the
// set-up done first, and the data and users shown last. Every ERPNext pack
// has both; the pack page lists them as its first and last rows.
// ⚠️ DATA IS A HOW-TO, not the work: the document excludes importing the
// customer's data, so the sentence says "how to".
export const ERPNEXT_SETUP = {
  label: 'Setup',
  // One sentence rather than a list — the pack page prints `sentence` as is.
  sentence:
    'Your site and ERPNext instance, company and print settings, chart of accounts, fiscal year and initial system configuration.',
}
export const ERPNEXT_DATA = {
  label: 'Data and users',
  sentence:
    'How to import items, customers and addresses with Excel templates, update stock and account opening balances, and create users with basic permissions.',
}

// Every module area the catalogue covers, in the document's own order.
//
// The three packs cover exactly this list: Accounts/Sales/Purchase/Stock takes
// the first four, Manufacturing those four plus the fifth, HR and Payroll the
// last two. Manufacturing is the only overlap, and a basket can hold it or the
// core pack, never both. That shape is the most useful thing a buyer can know about the
// three, so it's exported rather than left implicit in each pack's `areas`.
// A pack's modules as one line — the catalogue card's third fact and the
// cart's. The scope document's own labels, in the order the pack page lists
// them; "A, B, C and D", no serial comma. A pack that contains another names
// that pack and only what it adds.
const joinLabels = (areas) => {
  const labels = areas.map((a) => PACK_SCOPE[a].label)
  // A no-break space ties "and" to the last label, so a wrap takes them down
  // together rather than leaving "and" at the end of the first line.
  return labels.length < 2
    ? labels.join('')
    : `${labels.slice(0, -1).join(', ')} and\u00a0${labels.at(-1)}`
}
export const packModules = (pack) => {
  const inner = STARTER_PACKS.find((p) => pack.supersedes?.includes(p.value))
  if (!inner) return joinLabels(pack.areas)
  return `Everything in ${inner.name}, plus ${joinLabels(pack.areas.filter((a) => !inner.areas.includes(a)))}`
}

export const SCOPE_AREAS = Object.keys(PACK_SCOPE).map((key) => ({
  key,
  label: PACK_SCOPE[key].label,
}))

// ── What buying one actually sets off ───────────────────────────────────────
// ⚠️ THREE THINGS IN ORDER, and the order is the product. You buy the pack from
// Frappe; Frappe's own team implements it; the two of you get on with it. It
// used to be "Frappe assigns a partner" in the middle — packs are implemented
// by Frappe itself now, and no partner is assigned.
//
// ⚠️ Step 1 names WHO IS PAID, and it is the page's only statement of it.
//
// ⚠️ Lifted out of `PackDetailPage`, which owned it privately, when the
// recommendation screen needed the same three lines. Two copies of a sequence
// is how the two screens come to disagree about what order things happen in.
// Two versions, by who implements: Frappe's own team, or a partner Frappe
// assigns (main's wording). The Demo menu picks — see `packImplementer`.
// ⚠️ The middle line is the tight one wherever this is laid out in three
// columns — it is the only cell padded on both sides. Keep it short: "Frappe
// assigns you a partner" measured 195px and took two lines.
export const packSteps = (byFrappe = true) => [
  { title: 'Pay in full', body: 'To Frappe, up front' },
  byFrappe
    ? { title: 'Frappe implements it', body: 'With its own team' }
    : { title: 'Frappe assigns a partner', body: 'By industry and region' },
  byFrappe
    ? { title: 'Coordinate with Frappe', body: 'Share data and processes' }
    : { title: 'Coordinate with partner', body: 'Share data and processes' },
]

// Section 4 — ships with every pack regardless of which one you buy.
export const INCLUDED_IN_ALL = [
  'ERPNext installed on Frappe Cloud',
  'Standard user roles',
  'One SMTP setup',
  'Standard module-wise dashboards',
  'Core system configuration',
  'One data import session',
  'One naming series session',
  'Opening balances',
]

// Section 5 — out of scope for every pack, available as paid add-ons. This list
// is the reason a pack is cheap and fast, so it's given the same weight as the
// inclusions rather than being buried in fine print.
// A bare string, or `{ label, hint }` when the line carries a caveat that would
// otherwise double its length. Same shape as the vision section's tags — see
// `components/PartnerVisionSection.vue`.
// ⚠️ Where a line needs a qualifier, the qualifier goes in `hint`, not in
// parentheses on the label. Three of these ran past the column's 304px and
// wrapped, and a wrapped exclusion reads as the loudest thing in the list —
// which is backwards, since the wrap is about sentence length, not importance.
export const STRICTLY_EXCLUDED = [
  'Custom print formats',
  'Custom scripting (Python / server scripts)',
  { label: 'API integrations', hint: 'Biometric devices, banks and payment gateways' },
  {
    label: 'Data cleaning and data import/migration',
    hint: 'You provide clean Excel or CSV data',
  },
  'UAT training',
  'Custom workflows',
  'Complex notification automation',
  { label: 'Post go-live support beyond Day 1', hint: 'Covered by an AMC' },
]

// A line is a bare string until it needs a caveat. One place decides which.
export const asExclusion = (item) => (typeof item === 'string' ? { label: item, hint: null } : item)

// ── When a pack is the wrong thing to buy ───────────────────────────────────
// ⚠️ THIS ANSWERS A QUESTION THE RECOMMENDATION SCREEN WAS ASKING BADLY. That
// screen offered "Bigger job? Get quotes from partners instead" — a link asking
// somebody to self-diagnose against a criterion nobody had given them, three
// lines after being told a pack fits. Nobody knows whether their job is
// "bigger". Everybody knows whether they need their data migrated.
//
// ⚠️ LIFTED FROM THE CONTRACT, NOT WRITTEN. Three of the four are the scope
// document's own exclusions, matched by fragment so the wording here cannot
// drift from the wording a customer is held to — the same device
// `data/project.js` uses for the customer responsibilities, and it throws at
// module load rather than falling back silently. The fourth is the user limit
// from the commercial terms, which is a real figure too.
//
// ⚠️ FOUR, out of eight exclusions. The rest are add-ons you can buy against a
// pack — UAT training, post-go-live support — and listing those here would say
// "go custom" about things a pack handles perfectly well with a change request.
// These four are the ones with no version that fits inside a fixed scope.
const excluded = (fragment) => {
  const found = STRICTLY_EXCLUDED.map(asExclusion).find((e) =>
    e.label.toLowerCase().includes(fragment),
  )
  if (!found) throw new Error(`No exclusion matching "${fragment}"`)
  return found.label
}

// Real, from the commercial terms below — the one hard number in the set, and
// named because it is the one line here that is NOT a section 5 exclusion. A
// screen printing the exclusions has to be able to put it in the same list
// without the list pretending it came from the same section.
export const PACK_USER_LIMIT = 'More than 50 people using it'

export const PACK_WONT_COVER = [
  PACK_USER_LIMIT,
  excluded('data cleaning'),
  excluded('custom scripting'),
  excluded('api integrations'),
]

// ── The exclusions, split by what you can do about them ─────────────────────
// ⚠️ A PARTITION, DERIVED. Section 5 says every one of these is available as a
// paid add-on, and that is true of five of them; the other three plus the user
// limit are the ones with no version that fits a fixed scope. A screen that
// lists all eight under one heading tells somebody to go and get quotes over a
// print format, and one that lists only four hides half the contract.
//
// Membership is computed from `PACK_WONT_COVER` rather than typed twice, so an
// exclusion cannot land in both lists or in neither — the same reason
// `excluded()` matches by fragment instead of retyping the document's wording.
export const PACK_ADD_ONS = STRICTLY_EXCLUDED.map(asExclusion).filter(
  (e) => !PACK_WONT_COVER.includes(e.label),
)

// The four as `{ label, hint }`, so one row template prints either list. The
// user limit has no section 5 entry and therefore no hint, which is correct:
// there is nothing to qualify about it.
export const PACK_BLOCKERS = PACK_WONT_COVER.map(
  (label) =>
    STRICTLY_EXCLUDED.map(asExclusion).find((e) => e.label === label) ?? { label, hint: null },
)

// ── The same four, said both ways ───────────────────────────────────────────
// ⚠️ THE CONTRACT'S WORDING IS A LIST OF THINGS YOU CANNOT HAVE, and read as a
// section under the price it is four reasons not to buy. It is the same four
// facts either way: "API integrations" as an exclusion is "you need API
// integrations" as a reason to talk to a partner, and only the second is
// something a reader can check against their own situation.
//
// ⚠️ AND THE ANSWER FLIPS WITH THE SCREEN. These four are the line between the
// two services, so which side of it is worth printing depends entirely on which
// side the reader is being shown. On the packs half they are the case for
// leaving: more than 50 people, data to migrate, scripting, integrations. On
// the custom half the same four tests are the case for a pack, and printing the
// custom reasons there was the screen arguing for what it had already
// recommended. One list, two readings, and neither can drift from the other
// because there is one list.
//
// ⚠️ A SEPARATE MAP RATHER THAN A REWRITE. `label` stays exactly as the
// commercial terms word it, because the pack's own scope panel quotes the
// document and must go on quoting it. These are the readings, keyed to the
// label so a renamed exclusion loses its sentences loudly instead of silently
// keeping the wrong ones. Each reading carries its exclusion's `hint` in the
// sentence itself — the list has no tooltips.
const BOTH_WAYS = {
  [PACK_USER_LIMIT]: {
    need: 'More than 50 people will use it',
    fits: 'Fewer than 50 people will use it',
  },
  [excluded('data cleaning')]: {
    need: "Your data isn't clean Excel or CSV yet",
    fits: 'Your data is ready as clean Excel or CSV',
  },
  [excluded('custom scripting')]: {
    need: 'You need custom scripting',
    fits: 'ERPNext as it ships covers how you work',
  },
  [excluded('api integrations')]: {
    need: 'You need bank, payment or device integrations',
    fits: 'Nothing connects to banks, payments or devices',
  },
}

export const PACK_FIT_TESTS = PACK_BLOCKERS.map((e) => ({
  ...e,
  need: BOTH_WAYS[e.label]?.need ?? e.label,
  fits: BOTH_WAYS[e.label]?.fits ?? e.label,
}))

// HOW IT WORKS, worded once for every screen that shows it: the catalogue
// draws `title` and `body` in three columns, the cart's rail the `title`
// alone, so each title has to stand on its own. One line each in the
// catalogue's columns: a long title there wrapped beside a short one. The order is the flow as
// built — payment, then the company questions on the project (a required
// task before the kickoff), then the sessions.
// ⚠️ "Guided", never "implemented": implementation and consulting are
// partners' work, and the scope document sells onboarding.
export const packStepsFor = (region = DEFAULT_REGION) => [
  {
    key: 'pay',
    title: 'Pay a fixed price upfront',
    body: `Plus ${pricingFor(region).tax}. Nothing in the pack's scope costs extra.`,
  },
  {
    key: 'company',
    title: 'Tell us about your company',
    body: 'A few questions on your project, answered before the kickoff call.',
  },
  {
    key: 'sessions',
    title: 'Join live onboarding sessions',
    body: 'With Frappe specialists, scheduled in advance, one module at a time.',
  },
]

// What the customer owes: attending on time is the scope document's term 3;
// the project champion is kept by decision from the earlier document.
export const CUSTOMER_RESPONSIBILITIES = [
  'Nominate a project champion',
  'Attend each session at its scheduled time',
]

// The "Terms & Conditions" of the new Starter Pack scope document, in its
// order, plus payment in advance and tax, which it doesn't state. Extra
// hours, validity, the user limit and the warranty threshold are not in it,
// so they are not here.
// ⚠️ Two terms are worded for the lineup, not copied. The document describes
// one ERPNext pack of 5 one-hour sessions covering five modules; the packs
// here differ in hours and modules, so these lines name "your pack" instead.
// The eligibility figure is the same one the hosting line quotes.
// ⚠️ GROUPED: the terms dialog renders these as sections; `commercialTermsFor`
// flattens all but the customer's part back into one list for the
// recommendation screen, so there is still one source for every line.
export const termsSectionsFor = (region = DEFAULT_REGION) => {
  const h = HOSTING_FROM[region] ?? HOSTING_FROM_USD
  return [
    {
      key: 'eligibility',
      label: 'Eligibility',
      lines: [`For Frappe Cloud customers on plans of ${money(h.amount, h)}/month and above`],
    },
    {
      key: 'sessions',
      label: 'Sessions',
      lines: [
        "Your pack's hours are guided onboarding sessions, scheduled in advance",
        "Missed sessions can't be rescheduled or carried forward, and count as used",
      ],
    },
    {
      key: 'scope',
      label: 'Scope',
      lines: [
        'Covers the modules your pack lists, and their basic, standard features',
        'Other modules and advanced features are outside the scope',
        'Topics outside the scope can be explored through ERPNext documentation, videos and community resources, or with an ERPNext partner',
        'Frappe decides whether a question, request or use case is in scope',
      ],
    },
    {
      key: 'payment',
      label: 'Payment',
      lines: [
        // Not in the scope document, kept by decision: a pack is bought from
        // Frappe and paid for at checkout, with tax added there.
        'Payment to Frappe in full, in advance',
        `${pricingFor(region).tax} charged on top`,
        'Fees are non-refundable and non-transferable',
      ],
    },
    { key: 'responsibilities', label: 'What we need from you', lines: CUSTOMER_RESPONSIBILITIES },
  ]
}

export const commercialTermsFor = (region = DEFAULT_REGION) =>
  termsSectionsFor(region)
    .filter((s) => s.key !== 'responsibilities')
    .flatMap((s) => s.lines)
