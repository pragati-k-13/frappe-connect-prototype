// The implementation itself: what a project IS, the stages it moves through,
// and what is needed from whom at each one.
//
// ⚠️ THE STAGES AND THE TASKS ARE INVENTED, and they are the only invented
// thing in the booking flow. The scope document describes what is DELIVERED,
// not how the work is tracked, so the spines below are the prototype's own
// model.
//
// They are named after beats the rest of the product already talks about — the
// Day 1 go-live the exclusions mention, the Frappe Cloud site every pack is
// installed on — rather than a generic funnel (Demo / Proposal / Won), which is
// what a CRM calls its own progress and says nothing to the business that
// bought a pack.
//
// ⚠️ NEITHER SPINE TRACKS THE PARTNER'S WORK, and that is the load-bearing
// decision in this file. There is no stage that advances when a partner
// finishes something, because partners do not reliably mark anything finished
// and a tracker that lies is worse than no tracker. Every stage advances on
// what the CUSTOMER has done. `theirs` is prose, not state.
//
import { STARTER_PACKS } from './packs'
// Only `demoProjects` needs this, to resolve a firm's name to its id — by NAME
// rather than by id for the same reason `data/messages.js` does it: an id
// hard-coded here would rot silently the day a partner is renamed.
import { APPS, PARTNERS } from './partners'

// ── Services ────────────────────────────────────────────────────────────────
// ⚠️ TWO, not three. Guided onboarding — three hours of partner-led teaching
// sold as a product — is gone, and with it its own project spine, its landing
// section and `data/onboarding.js`. What Frappe Connect sells is a fixed-scope
// pack or a scoped implementation, and the recommendation picks between exactly
// those two.
//
// The two ways an implementation can be bought. `null` is a fourth state and
// not a fourth service: a project exists before this is decided — someone can
// write down what they want built and only then work out how to have it built.
//
// ⚠️ `value` is what a project stores. Renaming one orphans every project.
export const SERVICES = [
  {
    value: 'pack',
    label: 'Starter Pack',
    // What the row under the project's name reads when the service is set.
    summary: 'Fixed scope, fixed price, fixed hours.',
    to: '/connect/packs',
  },
  {
    value: 'custom',
    label: 'Custom implementation',
    summary: 'Scoped and quoted by a partner against what you need.',
    to: '/connect/recommendation',
  },
]

export const serviceOf = (value) => SERVICES.find((s) => s.value === value) ?? null

// ⚠️ A DRAFT IS A PROJECT WITH NO SERVICE. Saved from New project with its
// requirements, and nothing else has happened: no partner, no payment, nothing
// sent. Booking packs or sharing the requirements is what starts it. Until
// then it is the one kind of project that can be edited or thrown away,
// because nobody but its owner has seen it.
export const isDraft = (project) => Boolean(project) && !project.service

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
//   fc-login    opens Frappe Cloud
//   copy-code   copies the partner's referral code
//   fc-link     opens the Frappe Cloud screen that takes the code
//   terms       a checkbox and the terms dialog — a contract, not an errand
//
// ⚠️ A TASK IS SOMETHING THE PRODUCT CAN SEE YOU DO. That is the rule now, and
// it used to be "anything the customer owes", which is why this list had
// eighteen rows with a checkbox on each and the customer ticking them by hand.
// A box you tick yourself is not a record of what happened, it is a record of
// what you claim happened — and a tracker whose state is typed in by the person
// it is tracking can say a project is finished when nothing has been done.
//
// So the question for every row became: can this screen tell? Sending a message
// to your partner, agreeing the terms, taking your Frappe Cloud code, rating
// them at the end, and the three that the brief flow performs on your behalf —
// those it can see, and those are the tasks.
//
// Everything else — nominate a champion, have your data clean, keep to the
// scope, sign off with your partner — happens where this product has no
// visibility at all. Those are NOT tasks; they are in the terms the business
// agrees to in the first step.
//
// `optional: true` marks a task that does not hold the step up. The button
// that moves on waits only for the rest.
//
// ⚠️ THERE IS NO CONDITIONAL TASK ANY MORE, and there was a mechanism for one.
// `when(project)` hid a row until the project was ready for it, added for
// the custom spine's `agree-terms` — the terms could not be offered before a
// partner existed. That agreement is now part of the hire itself, and the filter
// went too: every count on this screen had to remember to route through it, and
// a no-op that four call sites must not forget is a trap that buys nothing.
// Bring it back if a second case turns up; do not keep it waiting for one.
const task = (key, label, rest = {}) => ({ key, label, ...rest })

