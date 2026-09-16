// The implementation itself: what a project IS, the stages it moves through,
// and what is needed from whom at each one.
//
// ⚠️ THE STAGES AND THE TASKS ARE INVENTED, and they are the only invented
// thing in the booking flow. The scope document and the onboarding program
// describe what is DELIVERED, not how the work is tracked, so the spines below
// are the prototype's own model.
//
// They are named after beats the rest of the product already talks about — the
// introductory call, kickoff, the Day 1 go-live the exclusions mention, the
// three onboarding sessions — rather than a generic funnel (Demo / Proposal /
// Won), which is what a CRM calls its own progress and says nothing to the
// business that bought a pack.
//
// The TASKS are a different case, and worth reading before replacing them.
// Almost every one is a real line lifted from `data/packs.js` or
// `data/onboarding.js` — `CUSTOMER_RESPONSIBILITIES`, `INCLUDED_IN_ALL`,
// `ONBOARDING_CHECKLIST`, the session homework — and imported rather than
// retyped, so a change to the contract reaches the tracker. What is invented is
// WHICH STAGE each one lands in, and the handful of connective lines that had
// no source. Those carry their own note.
import { CUSTOMER_RESPONSIBILITIES, STARTER_PACKS } from './packs'
import { ONBOARDING, ONBOARDING_CHECKLIST, ONBOARDING_SESSIONS } from './onboarding'
// Only `demoProjects` needs this, to resolve a firm's name to its id — by NAME
// rather than by id for the same reason `data/messages.js` does it: an id
// hard-coded here would rot silently the day a partner is renamed.
import { APPS, PARTNERS } from './partners'

// ── Services ────────────────────────────────────────────────────────────────
// The three ways an implementation can be bought. `null` is a fourth state and
// not a fourth service: a project exists before this is decided — someone can
// write down what they want built and only then work out how to have it built.
//
// ⚠️ `value` is what a project stores. Renaming one orphans every project.
export const SERVICES = [
  {
    value: 'pack',
    label: 'Starter pack',
    // What the row under the project's name reads when the service is set.
    summary: 'Fixed scope, fixed price, fixed hours.',
    to: '/connect/packs',
  },
  {
    value: 'onboarding',
    label: 'Guided onboarding',
    summary: ONBOARDING.summary,
    to: '/connect#guided-onboarding',
  },
  {
    value: 'custom',
    label: 'Custom implementation',
    summary: 'Scoped and quoted by a partner against what you need.',
    to: '/connect/partners',
  },
]

export const serviceOf = (value) => SERVICES.find((s) => s.value === value) ?? null

// ── Tasks ───────────────────────────────────────────────────────────────────
// A task is `{ key, label, hint?, action? }`.
//
// `key` is stored on the project once ticked, so it has to be unique across the
// WHOLE spine and not just within its stage — a project carries one flat list
// of what is done.
//
// `action` is how the page helps you finish it, and it names a KIND rather than
// carrying a handler: the data layer knows a task needs a slot booked, the page
// knows what booking a slot looks like. Kinds in use:
//
//   book-slot   opens the same BookSlotDialog the profile and Confirmed use
//   message     opens (or starts) the thread with this partner
//   scope       opens the pack's scope panel, or the module scope for custom
//   partners    goes to the directory
//   packs       goes to the pack catalogue
//
// A task with no action is a plain tick: something you do away from the screen
// and come back to record.
const task = (key, label, rest = {}) => ({ key, label, ...rest })

// ⚠️ `theirs` IS A LIST OF SENTENCE FRAGMENTS, lower-case, each one completing
// "Tridots is ___". They are rendered as ONE SENTENCE naming the other side and
// what they are doing — not as a second list.
//
// That was a correction. The first version made it a parallel checklist with an
// open ring where your side has a checkbox, on the reasoning that you cannot
// tick someone else's work. At 14px an empty circle beside an empty square does
// not carry that distinction: the partner's work scanned as three more things
// YOU had failed to do, which is the opposite of the point. Prose cannot be
// mistaken for a checklist, and it drops the "Tridots is doing" heading with it
// — a sentence names its own subject.
//
// So: 'installing ERPNext on Frappe Cloud', never 'Installation' or 'Day 1
// support'. A noun phrase here produces "Tridots is day 1 support."

