// The Starter Pack catalogue.
//
// Everything here except the non-India prices is REAL: the module-by-module
// scope tables, what ships with every pack, what is strictly excluded and the
// commercial and contractual terms come from "Starter Pack Scope Document –
// India" (ERPNext & Frappe HR). That document is the contract a customer buys,
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
// what it contained. These three are disjoint slices of PACK_SCOPE that a buyer
// combines: Accounts/Sales/Purchase/Stock, Manufacturing, HR and Payroll.
// Nothing is a prefix of anything, so `name` and `areas` are two renderings of one
// list rather than two ways of saying "and the rest".
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
export const STARTER_PACKS = [
  {
    value: 'accounts-sales-purchase-stock',
    name: 'Accounts, Sales, Purchase, Stock',
    // ⚠️ `tagline` says who the pack is FOR, `pitch` says what it lets you do.
    // Neither one lists modules any more — the name is the module list, and on
    // the catalogue row the tagline sits directly under it.
    tagline: 'Where most businesses start',
    pitch: 'Run the business without spreadsheets.',
    // ⚠️ The document's own labels for these four are Accounting, Selling,
    // Buying and Inventory. The pack is named in the pricing sheet's
    // vocabulary; the scope tables keep the document's. Same four modules.
    areas: ['accounting', 'selling', 'buying', 'inventory'],
    apps: ['erpnext'],
    hours: 5,
    validityDays: 30,
    validity: '30 days',
  },
  {
    value: 'manufacturing',
    name: 'Manufacturing',
    tagline: 'For businesses that make what they sell',
    pitch: 'Plan production against real stock.',
    areas: ['manufacturing'],
    apps: ['erpnext'],
    hours: 10,
    validityDays: 60,
    validity: '60 days',
  },
  {
    // ⚠️ ONE PACK, TWO MODULES — and the only pack that isn't a single module.
    // HR and Payroll shipped as two 5-hour packs and were combined, because
    // nobody buys attendance and leave without intending to pay people off the
    // back of it: the split sold half a job twice. Hours are the two added
    // (5 + 5), so the price is unchanged for anyone who would have bought both
    // and higher for the handful who wanted one.
    //
    // `value` stays `hrms` rather than becoming `hr-payroll`: it is the id
    // partners are tagged with in `data/partners.js`, and keeping it means the
    // firms that sold HR still sell this. The `payroll` tag went with the pack.
    value: 'hrms',
    name: 'HR and Payroll',
    tagline: 'For a headcount that has outgrown a spreadsheet',
    pitch: 'Keep people in one place, and pay them on time.',
    areas: ['hrms', 'payroll'],
    apps: ['frappe-hr'],
    hours: 10,
    validityDays: 30,
    validity: '30 days',
  },
]

// Price is `hours × rate`, always — which is how the real India sheet is built:
// ₹10,000 for 5 hours and ₹20,000 for 10, a flat ₹2,000/hr across all three.
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

