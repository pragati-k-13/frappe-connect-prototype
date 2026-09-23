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
import { GROUP_OF_SEGMENT, INDUSTRIES, REGION_OF, REGIONS } from './quiz'

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

// ⚠️ THE TIMELINE NARROWS NOTHING, AND THE SCREEN SAYS SO. It is collected
// because a partner deciding whether to quote needs it more than they need the
// tier, and because the criteria list reads as a set with a hole in it when the
// most obvious question about a project is missing. It is not a filter, for the
// same reason the budget is not one: there is nothing on a partner to test it
// against until the partner side is asked when they are free. See the note on
// `matchingPartners`.
export const TIMELINES = [
  { value: 'now', label: 'Ready to start now' },
  { value: 'quarter', label: 'Within three months' },
  { value: 'half', label: 'Within six months' },
  { value: 'none', label: 'No specific timelines' },
]

export const timelineLabel = (value) =>
  TIMELINES.find((t) => t.value === value)?.label ?? 'No specific timelines'

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
// ⚠️ THREE TEXT FIELDS, AND IT WAS ONE. The single box asked "What do you need
// built?" and got a sentence, because one unlabelled box makes somebody guess
// the GENRE of what is wanted. Two real enquiries Frappe received are the
// evidence: both arrived as e-mail, where a blank page forces you to say
// everything, and both answered the same questions in the same order — what we
// make and who for, how we run it today, what goes wrong, what it must satisfy,
// which areas. A form is only better than a blank page if its fields cover the
// same ground; a small box labelled with a noun list is SMALLER than a blank
// page, which is what this one was.
//
// Three of those questions are already asked by the intake — `operations`,
// `problems`, and the module list on the project — so they are not asked again
// here. These two are the ones nothing in the product collected:
//
//   `customers`    who you sell to, and what they demand of you. One of the two
//                  enquiries turned entirely on supplying BHEL and RITES, which
//                  is what put IRIS and ISO 9001 in scope. Nothing asked.
//   `mustSatisfy`  what it must connect to or be able to prove — audit trails,
//                  traceability, e-invoicing. The old placeholder said
//                  "integrations" as the middle of three nouns and got nothing.
//
// Both are OPTIONAL. The other enquiry was 200 words about a single constraint
// and its author would have abandoned a four-field form; the floor stays on
// `scope` alone.
export const emptyBrief = () => ({
  scope: '',
  customers: '',
  mustSatisfy: '',
  budget: '',
  cities: [],
  tiers: [],
  workStyle: '',
  timeline: '',
})

// ── The criteria, as sentences ──────────────────────────────────────────────
// ⚠️ ONE BUILDER, TWO READERS, AND THEY ARE ON OPPOSITE SIDES. The
// recommendation card shows these to the business before it sends, and the
// brief's details dialog shows them to the partner who received it. A partner
// reading a different list from the one the customer was shown is the worst
// kind of drift this file can produce, so there is one function.
//
// Every line is a full clause, because half of them are the ABSENCE of a
// constraint and an absence has no natural phrasing: "Tier" over nothing reads
// as a missing value, "All tiers" reads as an answer.
export const criteriaLines = (company, brief) => {
  const region = REGIONS.find((r) => r.value === REGION_OF[company?.country])
  const group = INDUSTRIES.find((i) => i.value === GROUP_OF_SEGMENT[company?.segments?.[0]])
  const cities = brief?.cities ?? []
  const tiers = brief?.tiers ?? []
  const tierLabels = TIERS.filter((t) => tiers.includes(t.value)).map((t) => t.label)
  const style = WORK_STYLES.find((w) => w.value === brief?.workStyle)
  return [
    {
      icon: 'map-pin',
      text: cities.length
        ? `Based in ${listOf(cities)}`
        : `Based anywhere in ${region?.label ?? 'your region'}`,
    },
    {
      icon: 'briefcase',
      text: group ? `Offer services for ${group.label}` : 'Offer services for any industry',
    },
    { icon: 'calendar', text: timelineLabel(brief?.timeline) },
    { icon: 'award', text: tierLabels.length ? `${listOf(tierLabels)} tier` : 'All tiers' },
    { icon: 'users', text: style?.label ?? 'Remote or on premises' },
  ]
}

// "Pune", "Pune and Mumbai", "Pune, Mumbai and Kochi".
const listOf = (items) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : (items[0] ?? '')

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
// ⚠️ THE BUDGET DOES NOT NARROW THIS, and it should. It is the one structured
// answer the brief collects and the only one this function ignores, so the
// count never moves when the band does. Partners are not interchangeable at
// every deal size — some run volume on small customers, some open nothing below
// an enterprise floor — and a brief sent to a firm that was never going to
// quote it wastes both sides.
//
// It is not fixed here because there is nothing on a partner to match against:
// `region`, `industries`, `city` and `tier` are real, `workStyle` is already
// invented, and a second fabricated attribute able to delete firms from a
// number this button promises to message would be worse than the no-op. It
// needs the partner side to ask the question first. See "The budget is
// collected and then dropped" in DESIGN-NOTES.md for what to ask and what
// changes here afterwards.
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