// Is this task finished?
//
// ⚠️ TWO SOURCES, ONE ANSWER. Most tasks are recorded by the action that
// completes them — a dialog confirming, a brief going out — and live in
// `project.done`, which only the store writes. A `complete` predicate is for
// the ones already derivable from state the product holds anyway, where storing
// a second copy would be a fact that can go stale against itself.
export const isTaskDone = (t, project, ctx = {}) =>
  t.complete ? Boolean(t.complete(project, ctx)) : (project?.done ?? []).includes(t.key)

// Is YOUR side of this stage finished?
//
// ⚠️ A STAGE CAN BE INCOMPLETE WITH NO TASKS IN IT, which "every task is done"
// gets exactly backwards — an empty list satisfies `every` vacuously.
// "Choosing a partner" is the case. It has no tasks either, and
// for a week it showed a "Move to Hosting" button over a list of firms nobody
// had hired — the stage's entire purpose, skippable, because the thing that
// completes it is a partner rather than a checkbox. `complete` is how a stage
// says what finishes it when that is not a task.
export const isStageDone = (stage, project, ctx = {}) =>
  stage?.complete
    ? Boolean(stage.complete(project))
    : (stage?.yours ?? []).every((t) => t.optional || isTaskDone(t, project, ctx))


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

// ── The three spines ────────────────────────────────────────────────────────
// A stage is `{ key, label, theme, yours, theirs }`.
//
// `yours` are TASKS — things this product can see you do. `theirs` is prose for
// what the partner is doing, read by the listing. See the note on `task`.
//
// `theme` feeds frappe-ui's Badge. Blue for the stages before work starts,
// orange while it is under way, green once it is done — so the badge carries
// the same information as the position in the bar, for anyone reading the badge
// alone in the listing.

// ⚠️ THE HOSTING TASKS ARE SHARED BY BOTH SPINES, keyed per spine. A project
// carries one flat `done` list, so the custom spine's copies take a prefix.
// All three are OPTIONAL: a business already on Frappe Cloud, or one hosting
// elsewhere, has nothing to do here, and the step must not hold them up.
const hostingTasks = (prefix = '') => [
  task(`${prefix}fc-login`, 'Log in to Frappe Cloud', {
    hint: 'Your site is hosted on Frappe Cloud. Create an account if you do not have one.',
    action: 'fc-login',
    optional: true,
  }),
  task(`${prefix}fc-code`, 'Copy your partner’s referral code', {
    hint: 'You enter it on Frappe Cloud in the next task.',
    action: 'copy-code',
    optional: true,
  }),
  task(`${prefix}fc-link`, 'Link your Frappe Cloud account to your partner', {
    hint: 'Your partner then manages your hosting and bills you for it.',
    action: 'fc-link',
    optional: true,
  }),
]

// ⚠️ TWO STEPS, AND BOTH ARE SETUP. Data preparation, configuration and
// go-live happen between the business and the partner, where this product has
// no visibility — so there is no step for them. Once setup is done the project
// is simply under way (`setupDoneAt`) until the business marks it complete.
const PACK_STAGES = [
  {
    key: 'confirmed',
    label: 'Finalize collaboration',
    theme: 'blue',
    yours: [
      // Always done: a pack project only exists once checkout has taken the
      // payment. Shown so the step reads as the whole agreement.
      task('paid', 'Pay upfront', {
        hint: 'Paid in full to Frappe at checkout.',
        complete: () => true,
      }),
      // ⚠️ CONSENT, not status — the act itself, performed here. The one task
      // drawn as a checkbox, because ticking it IS the agreement.
      task('agree-terms', 'Agree to the terms and conditions', {
        hint: 'Payment, scope, validity and what your team provides.',
        action: 'terms',
      }),
    ],
    theirs: ['reading the brief that went out with your payment'],
  },
  {
    // ⚠️ ITS OWN STEP, AND EARLY. Hosting is how Frappe is paid, and nothing
    // can be configured until there is a site to configure.
    key: 'hosting',
    label: 'Set up hosting',
    theme: 'blue',
    yours: hostingTasks(),
    theirs: ['installing ERPNext on your site', 'setting up standard user roles'],
  },
]