// One real responsibility, by its text, so the tracker cites the contract
// rather than paraphrasing it. Throws loudly at module load if the wording in
// `packs.js` changes — which is the point: a silent fallback here would let the
// two drift apart and nobody would notice until a customer read both.
const responsibility = (fragment) => {
  const found = CUSTOMER_RESPONSIBILITIES.find((r) => r.toLowerCase().includes(fragment))
  if (!found) throw new Error(`No customer responsibility matching "${fragment}"`)
  return found
}

// ── The three spines ────────────────────────────────────────────────────────
// A stage is `{ key, label, theme, blurb, yours, theirs }`.
//
// `theme` feeds frappe-ui's Badge. Blue for the stages before work starts,
// orange while it is under way, green once it is done — so the badge carries
// the same information as the position in the bar, for anyone reading the badge
// alone in the listing.
//
// `blurb` is one sentence saying what this stage IS. It sits under the stage
// name on the detail page; the checklist below it says what to DO.

const PACK_STAGES = [
  {
    key: 'confirmed',
    label: 'Confirmed',
    theme: 'blue',
    blurb: 'The pack is booked and a partner is assigned. Nothing starts until you meet them.',
    yours: [
      task('nominate-champion', responsibility('champion'), {
        hint: 'One person on your side who can answer questions and make decisions.',
      }),
      task('request-slot', 'Request an introductory call', { action: 'book-slot' }),
    ],
    theirs: ['reading the requirements you sent'],
  },
  {
    key: 'intro-call',
    label: 'Intro call',
    theme: 'blue',
    blurb: 'A call to agree what is in scope and when the work starts.',
    yours: [
      task('attend-intro', 'Attend the introductory call'),
      task('confirm-scope', 'Check the pack covers what you need', { action: 'scope' }),
    ],
    theirs: ['walking you through what the pack covers', 'agreeing a start date with you'],
  },
  {
    key: 'kickoff',
    label: 'Kickoff',
    theme: 'orange',
    blurb: 'Your site is set up, and your data is what the configuration is built on.',
    yours: [
      task('data-ready', responsibility('data ready'), {
        // Real, and the reason this task exists at all: cleaning and migrating
        // data is STRICTLY EXCLUDED from every pack.
        hint: 'Clean Excel or CSV. Data cleaning and migration are not in the pack.',
        action: 'message',
      }),
      task('naming-series', 'Decide your naming series'),
      task('opening-balances', 'Gather your opening balances'),
    ],
    theirs: [
      'installing ERPNext on Frappe Cloud',
      'setting up standard user roles',
      'running your data import session',
    ],
  },
  {
    key: 'implementation',
    label: 'Implementation',
    theme: 'orange',
    blurb: 'The modules in your pack are configured, and your team is trained on them.',
    yours: [
      task('approve', responsibility('approve internally'), {
        hint: 'Configuration waits on your sign-off. Hours run against the pack either way.',
      }),
      task('users-available', responsibility('users available')),
      task('keep-scope', responsibility('strictly to the scope'), {
        hint: 'Anything outside it is a change request, and more hours.',
      }),
    ],
    theirs: [
      'configuring the modules in your pack',
      'setting up module dashboards',
      'training your users',
    ],
  },
  {
    key: 'live',
    label: 'Live',
    theme: 'green',
    blurb: 'You are running on ERPNext. Day 1 support is included; anything after it is an AMC.',
    yours: [task('signoff', 'Sign off on go-live')],
    theirs: ['standing by for Day 1 go-live'],
  },
]

// ⚠️ Guided onboarding is NOT a small implementation, and this spine is where
// that shows. It is three hours of teaching across ten working days, so the
// stages are the sessions themselves — there is no build phase, because the
// customer does the work. Forcing it into the pack's five stages was the
// alternative and it misnames every one of them.
const SESSION_STAGES = ONBOARDING_SESSIONS.map((session) => ({
  key: `session-${session.number}`,
  label: `Session ${session.number}`,
  theme: 'orange',
  // The session's own title and length, from the program document.
  blurb: `${session.title} — ${session.minutes} minutes, with you driving.`,
  yours: [
    task(`session-${session.number}-attend`, `Attend session ${session.number}`, {
      hint: 'You share your screen and do the steps. The consultant guides.',
    }),
    // The last session sets no homework, so the task simply is not there
    // rather than being a tick with nothing behind it.
    ...(session.homework
      ? [task(`session-${session.number}-homework`, 'Homework', { hint: session.homework })]
      : []),
  ],
  theirs: [`leading session ${session.number}`],
}))

