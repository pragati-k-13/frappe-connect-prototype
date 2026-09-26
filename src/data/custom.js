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
// ⚠️ ONE TEXT FIELD, ON PURPOSE. Two real enquiries Frappe received answered
// the same questions in the same order — what we make and who for, how we run
// it today, what goes wrong, what it must connect to or prove — and the box's
// placeholder asks exactly those, so one box covers the ground without turning
// into a four-field form somebody abandons. `scopeHint` below names whichever
// of them the text has not touched yet.
export const emptyBrief = () => ({
  scope: '',
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

// The same criteria as one request, for the brief's details dialog: "A partner
// based anywhere in Asia who offers services for Manufacturing. Any tier,
// remote or on site." Read off the same inputs as `criteriaLines`, beside it,
// so the two cannot disagree. The timeline is left out — the dialog prints it
// with the budget, where a partner deciding whether to quote looks for it.
//
// ⚠️ THE DEFAULTS STAY IN. "Any tier" tells a Silver partner they are welcome;
// in a sentence it costs two words rather than a line.
export const criteriaSentence = (company, brief) => {
  const region = REGIONS.find((r) => r.value === REGION_OF[company?.country])
  const group = INDUSTRIES.find((i) => i.value === GROUP_OF_SEGMENT[company?.segments?.[0]])
  const cities = brief?.cities ?? []
  const tiers = TIERS.filter((t) => (brief?.tiers ?? []).includes(t.value)).map((t) => t.label)
  const where = cities.length
    ? `based in ${listOf(cities)}`
    : `based anywhere in ${region?.label ?? 'your region'}`
  const what = group ? `offers services for ${group.label}` : 'works in any industry'
  const tier = tiers.length ? `${listOf(tiers)} tier` : 'Any tier'
  const style =
    { onsite: 'on site', remote: 'remote' }[brief?.workStyle] ?? 'remote or on site'
  return `A partner ${where} who ${what}. ${tier}, ${style}.`
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

// ── Reading the scope back ──────────────────────────────────────────────────
// ⚠️ A HINT, NEVER A GATE. Everything below decides what to SAY under the box
// while somebody types; nothing here can stop a brief being sent, and the only
// hard rule stays the length floor in `briefErrors`. A heuristic that blocks is
// a heuristic that has to be right, and this one is a word list.
//
// ⚠️ IT ADVISES, IT DOES NOT SCORE. No meter, no percentage, no "3 of 4
// answered". A score invites somebody to write for the score, and the number
// would be measuring vocabulary rather than usefulness. What comes back is one
// sentence naming the next thing worth adding, which is the only output a
// person can act on.
//
// ⚠️ THE FOUR TOPICS ARE THE FOUR QUESTIONS the placeholder asks, in the order
// the two real enquiries answered them. `words` are stems, matched anywhere, so
// "manufacturing" and "manufacture" both hit `manufactur`.
const TOPICS = [
  {
    key: 'what',
    ask: 'what you make or sell',
    words: [
      'manufactur', 'factor', 'produc', 'trading', 'trade', 'distribut', 'retail',
      'wholesal', 'sell', 'sales of', 'service', 'agency', 'clinic', 'school',
      'construct', 'export', 'import', 'trader', 'supply', 'suppli',
    ],
  },
  {
    key: 'today',
    ask: 'how it runs today',
    words: [
      'spreadsheet', 'excel', 'google sheet', 'tally', 'manual', 'paper', 'folder',
      'by hand', 'sap', 'zoho', 'quickbook', 'busy', 'legacy', 'current system',
      'existing system', 'erp we', 'our erp', 'software we',
    ],
  },
  {
    key: 'wrong',
    ask: 'what keeps going wrong',
    words: [
      'wrong', 'error', 'mistake', 'delay', 'late', 'lost', 'missing', 'blind',
      'no visibility', 'cannot', "can't", 'slow', 'stuck', 'trapped', 'duplicate',
      'reconcil', 'chas', 'guess', 'untrack', 'hard to', 'difficult', 'problem',
      'pain', 'bottleneck',
    ],
  },
  {
    key: 'must',
    ask: 'what it must connect to or prove',
    words: [
      'integrat', 'api', 'e-invoic', 'einvoic', 'gst', 'audit', 'complian', 'iso',
      'iris', 'traceab', 'barcode', 'shopify', 'woocommerce', 'amazon', 'bank',
      'payment gateway', 'whatsapp', 'biometric', 'migrat', 'import our data',
      'connect to', 'sync',
    ],
  },
]

// ⚠️ KEYBOARD MASH, NOT BAD WRITING. The only thing this tries to catch is text
// that is not language: no vowels, one enormous token, the same word four
// times. It deliberately does not judge grammar or length of sentence, because
// the person most likely to write a short blunt brief is the person who knows
// their business best.
// ⚠️ "HAS A VOWEL" IS NOT THE TEST, and it was. Nearly every keyboard mash
// contains an a or an e — "asdkjh" does — so the first version of this passed
// a line of pure noise straight through. What separates typing from language is
// the SHAPE of a word: English keeps vowels at roughly a fifth of its letters
// and almost never runs four consonants together. Both tests have to fail
// before a token is doubted, and a majority of tokens have to be doubted before
// the line is, so one "strengths" costs nothing.
const isWordShaped = (word) => {
  const letters = word.length
  const vowels = (word.match(/[aeiouy]/g) ?? []).length
  if (vowels / letters < 0.2) return false
  return !/[bcdfghjklmnpqrstvwxz]{4,}/.test(word)
}

const looksLikeNonsense = (text) => {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? []
  if (!words.length) return text.trim().length > 0
  if (words.some((w) => w.length > 24)) return true
  // Short tokens are skipped: acronyms are real and "WMS" is not a word shape.
  const testable = words.filter((w) => w.length >= 4)
  if (testable.length >= 3 && testable.filter(isWordShaped).length / testable.length < 0.5) {
    return true
  }
  const distinct = new Set(words).size
  return words.length >= 6 && distinct / words.length < 0.4
}

const covered = (text) => {
  const t = text.toLowerCase()
  return TOPICS.filter((topic) => topic.words.some((w) => t.includes(w)))
}

// `{ tone, text }`, where tone is one of 'neutral', 'warn' and 'good'. One
// sentence, because it sits under a field somebody is mid-thought in.
export const scopeHint = (raw) => {
  const text = (raw ?? '').trim()
  if (!text) {
    return {
      tone: 'neutral',
      text: 'Partners quote from this, so the detail you add here comes back as accuracy.',
    }
  }
  if (looksLikeNonsense(text)) {
    return {
      tone: 'warn',
      text: 'This does not read as a description yet, so partners will answer with a workshop rather than a quote.',
    }
  }
  if (text.length < SCOPE_MIN) {
    return { tone: 'neutral', text: 'Keep going, a sentence or two is the least anyone can quote from.' }
  }
  const hit = covered(text)
  const missing = TOPICS.filter((t) => !hit.includes(t))
  // ⚠️ NEUTRAL, NOT AMBER. Amber is for text that is not language; this is
  // language that has not said much yet, and colouring the two the same tells
  // somebody who wrote a real sentence that they wrote gibberish.
  if (!hit.length) {
    return {
      tone: 'neutral',
      text: 'Say what you make and what keeps going wrong, so partners can size it.',
    }
  }
  if (missing.length) {
    return { tone: 'neutral', text: `Add ${missing[0].ask} and more of them can quote a figure.` }
  }
  return { tone: 'good', text: 'That is enough for most partners to quote a figure.' }
}

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