// ⚠️ Custom is the only spine with a stage BEFORE a partner exists, and that is
// the reason it has its own. A pack arrives with someone assigned; custom work
// has to find the firm that will take it on.
//
// ⚠️ NO REQUIREMENTS STAGE. Writing and sending the requirements happens before
// the project page exists — the send creates the project — so a step for it
// was always already done, and every custom project opened on "Step 2".
const CUSTOM_STAGES = [
  {
    key: 'choosing',
    label: 'Choosing a partner',
    theme: 'blue',
    // ⚠️ NO TASKS AT ALL, and it had four. Go through the replies, approve
    // one, choose the one you are going with, agree the terms. The first three
    // recorded things the Replies section can SEE — a box confirming you
    // shortlisted somebody, under the button you pressed to shortlist them, is
    // the product asking for a receipt it wrote itself. They also produced the
    // fault that started this: three rows carrying the same "See the replies"
    // button, every one scrolling to the same section a few hundred pixels
    // below.
    //
    // The fourth was the terms, and it was the strangest of them: it appeared
    // only once a partner was hired, which is to say it asked you to agree the
    // terms of an engagement you had already entered. Agreeing is not a step
    // after hiring, it is what hiring IS — so it moved into the hire itself.
    // See `HirePartnerDialog`.
    //
    // What is left is a stage that is entirely its replies list, which is what
    // choosing a partner actually consists of.
    yours: [],
    // ⚠️ THE STAGE IS FINISHED WHEN A PARTNER IS HIRED, which is not a task and
    // cannot be one — it happens in the replies list below. Without this the
    // stage had no tasks, "every task is done" was vacuously true, and the
    // button to leave stood over a list of firms nobody had chosen.
    complete: (project) => Boolean(project?.partnerId),
    // ⚠️ NO `theirs` SENTENCE, and this is the one stage that has to go
    // without. The line is rendered as "<other party> is <fragment>", and the
    // other party here is a dozen firms rather than one — with no partner
    // assigned it came out as "Frappe is quoting against your requirements",
    // which names the wrong company for the wrong work. The Replies section
    // directly below says "5 of 6 partners replied", which is the same fact
    // stated precisely.
    theirs: [],
  },
  {
    key: 'custom-hosting',
    label: 'Set up hosting',
    theme: 'blue',
    yours: hostingTasks('custom-'),
    theirs: ['setting up your site', 'importing your data'],
  },
]

const STAGES_BY_SERVICE = {
  pack: PACK_STAGES,
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
  const outstanding = (stage.yours ?? []).filter(
    (t) => !t.optional && !isTaskDone(t, project),
  ).length
  return { outstanding, waitingOn: outstanding === 0 && (stage.theirs ?? []).length > 0 }
}

// ── Timeline ────────────────────────────────────────────────────────────────
// ⚠️ A VALIDITY WINDOW, not a delivery estimate, and the wording everywhere has
// to keep that distinction. It is the period the hours must be USED within —
// the packs' `validityDays`, a real contractual figure — and it says nothing
// about when you go live.
//
// Per-stage durations were the alternative and would have been better to read:
// "week 3 of 8", a bar filling against a date. Every number in it would have
// been invented, on a page whose whole job is telling someone where they stand.
// A soft fact stated precisely is worse than a hard fact stated narrowly.
//
// Custom work has NO window, because none exists until a partner quotes one.
// `null` is the honest answer and the page says so.
const DAY = 24 * 60 * 60 * 1000

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
    // ⚠️ THE LONGEST WINDOW IN THE BASKET, not the sum and not the first.
    // Validity is the period the hours must be used within and the packs are
    // delivered as one engagement, so two 30-day packs are not 60 days — and a
    // basket holding a 60-day pack is not over at 30.
    const packs = (project.packs ?? []).map((v) => STARTER_PACKS.find((p) => p.value === v))
    const pack = packs.filter(Boolean).sort((a, b) => b.validityDays - a.validityDays)[0]
    if (!pack) return null
    // ⚠️ "60-day validity", not the pack's own `validity` string ("60 days").
    // Beside a countdown the bare string read as a second countdown — "60 days
    // · 42 days left" is two numbers in the same units where only one of them
    // is a remaining figure. Naming it as a TERM is what separates them.
    //
    // ⚠️ Also not "delivery time", which is what the booking panel used to call
    // this same number. The scope document's own word is validity — it is the
    // period the hours must be used within, and it says nothing about when you
    // go live. That wording is fixed now: every surface takes the phrase from
    // `packFacts`, which says "to deliver".
    return finishWindow(`${pack.validityDays}-day validity`, from, from + pack.validityDays * DAY)
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
  // ⚠️ CALENDAR days, because "how long have I got" is a question about the
  // calendar.
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
// ⚠️ TAKES THE LIST, and does not try to name every pack in it. A basket of
// three produces "Accounts, Sales, Purchase, Stock, Manufacturing and HR and
// Payroll implementation for Northwind", which is not a title — it is the
// basket read out. One pack names itself; more than one is an ERPNext
// implementation, and the project page lists what is in it directly below.
export const projectName = (packs, company) => {
  const list = [packs].flat().filter(Boolean)
  const what = list.length === 1 ? list[0].name : 'ERPNext'
  return company ? `${what} implementation for ${company}` : `${what} implementation`
}

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
// Two, because two is what it takes to see every state the tracker has:
//
// ⚠️ `apps` is EMPTY on the first, and that is the shape of a pack rather than
// a gap in the seed. A pack is bought as a fixed scope — the pack names the
// work — so it was never asked which apps it wants. Only the second can back
// an inquiry; see `inquiryProjects` in the store.
//
//   1  packs mid-flight, with a partner and a validity window running down
//   2  custom work with NO PARTNER YET — the state the bid table is drawn in
//
// Dated relative to now, the same way the seeded threads are, so the windows
// never go stale and the demo reads the same next year.
const daysAgo = (n) => Date.now() - n * DAY