// The scope tables, verbatim from section 3 of the document.
//
// Rows are ordered as printed — masters, then transactions, then reports, then
// settings, then exclusions — because that's the order the work happens in, and
// the exclusions read as the end of a list rather than as a warning bolted on.
// A pack renders only the areas it includes (see `areas` above).
export const PACK_SCOPE = {
  accounting: {
    label: 'Accounting',
    rows: [
      {
        area: 'Masters',
        items: [
          'Chart of Accounts',
          'Fiscal Year',
          'Financial Book',
          'Accounting Period',
          'Mode of Payment',
          'GST and Tax Withholding Category (India)',
        ],
      },
      {
        area: 'Transactions',
        items: [
          'Payment / Receipt',
          'Journal Voucher',
          'Debit / Credit Note',
          'Inter Bank',
          'Bank Reconciliation',
          'Payment Reconciliation',
        ],
      },
      {
        area: 'Reports',
        items: [
          'Balance Sheet',
          'Trial Balance',
          'Profit & Loss',
          'Outstanding Receivable / Payable (detailed and summary)',
          'General Ledger',
          'TDS Summary',
          'Cash Flow',
        ],
      },
      { area: 'Settings', items: ['Accounts Settings', 'GST Settings'] },
      {
        area: 'Not included',
        items: ['Multiple entities', 'Cost centers', 'Budgeting', 'Multi-currency'],
        excluded: true,
      },
    ],
  },
  selling: {
    label: 'Selling',
    rows: [
      {
        area: 'Masters',
        items: ['Customer list (addresses and contacts)', 'Item master', 'Price list', 'Territory'],
      },
      {
        area: 'Transactions',
        items: [
          'Quotation',
          'Sales Order (with sales team and partner)',
          'Delivery Note',
          'Sales Invoice',
          'Accounting and inventory impact',
        ],
      },
      {
        area: 'Reports',
        items: [
          'Sales Analytics',
          'Sales Order Trends',
          'Inactive Customers',
          'Item-wise Sales History',
          'Pending SO Items',
          'GSTR1',
          'GST Registers',
        ],
      },
      { area: 'Settings', items: ['Selling Settings'] },
      {
        area: 'Not included',
        items: ['Loyalty programs', 'E-commerce integrations'],
        excluded: true,
      },
    ],
  },
  buying: {
    label: 'Buying',
    rows: [
      {
        area: 'Masters',
        items: [
          'Supplier master (addresses and contacts)',
          'Terms and conditions',
          'Payment terms',
        ],
      },
      {
        area: 'Transactions',
        items: [
          'Material Request',
          'RFQ',
          'Supplier Quotation (manual or portal)',
          'Purchase Order',
          'Purchase Receipt',
          'Purchase Invoice',
          'Import purchase',
          'Landed Cost Voucher',
        ],
      },
      {
        area: 'Reports',
        items: [
          'Purchase Analytics',
          'Supplier reports',
          'Item Purchase History',
          'GST purchase registers',
          'Reconciliation tools',
        ],
      },
      { area: 'Workflow', items: ['Single-level Purchase Order approval'] },
      {
        area: 'Not included',
        items: ['Multi-level approval workflows', 'Supplier portal setup'],
        excluded: true,
      },
    ],
  },
  inventory: {
    label: 'Inventory',
    rows: [
      {
        area: 'Masters',
        items: ['Item setup', 'Item Group', 'Warehouse', 'UOM', 'Batch', 'Serial No.', 'Brand'],
      },
      { area: 'Transactions', items: ['Stock Entry', 'Stock Reconciliation'] },
      {
        area: 'Reports',
        items: ['Stock Ledger', 'Stock Balance', 'Reorder Level Report', 'Batch Expiry Status'],
      },
      { area: 'Settings', items: ['Stock Settings'] },
    ],
  },
  manufacturing: {
    label: 'Manufacturing',
    rows: [
      { area: 'Masters', items: ['BOM', 'Operations', 'Workstation'] },
      {
        area: 'Transactions',
        items: ['Work Orders (single and multi-level BOM)', 'Job Card', 'Production stock entries'],
      },
      {
        area: 'Reports',
        items: [
          'Work Order Summary',
          'BOM Stock Report',
          'Production Analytics',
          'Job Card Summary',
          'Work Order stock reports',
        ],
      },
      { area: 'Settings', items: ['Manufacturing Settings'] },
      {
        area: 'Not included',
        items: [
          'Capacity planning',
          'Production forecasting',
          'Custom planning algorithms',
          'PLC and machinery integrations',
        ],
        excluded: true,
      },
    ],
  },
  hrms: {
    label: 'HRMS',
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

// Every module area the catalogue covers, in the document's own order.
//
// The four packs are four DISJOINT slices of this list, and together they are
// exactly it: Accounts/Sales/Purchase/Stock takes the first four, Manufacturing
// the fifth, HR and Payroll one each. Nothing nests and nothing overlaps, so a
// buyer who wants production on top of the basics buys two packs rather than a
// bigger one. That shape is the most useful thing a buyer can know about the
// four, so it's exported rather than left implicit in each pack's `areas`.
export const SCOPE_AREAS = Object.keys(PACK_SCOPE).map((key) => ({
  key,
  label: PACK_SCOPE[key].label,
}))

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

// Section 8.
export const CUSTOMER_RESPONSIBILITIES = [
  'Keep strictly to the scope',
  'Nominate a project champion',
  'Have your data ready',
  'Approve internally without delay',
  'Make your users available for training',
]

// Sections 6 and 7, with the region-dependent figures left as functions so a
// non-India reader isn't quoted rupees. The Frappe Cloud warranty threshold
// stays in rupees because that's the plan price Frappe publishes.
export const commercialTermsFor = (region = DEFAULT_REGION) => {
  const p = pricingFor(region)
  return [
    // ⚠️ "to Frappe" is the whole point of the line. A pack is bought from
    // Frappe and delivered by the partner Frappe assigns, so the money never
    // goes to the partner — and every other surface a buyer sees this on names
    // a partner somewhere on the same screen.
    'Payment to Frappe in full, in advance',
    `${p.tax} charged on top`,
    `Extra hours beyond the pack: ${additionalHourRateFor(region)} per hour, plus ${p.tax}`,
    'For businesses running fewer than 50 users',
    'Your Frappe Cloud subscription is billed separately',
    'Product warranty applies on Frappe Cloud plans above ₹4,100 + GST a month',
    'Scope is limited to what this document lists. Anything else is a change request, and more hours',
    'Validity runs from the project start date',
  ]
}
