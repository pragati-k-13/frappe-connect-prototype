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
//      (`moduleHours`), so the drill-down can never disagree with the row that
//      opened it. That is the one invariant worth testing.
//   2. ERPNext's modules sum to 63 hours, and its core four (Finance, Sales,
//      Purchase, Inventory) to 39 — near the 40 that `core-erpnext` already
//      advertises in `STARTER_PACKS`. The estimator and the pack table read as
//      the same universe rather than two unrelated inventions.
//
// Task names are the shape of real implementation work — "Opening balances",
// "Statutory setup" — rather than filler, because the point of the drill-down
// is to show that the number has something under it.

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
  ],

  crm: [
    {
      key: 'deals',
      label: 'Deals',
      tasks: [
        { label: 'Pipeline stages and probabilities', hours: 3 },
        { label: 'Lead sources and assignment rules', hours: 3 },
      ],
    },
    {
      key: 'contacts',
      label: 'Contacts',
      tasks: [
        { label: 'Import and de-duplication', hours: 2 },
        { label: 'Organisation linking', hours: 2 },
      ],
    },
    {
      key: 'email',
      label: 'Email and templates',
      tasks: [
        { label: 'Mailbox connection', hours: 2 },
        { label: 'Outbound templates', hours: 3 },
      ],
    },
  ],

  'frappe-hr': [
    {
      key: 'payroll',
      label: 'Payroll',
      tasks: [
        { label: 'Salary structures', hours: 5 },
        { label: 'Statutory setup', hours: 4 },
        { label: 'First parallel payroll run', hours: 3 },
      ],
    },
    {
      key: 'attendance',
      label: 'Attendance and leave',
      tasks: [
        { label: 'Shift and holiday setup', hours: 3 },
        { label: 'Leave policies and balances', hours: 3 },
        { label: 'Biometric device import', hours: 2 },
      ],
    },
    {
      key: 'onboarding',
      label: 'Onboarding',
      tasks: [
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
// list is two numbers claiming the same thing, and the drill-down is exactly
// where they'd be seen disagreeing.
export const moduleHours = (module) => module.tasks.reduce((n, t) => n + t.hours, 0)

// The selected modules for one app, in catalogue order rather than selection
// order — so a module's position in the list doesn't depend on the sequence a
// picker happened to write it in.
export const modulesFor = (app, selectedKeys) =>
  (MODULES[app] ?? [])
    .filter((m) => selectedKeys.includes(m.key))
    .map((m) => ({ ...m, hours: moduleHours(m) }))
