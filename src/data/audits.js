import { MANAGERS } from './partnership'

// The firm's PMM audits, shaped like frappe/press's Partner Audit and Partner
// Non Conformance doctypes: a type, a status, a proposed date until Frappe sets
// the real one, the partner manager who audits, and the non-conformances (NCs)
// a completed audit raises. Bronze and up only; a Beginner has had none.
//
// The time, the meeting link and any rescheduling happen on email, so none of
// it is stored here.
//
// ⚠️ Invented: the dates, the report, every finding and response.

// What a partner can ask for, as press's request dialog offers it. Press's
// record also allows Hybrid, which Frappe can set, so an audit can still show
// it.
export const AUDIT_TYPES = ['Online', 'In-Person']

// Press's statuses, keyed by its values. The partner sees all six.
export const AUDIT_STATUS = {
  Requested: { label: 'Requested', theme: 'gray' },
  Scheduled: { label: 'Scheduled', theme: 'blue' },
  'In Progress': { label: 'In progress', theme: 'blue' },
  Completed: { label: 'Completed', theme: 'green' },
  'On Hold': { label: 'On hold', theme: 'amber' },
  Cancelled: { label: 'Canceled', theme: 'gray' },
}

// Press's NC statuses plus `In Review`, which press doesn't have yet: the
// partner submits what changed, and Frappe's PMM team closes it or sends it
// back. `rank` is the list's order: what needs the partner first, then what's
// waiting on Frappe, then what's done. `dot` is the StageDot colour, as Leads
// colours a stage: blue while it's live, colour only once it's finished.
export const NC_STATUS = {
  Open: { label: 'Open', dot: 'bg-surface-blue-7', rank: 0 },
  WIP: { label: 'In progress', dot: 'bg-surface-blue-7', rank: 0 },
  'On Hold': { label: 'On hold', dot: 'bg-surface-blue-7', rank: 1 },
  'In Review': { label: 'In review', dot: 'bg-surface-blue-7', rank: 2 },
  Closed: { label: 'Closed', dot: 'bg-surface-green-7', rank: 3 },
  Discarded: { label: 'Discarded', dot: 'bg-surface-gray-5', rank: 3 },
}

// Press's departments.
export const DEPARTMENTS = ['Implementation', 'Sales', 'Support', 'General']

// The partner can respond only while it's theirs to fix.
export const canRespond = (nc) => nc.status === 'Open' || nc.status === 'WIP'
export const isDone = (nc) => NC_STATUS[nc.status].rank === 3

const [ADITI, KARAN] = MANAGERS

// Each finding's back-and-forth with Frappe, oldest first: the partner
// submits what changed, Frappe's PMM team sends it back or closes it. The
// aside draws it as a timeline, after the audit that raised it.
const FARHAN = 'Farhan Qureshi'
const sent = (on, text, evidence = null) => ({ kind: 'submitted', by: FARHAN, on, text, evidence })
const back = (by, on, text) => ({ kind: 'returned', by, on, text })
const shut = (by, on) => ({ kind: 'closed', by, on })

const NCS = [
  {
    id: 'PNC-00055',
    department: 'Sales',
    title: 'SLAs are not applied to leads',
    status: 'WIP',
    due: '2026-11-10',
    finding: 'Leads sit in the CRM with no response time set. Several waited more than a week for a first reply.',
    measures: 'Set a first-response SLA on every lead source and review breaches in the weekly sales meeting.',
    log: [
      sent('2026-10-20', 'Set a 24-hour first-response SLA on the web form lead source.'),
      back(KARAN.name, '2026-10-28', 'The SLA is set on the web form only. Add it to email and phone leads too.'),
    ],
  },
  {
    id: 'PNC-00056',
    department: 'Implementation',
    title: 'Weekly project updates are not shared with customers',
    status: 'In Review',
    due: '2026-12-15',
    finding: 'Two of the three projects reviewed had no written update to the customer in the last month.',
    measures: 'Send a weekly update on every active project: progress, next steps and open risks.',
    log: [
      sent(
        '2026-11-12',
        'Every active project now sends a Friday update from the project template. The first four weeks are attached.',
        'weekly-updates-oct.pdf',
      ),
    ],
  },
  {
    id: 'PNC-00057',
    department: 'Implementation',
    title: 'No documented handover from sales to implementation',
    status: 'Open',
    due: '2026-12-20',
    finding: 'Implementation teams learn the scope from the customer at kickoff, not from sales.',
    measures: 'Hold a handover meeting with a written scope summary before every kickoff.',
    log: [],
  },
  {
    id: 'PNC-00051',
    department: 'Sales',
    title: 'No process for collecting feedback during the sales cycle',
    status: 'Closed',
    due: '2026-06-15',
    finding: 'Lost deals are closed without asking the prospect why.',
    measures: 'Ask for a short reason on every lost deal and record it in the CRM.',
    log: [
      sent('2026-05-28', 'Added a required lost reason in the CRM and a follow-up email to the prospect.'),
      shut(KARAN.name, '2026-06-02'),
    ],
  },
  {
    id: 'PNC-00052',
    department: 'Support',
    title: 'No monthly customer satisfaction scores',
    status: 'Closed',
    due: '2026-06-30',
    finding: 'Customer satisfaction is not measured once support starts.',
    measures: 'Send a monthly satisfaction survey to every customer on support.',
    log: [
      sent('2026-06-12', 'A monthly survey now goes out from Helpdesk on the first working day.', 'csat-survey.png'),
      shut(KARAN.name, '2026-06-18'),
    ],
  },
  {
    id: 'PNC-00053',
    department: 'Support',
    title: 'No root cause analysis for repeat tickets',
    status: 'Closed',
    due: '2026-07-15',
    finding: 'Repeat tickets are fixed one by one with no record of the underlying cause.',
    measures: 'Write an RCA for every critical ticket and for any issue reported three times or more.',
    log: [
      sent('2026-07-01', 'An RCA template is linked from Helpdesk and reviewed every two weeks.'),
      shut(KARAN.name, '2026-07-07'),
    ],
  },
  {
    id: 'PNC-00054',
    department: 'Implementation',
    title: 'No weekly review of delivery metrics',
    status: 'Closed',
    due: '2026-07-31',
    finding: 'Utilization and milestones are tracked, but nobody reviews them together.',
    measures: 'Hold a weekly review of utilization, open tasks and overdue milestones.',
    log: [
      sent('2026-07-16', 'A 30-minute review runs every Monday with the implementation leads.'),
      shut(KARAN.name, '2026-07-21'),
    ],
  },
]