const ONBOARDING_STAGES = [
  {
    key: 'booked',
    label: 'Booked',
    theme: 'blue',
    blurb: `${ONBOARDING.totalHours} hours with a certified partner, to be used within ${ONBOARDING.validity}.`,
    yours: [
      // Real: the eligibility gate, in the program's own words.
      task('confirm-plan', 'Confirm your Frappe Cloud plan', {
        hint: ONBOARDING.eligibility.detail,
      }),
      task('book-session-1', 'Request a time for session 1', { action: 'book-slot' }),
    ],
    theirs: ['assigning a certified consultant'],
  },
  {
    key: 'prep',
    label: 'Preparation',
    theme: 'blue',
    blurb: 'What you bring to the first session. Three hours is only enough if this is ready.',
    // Real, and the whole list: `ONBOARDING_CHECKLIST` is what the program
    // says the customer brings, so it is the preparation stage verbatim.
    yours: ONBOARDING_CHECKLIST.map((label, i) => task(`prep-${i}`, label)),
    theirs: ['sending the call link'],
  },
  ...SESSION_STAGES,
  {
    key: 'done',
    label: 'Done',
    theme: 'green',
    blurb: 'You can configure and run ERPNext yourself. What is left is a plan for the rest.',
    // The program's closing outcome, as the one thing still to do.
    yours: [
      task('roadmap', 'Write up your implementation roadmap', {
        hint: 'And decide where you want a partner to take over.',
      }),
    ],
    theirs: [],
  },
]

// ⚠️ Custom is the only spine with stages BEFORE a partner exists, and that is
// the reason it has its own. A pack and an onboarding both arrive with someone
// assigned; custom work starts as a description of a problem and has to find
// the firm that will take it on.
const CUSTOM_STAGES = [
  {
    key: 'requirements',
    label: 'Requirements',
    theme: 'blue',
    blurb: 'What you want built, in enough detail that a partner can price it.',
    yours: [
      task('describe', 'Describe what you need built', { action: 'scope' }),
      task('pick-modules', 'Pick the modules in scope', { action: 'scope' }),
    ],
    theirs: [],
  },
  {
    key: 'matching',
    label: 'Matching',
    theme: 'blue',
    blurb: 'Frappe puts your requirements in front of partners who do this kind of work.',
    yours: [task('review-partners', 'Review the partners who respond', { action: 'partners' })],
    theirs: ['matching you with partners in your industry', 'passing on your requirements'],
  },
  {
    key: 'proposal',
    label: 'Proposal',
    theme: 'orange',
    blurb: 'Hours, price and a timeline, against the scope you wrote.',
    yours: [
      task('review-proposal', 'Review the hours and the price', { action: 'message' }),
      task('approve-proposal', 'Approve the scope and the timeline'),
    ],
    theirs: ['estimating hours against your scope', 'sending you a proposal'],
  },
  {
    key: 'custom-kickoff',
    label: 'Kickoff',
    theme: 'orange',
    blurb: 'Your site is set up, and your data is what the build is based on.',
    yours: [
      task('custom-champion', responsibility('champion')),
      task('custom-data', responsibility('data ready'), { action: 'message' }),
    ],
    theirs: ['setting up your site', 'importing your data'],
  },
  {
    key: 'build',
    label: 'Build',
    theme: 'orange',
    blurb: 'The work itself, in whatever phases you and your partner agreed.',
    yours: [
      task('custom-approve', responsibility('approve internally')),
      task('custom-users', responsibility('users available')),
    ],
    theirs: ['building and configuring', 'training your users'],
  },
  {
    key: 'custom-live',
    label: 'Live',
    theme: 'green',
    blurb: 'You are running on it. Support after go-live is whatever your contract says.',
    yours: [task('custom-signoff', 'Sign off on go-live')],
    theirs: ['standing by for go-live'],
  },
]

