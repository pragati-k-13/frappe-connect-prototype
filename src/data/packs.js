// The Starter Pack catalogue.
//
// Everything here except the non-India prices is REAL, lifted from
// "Starter Pack Scope Document – India" (ERPNext & Frappe HR) — the four packs,
// their hours and validity, the module-by-module scope tables, what ships with
// every pack, what is strictly excluded, and the commercial and contractual
// terms. That document is the contract a customer buys, so this file is the one
// place its wording lives; the pack detail modal renders it rather than
// paraphrasing it.
//
// ⚠️ The scope document is INDIA-ONLY. Its accounting scope names GST and TDS,
// its payroll scope names India tax configuration, and its prices are rupees
// plus 18% GST. Only India's prices are decided — see REGION_PRICING.

import { REGIONS } from './quiz'

// ⚠️⚠️ `frappe-hr` is the Frappe HR APP, and it is not ERPNext's HR module. A
// pack including `hrms`/`payroll` sells the app; `data/modules.js` carries a
// separate ERPNext `hr` module that the estimator prices. Don't conflate them.

// The four packs. `value` is the id partners are tagged with in
// `data/partners.js` — renaming one orphans every partner that sells it.
//
// `areas` keys into PACK_SCOPE below, in the order the detail view lists them.
// The pack is exactly the sum of its areas, so a pack's coverage can't drift
// from the scope tables the way a hand-written summary would.
export const STARTER_PACKS = [
  {
    value: 'core-erpnext',
    name: 'Core ERPNext',
    // The one-line version, for the marketing page and the comparison table.
    modules: 'Finance + Sales + Purchase + Inventory',
    // ⚠️ `tagline` says what is IN the pack, `pitch` says what it is FOR. Three
    // of the four taglines describe contents ("Everything in Core ERPNext, plus
    // production"), which reads as a summary of the module list rather than a
    // reason to buy — fine on a catalogue row where the modules aren't shown,
    // wrong in the booking panel where they are listed six lines below. The
    // panel takes `pitch`; everywhere else still takes `tagline`.
    tagline: 'Where most businesses start',
    pitch: 'Run the business without spreadsheets.',
    moduleList: 'Finance, Sales, Purchase and Inventory modules',
    areas: ['accounting', 'selling', 'buying', 'inventory'],
    apps: ['erpnext'],
    hours: 40,
    validityDays: 30,
    validity: '30 days',
  },
  {
    value: 'manufacturing',
    name: 'Manufacturing',
    modules: 'Core ERPNext + Manufacturing',
    tagline: 'Everything in Core ERPNext, plus production',
    pitch: 'Plan production against real stock.',
    moduleList: 'Finance, Sales, Purchase, Inventory and Manufacturing modules',
    areas: ['accounting', 'selling', 'buying', 'inventory', 'manufacturing'],
    apps: ['erpnext'],
    hours: 70,
    validityDays: 60,
    validity: '60 days',
  },
  {
    value: 'all-in-one',
    name: 'All in one',
    modules: 'Core ERPNext + Manufacturing + Frappe HR',
    tagline: 'Everything in Manufacturing, plus HR and payroll',
    pitch: 'Run operations and payroll in one place.',
    moduleList: 'Finance, Sales, Purchase, Inventory, Manufacturing and Frappe HR modules',
    areas: ['accounting', 'selling', 'buying', 'inventory', 'manufacturing', 'hrms', 'payroll'],
    apps: ['erpnext', 'frappe-hr'],
    hours: 100,
    validityDays: 90,
    validity: '90 days',
  },
  {
    value: 'frappe-hr',
    name: 'Frappe HR',
    modules: 'HRMS + Payroll',
    tagline: 'HR and payroll, on their own',
    pitch: 'Pay people on time, every month.',
    moduleList: 'HRMS and Payroll modules',
    areas: ['hrms', 'payroll'],
    apps: ['frappe-hr'],
    hours: 30,
    validityDays: 30,
    validity: '30 days',
  },
]

// Price is `hours × rate`, always — which is how the real India sheet is built:
// ₹80,000 for 40 hours, ₹1,40,000 for 70, ₹2,00,000 for 100, ₹60,000 for 30, a
// flat ₹2,000/hr across all four. Deriving rather than listing four prices per
// region means a pack's hours and its price cannot disagree.
//
// ⚠️ INDIA IS REAL. The other five rates are INVENTED — pricing for those
// regions isn't decided yet. They're each set below the local partner rates in
// `data/partners.js`, so a pack still reads as the discounted fixed-scope
// product it is, but don't quote any of them.
//
// One currency per region rather than per country: the directory groups
// partners this way (see `data/quiz.js`), and a mock that invents a rate for
// every market would assert far more than it knows.
const REGION_RATES = {
  india: { currency: 'INR', locale: 'en-IN', rate: 2000, tax: '18% GST', real: true },
  asia: { currency: 'USD', locale: 'en-US', rate: 40, tax: 'local taxes' },
  'middle-east': { currency: 'USD', locale: 'en-US', rate: 55, tax: 'local VAT' },
  africa: { currency: 'USD', locale: 'en-US', rate: 35, tax: 'local taxes' },
  europe: { currency: 'EUR', locale: 'en-IE', rate: 70, tax: 'local VAT' },
  americas: { currency: 'USD', locale: 'en-US', rate: 85, tax: 'sales tax' },
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
// The four packs are four slices of THIS list, and three of them nest: Core is
// the first four, Manufacturing adds the fifth, All in one adds the last two.
// Frappe HR is the only one that isn't a prefix — it's the last two on their
// own. That shape is the most useful thing a buyer can know about the four, so
// it's exported rather than left implicit in each pack's `areas`.
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
    'Payment in full, in advance',
    `${p.tax} charged on top`,
    `Extra hours beyond the pack: ${additionalHourRateFor(region)} per hour, plus ${p.tax}`,
    'For businesses running fewer than 50 users',
    'Your Frappe Cloud subscription is billed separately',
    'Product warranty applies on Frappe Cloud plans above ₹4,100 + GST a month',
    'Scope is limited to what this document lists. Anything else is a change request, and more hours',
    'Validity runs from the project start date',
  ]
}
