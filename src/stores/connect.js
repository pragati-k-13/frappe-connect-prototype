import { defineStore } from 'pinia'
import { PARTNERS } from '../data/partners'
// Two consumers: `industryCounts`, the group totals on the industry filter's
// headings, and `saveCompany`, which derives a segment's group. Both need to
// know which segments belong to which group.
import { bookingThread, discoveryThreads } from '../data/messages'
import { INDUSTRIES } from '../data/quiz'

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
    // The visitor's project: what they want built. This is the scope the
    // "Estimate quote" modal prices, and it belongs here rather than on a
    // partner because it's the same work whoever quotes it.
    //
    // ⚠️ Seeded placeholder. Nothing writes to it yet — a module picker does,
    // later. Keys match `APPS[].value`, values match `MODULES[app][].key` in
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
    project: {
      name: 'ERP rollout',
      modules: {
        erpnext: ['finance', 'sales', 'purchase', 'inventory', 'manufacturing', 'hr'],
      },
    },
    // The pack the visitor pressed Get started on, by `value`. It lives here
    // rather than in the URL because the gate fires BEFORE the panel opens —
    // there is no `?pack=` yet at the moment of the click — and the onboarding
    // screen two navigations later still has to name it.
    //
    // ⚠️ Null when they arrived by another door (saving a partner, the top-bar
    // CTA). Onboarding's subtitle then reads generically rather than guessing
    // a pack they never chose.
    pack: null,
    // What the onboarding screen collected. `name` is the company's, which is
    // also mirrored onto `viewer.company` — the sidebar and the quote header
    // read the viewer, and two names for one company drift apart.
    //
    // ⚠️ `operations` and `problems` are free text and optional. They're what a
    // partner reads before the first call; nothing in the app renders them yet.
    company: { name: '', employees: '', segments: [], operations: '', problems: '' },
    // Every conversation the viewer can open, newest activity last within each
    // thread. Two ways in and no third: the demo switch seeds the exploring
    // viewer's inbox, and booking a pack adds the thread the confirmed screen
    // promises ("Project details sent via Messaging"). A fresh account has
    // none, which is why the screen has a real empty state.
    //
    // ⚠️ In memory, like everything else here. Reloading loses what you typed.
    threads: [],
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
    hasProject: (state) => state.account === 'client',

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
    },

    // Booking a pack is the one thing in the app that starts a conversation.
    // Idempotent by partner: confirming twice with the same partner reopens the
    // thread rather than stacking a second copy of it.
    startBooking({ partner, pack, slot }) {
      const existing = this.threads.find((t) => t.partnerId === partner.id)
      if (existing) return existing.id
      this.threads = [...this.threads, bookingThread({ partner, pack, slot })]
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
      // Conversations belong to the account, same as the saved list.
      this.threads = []
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
    },

    // Run the held action. Called by an auth screen AFTER it has navigated back
    // to `next`, so the action lands on a mounted page and isn't clobbered by
    // the navigation that would otherwise follow it.
    runPending() {
      const action = pendingAction
      pendingAction = null
      action?.()
    },

    // Backing out drops it. An auth screen the visitor left without finishing
    // must not leave an action armed — otherwise signing in from somewhere else
    // an hour later silently saves the partner they walked away from.
    dropPending() {
      pendingAction = null
    },

    // Which pack the visitor is buying. Set at the moment Get started is
    // pressed, so it survives the gate, the two auth screens and the verify
    // step to reach onboarding.
    selectPack(value) {
      this.pack = value
    },

    // What the onboarding screen collected. The segments land where the quiz
    // would have put them, which is the whole point: `matches()` filters on
    // `answers.segments`, so answering here narrows the partner list the same
    // way answering the quiz does.
    //
    // ⚠️ ORDER MATTERS. `answer('industry', …)` CLEARS segments — changing the
    // group is meant to drop the choices made under the old one — so the group
    // has to be written first and the segments after it. Reversed, this method
    // would silently throw away everything it just collected.
    //
    // The group is derived rather than asked for: the control is grouped, so
    // the first pick's heading is the industry. Segments spanning two groups
    // keep the first, since the quiz's own field holds exactly one.
    saveCompany({ name, employees, segments, operations, problems }) {
      this.company = { name, employees, segments, operations, problems }
      this.viewer = { ...this.viewer, company: name }
      const group = INDUSTRIES.find((i) => i.segments.includes(segments?.[0]))
      if (group) this.answer('industry', group.value)
      this.answers.segments = segments ?? []
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
    signUp({ name, email, country }) {
      this.viewer = { ...this.viewer, name, email }
      if (country) {
        this.filters.countries = [country]
        this.regionInferred = false
      }
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
