// Guided onboarding — a three-hour, partner-led program that teaches a customer
// to configure and run ERPNext themselves.
//
// Everything here is REAL, from the "ERPNext Onboarding" program document: the
// three sessions and their timings, the agenda inside each, the homework, the
// preparation checklist, what the program deliberately won't cover, and the
// terms.
//
// ⚠️ NAMING. The product is "guided onboarding"; the questions Frappe Connect
// asks a new customer at signup are "onboarding questions". Two different
// things, one word, and they sit a click apart in the flow — hence the
// qualifier in the product's name everywhere it's shown. Don't drop it.
export const ONBOARDING = {
  name: 'Guided onboarding',
  // What it is, in one line, for the card on the marketing page.
  summary:
    'Three focused hours with a certified partner, teaching you to configure and run ERPNext yourself.',
  totalHours: 3,
  sessionCount: 3,
  // Ten WORKING days, not two weeks — the document is specific, and the
  // difference is real for anyone booking around a holiday.
  validity: '10 working days',
  // ⚠️ Deliberately free. It isn't priced separately — the qualifier is the
  // Frappe Cloud subscription, below.
  price: null,
  // The gate. A customer on a smaller plan (or none) can't book, and this is
  // what the booking flow checks by asking them to sign in with Frappe Cloud.
  eligibility: {
    label: 'Included with Frappe Cloud',
    detail:
      'Available to Frappe Cloud customers on the ₹810 / $10 a month plan and above. Signing in with Frappe Cloud confirms it.',
    minPlan: { inr: 810, usd: 10 },
  },
  // How it's delivered — the "you drive, they guide" model is the whole
  // premise, so it's a fact about the product, not a footnote.
  delivery:
    'Online video calls with a certified Frappe partner. You share your screen and do the steps yourself, with the consultant guiding you.',
}

// What a customer can do by the end. Written as outcomes because that's how
// someone deciding whether to book will read it — the agenda below answers
// "what happens", this answers "what do I get".
export const ONBOARDING_OUTCOMES = [
  'Understand how ERPNext is structured and how transactions flow through it',
  'Set up the foundation: company, items, warehouses, customers and suppliers',
  'Run the core purchase and sales workflows yourself',
  'See how a transaction moves stock and hits the accounts',
  'Import your own master data using the standard templates',
  'Set up users and basic permissions',
  'Know where to learn more and how to get help',
  'Leave with an implementation roadmap, and know when to bring in a partner',
]

// The three sessions. `agenda` items carry their own minutes because the
// document budgets them individually, and those numbers are what make the
// three hours credible rather than round.
export const ONBOARDING_SESSIONS = [
  {
    number: 1,
    title: 'Build the foundation',
    minutes: 60,
    summary: 'Understand ERPNext and configure the basic building blocks.',
    agenda: [
      {
        title: 'The ERPNext mental model',
        minutes: 10,
        items: ['Navigation', 'Modules', 'Search', 'Doctypes', 'Workspaces'],
      },
      {
        title: 'Company setup',
        minutes: 10,
        items: ['Company', 'Fiscal year', 'Basic accounting setup'],
      },
      {
        title: 'Master data',
        minutes: 25,
        items: ['Item', 'Item Group', 'Warehouse', 'Supplier', 'Customer'],
      },
      {
        title: 'Your turn',
        minutes: 15,
        items: ['Create one item, one warehouse, one supplier and one customer'],
      },
    ],
    homework:
      'Complete your master data with real business information, and prepare what the purchase and sales exercises will need.',
  },
  {
    number: 2,
    title: 'Learn the transaction engine',
    minutes: 60,
    summary: 'Learn by running the two core business flows end to end.',
    agenda: [
      {
        title: 'Purchase',
        minutes: 25,
        items: [
          'Material Request → Purchase Order → Purchase Receipt → Purchase Invoice → Payment',
        ],
      },
      {
        title: 'Sales',
        minutes: 25,
        items: ['Quotation → Sales Order → Delivery Note → Sales Invoice → Payment'],
      },
      {
        title: 'Stock and accounting',
        minutes: 10,
        items: ['Transaction → stock movement → accounting impact → reports'],
        // The document is explicit that this is about understanding, not
        // coverage — worth keeping, because it's what stops the session
        // turning into a report tour.
        note: 'Not every report. What ERPNext is doing behind each transaction.',
      },
    ],
    homework:
      'Run one real purchase and one real sale, then check the stock and accounting they produced.',
  },
  {
    number: 3,
    title: 'Become self-sufficient',
    minutes: 60,
    summary: 'Learn how to carry on the implementation without a consultant.',
    agenda: [
      {
        title: 'Data import',
        minutes: 15,
        items: ['Templates', 'Field mapping', 'Validation', 'Common errors'],
      },
      {
        title: 'Opening data',
        minutes: 10,
        items: ['Opening stock', 'Opening accounts', 'What is needed, where and when'],
        note: 'The consultant explains the process rather than performing a migration.',
      },
      {
        title: 'Users and permissions',
        minutes: 10,
        items: ['Users', 'Roles', 'Basic permissions'],
      },
      {
        title: 'Learning and troubleshooting on your own',
        minutes: 10,
        items: [
          'Finding a doctype',
          'Investigating an unfamiliar workspace',
          'Telling a configuration question from a product issue',
          'When to ask for support, and when to bring in a partner',
        ],
      },
      {
        title: 'Roadmap and questions',
        minutes: 15,
        items: ['Agree the sequence for finishing your own implementation'],
      },
    ],
    homework: null,
  },
]

// What the customer brings. Short enough to read before booking, which is the
// point — it's the honest answer to "can I actually use this next week?".
export const ONBOARDING_CHECKLIST = [
  'Company information',
  'Item list',
  'Customers',
  'Suppliers',
  'Warehouses',
  'What you need in opening data',
]

// Deliberately out of scope. Same reasoning as the packs' exclusions: this list
// is why three hours is enough, so it's shown, not buried.
export const ONBOARDING_EXCLUSIONS = [
  'Print format configuration',
  'Workflow approvals',
  'Customization, basic or advanced',
  'Report training for AP, AR and P&L',
  'Advanced payment scenarios',
  'Detailed data migration and opening entries',
  'Complex permissions and advanced configuration',
  'Custom development and third-party integrations',
  'Feature-specific tutorials',
]

export const ONBOARDING_TERMS = [
  'Available to Frappe Cloud customers on the ₹810 / $10 a month plan and above',
  'The three hours can be used within 10 working days. After that the onboarding is treated as complete',
  'Delivered by certified partners over video call; you share your screen and do the steps yourself',
  'Be signed in to your ERPNext site with what you need ready before each session',
]