export const demoProjects = () => {
  const idOf = (name) => PARTNERS.find((p) => p.name === name)?.id ?? null
  return [
    {
      id: 'pr-demo-pack',
      name: 'ERPNext implementation for Northwind',
      apps: [],
      modules: {},
      service: 'pack',
      // Two, because a basket is the normal case now and a seeded project
      // holding one would never show the state the checkout produces.
      packs: ['accounts-sales-purchase-stock', 'manufacturing'],
      partnerId: idOf('Tridots Tech'),
      stage: 'hosting',
      // The terms are agreed — that is what got it past the first step — and
      // hosting is left untouched so the demo opens on its three tasks.
      done: ['agree-terms'],
      // 18 days into a 60-day window, so it reads as comfortably in hand.
      // A window close to expiry is a state worth seeing too — drag the stage
      // switcher's project here and change this number to see it.
      at: daysAgo(18),
      slot: null,
    },
    {
      // ⚠️ The important one. No partner, and the stage where that is being
      // decided — this is the project that proves the partner card is genuinely
      // absent rather than always-present, and the one the bid table is drawn
      // against.
      id: 'pr-demo-custom',
      name: 'Warehouse barcode workflow',
      apps: ['erpnext'],
      modules: { erpnext: ['inventory', 'manufacturing'] },
      service: 'custom',
      packs: [],
      partnerId: null,
      stage: 'choosing',
      done: [],
      at: daysAgo(5),
      slot: null,
    },
  ]

}

// ── The Frappe Cloud partner code ───────────────────────────────────────────
// ⚠️ THIS IS THE COMMERCIAL POINT OF THE WHOLE PRODUCT, and it is one short
// string on one task. Frappe is not paid for matching anybody: the packs are
// bought from Frappe once, custom work is paid entirely to the partner, and
// what Frappe actually sells is the Frappe Cloud site the implementation runs
// on. A partner code is how that site gets billed to the partner — who bills
// the business — instead of the business paying Frappe Cloud directly.
//
// So the hosting stage is not housekeeping placed after the interesting part.
// It is the part.
//
// ⚠️ GENERATED FROM THE PARTNER AND THE PROJECT, deterministically, so it is
// stable across reloads without being stored. A real build issues these from
// Frappe Cloud and this function is a stand-in for that call — don't teach
// anything to parse the format.
export const partnerCodeFor = (project, partner) => {
  if (!project || !partner) return null
  const seed = [...`${partner.id}${project.id}`].reduce((h, c) => (h * 33 + c.charCodeAt(0)) % 99999, 7)
  return `${partner.id.slice(0, 3).toUpperCase()}-${String(seed).padStart(5, '0')}`
}

// Where the code is entered. Out of the app — the point of the task is that
// this happens somewhere else.
//
// ⚠️ THIS PATH IS INVENTED. The mechanism is real and so is its name — Frappe
// Cloud lets a customer own their account while an implementation partner is
// billed for it, under "Paid via Partner" — but the public documentation does
// not say which dashboard screen takes the code, and the dashboard needs a
// login to look. So the deep link is plausible rather than checked, and it
// WILL be wrong if the settings are laid out differently.
//
// It is a deep link rather than the bare domain because a code is useless
// beside a home page: the task is "take this string to the one screen that
// wants it", and sending somebody to frappecloud.com leaves them to find that
// screen themselves. Signing in first is fine — Frappe Cloud bounces to login
// and returns here, which is what any dashboard link does.
//
// Replace with the real path before this is shown outside the team. Same rule
// as the invented partner rates and the generated quotes.
export const FRAPPE_CLOUD_URL = 'https://frappecloud.com/dashboard'

export const FRAPPE_CLOUD_PARTNER_URL = 'https://frappecloud.com/dashboard/settings/partner'
