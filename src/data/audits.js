// The firm's PMM audits, as Frappe's partner portal lists them: a type, a
// status, the auditor once one is assigned, and the non-conformances (NCs) a
// completed audit raises. Bronze and up only; a Beginner has had none.
//
// ⚠️ Invented: the auditor, the dates, every finding. `example.com` addresses
// can't reach a real inbox.

export const AUDIT_TYPES = ['Online', 'Hybrid', 'In-Person']

export const AUDIT_STATUS = {
  Requested: 'gray',
  Scheduled: 'blue',
  Completed: 'green',
}

export const NC_STATUS = {
  WIP: 'amber',
  Closed: 'green',
}

const AUDITOR = 'auditor@example.com'

const NCS = [
  {
    id: 'PNC-00055',
    function: 'Sales',
    title: 'SLAs are not applied to leads',
    status: 'WIP',
    finding: 'Leads sit in the CRM with no response time set. Several waited more than a week for a first reply.',
    measures: 'Set a first-response SLA on every lead source and review breaches in the weekly sales meeting.',
  },
  {
    id: 'PNC-00056',
    function: 'Delivery',
    title: 'Weekly project updates are not being shared with customers',
    status: 'WIP',
    finding: 'Two of the three projects reviewed had no written update to the customer in the last month.',
    measures: 'Send a weekly update on every active project: progress, next steps and open risks.',
  },
  {
    id: 'PNC-00051',
    function: 'Sales',
    title: 'No process for collecting feedback during the sales cycle',
    status: 'Closed',
    finding: 'Lost deals are closed without asking the prospect why.',
    measures: 'Ask for a short reason on every lost deal and record it in the CRM.',
    measuresTaken: 'Added a required lost reason in the CRM and a follow-up email to the prospect.',
    closedBy: 'Farhan Qureshi',
    closedOn: '2026-06-02',
  },
  {
    id: 'PNC-00052',
    function: 'Support',
    title: 'Missing process for collecting monthly customer satisfaction scores',
    status: 'Closed',
    finding: 'Customer satisfaction is not measured after go-live support starts.',
    measures: 'Send a monthly satisfaction survey to every customer on support.',
    measuresTaken: 'A monthly survey now goes out from Helpdesk on the first working day.',
    closedBy: 'Farhan Qureshi',
    closedOn: '2026-06-18',
  },
  {
    id: 'PNC-00053',
    function: 'Support',
    title: 'Missing Root Cause Analysis (RCA) and Corrective Actions practices',
    status: 'Closed',
    finding: 'Repeat tickets are fixed one by one with no record of the underlying cause.',
    measures: 'Write an RCA for every critical ticket and for any issue reported three times or more.',
    measuresTaken: 'An RCA template is linked from Helpdesk and reviewed every two weeks.',
    closedBy: 'Farhan Qureshi',
    closedOn: '2026-07-07',
  },
  {
    id: 'PNC-00054',
    function: 'Delivery',
    title: 'Missing weekly review meetings for reporting metrics',
    status: 'Closed',
    finding: 'Delivery metrics are tracked but nobody reviews them together.',
    measures: 'Hold a weekly review of utilization, open tasks and overdue milestones.',
    measuresTaken: 'A 30-minute review runs every Monday with the delivery leads.',
    closedBy: 'Farhan Qureshi',
    closedOn: '2026-07-21',
  },
  {
    id: 'PNC-00057',
    function: 'Delivery',
    title: 'No documented handover from sales to delivery',
    status: 'Closed',
    finding: 'Delivery teams learn the scope from the customer at kickoff, not from sales.',
    measures: 'Hold a handover meeting with a written scope summary before every kickoff.',
    measuresTaken: 'Handover checklist added to the project template; sales signs it off.',
    closedBy: 'Farhan Qureshi',
    closedOn: '2026-08-04',
  },
]

// Newest first, as the list shows them.
export const auditsSeed = () => [
  { id: 'AUD-0003', type: 'Hybrid', status: 'Requested', auditor: null, requested: '2026-12-04', date: null, ncs: [] },
  { id: 'AUD-0002', type: 'Online', status: 'Scheduled', auditor: AUDITOR, requested: '2026-11-20', date: '2026-11-24', ncs: [] },
  {
    id: 'AUD-0001',
    type: 'In-Person',
    status: 'Completed',
    auditor: AUDITOR,
    requested: '2026-04-11',
    date: '2026-04-11',
    ncs: NCS.map((nc) => ({ ...nc })),
  },
]

// ── Dates, American style ───────────────────────────────────────────────────
// Parsed as local dates: `new Date('2026-04-11')` is UTC midnight, which is
// the day before west of Greenwich.
const local = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const fmt = (opts) => new Intl.DateTimeFormat('en-US', opts)
const short = fmt({ month: 'short', day: 'numeric' })
const medium = fmt({ month: 'short', day: 'numeric', year: 'numeric' })
const long = fmt({ month: 'long', day: 'numeric', year: 'numeric' })
export const auditShortDate = (iso) => short.format(local(iso))
export const auditDate = (iso) => medium.format(local(iso))
export const auditLongDate = (iso) => long.format(local(iso))
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const openNcs = (audit) => audit.ncs.filter((nc) => nc.status !== 'Closed')
