// Custom implementation: what a business has to tell us before we will put its
// requirements in front of anyone, how it narrows the field, and who that
// leaves.
//
// ⚠️ THE TWO MANDATORY ANSWERS ARE THE POINT. A partner reading "we need a
// custom ERP implementation" has nothing to quote against, so the first reply
// is always the same two questions — what are you trying to build, and what can
// you spend — and the conversation starts a week later than it looks like it
// did. Asking them here is what makes a broadcast to twelve firms a fair thing
// to do rather than twelve people's time spent working out whether to bother.
//
// ⚠️ A BUDGET BAND, NOT A NUMBER. A free figure invites a placeholder, and a
// placeholder is worse than a range: partners price against it, and the one who
// quotes honestly against a made-up ₹2,00,000 loses to the one who doesn't.
// Bands also let someone answer truthfully when the truth is "we don't know
// yet, somewhere in this order of magnitude".
import { PARTNERS, cityOf } from './partners'
import { marketFor } from './packs'
import { GROUP_OF_SEGMENT, REGION_OF } from './quiz'

// ── Budget ──────────────────────────────────────────────────────────────────
// ⚠️ EVERY FIGURE HERE IS INVENTED. Frappe publishes no guidance on what a
// custom implementation costs and the partner rates in `data/partners.js` are
// invented too, so these are bands drawn to be plausible against those rates —
// the middle band is roughly a two-month engagement at an Indian partner's day
// rate — and nothing more. Don't quote them.
//
// Two ladders, because a business in Pune and one in Frankfurt do not think
// about this in the same units and converting one into the other produces
// bands with four significant figures. India's are in lakhs, which is how the
// number is said out loud there; everywhere else is round dollars.
const INR_BANDS = [
  { value: 'inr-1', label: 'Under ₹5 lakh' },
  { value: 'inr-2', label: '₹5 to 15 lakh' },
  { value: 'inr-3', label: '₹15 to 40 lakh' },
  { value: 'inr-4', label: 'Over ₹40 lakh' },
  { value: 'unsure', label: 'Not decided yet' },
]

const USD_BANDS = [
  { value: 'usd-1', label: 'Under $10,000' },
  { value: 'usd-2', label: '$10,000 to $30,000' },
  { value: 'usd-3', label: '$30,000 to $75,000' },
  { value: 'usd-4', label: 'Over $75,000' },
  { value: 'unsure', label: 'Not decided yet' },
]

// ⚠️ "Not decided yet" IS AN ANSWER and it is in both ladders. The alternative
// was making the question skippable, which produces the same absence of
// information while also producing a brief that doesn't mention money at all —
// so a partner cannot tell the difference between a business that didn't want
// to say and one that never saw the question. Said out loud it is a fact a
// partner can work with.
export const budgetBandsFor = (country) =>
  marketFor(country) === 'india' ? INR_BANDS : USD_BANDS

export const budgetLabel = (value) =>
  [...INR_BANDS, ...USD_BANDS].find((b) => b.value === value)?.label ?? ''

// ── The narrowing filters ───────────────────────────────────────────────────
// ⚠️ These are OPTIONAL and the mandatory answers above are not, which is the
// whole distinction: scope and budget are what a partner needs to reply, and
// these are what the business wants in a partner. Left alone they constrain
// nothing, and the count simply stays as wide as it started.
export const WORK_STYLES = [
  { value: 'onsite', label: 'Will come to us', hint: 'On site for workshops and training' },
  { value: 'remote', label: 'Remote is fine' },
]

// ⚠️ Matched against a partner's own `workStyle`, where 'both' satisfies either
// request — a firm that does both is not excluded by someone who asked for one.
export const matchesWorkStyle = (partner, want) =>
  !want || partner.workStyle === 'both' || partner.workStyle === want

export const TIERS = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
]

// ⚠️ INDIA ONLY, and the flow says so where the control would otherwise just be
// missing. The city list is derived from partners who are actually in those
// cities (`INDIA_CITIES`), and outside India the directory's biggest city holds
// one firm — a filter whose every option returns one result or none is a
// control that looks broken.
export const asksCity = (country) => country === 'India'

// ── The brief ───────────────────────────────────────────────────────────────
export const emptyBrief = () => ({
  scope: '',
  budget: '',
  cities: [],
  tiers: [],
  workStyle: '',
})

// ⚠️ A LENGTH FLOOR ON THE SCOPE, which is unusual in this app and deliberate
// here. This text is broadcast to a dozen firms who will each spend an hour on
// it; "need help with erpnext" is not a requirement, and the floor is the
// cheapest way to say so before twelve people find out one at a time. 40
// characters is about a sentence — low enough that a real one-line brief
// passes, high enough to stop a word.
const SCOPE_MIN = 40

export const briefErrors = (brief) => {
  const e = {}
  const scope = brief.scope.trim()
  if (!scope) e.scope = 'Describe what you need built'
  else if (scope.length < SCOPE_MIN)
    e.scope = 'A sentence or two — partners quote against this, so it needs something to quote'
  if (!brief.budget) e.budget = 'Pick a range'
  return e
}

export const briefComplete = (brief) => Object.keys(briefErrors(brief)).length === 0

// ── Who this reaches ────────────────────────────────────────────────────────
// The count under the filters, and the list the broadcast actually goes to —
// ONE function, because a number that doesn't match what happens next is the
// single most damaging thing this screen could print.
//
// ⚠️ THE BASE IS REGION AND INDUSTRY, not country. Thirteen seed partners
// across six regions means a country test would return one firm for most of the
// world and the screen would read as an empty directory rather than as a
// filter. Region is also the truer default: an implementation runs from
// anywhere, and the business narrows to a city itself if it wants to.
//
// `segments` from the intake are matched at the GROUP level — a partner tagged
// 'Discrete Manufacturing' should reach a business in 'Steel Manufacturing',
// because the directory's segments are finer than anybody's idea of who can
// help them.
const groupsOf = (segments) => new Set((segments ?? []).map((s) => GROUP_OF_SEGMENT[s]))

// ⚠️ `REGION_OF`, not `marketFor`. The two answer different questions and only
// differ in one place that matters: `marketFor` says India is its own PRICING
// market, because it has the only real rate card, while the directory files
// India inside Asia. This is a question about the directory.
const regionOfCountry = (country) => REGION_OF[country] ?? null

export const matchingPartners = (intake, brief) => {
  const region = intake?.country ? regionOfCountry(intake.country) : null
  const wanted = groupsOf(intake?.segments)
  return PARTNERS.filter((p) => {
    if (region && p.region !== region) return false
    // No industry answered is no industry constraint, same as everywhere else.
    if (wanted.size && !p.industries.some((s) => wanted.has(GROUP_OF_SEGMENT[s]))) return false
    if (brief?.cities?.length && !brief.cities.includes(cityOf(p))) return false
    if (brief?.tiers?.length && !brief.tiers.includes(p.tier)) return false
    if (!matchesWorkStyle(p, brief?.workStyle)) return false
    return true
  })
}
