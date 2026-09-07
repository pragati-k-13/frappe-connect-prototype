// The module catalogue behind the "Estimate quote" modal: what each Frappe app
// breaks into, and what setting each of those up involves.
//
// ⚠️ Every module, task and hour figure here is INVENTED. Nothing in the
// directory publishes an implementation breakdown, and before this file there
// was no notion of a module or a task anywhere in `src/` — the only prior
// mention was `STARTER_PACKS[].modules`, a display string that can't even be
// split, since two of its four values name other *packs* ("Core ERPNext +
// Manufacturing") rather than modules.
//
// It's invented but not arbitrary. Two constraints hold it together:
//
//   1. A module has no `hours` of its own. Its hours are the sum of its tasks
//      (`moduleHours`), so no figure in the file is a bare assertion — every
//      one of them is answerable with "made of what?". That is the one
//      invariant worth testing.
//   2. ERPNext's modules sum to 88 hours, and its core four (Finance, Sales,
//      Purchase, Inventory) to 39 — near the 40 that `core-erpnext` already
//      advertises in `STARTER_PACKS`. The estimator and the pack table read as
//      the same universe rather than two unrelated inventions.
//
// ⚠️ `tasks` IS NO LONGER RENDERED. The estimator used to drill from a module
// into its task list; it is one level now, so the only thing tasks do today is
// derive `hours`. They stay because that derivation is the point of constraint
// 1 — replacing each list with a hand-written `hours: 12` would turn a figure
// with a rationale into a magic number, and the rationale is what a real
// catalogue would be reviewed against. Task names are the shape of real
// implementation work — "Opening balances", "Statutory setup" — for the same
// reason.
//
// ⚠️ NO CRM. Starter packs — the standard, fixed-scope implementation this
// modal prices — are ERP work, so the CRM modules that used to sit here were
// quoting something the packs don't sell. Removing them here is the whole
// removal: `modulesFor` returns nothing for an app with no entry, so a project
// that still lists CRM modules contributes zero hours rather than erroring.
//
// ⚠️⚠️ FRAPPE HR AND ERPNEXT'S HR MODULE ARE TWO DIFFERENT THINGS. Frappe HR
// is a separate app — its own entry in `APPS`, listed by nine of the thirteen
// partners, with its own starter pack in `STARTER_PACKS`. ERPNext also has an
// HR module, which is the `hr` entry in the ERPNext list below. They are not
// two names for one thing and neither one substitutes for the other. Any
// future copy, filter or estimate that treats them as interchangeable is
// wrong, and this file is exactly where that mistake would get made, because
// it is the one place both could appear as top-level keys.
//
// What this catalogue holds is ERPNext's HR module. It does NOT break Frappe
// HR down into modules of its own — a deliberate scope decision about the
// estimator, not a claim that the app is covered by the ERPNext module. A
// partner who sells a Frappe HR implementation is selling something this panel
// currently doesn't price.
//
// ⚠️ TASK LIST INHERITED, AND IT SHOULDN'T STAY THAT WAY. The eight tasks on
// `hr` below are the whole of what used to be the separate `frappe-hr`
// catalogue (Payroll, Attendance and leave, Onboarding), moved across
// unchanged — same labels, same hours, same 25-hour sum, so the move invented
// no numbers and dropped none. But they were written for the APP: a first
// parallel payroll run and a biometric device import are full-HRMS work, not
// what ERPNext's HR module asks for. Rewrite them to that module's actual
// scope before anyone treats the 25 as real. Nothing renders them today — they
// only derive `hours` — which is why this is a warning and not a bug.
//
// ⚠️ One consequence of HR living under ERPNext: it now reaches every partner.
// The panel only shows modules whose app the partner implements, and all
// thirteen do ERPNext, where four of them don't do Frappe HR. Those four now
// quote ERPNext HR work, which is right — it's ERPNext, and they do ERPNext —
// but it IS a change in who sees an HR line.

// Keys match `APPS[].value` in `data/partners.js`. An app absent here simply
// contributes nothing to an estimate.
export const MODULES = {
  erpnext: [
    {
      key: 'finance',
      label: 'Finance',
      tasks: [
        { label: 'Chart of accounts setup', hours: 4 },
        { label: 'Tax templates', hours: 3 },
        { label: 'Bank reconciliation', hours: 3 },
        { label: 'Opening balances', hours: 2 },
      ],
    },
    {
      key: 'sales',
      label: 'Sales',
      tasks: [
        { label: 'Item and price lists', hours: 3 },
        { label: 'Quotation to invoice flow', hours: 4 },
        { label: 'Customer masters and import', hours: 2 },
      ],
    },
    {
      key: 'purchase',
      label: 'Purchase',
      tasks: [
        { label: 'Supplier masters', hours: 2 },
        { label: 'Purchase cycle and approvals', hours: 4 },
        { label: 'Landed cost vouchers', hours: 2 },
      ],
    },
    {
      key: 'inventory',
      label: 'Inventory',
      tasks: [
        { label: 'Warehouse and bin setup', hours: 3 },
        { label: 'Stock entries and transfers', hours: 4 },
        { label: 'Reorder levels and valuation', hours: 3 },
      ],
    },
    {
      key: 'manufacturing',
      label: 'Manufacturing',
      tasks: [
        { label: 'BOM setup', hours: 6 },
        { label: 'Work order workflow', hours: 10 },
        { label: 'Capacity and shop floor planning', hours: 8 },
      ],
    },
    // ⚠️ ERPNext's HR module — NOT the Frappe HR app, which is a separate and
    // different product that this catalogue doesn't break down at all. See the
    // ⚠️⚠️ at the top of the file, including why these eight tasks are on
    // borrowed time: they were written for the app, not for this module.
    {
      key: 'hr',
      label: 'HR',
      tasks: [
        { label: 'Salary structures', hours: 5 },
        { label: 'Statutory setup', hours: 4 },
        { label: 'First parallel payroll run', hours: 3 },
        { label: 'Shift and holiday setup', hours: 3 },
        { label: 'Leave policies and balances', hours: 3 },
        { label: 'Biometric device import', hours: 2 },
        { label: 'Employee lifecycle templates', hours: 3 },
        { label: 'Document checklists', hours: 2 },
      ],
    },
  ],

  helpdesk: [
    {
      key: 'tickets',
      label: 'Tickets',
      tasks: [
        { label: 'Teams, queues and assignment', hours: 3 },
        { label: 'Email and portal intake', hours: 3 },
      ],
    },
    {
      key: 'sla',
      label: 'SLA policies',
      tasks: [
        { label: 'Priority and response targets', hours: 3 },
        { label: 'Escalation rules', hours: 2 },
      ],
    },
    {
      key: 'knowledge-base',
      label: 'Knowledge base',
      tasks: [
        { label: 'Category structure', hours: 2 },
        { label: 'Article migration', hours: 4 },
      ],
    },
  ],
}

// Derived, never stored. A module carrying its own `hours` alongside a task
// list is two numbers claiming the same thing, and nothing would keep the
// stored one honest as the list changed.
export const moduleHours = (module) => module.tasks.reduce((n, t) => n + t.hours, 0)

// The selected modules for one app, in catalogue order rather than selection
// order — so a module's position in the list doesn't depend on the sequence a
// picker happened to write it in.
export const modulesFor = (app, selectedKeys) =>
  (MODULES[app] ?? [])
    .filter((m) => selectedKeys.includes(m.key))
    .map((m) => ({ ...m, hours: moduleHours(m) }))
