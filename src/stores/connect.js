import { defineStore } from 'pinia'
import { PARTNERS } from '../data/partners'

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
//   visitor  no account. Browsing the directory signed out.
//   client   has an account, and an implementation already under way.
//
// ⚠️ Nothing in the product reads `account` yet — every screen is built for the
// visitor. The states are here so the switcher can offer them and so the seam
// has a name. Components should read the `signedIn` / `hasProject` getters
// rather than comparing the string, which is what makes a third state (an
// account with no project yet) a change in this file alone.
const ACCOUNT_STATES = ['visitor', 'client']

// The listing's primary order, always. Tier is the one ranking the partner
// programme itself publishes, so it outranks whatever order the filters happen
// to leave behind — a gold partner never sits below a bronze one.
//
// A partner with no tier isn't a fourth level, it's the absence of one: not in
// the programme, no badge in the row (see `TierIcon`). Those sort last.
const TIER_RANK = { gold: 0, silver: 1, bronze: 2 }
const tierRank = (p) => TIER_RANK[p.tier] ?? 3

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
    // `data/modules.js`. Five ERPNext modules against two CRM ones on purpose:
    // the section has to show apps carrying very different amounts.
    //
    // Not cleared by `reset()`, same as `account` and `role` — it's the demo
    // you're in, not something the quiz collected.
    project: {
      name: 'ERP rollout',
      modules: {
        erpnext: ['finance', 'sales', 'purchase', 'inventory', 'manufacturing'],
        crm: ['deals', 'contacts'],
        'frappe-hr': ['payroll', 'attendance'],
      },
    },
    // Post-quiz filters on the results page. `app` starts unset — it's a
    // refinement offered mid-list, not a qualifier.
    filters: { search: '', app: null },
  }),

  getters: {
    // The two questions a screen actually wants to ask. Everything that varies
    // by account state should go through these, so the enum stays in one place.
    signedIn: (state) => state.account !== 'visitor',
    hasProject: (state) => state.account === 'client',

    // A stand-in for GeoIP. Real implementations resolve this server-side on
    // first paint; the mock hardcodes the common case so the interaction (a
    // pre-filled answer you can override) is reviewable.
    inferredRegion: () => 'india',

    results(state) {
      const { segments, region, implementation } = state.answers
      const { search, app } = state.filters
      const q = search.trim().toLowerCase()

      return (
        PARTNERS.filter((p) => {
          if (region.length && !region.includes(p.region)) return false
          if (app && !p.apps.includes(app)) return false
          // Union, not intersection: several segments read as "any of these", the
          // same way several regions do. Partners are tagged with the directory's
          // own segment names, so this is a direct match — no mapping up to the
          // group, because the group isn't a filter of its own any more.
          if (segments.length && !p.industries.some((i) => segments.includes(i))) return false
          // A standard implementation is only useful from a partner who actually
          // sells starter packs.
          if (implementation === 'standard' && p.packs.length === 0) return false
          if (q) {
            const haystack = [p.name, p.city, ...p.industries, ...p.apps].join(' ').toLowerCase()
            if (!haystack.includes(q)) return false
          }
          return true
        })
          // `.filter()` already handed back a fresh array, so this sorts a copy,
          // not PARTNERS. Sort is stable in every engine this runs on, which is
          // what keeps the order inside a tier equal to the order in
          // `data/partners.js` — the seed list's order is the tiebreak.
          .sort((a, b) => tierRank(a) - tierRank(b))
      )
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
    skip(key) {
      this.answers[key] = key === 'region' || key === 'segments' ? [] : null
      if (key === 'industry') this.answers.segments = []
    },
    // Called when the quiz mounts: seeds the region answer from "geo" so the
    // user confirms rather than picks. Never overwrites a real choice.
    seedInferredRegion() {
      if (this.answers.region.length) return
      this.answers.region = [this.inferredRegion]
      this.regionInferred = true
    },
    reset() {
      this.answers = emptyAnswers()
      this.regionInferred = false
      this.filters = { search: '', app: null }
    },
  },
})