const STAGES_BY_SERVICE = {
  pack: PACK_STAGES,
  onboarding: ONBOARDING_STAGES,
  custom: CUSTOM_STAGES,
}

// ⚠️ Returns an EMPTY ARRAY for a project with no service, and every caller is
// built to render that: a project that has not decided how it will be
// implemented has no spine to draw, so the page shows scope and one decision
// instead of a progress bar with nothing behind it. Falling back to the pack's
// stages here would invent five steps nobody has agreed to.
export const stagesFor = (service) => STAGES_BY_SERVICE[service] ?? []

// The stage a project is at. Falls back to the spine's FIRST stage rather than
// to nothing: a project with a service always has a stage, and an unknown key
// is a bug in the caller, not a state to render. Null when there is no service.
export const stageOf = (service, key) => {
  const stages = stagesFor(service)
  if (!stages.length) return null
  return stages.find((s) => s.key === key) ?? stages[0]
}

// Zero-based position in the spine, and how many there are. Both the progress
// bar and the "step 3 of 5" line read this, so they cannot disagree.
export const stageProgress = (service, key) => {
  const stages = stagesFor(service)
  if (!stages.length) return null
  const index = Math.max(
    stages.findIndex((s) => s.key === key),
    0,
  )
  return { index, total: stages.length, step: index + 1 }
}

// The stage after this one, or null at the end of the spine.
export const nextStage = (service, key) => {
  const stages = stagesFor(service)
  const index = stages.findIndex((s) => s.key === key)
  return index >= 0 ? (stages[index + 1] ?? null) : null
}

// ── What a stage is waiting on ──────────────────────────────────────────────
// `{ outstanding, waitingOn }` for the stage a project is at — the one fact
// both the listing row and the project page lead with, derived in one place so
// they cannot disagree.
//
// ⚠️ Built for the LISTING as much as the page. The rows used to read "Step 3
// of 5", which is a progress report: it says where a project is and not whether
// it wants anything. Four of those in a column cannot be triaged. `outstanding`
// is what turns the index into a queue.
//
// `waitingOn` is true when your side is clear and the other side has work —
// which is most of a project, and the state that most needs saying out loud.
export const stageWork = (project) => {
  const stage = stageOf(project?.service, project?.stage)
  if (!stage) return null
  const done = project.done ?? []
  const outstanding = (stage.yours ?? []).filter((t) => !done.includes(t.key)).length
  return { outstanding, waitingOn: outstanding === 0 && (stage.theirs ?? []).length > 0 }
}

// ── Timeline ────────────────────────────────────────────────────────────────
// ⚠️ A VALIDITY WINDOW, not a delivery estimate, and the wording everywhere has
// to keep that distinction. It is the period the hours must be USED within —
// the packs' `validityDays` and onboarding's ten working days, both real,
// contractual figures — and it says nothing about when you go live.
//
// Per-stage durations were the alternative and would have been better to read:
// "week 3 of 8", a bar filling against a date. Every number in it would have
// been invented, on a page whose whole job is telling someone where they stand.
// A soft fact stated precisely is worse than a hard fact stated narrowly.
//
// Custom work has NO window, because none exists until a partner quotes one.
// `null` is the honest answer and the page says so.
const DAY = 24 * 60 * 60 * 1000

// Ten WORKING days is what the onboarding document says, so weekends are
// skipped rather than the ten being multiplied into a fortnight. The difference
// is real for anyone booking around a holiday.
const addWorkingDays = (from, count) => {
  const d = new Date(from)
  let left = count
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    // 0 Sunday, 6 Saturday.
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1
  }
  return d.getTime()
}