// The 2024 audit's findings, all closed: the audit that took the firm to
// Silver.
const closed = (id, department, title, finding, measures, changed, sentOn, closedOn) => ({
  id,
  department,
  title,
  status: 'Closed',
  due: closedOn,
  finding,
  measures,
  log: [sent(sentOn, changed), shut(ADITI.name, closedOn)],
})
const NCS_2024 = [
  closed(
    'PNC-00031',
    'Sales',
    'No qualification criteria for new leads',
    'Every lead gets the same follow-up, whatever its size or fit.',
    'Agree on qualification criteria and record them on each lead.',
    'Leads now carry a fit score, set at first contact.',
    '2024-11-15',
    '2024-11-20',
  ),
  closed(
    'PNC-00032',
    'Implementation',
    'Project plans are not shared at kickoff',
    'Customers first see the plan weeks into the project.',
    'Share a written plan with milestones at every kickoff.',
    'The kickoff template now ends with the plan sent to the customer.',
    '2024-11-22',
    '2024-11-28',
  ),
  closed(
    'PNC-00033',
    'Support',
    'No first-response target on tickets',
    'Tickets have no expected response time.',
    'Set a first-response target and track breaches.',
    'Helpdesk SLAs set a 4-hour first response on every ticket.',
    '2024-11-29',
    '2024-12-05',
  ),
  closed(
    'PNC-00034',
    'General',
    'Roles and owners are not documented',
    'Nobody could say who owns delivery, support or billing.',
    'Write down an owner for each function.',
    'An owners page is pinned in the team wiki.',
    '2024-12-06',
    '2024-12-12',
  ),
]

// One of each stage, so every state of the page can be reviewed. Named as
// press names them, ADT-0001 up. `pmm` is the level the audit is for, one
// above the firm's at the time (frappe.io's partner guide: PMM 3 for Bronze,
// 4 for Silver, 5 for Gold). `result` is Frappe's verdict once it's done.
// ⚠️ Press stores neither yet: it keeps the firm's tier at the time, not the
// level the audit is for, and records no result.
export const auditsSeed = () => [
  {
    id: 'ADT-0004',
    type: 'Online',
    status: 'Requested',
    pmm: 5,
    result: null,
    auditor: null,
    requested: '2026-11-15',
    proposed: '2026-12-15',
    date: null,
    report: null,
    ncs: [],
  },
  {
    id: 'ADT-0003',
    type: 'Online',
    status: 'Scheduled',
    pmm: 5,
    result: null,
    auditor: ADITI,
    requested: '2026-11-14',
    proposed: '2026-11-21',
    date: '2026-11-24',
    report: null,
    ncs: [],
  },
  {
    id: 'ADT-0002',
    type: 'In-Person',
    status: 'Completed',
    pmm: 5,
    result: 'Not met',
    auditor: KARAN,
    requested: '2026-03-20',
    proposed: '2026-04-11',
    date: '2026-04-11',
    report: 'pmm-audit-report-apr-2026.pdf',
    ncs: NCS.map((nc) => ({ ...nc })),
  },
  {
    id: 'ADT-0001',
    type: 'Online',
    status: 'Completed',
    pmm: 4,
    result: 'Met',
    auditor: ADITI,
    requested: '2024-10-01',
    proposed: '2024-11-02',
    date: '2024-11-02',
    report: 'pmm-audit-report-nov-2024.pdf',
    ncs: NCS_2024.map((nc) => ({ ...nc })),
  },
]

// The next press-style name.
export const nextAuditId = (audits) => {
  const n = Math.max(0, ...audits.map((a) => Number(a.id.split('-')[1]) || 0)) + 1
  return `ADT-${String(n).padStart(4, '0')}`
}

// The date an audit goes by: Frappe's once it's set, the proposed one until
// then. The list sorts on it.
export const auditDay = (audit) => audit.date ?? audit.proposed

// What the audit page is called. Stable: a reschedule moves the date, not this.
export const auditTitle = (audit) => `PMM ${audit.pmm} audit`

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

export const openNcs = (audit) => audit.ncs.filter((nc) => !isDone(nc))
// Past its due date and still the partner's to fix.
export const isOverdue = (nc) => canRespond(nc) && nc.due < todayIso()
