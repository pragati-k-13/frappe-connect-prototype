import { defineStore } from 'pinia'
import { APPS, PARTNERS } from '../data/partners'
// Two consumers: `industryCounts`, the group totals on the industry filter's
// headings, and `saveCompany`, which derives a segment's group. Both need to
// know which segments belong to which group.
import { bidMessage, bookingThread, briefThread, contactThread, discoveryThreads } from '../data/messages'
import { demoProjects, inquiryName, nextStage, projectName, stagesFor } from '../data/project'
import { modulesFor } from '../data/modules'
import { INDUSTRIES } from '../data/quiz'
import { emptyBrief, matchingPartners } from '../data/custom'
import { bidFor, repliesToBrief } from '../data/bids'
import { STARTER_PACKS } from '../data/packs'
import { recommendedPackValues } from '../data/recommendation'

// A skipped question stores `null`, which every filter below reads as "no
// constraint". That keeps skip and never-asked identical downstream, so the
// results page needs no special cases — and if Skip is cut later, only the
// quiz page changes.
// Region and segments are the multi-answer dimensions: businesses routinely
// work with partners across more than one region, and a business rarely sits in
// exactly one segment either. Both store arrays, and an empty array reads as
// "no constraint" the same way `null` does for the single-answer questions.
//
// `industry` is the answer to Q1 and nothing more — it does NOT filter. The
// directory's taxonomy is two levels and partners are tagged at the segment
// level, so `segments` is the whole constraint: the quiz writes the one segment
// it asked for, and the results filter (a single grouped multi-select, industry
// as the group label) can widen that to any set across any groups. Keeping the
// group as a second, parallel filter meant two controls for one dimension and
// two chances for them to disagree.
const emptyAnswers = () => ({
  industry: null,
  segments: [],
  region: [],
  implementation: null,
})

// The demo has two axes. `role` is which SIDE of the product you're looking at
// (business or partner). `account` is, for the business side, where the viewer
// stands with it:
//
//   visitor    no account. Browsing the directory signed out.
//   exploring  has an account, no project yet. Partway through choosing, with
//              several conversations open — the messages screen's other viewer.
//   client     has an account, and an implementation already under way.
//
// The third state is the one this file's own note said would be needed one day
// ("an account with no project yet"), and it arrived with the messages screen:
// signing up and booking are different moments, and only the second one gives
// you a thread.
//
// Components should read the `signedIn` / `hasProject` getters rather than
// comparing the string, which is what keeps the enum here.
const ACCOUNT_STATES = ['visitor', 'exploring', 'client']

// What the visitor was trying to do when the gate interrupted them, so it can be
// finished once they're in. Module scope rather than store state on purpose:
// it's a callback, and a function sitting in reactive state is both pointless to
// track and awkward to serialise.
//
// ⚠️ It survives a route change, which is the whole reason it can work at all
// now that the gate NAVIGATES rather than opening a modal over the page. The
// component that set it is unmounted by the time it runs, so an action that
// touches component-local state is not safe to hold — every current one goes
// through the store, which is.
let pendingAction = null

// The answers and filters as they were immediately before the last `reset()`,
// so Undo on the cleared-filters toast can put them back. Module scope rather
// than store state: it's a one-shot stash the toast reads once, not something
// any screen renders.
let lastCleared = null

// The listing's primary order, always. Tier is the one ranking the partner
// programme itself publishes, so it outranks whatever order the filters happen
// to leave behind — a gold partner never sits below a bronze one.
//
// A partner with no tier isn't a fourth level, it's the absence of one: not in
// the programme, no badge in the row (see `TierIcon`). Those sort last.
const TIER_RANK = { gold: 0, silver: 1, bronze: 2 }
const tierRank = (p) => TIER_RANK[p.tier] ?? 3
const byTier = (a, b) => tierRank(a) - tierRank(b)

// The whole filter set as one object. Built rather than read straight off state
// so the search term is normalised in exactly one place, and so `results` and
// the suggestion groups are demonstrably asking about the same thing.
const criteriaFrom = (state) => ({
  segments: state.answers.segments,
  region: state.answers.region,
  implementation: state.answers.implementation,
  app: state.filters.app,
  countries: state.filters.countries,
  q: state.filters.search.trim().toLowerCase(),
})

// Does this partner survive the filters?
//
// `skip` lifts ONE constraint, which is the entire idea behind a suggestion
// group: the same filter set with a single dimension dropped. Keeping both in
// one function is what stops a group and the list above it from disagreeing
// about what the other filters mean — the bug you get the moment the filter
// logic is written out twice.
const matches = (p, c, skip = null) => {
  // Region and country are ONE dimension — `geo` — selected through a single
  // control, so they combine as a UNION and not an intersection. "All of Asia"
  // plus "Germany" has to mean either, the same way two regions or two segments
  // already do; read as an intersection it would return nothing, since no
  // partner is in both places.
  //
  // `p.countries` is an array because a partner could serve more than one,
  // even though every seeded one resolves to the last comma field of its city.
  if (skip !== 'geo' && (c.region.length || c.countries.length)) {
    const byRegion = c.region.includes(p.region)
    const byCountry = p.countries.some((x) => c.countries.includes(x))
    if (!byRegion && !byCountry) return false
  }
  if (skip !== 'app' && c.app && !p.apps.includes(c.app)) return false
  // Union, not intersection: several segments read as "any of these", the same
  // way several regions do. Partners are tagged with the directory's own segment
  // names, so this is a direct match — no mapping up to the group, because the
  // group isn't a filter of its own any more.
  if (skip !== 'segments' && c.segments.length && !p.industries.some((i) => c.segments.includes(i)))
    return false
  // A standard implementation is only useful from a partner who actually sells
  // starter packs.
  if (skip !== 'implementation' && c.implementation === 'standard' && p.packs.length === 0)
    return false
  // Never skipped — see SUGGESTABLE.
  if (c.q) {
    const haystack = [p.name, p.city, ...p.industries, ...p.apps].join(' ').toLowerCase()
    if (!haystack.includes(c.q)) return false
  }
  return true
}

// The dimensions a suggestion group may lift, and how to tell whether each is
// constraining anything right now.
//
// Search is deliberately absent. A typed term is a request for one specific
// thing — often a partner by name — so answering it with partners that don't
// match the text reads as the app ignoring what you typed.
const SUGGESTABLE = [
  // Region and country lift together, because they're one dimension. Lifting
  // only one of them would offer a "suggestion" the other half still excludes.
  { key: 'geo', active: (c) => c.region.length > 0 || c.countries.length > 0 },
  { key: 'segments', active: (c) => c.segments.length > 0 },
  // Only 'standard' constrains. Custom work rules nobody out, so lifting it
  // would produce an empty group.
  { key: 'implementation', active: (c) => c.implementation === 'standard' },
  { key: 'app', active: (c) => Boolean(c.app) },
]

// Suggest at or below this many results. Two is still a thin slice of a
// thirteen-partner directory — few enough that "these are your options" isn't
// yet true.
const SUGGEST_AT_OR_BELOW = 2
// Per group, so four lifted dimensions can't out-length the results themselves.
const SUGGEST_PER_GROUP = 3