// `{ label, startedAt, endsAt, daysLeft, expired }`, or null where no window
// has been agreed.
export const windowFor = (project) => {
  // ⚠️ `serviceAt`, NOT `at`. The window runs from the moment the service was
  // BOOKED, and a project's `at` is the moment someone wrote down what they
  // wanted — which can be months earlier. Counting from `at` meant a project
  // noted in January and booked in June opened with most of its validity
  // already spent, and a long enough gap showed it EXPIRED on the day it was
  // bought. The scope document is explicit: "Validity runs from the project
  // start date", and for a pack that date is the booking.
  //
  // Falls back to `at` for a project that arrived with its service already
  // set — booking a pack creates both in one gesture, so the two are the same
  // instant there and `serviceAt` is not worth writing.
  const from = project?.serviceAt ?? project?.at
  if (!from) return null
  if (project.service === 'pack') {
    const pack = STARTER_PACKS.find((p) => p.value === project.pack)
    if (!pack) return null
    // ⚠️ "60-day validity", not the pack's own `validity` string ("60 days").
    // Beside a countdown the bare string read as a second countdown — "60 days
    // · 42 days left" is two numbers in the same units where only one of them
    // is a remaining figure. Naming it as a TERM is what separates them.
    //
    // ⚠️ Also not "delivery time", which is what `PackPanel` calls this same
    // number. The scope document's own word is validity — it is the period the
    // hours must be used within, and it says nothing about when you go live.
    // The panel's wording is the one that is wrong; changing it is a separate
    // job from this one.
    return finishWindow(`${pack.validityDays}-day validity`, from, from + pack.validityDays * DAY)
  }
  if (project.service === 'onboarding') {
    return finishWindow(ONBOARDING.validity, from, addWorkingDays(from, 10))
  }
  return null
}

// ⚠️ A WEEK, flat, and not a proportion of the window. "Fewer than seven days"
// is a unit a person already thinks in; 20% of a 60-day pack and 20% of ten
// working days are two different amounts of trouble and neither is a thing
// anyone says out loud.
//
// Derived here rather than at each call site so the listing row and the project
// page cannot disagree about when a window has become a problem.
const URGENT_DAYS = 7

const finishWindow = (label, startedAt, endsAt) => ({
  // "60-day validity" / "10 working days" — what the contract calls the
  // window. Kept SEPARATE from the countdown below rather than composed into
  // one string, and that separation was learned the hard way: the first
  // version rendered "N days left of {label}", which for onboarding came out
  // as "10 days left of 10 working days" — two different units in one phrase,
  // one of them a countdown in calendar days and the other a contractual term
  // in working days. They are two facts. They read as two.
  label,
  startedAt,
  endsAt,
  // Rounded UP: a window with six hours left has one day left, not zero.
  // ⚠️ CALENDAR days in every case, including onboarding's — the end date is
  // computed in working days, but "how long have I got" is a question about
  // the calendar.
  daysLeft: Math.ceil((endsAt - Date.now()) / DAY),
  expired: endsAt < Date.now(),
  // ⚠️ Not `expired` as well — the two are separate states with separate
  // wording and separate colours, and a window that has run out is not a window
  // that is running out.
  urgent: endsAt >= Date.now() && endsAt - Date.now() <= URGENT_DAYS * DAY,
})

// ── Naming ──────────────────────────────────────────────────────────────────
// What the project is called wherever it is listed. A project NAMES ITSELF
// once it has one — someone who pressed New project typed one — and only falls
// back to deriving a name from the pack it was booked with, which is the path
// that never asked.
//
// The pack names the work and the company names whose it is; without a company
// (a demo viewer who never filled in onboarding) the pack alone still reads as
// a project.
export const projectName = (pack, company) =>
  company ? `${pack.name} implementation for ${company}` : `${pack.name} implementation`

// The same sentence for a project nobody typed a name for: the one an INQUIRY
// creates. `ContactPartnerDialog` asks which apps and which modules and
// nothing else — a name field is a third question in a dialog whose whole
// argument is that defining requirements shouldn't cost a detour — so the apps
// name the work here, exactly as the pack does above.
//
// ⚠️ Deriving from the APPS and not from the modules, even though the modules
// are the finer answer. "Finance, Sales and Purchase implementation" names the
// scope as it stood the minute the inquiry went out; scope moves, and a list of
// six modules is not a title anyone scans a projects page for. The app is the
// part of the answer that stays true.
//
// Renameable afterwards from the project itself — or it will be: nothing edits
// a project's name yet, which is the reason the derived one has to be good
// enough to live with rather than a placeholder.
// Which apps a project is in, for display and for the inquiry snapshot.
//
// ⚠️ The UNION of `apps` and the module list's own keys, not `apps` alone. A
// project made by `NewProjectDialog` picks ERPNext modules without ever being
// asked which app they belong to, so its `apps` is empty while its scope is
// plainly ERPNext work — and reading the field alone would show a project with
// six ERPNext modules and no app. The field is still the source of truth for
// the answer nothing else records: an app with no module catalogue behind it.
export const projectApps = (project) => [
  ...new Set([...(project.apps ?? []), ...Object.keys(project.modules ?? {})]),
]

export const inquiryName = (apps, company) => {
  const labels = apps.map((value) => APPS.find((a) => a.value === value)?.label ?? value)
  // Same "a, b and c" construction as the checklist's own sentence — see
  // `ProjectChecklist`. Written out rather than shared because two call sites
  // is not yet a helper, and `Intl.ListFormat` would pull a locale decision
  // into a file that has none.
  const what =
    labels.length > 1
      ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
      : (labels[0] ?? 'Frappe')
  return company ? `${what} implementation for ${company}` : `${what} implementation`
}

// ── The demo's projects ─────────────────────────────────────────────────────
// ⚠️ SEEDED, and invented on the same footing as everything else attached to a
// real partner in this repo — no firm named here is running any of this work.
//
// Four, because four is what it takes to see every state the tracker has:
//
// ⚠️ `apps` is EMPTY on the first two, and that is the shape of a pack and an
// onboarding rather than a gap in the seed. Both are bought as a fixed scope —
// the pack names the work — so neither one was ever asked which apps it wants.
// Only the last two can back an inquiry; see `inquiryProjects` in the store.
//
//   1  a pack mid-flight, with a partner and a validity window running down
//   2  an onboarding before its first session, where the checklist IS the stage
//   3  custom work with NO PARTNER YET — the state the partner card is absent in
//   4  a project with no service at all — no spine, no window, one decision
//
// Dated relative to now, the same way the seeded threads are, so the windows
// never go stale and the demo reads the same next year.
const daysAgo = (n) => Date.now() - n * DAY

export const demoProjects = () => {
  const idOf = (name) => PARTNERS.find((p) => p.name === name)?.id ?? null
  return [
    {
      id: 'pr-demo-pack',
      name: 'Manufacturing implementation for Northwind',
      apps: [],
      modules: {},
      service: 'pack',
      pack: 'manufacturing',
      partnerId: idOf('Tridots Tech'),
      stage: 'kickoff',
      // Partway through the stage, not at the start of it: an empty checklist
      // and a full one are both easier to lay out than a half-done one, which
      // is the state this page will spend its life in.
      done: ['nominate-champion', 'request-slot', 'attend-intro', 'confirm-scope', 'naming-series'],
      // 18 days into a 60-day window, so it reads as comfortably in hand.
      // A window close to expiry is a state worth seeing too — drag the stage
      // switcher's project here and change this number to see it.
      at: daysAgo(18),
      slot: null,
    },
    {
      id: 'pr-demo-onboarding',
      name: 'Guided onboarding for Northwind',
      apps: [],
      modules: {},
      service: 'onboarding',
      pack: null,
      partnerId: idOf('Finbyz Tech'),
      stage: 'prep',
      done: ['confirm-plan', 'book-session-1', 'prep-0', 'prep-1'],
      at: daysAgo(3),
      // The one seeded slot: a session 1 already requested, so the stage has
      // something to say about what it is waiting for.
      slot: { at: Date.now() + 2 * DAY, label: 'Thursday at 10:00' },
    },
    {
      // ⚠️ The important one. No partner, and two stages to go before there is
      // one — this is the project that proves the partner card is genuinely
      // absent rather than always-present.
      id: 'pr-demo-custom',
      name: 'Warehouse barcode workflow',
      apps: ['erpnext'],
      modules: { erpnext: ['inventory', 'manufacturing'] },
      service: 'custom',
      pack: null,
      partnerId: null,
      stage: 'matching',
      done: ['describe', 'pick-modules'],
      at: daysAgo(5),
      slot: null,
    },
    {
      // No service. The state the whole "decide later" path exists for.
      id: 'pr-demo-undecided',
      name: 'ERP rollout',
      apps: ['erpnext'],
      modules: {
        erpnext: ['finance', 'sales', 'purchase', 'inventory', 'manufacturing', 'hr'],
      },
      service: null,
      pack: null,
      partnerId: null,
      stage: null,
      done: [],
      at: daysAgo(1),
      slot: null,
    },
  ]
}