export const useConnectStore = defineStore('connect', {
  state: () => ({
    // Which persona the demo is showing. Only 'business' is built out; the
    // switcher lands with the partner views.
    role: 'business',
    // See ACCOUNT_STATES above. Deliberately NOT cleared by `reset()`: it's
    // which demo you're in, not something the quiz collected — same as `role`.
    account: 'visitor',
    // Who the signed-in viewer is. Invented, but harmlessly so: this is the
    // demo's own business user, not a person at any of the real partners in
    // the directory, so a made-up name here asserts nothing about anyone.
    // Northwind is one of the fictional client companies in
    // `data/media.js`, and `.example` is the TLD reserved for documentation —
    // the address can never resolve to a real mailbox.
    viewer: {
      name: 'Meera Iyer',
      email: 'meera@northwind.example',
      company: 'Northwind',
    },
    // Partner ids the viewer has saved. ONE list for the whole app: the listing
    // row and the profile header are two views of the same bookmark, and as two
    // component-local `ref`s they disagreed the moment you used both — save
    // from the row, open that partner, and it showed unsaved.
    //
    // Cleared on log out, because a saved list belongs to an account.
    //
    // ⚠️ In memory only. A real build writes this to the visitor's account;
    // a reload still loses it.
    saved: [],
    answers: emptyAnswers(),
    // Set when the region was inferred rather than chosen. Nothing renders it
    // now — the "Guessed from your connection" line came out — but the seed
    // still happens, so the fact is worth keeping: it's what a disclosure, an
    // analytics event, or a "why am I seeing this?" affordance would read.
    regionInferred: false,
    // ⚠️ THIS USED TO BE A SECOND `project` KEY, four lines from the real one,
    // and the collision was silent: an object literal keeps the LAST value, so
    // `project` was the booked implementation and this scope was unreachable.
    // `EstimateQuoteDialog` read `store.project.modules` off `null` and the
    // modal threw the moment it opened.
    //
    // The fix is not a rename. A project now HOLDS its scope — `modules` is a
    // field on every project, decided before the service is — so the two
    // meanings that collided here were one thing all along. What is left is
    // the fallback the estimator needs when nobody has made a project yet,
    // which is what `scopeModules` hands it.
    //
    // Keys match `APPS[].value`, values match `MODULES[app][].key` in
    // `data/modules.js`.
    //
    // ⚠️ ERPNext only, and that isn't a shortcut. `data/modules.js` carries no
    // CRM catalogue (starter packs are ERP work) and doesn't break the Frappe
    // HR app into modules either. An entry for either app would sit here
    // contributing nothing — `modulesFor` returns an empty list for an app with
    // no catalogue — which reads as a bug rather than as scope.
    //
    // ⚠️ The `hr` below is ERPNext's HR module. It is NOT the Frappe HR app:
    // the two are separate, different products, and a project wanting Frappe HR
    // is not covered by ticking this. See the ⚠️⚠️ at the top of
    // `data/modules.js`.
    //
    // Six modules spanning 8 to 25 hours: the estimator has to show rows
    // carrying very different amounts, which is what the old five-plus-two
    // split across two apps was for before HR moved.
    //
    // Not cleared by `reset()`, same as `account` and `role` — it's the demo
    // you're in, not something the quiz collected.
    defaultScope: {
      erpnext: ['finance', 'sales', 'purchase', 'inventory', 'manufacturing', 'hr'],
    },
    // The pack the visitor pressed Get started on, by `value`. It lives here
    // rather than in the URL because the gate fires BEFORE the panel opens —
    // there is no `?pack=` yet at the moment of the click — and the onboarding
    // screen two navigations later still has to name it.
    //
    // ⚠️ Null when they arrived by another door (saving a partner, the top-bar
    // CTA). Onboarding's subtitle then reads generically rather than guessing
    // a pack they never chose.
    // ⚠️ A LIST, because the packs are disjoint modules now and the whole
    // shape of the recommendation is "these two". It replaces a single `pack`,
    // and the rename was not cosmetic: every reader had to decide what it meant
    // to hold one of something that is bought in twos.
    //
    // Seeded from the recommendation and then owned by the person — ticking and
    // unticking on the recommendation screen writes straight here, so the
    // basket survives sign-up, verification and the checkout.
    packs: [],
    // What a custom implementation is asking for. One per account rather than
    // one per project, for the same reason the intake is: this prototype has
    // one business in it. `data/custom.js` owns the shape and the rules.
    brief: emptyBrief(),
    // ⚠️ THE MOST VALUABLE FEEDBACK IN THE APP and the cheapest to collect:
    // whether the recommendation was right, asked on the screen that made it,
    // before anyone has spent anything. It is the only signal that says the
    // engine is wrong rather than that a partner was. `null` until answered,
    // then `{ ok, note }`.
    recoFeedback: null,
    // Ratings the account has left, `{ projectId, partnerId, rating, text, at }`.
    // Kept here and not on the project because a rating is about the PARTNER —
    // it is published on their profile — and the project is only where it was
    // collected.
    feedback: [],
    // ⚠️ UNPROMPTED, AND THE ONLY ONE OF THE THREE THAT IS. `recoFeedback` and
    // `feedback` are both answers to a question Frappe chose to ask at a moment
    // Frappe chose — which is what makes them answerable, and what makes them
    // blind to anything nobody predicted. This is whatever somebody types into
    // the rail's Give feedback dialog, from any screen, at any time:
    // `{ text, route, at }`. See `FeedbackDialog`.
    productFeedback: [],
    // What the onboarding screen collected. `name` is the company's, which is
    // also mirrored onto `viewer.company` — the sidebar and the quote header
    // read the viewer, and two names for one company drift apart.
    //
    // ⚠️ `operations` and `problems` are free text and optional. They're what a
    // partner reads before the first call; nothing in the app renders them yet.
    // What the intake collected, plus the name the account was opened with.
    //
    // ⚠️ `name` ARRIVES LAST, which is the reverse of how this used to work.
    // The intake runs before anyone signs up — three questions on the landing
    // page, answered anonymously — so everything here except the name exists
    // before there is an account to hang it on, and `saveAccount` fills the
    // name in at sign-up. A screen testing "has this account answered the
    // questions?" must therefore test `country`, not `name`.
    company: {
      name: '',
      country: '',
      employees: '',
      segments: [],
      apps: [],
      appsOther: '',
      operations: '',
      problems: [],
    },
    // Every implementation the account is tracking. A LIST, because a business
    // routinely has more than one thing on: a starter pack running while a
    // custom piece is being scoped, or an onboarding done months before either.
    //
    // A project is:
    //
    //   { id, name, apps, modules, service, pack, partnerId, stage, done, at, slot }
    //
    // and it acquires those fields IN THAT ORDER, which is the whole model.
    // `name`, `apps` and `modules` are what you want built — a project can
    // exist with nothing but those.
    //
    // ⚠️ `apps` is NOT derivable from `Object.keys(modules)`, which is why it is
    // a field of its own rather than a getter. Only some apps have a module
    // catalogue (ERPNext and Helpdesk, as `data/modules.js` stands), so "we
    // want Drive and Insights" has no module list to be inferred from — and
    // inferring the apps from the modules would drop that answer on the floor
    // at the exact moment someone gave it. The two overlap constantly and
    // neither one contains the other. `service` is how you have decided to have it built
    // (`null` until then, and the tracker draws no progress bar without one).
    // `partnerId` is who is doing it, which for custom work is not known for
    // two stages. `stage` and `done` are where it has got to.
    //
    // ⚠️ `done` is a flat array of TASK KEYS across the whole spine, not a
    // per-stage list — which is why `data/project.js` requires task keys to be
    // unique across a spine rather than within a stage.
    //
    // ⚠️ The confirmed screen can also be reached by URL with no store behind
    // it (`?pack=&partner=`), so every reader treats a missing project as
    // optional and falls back to the first stage — see `stageOf`.
    projects: [],
    // Every conversation the viewer can open, newest activity last within each
    // thread. Three ways in: the demo switch seeds the exploring viewer's
    // inbox, booking a pack adds the thread the confirmed screen promises
    // ("Project details sent via Messaging"), and Contact opens an empty one
    // from anywhere a partner is shown. A fresh account has none, which is why
    // the screen has a real empty state.
    //
    // ⚠️ In memory, like everything else here. Reloading loses what you typed.
    threads: [],
    // ⚠️ A REACTIVE MIRROR of `pendingAction` above, which is a module-level
    // `let` and so invisible to any computed. Nothing reads the action itself
    // from a template — only whether one is armed — and that question decides
    // how sign-up ends: with an errand in hand the company questions are asked
    // in a dialog over wherever the visitor was going, and without one they get
    // the full screen. See `hasErrand`.
    pendingHeld: false,
    // Is the company-details dialog open? Store state rather than a page's own
    // ref because the dialog is mounted at the app root — it has to be able to
    // sit over any screen the gate interrupted, not just one.
    companyPrompt: false,
    // Which partner the inquiry dialog is open for, by id — `null` when it is
    // closed. Store state and a partner ID rather than a page's own ref holding
    // a partner object, for the same reason `companyPrompt` is: the dialog is
    // mounted at the app root, because Contact is pressed from a listing row, a
    // profile header, two pricing cards and the estimate modal, and a dialog
    // owned by any one of those cannot open over the others.
    //
    // ⚠️ The ID, so the dialog resolves the partner itself. A copy of the record
    // parked in the store is a second source of truth for a firm's name and
    // rate, and this one would outlive the row that put it there.
    inquiryFor: null,
    // What the dialog should open with already filled in, when whatever opened
    // it knows more than the dialog does. Only the estimate modal sets it: the
    // visitor has just been ticking modules against a price, and asking those
    // same questions again on the next screen is the friction this whole flow
    // exists to remove. `{ apps, modules }`, and `null` from every other door.
    inquiryPrefill: null,
    // Filters on the results page. `app` starts unset — it's a refinement
    // offered mid-list, not a qualifier.
    // `countries` is the granular half of the region dimension. Empty reads as
    // "no constraint", the same as an unset `app` — see the filter notes above.
    // It is NOT post-quiz only: the quiz's India chip is a country, so the
    // question before the listing writes this field too (`toggleGeo`).
    filters: { search: '', app: null, countries: [] },
  }),

  getters: {
    // The two questions a screen actually wants to ask. Everything that varies
    // by account state should go through these, so the enum stays in one place.
    signedIn: (state) => state.account !== 'visitor',
    // Did the visitor arrive at sign-up in the middle of doing something?
    //
    // A pack means they pressed Get started; `pendingHeld` means a gated control
    // (Save, Contact) is waiting to finish. Either way they were interrupted,
    // so the company questions are asked in a dialog OVER where they were going
    // rather than as a screen of their own — the errand stays visible behind it.
    //
    // Neither is true for the top bar's "Log in or create account": that is the
    // one path where signing up IS the errand, and it keeps the full screen.
    hasErrand: (state) => state.packs.length > 0 || state.pendingHeld,
    // ⚠️ Derived from the LIST, not from `account`. It used to read
    // `account === 'client'`, which was the same answer while a project could
    // only be created by booking a pack — but the enum's third state means
    // "signed in, mid-implementation", and someone who signs up and books
    // nothing is a client with no project. Asking the data is what makes that
    // state come out right without anyone having to remember it.
    hasProject: (state) => state.projects.length > 0,

    // One project by id. A function getter because every caller asks about one
    // — the detail route resolves its `:id` through this, and an unknown id is
    // an empty state rather than an error.
    projectBy: (state) => (id) => state.projects.find((p) => p.id === id) ?? null,

    // The project behind a booking, found the way the Confirmed screen has to
    // find it: by the two things that screen carries in its URL.
    //
    // ⚠️ SEARCHED FROM THE END, and matched on a PACK as well as the partner —
    // `packValue` is now one of possibly several a project holds, so the test
    // is membership rather than equality.
    //
    // ⚠️ SEARCHED FROM THE END, and matched on the PACK as well as the partner.
    // Both were learned from the same bug. The first version took the first
    // project with a matching partner, and booking a second pack with a partner
    // you were already working with put the OLD project on the confirmation
    // screen — right partner, wrong pack, wrong stage, wrong dates, and a
    // "Project created" line dated weeks earlier than the click that produced
    // it. Matching the pack rules out the other project; taking the last match
    // rules out the older of two bookings of the SAME pack from the same
    // partner, which is rarer but is what the demo's seeded data does.
    //
    // `packValue` is optional: a caller that knows only the partner still gets
    // their most recent project.
    projectForBooking: (state) => (partnerId, packValue) => {
      for (let i = state.projects.length - 1; i >= 0; i -= 1) {
        const p = state.projects[i]
        if (p.partnerId !== partnerId) continue
        if (packValue && !(p.packs ?? []).includes(packValue)) continue
        return p
      }
      return null
    },

    // The module scope the estimate modal prices.
    //
    // The projects an INQUIRY can be sent about, newest first.
    //
    // ⚠️ Custom work and undecided projects ONLY, and that is the flow's own
    // boundary rather than a filter for tidiness. A pack and a guided
    // onboarding are bought as a FIXED SCOPE — the pack names the work, the
    // price is published, and the partner is assigned rather than asked — so
    // there is no estimate for a partner to calculate and nothing an inquiry
    // would carry. Asking "which modules?" about a pack contradicts the pack.
    //
    // An account whose only projects are packs therefore reads as an account
    // with none, and gets the define-requirements form: the custom project it
    // is about to start is genuinely a new project, not a second inquiry about
    // the one already running.
    //
    // Newest first, matching the projects page — the thing you started most
    // recently is the thing you are most likely to be asking about.
    inquiryProjects: (state) =>
      [...state.projects].reverse().filter((p) => p.service === 'custom' || p.service === null),

    // Has this partner been told what we want built?
    //
    // ⚠️ THIS IS NOT "is there a thread". Contact skips the inquiry dialog for a
    // partner who already has the requirements, and the first version of that
    // test was the existence of a conversation — which is wrong twice over. The
    // `exploring` persona is SEEDED with four discovery threads (see `SEEDS` in
    // `data/messages.js`), so on four of thirteen partners the dialog was
    // unreachable; and those threads are the exact case the gate exists for —
    // someone mid-question who has never said which apps or which modules.
    //
    // Two things count as having sent them:
    //
    //   inquiry   the requirements card `sendInquiry` writes
    //   company   the company profile a BOOKING sends, alongside the pack ask
    //             and the call — a pack IS a fixed scope, so that conversation
    //             has requirements in it even though nobody filled this dialog
    //
    // A thread of plain messages counts as neither, however much has been
    // typed into it. What a partner can quote against is a scope, not a chat.
    requirementsSentTo: (state) => (partnerId) =>
      Boolean(
        state.threads
          .find((t) => t.partnerId === partnerId)
          ?.messages.some((m) => m.kind === 'inquiry' || m.kind === 'company'),
      ),

    // The newest project's, because that is the one you were last thinking
    // about — falling back to `defaultScope` when there are no projects, since
    // the modal is open to signed-out visitors and has to have something to
    // price. See the note on `defaultScope` in state.
    scopeModules: (state) => state.projects.at(-1)?.modules ?? state.defaultScope,

    // A function getter rather than a derived list: every caller asks about one
    // partner, and `saved` is a plain array of ids so `includes` is the whole
    // check.
    isSaved: (state) => (id) => state.saved.includes(id),

    // A stand-in for GeoIP. Real implementations resolve this server-side on
    // first paint; the mock hardcodes the common case so the interaction (a
    // pre-filled answer you can override) is reviewable.
    //
    // Shaped like a `GEO_CHOICES` entry — `{ country }` or `{ region }` — because
    // that's what the geo question is answered with, and the common case here is
    // a country: eight of thirteen partners are in India and so is most of the
    // traffic. A real GeoIP resolves to a country too; the region is the fallback
    // for the ones no chip names.
    inferredGeo: () => ({ country: 'India' }),

    results(state) {
      const c = criteriaFrom(state)
      return (
        PARTNERS.filter((p) => matches(p, c))
          // `.filter()` already handed back a fresh array, so this sorts a copy,
          // not PARTNERS. Sort is stable in every engine this runs on, which is
          // what keeps the order inside a tier equal to the order in
          // `data/partners.js` — the seed list's order is the tiebreak.
          .sort(byTier)
      )
    },

    // Partner count per country, for the labels on the country filter.
    //
    // Skips the whole `geo` dimension — region and country together, because
    // they are one dimension — and nothing else. That's what makes the numbers
    // worth reading: counted with geo applied, every country you hadn't picked
    // would read 0 the moment you picked one.
    //
    // So each number answers "how many would picking this ADD", which is the
    // right question now that the dimension is a union: with Europe selected,
    // India still reads 8, because ticking it would widen the list by eight and
    // not narrow it to nothing. Industry, app and search are still respected.
    //
    // A plain object keyed by country name. Countries with no partners never
    // appear here; the filter reads a missing key as 0 rather than this getter
    // having to know the directory's full country list.
    countryCounts(state) {
      const c = criteriaFrom(state)
      const counts = {}
      for (const p of PARTNERS) {
        if (!matches(p, c, 'geo')) continue
        for (const country of p.countries) counts[country] = (counts[country] ?? 0) + 1
      }
      return counts
    },

    // Partner count per segment, for the labels on the industry filter. The
    // same shape and the same reasoning as `countryCounts` above: it skips the
    // whole `segments` dimension and nothing else, so each number says how many
    // picking that row would ADD rather than reading 0 the moment you pick a
    // sibling. Region, app and search are still respected.
    segmentCounts(state) {
      const c = criteriaFrom(state)
      const counts = {}
      for (const p of PARTNERS) {
        if (!matches(p, c, 'segments')) continue
        for (const segment of p.industries) counts[segment] = (counts[segment] ?? 0) + 1
      }
      return counts
    },

    // Partner count per industry GROUP, keyed by industry value — the number on
    // the filter's group headings.
    //
    // ⚠️ Not the sum of the group's segment counts, which is what the geo
    // filter's heading can get away with. A partner sits in exactly one country
    // but routinely in several segments — Tridots is in five — so summing would
    // count the same partner once per segment it lists and report more
    // "partners" in Manufacturing than the directory holds. This counts each
    // partner once per group.
    industryCounts(state) {
      const c = criteriaFrom(state)
      const counts = {}
      for (const p of PARTNERS) {
        if (!matches(p, c, 'segments')) continue
        for (const industry of INDUSTRIES) {
          if (p.industries.some((i) => industry.segments.includes(i))) {
            counts[industry.value] = (counts[industry.value] ?? 0) + 1
          }
        }
      }
      return counts
    },

    // Partners that are ONE lifted filter away from qualifying, grouped by which
    // filter that is. For when the current set has narrowed so far that the list
    // isn't a choice any more.
    //
    // The groups are mutually exclusive by construction, and that's the point: a
    // partner is only listed under `region` if it satisfies every OTHER filter,
    // so one that misses both region and industry appears in neither group. A
    // suggestion you'd have to change two things to reach isn't a suggestion.
    //
    // Returns dimension keys, not prose — which filter was lifted is a fact
    // about the data, and how to word it is the results page's business.
    suggestions(state) {
      if (this.results.length > SUGGEST_AT_OR_BELOW) return []
      const c = criteriaFrom(state)
      return SUGGESTABLE.filter((d) => d.active(c))
        .map((d) => ({
          key: d.key,
          // `matches(…, d.key)` is "would qualify without this filter";
          // `!matches(…)` drops the ones already in the list above.
          partners: PARTNERS.filter((p) => matches(p, c, d.key) && !matches(p, c))
            .sort(byTier)
            .slice(0, SUGGEST_PER_GROUP),
        }))
        .filter((g) => g.partners.length)
    },
  },

  actions: {
    // Which side of the product the demo is showing. Only 'business' is built
    // out; the partner views and their PRM surfaces land later, so the demo
    // switch offers the option disabled rather than hiding it.
    setRole(role) {
      this.role = role
    },

    // Guarded rather than assigned straight through: the switcher is the only
    // caller today, but an unknown string here would silently make both
    // getters read as "signed in but no project", which is a state that
    // doesn't exist.
    setAccount(account) {
      if (!ACCOUNT_STATES.includes(account)) return
      this.account = account
    },

    // The demo switch's version of `setAccount`: it also loads the inbox that
    // belongs to the persona being switched to. Separate from `setAccount`
    // because `completeLogin` calls that one the moment onboarding finishes,
    // and a brand new account must NOT be handed threads it never started.
    demoAccount(account) {
      if (!ACCOUNT_STATES.includes(account)) return
      this.setAccount(account)
      this.threads = account === 'exploring' ? discoveryThreads() : []
      // ⚠️ The client persona is seeded with FOUR projects, and the count is
      // the point rather than generosity: between them they cover every state
      // the tracker has to render — both services, a project with no
      // service at all, and one whose partner has not been picked yet. Three
      // of the four would leave a state with no way to see it.
      this.projects = account === 'client' ? demoProjects() : []
      // ⚠️ THE CUSTOM DEMO PROJECT NEEDS ITS REPLIES. Its own note calls it
      // "the one the bid table is drawn against", and it was seeded with no
      // broadcast and no bids — so the table never rendered on it and the
      // stage had nothing under the bar but a heading. That was survivable
      // while the stage also carried four checkboxes; the replies list IS the
      // stage now, so an empty one is an empty screen.
      //
      // Seeded through the same two calls the real flow uses, rather than a
      // hand-written array: `broadcast` names who was written to, and
      // `simulateReplies` decides who answered and at what price. A demo built
      // from the product's own functions cannot show a state the product
      // cannot reach.
      for (const project of this.projects) {
        if (project.service !== 'custom' || project.stage !== 'choosing') continue
        project.broadcast = {
          at: Date.now() - 5 * 86400000,
          partnerIds: PARTNERS.filter((p) => p.region === 'asia')
            .slice(0, 6)
            .map((p) => p.id),
        }
        this.simulateReplies(project.id)
      }
      // ⚠️ SEEDED for the signed-in personas, because they are meant to read as
      // accounts that finished onboarding — `viewer.company` has said Northwind
      // all along, and `company` saying nothing made the store disagree with
      // itself. It shows: the contact wizard asks for company details exactly
      // when `company.name` is empty, so without this every persona met the
      // 3-step version of a dialog they should see one step of.
      //
      // `visitor` keeps the empty form. That IS the state a fresh sign-up is in,
      // and it is the one the wizard exists for.
      this.company =
        account === 'visitor'
          ? { name: '', employees: '', segments: [], operations: '', problems: [] }
          : {
              name: this.viewer.company,
              employees: '11 to 50',
              segments: ['Discrete Manufacturing'],
              operations: 'disconnected',
              problems: ['integration', 'visibility'],
            }
    },

    // Booking a pack starts a conversation carrying three things — see
    // `bookingThread`. Idempotent by partner: confirming twice with the same
    // partner reopens the thread rather than stacking a second copy of it.
    startBooking({ partner, packs }) {
      // The booking IS the project: one gesture starts both, so nothing else
      // has to remember to create the second one.
      //
      // ⚠️ Always a NEW project, even when an undecided one is sitting in the
      // list. Adopting one would mean guessing WHICH — and a business that
      // wrote down "ERP rollout" and then bought a Manufacturing pack may well
      // have meant them as two separate things. The list shows both; merging
      // them is a gesture nobody has designed.
      const list = [packs].flat()
      this.projects = [
        ...this.projects,
        {
          id: `pr-${Date.now()}`,
          // Derived, not typed: this path never asked for a name.
          name: projectName(list, this.company.name || this.viewer.company),
          apps: [],
          // A pack IS its scope, so the project carries no module list of its
          // own — `PackPanel` renders what the pack covers. Empty rather than
          // absent so every project has the same shape.
          modules: {},
          service: 'pack',
          // ⚠️ A LIST. See the note on `packs` in the state above.
          packs: list.map((p) => p.value),
          partnerId: partner.id,
          stage: 'confirmed',
          done: [],
          at: Date.now(),
          slot: null,
        },
      ]
      // ⚠️ The message goes out whether or not the customer ever opens the
      // inbox — see `bookingThread`. An assignment nobody has been told about
      // is not an assignment.
      const existing = this.threads.find((t) => t.partnerId === partner.id)
      if (existing) return existing.id
      this.threads = [...this.threads, bookingThread({ partner, packs: list })]
      return partner.id
    },

    // ── Projects ─────────────────────────────────────────────────────────
    // A project with nothing decided but what it is called and what it covers.
    // This is the door "New project" opens, and the one path that produces a
    // project with no service — every other way in (booking a pack) arrives
    // with the service and the partner already settled.
    //
    // Returns the id so the caller can navigate straight to it.
    createProject({ name, apps, modules }) {
      const id = `pr-${Date.now()}`
      this.projects = [
        ...this.projects,
        {
          id,
          name: name.trim(),
          // Which apps the work is in, independent of the module list — see the
          // ⚠️ on `projects` for why one cannot be derived from the other.
          apps: apps ?? [],
          modules: modules ?? {},
          // The three that are not decided yet, spelled out rather than left
          // off: a project's shape should not depend on how it was made.
          service: null,
          // ⚠️ A LIST, because the packs are disjoint modules now and the whole
    // shape of the recommendation is "these two". It replaces a single `pack`,
    // and the rename was not cosmetic: every reader had to decide what it meant
    // to hold one of something that is bought in twos.
    //
    // Seeded from the recommendation and then owned by the person — ticking and
    // unticking on the recommendation screen writes straight here, so the
    // basket survives sign-up, verification and the checkout.
    packs: [],
    // What a custom implementation is asking for. One per account rather than
    // one per project, for the same reason the intake is: this prototype has
    // one business in it. `data/custom.js` owns the shape and the rules.
    brief: emptyBrief(),
    // ⚠️ THE MOST VALUABLE FEEDBACK IN THE APP and the cheapest to collect:
    // whether the recommendation was right, asked on the screen that made it,
    // before anyone has spent anything. It is the only signal that says the
    // engine is wrong rather than that a partner was. `null` until answered,
    // then `{ ok, note }`.
    recoFeedback: null,
    // Ratings the account has left, `{ projectId, partnerId, rating, text, at }`.
    // Kept here and not on the project because a rating is about the PARTNER —
    // it is published on their profile — and the project is only where it was
    // collected.
    feedback: [],
    // ⚠️ UNPROMPTED, AND THE ONLY ONE OF THE THREE THAT IS. `recoFeedback` and
    // `feedback` are both answers to a question Frappe chose to ask at a moment
    // Frappe chose — which is what makes them answerable, and what makes them
    // blind to anything nobody predicted. This is whatever somebody types into
    // the rail's Give feedback dialog, from any screen, at any time:
    // `{ text, route, at }`. See `FeedbackDialog`.
    productFeedback: [],
          partnerId: null,
          stage: null,
          done: [],
          at: Date.now(),
          slot: null,
        },
      ]
      return id
    },

    // Deciding HOW the work gets done. Sets the spine and drops the project on
    // its first stage — a service with no stage would render a progress bar
    // with nothing lit.
    //
    // ⚠️ Clears `done`. The task keys belong to the spine being left, so
    // carrying them over would tick tasks on the new one at random wherever two
    // spines happen to share a key.
    chooseService(id, service) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return
      const stages = stagesFor(service)
      if (!stages.length) return
      project.service = service
      project.stage = stages[0].key
      project.done = []
      // ⚠️ When the CLOCK starts, which is not when the project was written
      // down — a validity window runs from the booking. See `windowFor`.
      project.serviceAt = Date.now()
    },

    // Which packs, once a service of 'pack' has been chosen. Separate from
    // `chooseService` because the catalogue is a screen away: you decide you
    // want packs, then you go and pick them.
    selectProjectPacks(id, packValues) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return
      project.packs = [...packValues]
    },

    // Who is doing the work. The custom spine is the caller that matters — it
    // reaches `matching` with `partnerId` still null and this is what fills it.
    assignPartner(id, partnerId) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return
      project.partnerId = partnerId
    },

    // Record a task as finished.
    //
    // ⚠️ THE SYSTEM WRITES THIS, NOT THE CUSTOMER, and it was `toggleTask` —
    // called from a checkbox, arguing that somebody's own record should be
    // correctable. That argument loses to a simpler one: a tracker whose state
    // is typed in by the person being tracked is not tracking anything. Every
    // caller is now an action that OBSERVED the thing happen — a dialog
    // confirmed, a code taken, a brief broadcast.
    //
    // One-way and idempotent. There is no un-complete because there is no
    // gesture that could mean one: you cannot un-send a message or un-agree a
    // set of terms, and confirming the same dialog twice must not undo it.
    completeTask(id, taskKey) {
      const project = this.projects.find((p) => p.id === id)
      if (!project || project.done.includes(taskKey)) return
      project.done = [...project.done, taskKey]
    },

    // Jump to a named stage. The demo switcher's, and deliberately unguarded by
    // the checklist: a reviewer has to be able to see the last stage without
    // ticking their way through twenty tasks to reach it.
    //
    // ⚠️ Does NOT touch `done`. Stepping back and forward through the stages
    // has to leave the same project behind it, or the switcher is destroying
    // the state it exists to let you look at.
    setStage(id, stageKey) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return
      if (!stagesFor(project.service).some((s) => s.key === stageKey)) return
      project.stage = stageKey
    },

    // The other way a stage moves: forward by one, because the work of this one
    // is finished. Returns the stage it moved TO — null at the end of the spine
    // — so the caller can name where it went without re-reading the store.
    advanceStage(id) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return null
      const next = nextStage(project.service, project.stage)
      if (next) project.stage = next.key
      return next
    },

    // A requested slot, from `BookSlotDialog`. Recorded on the project so the
    // stage can say what it is waiting for — "Tuesday 14:30, awaiting
    // confirmation" — rather than the request vanishing into a toast, which is
    // what happened before this existed.
    //
    // ⚠️ Does not advance on its own. Requesting is not attending, and the two
    // pack stages either side of it (`confirmed`, `intro-call`) are separated
    // by exactly that difference. The page ticks the task; the customer moves
    // on when the call has happened.
    recordSlot(id, slot) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return
      project.slot = slot
    },

    // The other way a conversation starts: Contact, from anywhere a partner is
    // shown. Chat is NOT downstream of booking — a visitor can have a question
    // long before they are ready to buy a pack, and gating the only way to ask
    // it behind a purchase is backwards.
    //
    // Idempotent by partner on the same terms as `startBooking`, and they share
    // the keying (`thread.id` IS `partner.id`), so Contact on a partner you have
    // already booked opens the booking thread rather than a second empty one
    // beside it. Returns the id either way, so the caller can navigate to it.
    openThread(partner) {
      const existing = this.threads.find((t) => t.partnerId === partner.id)
      if (existing) return existing.id
      this.threads = [...this.threads, contactThread(partner)]
      return partner.id
    },

    // Appends to the thread and returns nothing: the screen reads the store
    // back rather than being told what it just sent.
    sendMessage(threadId, body) {
      const text = body.trim()
      if (!text) return
      const thread = this.threads.find((t) => t.id === threadId)
      if (!thread) return
      thread.messages.push({
        id: `m-${Date.now()}`,
        from: 'you',
        at: Date.now(),
        kind: 'text',
        body: text,
      })
    },

    // Returns the state it moved TO, so the caller can name which way it went
    // without re-reading the store to find out.
    toggleSaved(id) {
      const next = !this.saved.includes(id)
      this.saved = next ? [...this.saved, id] : this.saved.filter((s) => s !== id)
      return next
    },

    // Logging out is `setAccount('visitor')` plus dropping what the account
    // held. Without the second half the bookmarks stayed filled afterwards —
    // the row was reading a list that no longer belonged to anyone. Returns how
    // many were dropped so the confirmation can say.
    logOut() {
      const cleared = this.saved.length
      this.saved = []
      // Conversations and the projects belong to the account, same as the
      // saved list.
      this.threads = []
      this.projects = []
      // An inquiry left open would be a dialog addressed to a partner on behalf
      // of an account that has just stopped existing.
      this.closeInquiry()
      this.setAccount('visitor')
      return cleared
    },

    // The three halves of the gate. `useAuthGate` in `utils/auth.js` is what
    // components call; these are what it and the auth screens use.
    //
    // ⚠️ Holding is deliberately NOT the same step as running. The gate now
    // sends the visitor to a screen of its own, so between the two there is a
    // full navigation: the action has to run once the app is back on the page
    // it interrupted, not while the auth screen is still mounted. See
    // `runPending`.
    holdUntilLogin(action) {
      pendingAction = action ?? null
      this.pendingHeld = Boolean(pendingAction)
    },

    // Run the held action. Called by an auth screen AFTER it has navigated back
    // to `next`, so the action lands on a mounted page and isn't clobbered by
    // the navigation that would otherwise follow it.
    runPending() {
      const action = pendingAction
      pendingAction = null
      this.pendingHeld = false
      action?.()
    },

    // Backing out drops it. An auth screen the visitor left without finishing
    // must not leave an action armed — otherwise signing in from somewhere else
    // an hour later silently saves the partner they walked away from.
    dropPending() {
      pendingAction = null
      this.pendingHeld = false
    },

    // ── The company-details dialog ───────────────────────────────────────
    // ⚠️ DECLINES while an inquiry is on screen, and that guard is the fix for a
    // real stack of two modals. `VerifyPage` runs whatever the gate was holding
    // and then opens this — so a visitor who pressed Contact, signed up and came
    // back got the inquiry dialog with the company questions trapped behind it.
    // The inquiry dialog asks them itself now, as steps 1 and 2 of its wizard
    // (`ContactPartnerDialog`), so this one has nothing left to add there.
    //
    // The guard lives here rather than in `VerifyPage` because the rule is about
    // the two dialogs, not about the screen that happened to open them both.
    openCompanyPrompt() {
      if (this.inquiryFor) return
      this.companyPrompt = true
    },
    // ⚠️ Only `saveCompany` should reach this. The dialog has no close button
    // and is not dismissible: Frappe assigns the partner off these answers, so
    // an account that skipped them is an account nothing can be matched for.
    closeCompanyPrompt() {
      this.companyPrompt = false
    },

    // ── The inquiry dialog ───────────────────────────────────────────────
    // Contact, from anywhere a partner is shown. What it opens depends on
    // whether the account has a project to talk about — the dialog decides
    // that, reading `inquiryProjects`; this only says which partner.
    openInquiry(partnerId, prefill = null) {
      this.inquiryFor = partnerId
      this.inquiryPrefill = prefill
    },
    // ⚠️ The prefill is dropped here and not on open. Clearing it as the dialog
    // opens would clear it before the dialog has read it; leaving it set after
    // the dialog closes would prefill the NEXT partner's inquiry with modules
    // ticked against a rate that is no longer on screen.
    closeInquiry() {
      this.inquiryFor = null
      this.inquiryPrefill = null
    },

    // Requirements with nobody to send them to: "Save without sending" on the
    // inquiry dialog. The same project `sendInquiry` would have made, minus the
    // conversation — so a business that has worked out what it wants but not who
    // should build it has somewhere to put that.
    //
    // Returns the project, which is what the toast names.
    saveRequirements({ apps = [], modules = {} }) {
      const id = this.createProject({
        name: inquiryName(apps, this.company.name || this.viewer.company),
        apps,
        modules,
      })
      return this.projects.find((p) => p.id === id) ?? null
    },

    // Sending it. Three things happen, in this order, and the order is the
    // model: a project exists, a conversation exists, the requirements are in
    // it.
    //
    // `projectId` names an existing project, or is null — in which case the
    // requirements passed in become a NEW project. That is the whole point of
    // the flow: defining requirements is not a detour to the projects page, it
    // is the thing you were already doing.
    //
    // Returns `{ thread, project, created }` — the thread id the toast's action
    // needs, the project the requirements belong to, and whether this call is
    // what brought it into existence. `created` is the only way the caller can
    // know: the project path and the create path are the same gesture from the
    // outside, and only one of them has something new to announce.
    sendInquiry({ partnerId, projectId = null, apps = [], modules = {}, message = '' }) {
      const partner = PARTNERS.find((p) => p.id === partnerId)
      if (!partner) return null

      // ⚠️ Named, not asked for, on the create path. `inquiryName` derives the
      // title from the apps; a name field would be a third question in a dialog
      // whose whole argument is that this costs no detour. Renameable later.
      const created = !projectId
      const id =
        projectId ??
        this.createProject({
          name: inquiryName(apps, this.company.name || this.viewer.company),
          apps,
          modules,
        })
      const project = this.projects.find((p) => p.id === id)
      if (!project) return null

      // The snapshot the thread carries. Labels rather than keys, because the
      // message is read by a person and outlives the catalogue the keys index
      // into — see the ⚠️ on `contactThread`.
      const inquiry = {
        project: project.name,
        apps: (project.apps ?? []).map((v) => APPS.find((a) => a.value === v)?.label ?? v),
        modules: Object.entries(project.modules ?? {}).flatMap(([app, keys]) =>
          modulesFor(app, keys).map((m) => m.label),
        ),
      }

      // ⚠️ Appends to an existing thread rather than starting a second one, the
      // same keying every other writer here uses (`thread.id` IS `partner.id`).
      // Reached when a partner was messaged before the inquiry flow existed, or
      // from a demo persona seeded with conversations.
      const existing = this.threads.find((t) => t.partnerId === partner.id)
      if (existing) {
        existing.messages.push({
          id: `inq-${Date.now()}`,
          from: 'you',
          at: Date.now(),
          kind: 'inquiry',
          inquiry,
        })
        if (message.trim()) this.sendMessage(existing.id, message.trim())
        return { thread: existing.id, project, created }
      }

      this.threads = [...this.threads, contactThread(partner, inquiry, message.trim())]
      return { thread: partner.id, project, created }
    },

    // ── The basket ───────────────────────────────────────────────────────
    // What the visitor is buying, by pack value. Set from the recommendation
    // and then edited by hand, and it survives the gate, the two auth screens
    // and the verification step because it lives here rather than in a URL.
    setPacks(values) {
      this.packs = [...new Set(values)]
    },

    togglePack(value) {
      this.packs = this.packs.includes(value)
        ? this.packs.filter((v) => v !== value)
        : [...this.packs, value]
    },

    // ⚠️ Seeds the basket ONLY IF IT IS EMPTY, which is what makes the
    // recommendation screen safe to revisit. Someone who unticked a pack and
    // pressed Back would otherwise find it ticked again, with the screen
    // insisting on a choice they had already rejected once.
    seedRecommendedPacks() {
      if (this.packs.length) return
      this.packs = recommendedPackValues(this.company)
    },

    // The pack records behind the basket, in catalogue order rather than the
    // order they were ticked — a total that reorders itself as you tick is a
    // total nobody can check.
    packRecords() {
      return STARTER_PACKS.filter((p) => this.packs.includes(p.value))
    },

    // ── The intake ───────────────────────────────────────────────────────
    // What the three questions on the landing page collected. Answered BEFORE
    // there is an account — the whole flow is quiz, recommendation, then
    // sign-up — so this writes a company record with no name on it, and
    // `saveAccount` fills that in later.
    //
    // The segments land where the quiz would have put them, which is the whole
    // point: `matches()` filters on `answers.segments`, so answering here
    // narrows the partner list the same way the old quiz did.
    //
    // ⚠️ ORDER MATTERS. `answer('industry', …)` CLEARS segments — changing the
    // group is meant to drop the choices made under the old one — so the group
    // has to be written first and the segments after it. Reversed, this method
    // would silently throw away everything it just collected.
    //
    // ⚠️ KEEPS THE EXISTING NAME. Someone can go back and change an answer
    // after signing up, and a spread that dropped `name` would quietly empty
    // the sidebar.
    saveCompany({ country, employees, segments, apps, appsOther, operations, problems }) {
      this.company = {
        ...this.company,
        country: country ?? '',
        employees,
        segments,
        apps: apps ?? [],
        // What "Something else" meant, when that was picked. Empty otherwise.
        appsOther: appsOther ?? '',
        operations: operations ?? null,
        problems: problems ?? [],
      }
      const group = INDUSTRIES.find((i) => i.segments.includes(segments?.[0]))
      if (group) this.answer('industry', group.value)
      this.answers.segments = segments ?? []
      // The country answers the partner list's geo filter too — one question,
      // asked once. `toggleGeo` would flip it off if it were already set, so
      // this assigns.
      if (country) this.filters.countries = [country]
    },

    // The two things sign-up asks that the intake deliberately doesn't: who you
    // are and what the company is called. See the ⚠️ on `company` above.
    saveAccount({ name, company }) {
      this.viewer = { ...this.viewer, name: name.trim(), company: company.trim() }
      this.company = { ...this.company, name: company.trim() }
    },

    // ── Custom implementation ────────────────────────────────────────────
    // The brief, as it is typed. Saved on every change rather than on submit,
    // because the partner count under the filters moves with it and a count
    // that only updates when you press something is a count nobody trusts.
    saveBrief(patch) {
      this.brief = { ...this.brief, ...patch }
    },

    // A custom project exists from the moment there is a brief to put in it —
    // before a partner, before a quote, before anyone has agreed to anything.
    // That is the difference between the two spines: a pack arrives assigned.
    //
    // Idempotent: returns the existing custom project if one is already open,
    // so pressing Continue twice does not produce two.
    startCustomProject() {
      const open = this.projects.find((p) => p.service === 'custom' && !p.partnerId)
      if (open) return open.id
      const id = `pr-${Date.now()}`
      this.projects = [
        ...this.projects,
        {
          id,
          name: `ERPNext implementation for ${this.company.name || this.viewer.company}`,
          apps: ['erpnext'],
          modules: {},
          service: 'custom',
          packs: [],
          partnerId: null,
          stage: 'requirements',
          done: [],
          at: Date.now(),
          serviceAt: Date.now(),
          slot: null,
          // Filled by `broadcastBrief`. Null means the requirements have not
          // gone anywhere yet, which is a different state from "nobody replied".
          broadcast: null,
          bids: [],
        },
      ]
      return id
    },

    // ⚠️ THE ONE ACTION IN THIS APP THAT CONTACTS SEVERAL COMPANIES AT ONCE, so
    // it is the one that has to be exactly as wide as the screen said it was.
    // The list comes from `matchingPartners` — the same function the count
    // under the filters is computed from — rather than from anything recomputed
    // here, because a broadcast that reaches one more firm than the number
    // shown is the worst bug this flow could have.
    //
    // Creates one thread per partner carrying the brief, and seeds the replies
    // that will come back. Not every partner answers; see `repliesToBrief`.
    broadcastBrief(id) {
      const project = this.projects.find((p) => p.id === id)
      if (!project) return null
      const partners = matchingPartners(this.company, this.brief)
      const brief = {
        projectId: id,
        project: project.name,
        scope: this.brief.scope.trim(),
        budget: this.brief.budget,
        country: this.company.country,
        employees: this.company.employees,
        segments: this.company.segments,
      }

      const threads = []
      for (const partner of partners) {
        // ⚠️ A broadcast never appends to an existing conversation. Dropping a
        // requirements card into a thread where the two of you were already
        // talking about something else reads as a form letter sent to a friend,
        // which is exactly what it would be.
        if (!this.threads.some((t) => t.partnerId === partner.id)) {
          threads.push(briefThread(partner, brief))
        }
      }
      this.threads = [...this.threads, ...threads]

      // ⚠️ NO REPLIES YET, AND THAT IS THE POINT. This used to seed every bid
      // in the same call, so the project opened one second after Send reading
      // "5 of 8 partners replied" — quotes that arrived before the requirements
      // had finished sending. It is a lie about the thing the whole flow is
      // built around: a brief has to be good BECAUSE you then wait on it.
      //
      // Replies arrive over the following days. In a prototype with no server
      // that means they arrive when a reviewer asks for them — see
      // `simulateReplies`, which the demo switch calls.
      project.broadcast = { at: Date.now(), partnerIds: partners.map((p) => p.id) }
      project.bids = []
      // ⚠️ THE STAGE MOVES ON ITS OWN HERE, which nothing else in the tracker
      // does — every other advance is the customer pressing a button. Sending
      // the brief IS all three of the Requirements tasks: it cannot happen
      // without a scope and a budget, and it is itself the third. Leaving the
      // project on "0 of 3 done" immediately after doing them would be the page
      // failing to notice what the person just did.
      project.done = [...new Set([...project.done, 'describe', 'set-budget', 'send-brief'])]
      project.stage = 'choosing'
      return { sent: partners.length, partnerIds: project.broadcast.partnerIds }
    },

    // ⚠️ DEMO ONLY, and it is the one action in this store that exists for the
    // reviewer rather than for the customer. Quotes take days; a prototype has
    // no days and no server, so the passage of time is a menu item. See
    // `DemoSwitch`.
    //
    // Everything it does is what a real inbox would do on its own: the partners
    // who answer get a bid, the bid lands as a card in that partner's own
    // thread, and the project's own list is what the comparison table reads.
    // Not every partner replies — see `repliesToBrief`.
    simulateReplies(id) {
      const project = this.projects.find((p) => p.id === id)
      if (!project?.broadcast || project.bids?.length) return null
      const bids = project.broadcast.partnerIds
        .map((pid) => PARTNERS.find((p) => p.id === pid))
        .filter((p) => p && repliesToBrief(p))
        .map((p) => ({ ...bidFor(p, { country: this.company.country }), state: 'pending' }))

      for (const bid of bids) {
        const thread = this.threads.find((t) => t.partnerId === bid.partnerId)
        if (thread) thread.messages.push(bidMessage(bid))
      }
      project.bids = bids
      return bids.length
    },

    // Approve a reply, or pass on it.
    //
    // ⚠️ APPROVING IS WHAT SHARES THE COMPANY. Until this runs, a partner has
    // the scope, the budget band and the industry and nothing that identifies
    // the business — so approval is not a formality, it is the moment a
    // stranger learns who you are. The company card is appended to their thread
    // here and nowhere else.
    //
    // ⚠️ PASSING TELLS THE PARTNER NOTHING. No message is sent and no state
    // reaches them. A rejection notice from a business that never spoke to you
    // is worse than silence, and the partner has lost nothing but the hour they
    // chose to spend on a brief they could see the size of.
    setBidState(projectId, partnerId, state) {
      const project = this.projects.find((p) => p.id === projectId)
      const bid = project?.bids?.find((b) => b.partnerId === partnerId)
      if (!bid) return
      const wasShortlisted = bid.state === 'shortlisted'
      bid.state = state
      if (state !== 'shortlisted' || wasShortlisted) return
      const thread = this.threads.find((t) => t.partnerId === partnerId)
      if (thread) thread.messages.push({ id: `c-${Date.now()}`, from: 'you', at: Date.now(), kind: 'company' })
    },

    // ⚠️ SHORTLISTING IS NOT CHOOSING. Several bids can be shortlisted — that is
    // how the comparison table gets more than one row — and this is the
    // separate, later gesture that ends the stage. The two were one action in
    // the first version and it forced a decision at the moment someone was
    // still gathering information.
    //
    // `why` is the one-tap reason, kept beside the project because it is
    // feedback about the marketplace rather than about the partner.
    // ⚠️ HIRING RECORDS THE TERMS, because agreeing them is what hiring is —
    // `HirePartnerDialog` collects the agreement before this runs, and there is
    // no route to here that skips it. It used to be a separate `agree-terms`
    // task ticked afterwards, which asked somebody to agree the terms of an
    // engagement they had already entered.
    choosePartner(projectId, partnerId) {
      const project = this.projects.find((p) => p.id === projectId)
      if (!project) return
      project.partnerId = partnerId
      project.termsAt = Date.now()
    },

    // ⚠️ SEPARATE FROM THE HIRE, and it has to be: the hire is a commitment and
    // this is one tap of optional feedback about it. Folding the reason into
    // `choosePartner` made the argument the dialog now makes with its two steps
    // — that dropping out of the question must not cost you the partner.
    setChooseReason(projectId, why) {
      const project = this.projects.find((p) => p.id === projectId)
      if (project) project.chooseReason = why
    },

    // ── Feedback ─────────────────────────────────────────────────────────
    // ⚠️ ASKED TWICE IN A PROJECT'S LIFE AND NOT MORE. Once when a partner is
    // chosen (why that one — a tap, stored above) and once at go-live (a rating
    // and a sentence, published). A product that asks after every stage stops
    // being answered by the stage that matters.
    // Was the recommendation right? One tap, and a field only if the answer is
    // no — there is nothing to learn from somebody who agrees, and asking them
    // to explain it is how a yes/no becomes a form people skip.
    recordRecoFeedback(ok, note = '') {
      this.recoFeedback = { ok, note: note.trim() }
    },

    // ⚠️ A LIST, NOT A FIELD, and it never replaces. The other two feedback
    // records are about one thing each — a project's partner, the current
    // recommendation — so writing over the previous answer is right for them.
    // This one is unprompted and repeatable: somebody who says two things a
    // week apart said two things, and keeping only the second would throw away
    // the one that was bothering them first.
    //
    // `route` is recorded rather than asked for. "Which page were you on?" is a
    // question the product can answer itself, and it is what turns "this is
    // confusing" from noise into a defect report.
    recordProductFeedback({ text, route }) {
      const body = (text ?? '').trim()
      if (!body) return
      this.productFeedback = [...this.productFeedback, { text: body, route, at: Date.now() }]
    },

    recordFeedback({ projectId, partnerId, rating, text }) {
      this.feedback = [
        ...this.feedback.filter((f) => f.projectId !== projectId),
        { projectId, partnerId, rating, text: text.trim(), at: Date.now() },
      ]
    },

    // What the two auth FORMS record. Neither signs anyone in: the code comes
    // back on the verify screen, and `completeLogin` is that screen's. Recorded
    // early all the same, so verify can name the address it sent a code to.
    //
    // Sign-up collected a name, an address and a country. All three replace the
    // seeded demo viewer, because a form that asks who you are and then shows
    // you someone else's name reads as the answers having been discarded.
    //
    // The country lands in `filters.countries`, the granular half of the geo
    // dimension — the same field the quiz's India chip writes through
    // `toggleGeo`, so an answer given here arrives at the listing ticked under
    // its region with nothing to translate. It replaces rather than appends:
    // this is where the business IS, not a filter they are widening.
    //
    // `regionInferred` clears for the same reason `toggleGeo` clears it — the
    // location was a guess until someone confirmed it, and confirming it is
    // exactly what this screen did.
    // ⚠️ COMPANY NAME, NOT COUNTRY. This form used to ask where you are, back
    // when sign-up was the first thing that happened; the intake asks that now,
    // on the landing page, because the answer changes the recommendation and
    // the recommendation comes first.
    //
    // ⚠️ WHY THE COMPANY NAME IS ASKED HERE AND NOT IN THE INTAKE. The intake
    // holds to one rule — every question in it changes the recommendation — and
    // a company's name changes nothing about which packs fit. It is needed at
    // exactly two later moments: the invoice, and the point where a custom bid
    // is approved and the partner learns who they are talking to. Both are
    // after this screen, so one ask here covers both, and the first ten seconds
    // of the funnel stay about the business rather than about paperwork.
    signUp({ name, email, company }) {
      this.viewer = { ...this.viewer, name, email }
      if (company) this.saveAccount({ name, company })
    },

    // Logging in knows only the address. The name stays whatever the store
    // already holds — a real build reads it back from the account, and deriving
    // one from the email would be a guess dressed up as a fact.
    logIn({ email }) {
      this.viewer = { ...this.viewer, email }
    },

    // ⚠️ Signs the visitor in and nothing else. Called by the VERIFY screen,
    // once the code is back — not by either form. It does NOT run the held
    // action either; `runPending` does, once the caller has navigated.
    completeLogin() {
      this.setAccount('client')
    },

    answer(key, value) {
      this.answers[key] = value
      if (key === 'region') this.regionInferred = false
      // Changing industry drops the segments picked under the old one — they
      // belong to a group that is no longer the answer.
      if (key === 'industry') this.answers.segments = []
    },
    // Region only: flip one region in or out of the answer. The chips in the
    // quiz are toggles, so this keeps the add/remove logic in one place instead
    // of rebuilding the array at three call sites.
    toggleRegion(value) {
      const current = this.answers.region
      this.answer(
        'region',
        current.includes(value) ? current.filter((r) => r !== value) : [...current, value],
      )
    },
    // One geo chip, either granularity — takes a `GEO_CHOICES` entry and routes
    // it to the half of the dimension it belongs to. The quiz asks India as a
    // country and the five regions as regions (see `data/quiz.js`), and the
    // results filter reads the union of both fields, so a country answered here
    // arrives there ticked under its region with nothing to translate.
    toggleGeo(choice) {
      if (!choice.country) return this.toggleRegion(choice.region)
      const current = this.filters.countries
      this.filters.countries = current.includes(choice.country)
        ? current.filter((c) => c !== choice.country)
        : [...current, choice.country]
      // Same clearing `answer('region', …)` does for the region half: whichever
      // way the question is answered, it stops being an inferred answer.
      this.regionInferred = false
    },
    skip(key) {
      this.answers[key] = key === 'region' || key === 'segments' ? [] : null
      // The geo question holds a country as well as a region, so skipping it has
      // to drop both halves — otherwise the India seeded from inferred location
      // survives a deliberate "no preference" and the listing arrives filtered
      // by an answer the visitor declined to give.
      if (key === 'region') this.filters.countries = []
      if (key === 'industry') this.answers.segments = []
    },
    // Called when the quiz mounts: seeds the geo answer from "where we think you
    // are" so the question costs a confirmation instead of a decision. Never
    // overwrites a real choice — and it checks BOTH halves for one, because
    // either can hold the answer.
    //
    // ⚠️ The question this pre-answers is "where can your partner be based?",
    // not "where are you?" — so the seed is a DEFAULT (start near me, widen from
    // there), not a guess at a fact about the visitor. That's what makes getting
    // it wrong cheap: an unwanted region is one chip to untick, where a wrong
    // answer to a question ABOUT them would read as the app being confidently
    // mistaken.
    seedInferredGeo() {
      if (this.answers.region.length || this.filters.countries.length) return
      const { region, country } = this.inferredGeo
      if (country) this.filters.countries = [country]
      else this.answers.region = [region]
      this.regionInferred = true
    },
    reset() {
      // Snapshot first. This is the app's one destructive action — it discards
      // all three quiz answers along with the filters — and the only way back
      // used to be redoing the quiz. Copied field by field rather than cloned
      // wholesale because `region` and `segments` are arrays, and a spread
      // alone would hand back the same array the store is about to replace.
      lastCleared = {
        answers: {
          ...this.answers,
          region: [...this.answers.region],
          segments: [...this.answers.segments],
        },
        regionInferred: this.regionInferred,
        // `countries` is an array, so it needs the same explicit copy as the
        // answers above — a bare spread would hand back the very array the
        // reset is about to replace.
        filters: { ...this.filters, countries: [...this.filters.countries] },
      }
      this.answers = emptyAnswers()
      this.regionInferred = false
      this.filters = { search: '', app: null, countries: [] }
    },

    // Undo for the toast `reset()` raises. Returns whether there was anything
    // to put back: the stash is one-shot, so an Undo pressed on a stale toast
    // (a second clear has happened since, or it was already used) reports that
    // rather than silently doing nothing.
    restoreCleared() {
      if (!lastCleared) return false
      this.answers = lastCleared.answers
      this.regionInferred = lastCleared.regionInferred
      this.filters = lastCleared.filters
      lastCleared = null
      return true
    },
  },
})
