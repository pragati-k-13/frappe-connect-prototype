// What the intake's three steps add up to: buy packs, or scope custom work.
//
// ⚠️ THIS IS THE PRODUCT. Everything before it collects answers and everything
// after it sells something; this is the only place that decides. So the rules
// are here as data and prose rather than as conditions buried in a page, and
// every one of them produces a SENTENCE — the recommendation screen has to say
// why, and a reason written next to its rule cannot drift from it.
//
// ⚠️ THE RULES ARE INVENTED. Nothing in the scope document says who should buy
// a pack and who needs a partner to scope the work; what it does say is that
// packs are "for businesses running fewer than 50 users" and that anything
// outside the printed scope is a change request. Both of those are real, and
// the three custom triggers below are what falls out of them. The pack mapping
// is a reading of the module catalogue, not a rule anybody has agreed.
import { COMPANY_SIZES, OPERATIONS } from './company'
import { STARTER_PACKS } from './packs'
import { GROUP_OF_SEGMENT } from './quiz'

// ⚠️ THE VERDICT'S reasons still print an answer back, and that is a different
// job from the per-pack lines below. Those recommend a product, so quoting the
// buyer at themselves reads as a form echoing its own checkbox. These are the
// EVIDENCE — "here is what we read" — and evidence that paraphrases the thing
// it is evidence of cannot be checked.
//
// The store holds what was CHOSEN (`'outgrown'`, `['close', 'people']`); this
// turns it back into what was read on screen.
const operationsLabel = (value) => OPERATIONS.find((o) => o.value === value)?.label ?? ''

// ── The size threshold ──────────────────────────────────────────────────────
// ⚠️ REAL, and the only rule here that is. The commercial terms say a pack is
// "for businesses running fewer than 50 users", so a business above the band
// that straddles 50 cannot be sold one — not as a matter of judgement but as a
// matter of what the pack says on it.
//
// Derived from the position in `COMPANY_SIZES` rather than by matching the
// string, so re-banding the sizes moves the threshold with them instead of
// silently making it match nothing.
const OVER_50_FROM = COMPANY_SIZES.indexOf('51 to 200')

export const isOver50 = (employees) => {
  const i = COMPANY_SIZES.indexOf(employees)
  return i >= 0 && i >= OVER_50_FROM
}

// ── The three custom triggers ───────────────────────────────────────────────
// Each is `{ test, reason }` and the reasons are printed in this order. A
// business can trip more than one, and all of them are shown: someone with 200
// staff on an ERP that no longer fits is being told two different things, and
// collapsing them to the first would lose the one they care about.
//
// ⚠️ ALL THREE ARE ABOUT FIT, NOT SIZE OF BUDGET. A pack is a fixed scope, so
// the question is never "can they afford more" — it is whether what they need
// is inside the printed scope. That is why "several systems that do not talk to
// each other" is NOT a trigger: integrations are excluded from every pack, but
// a business can buy the pack for the modules and treat the integration as the
// change request it is. "An ERP that no longer fits how we work" is different —
// there is no configuration of a fixed scope that answers it.
// ⚠️ ONE SENTENCE EACH: a clause of fact, then what follows from it. They were
// two-sentence paragraphs that restated the headline after every fact, and for
// a while they were bare fragments, which is worse — a fragment under a
// headline does not say whether it is a fact about you, a condition of the
// offer or a feature of the product. The consequence inside the sentence is
// what lets these stand without a label above them explaining what they are.
const CUSTOM_TRIGGERS = [
  {
    key: 'size',
    test: (f) => isOver50(f.employees),
    reason: (f) => `You're ${f.employees} people, and a pack is scoped for under 50 users.`,
  },
  {
    key: 'outgrown',
    test: (f) => f.operations === 'outgrown',
    reason: () =>
      'You are already on an ERP, so this is a migration — a pack is a fresh configuration.',
  },
  {
    key: 'fit',
    test: (f) => f.problems.includes('fit'),
    reason: () =>
      'You need the software to bend to how you work, and a pack is ERPNext exactly as it ships.',
  },
]

// ── The pack rules ──────────────────────────────────────────────────────────
// One per pack, in the order the recommendation lists them. `when` returns the
// reason it applies, or null — returning the SENTENCE rather than a boolean is
// what keeps a rule and its explanation in one expression: there is no way to
// add a condition here and forget to say why it fired.
//
// ⚠️ The core pack is the DEFAULT and the other two are additions, which is the
// shape of the catalogue rather than a preference: accounts, sales, purchase
// and stock is what a business runs on, and manufacturing and payroll are
// things some businesses also do. The one case that turns the default off is a
// business whose only complaint is about people — see the note on its rule.
const anyManufacturing = (segments) =>
  (segments ?? []).some((s) => GROUP_OF_SEGMENT[s] === 'manufacturing')

// ⚠️ WHAT THE PACK DOES ABOUT EACH PROBLEM, in the product's words. These used
// to quote the answer straight back — `Covers "Systems that do not talk to each
// other"` — which is a form echoing its own checkbox at the reader. It sounds
// mechanical, it teaches nothing, and the one thing a person does not need
// explaining is the sentence they just ticked.
//
// Each line now says what they GET, phrased against the thing they named. Still
// answer-specific, so the screen keeps its argument; no longer a quotation, so
// it reads as advice.
//
// ⚠️ The keys are the problems the four core modules answer. A problem that is
// not here gets no core reason at all — see the fallback in the rule.
const CORE_REMEDY = {
  'manual-work': 'Stops the same order being typed into three places',
  integration: 'One system for orders, invoices and stock, instead of three',
  close: 'Month-end closes off the ledger your orders already write to',
  visibility: 'Stock that moves when an order does',
  scale: 'The base the rest of ERPNext is built on',
}

const PACK_RULES = {
  'accounts-sales-purchase-stock': (f) => {
    // ⚠️ The one exclusion. A business that named ONLY the people problem is
    // telling us its books and its stock are fine; selling it four modules it
    // did not ask about is the upsell this screen exists not to be. Everyone
    // else gets it, including someone who ticked nothing that maps cleanly —
    // the modules are the floor of running a business on ERPNext.
    if (f.problems.length === 1 && f.problems[0] === 'people') return null
    const named = f.problems.find((p) => CORE_REMEDY[p])
    return named ? CORE_REMEDY[named] : 'The base the rest of ERPNext is built on'
  },
  manufacturing: (f) => {
    if (!anyManufacturing(f.segments)) return null
    return 'Work orders and BOMs, planned against the stock you hold'
  },
  hrms: (f) => {
    if (!f.problems.includes('people')) return null
    return 'Attendance, leave and salaries off one employee record'
  },
}

// ── The recommendation ──────────────────────────────────────────────────────
// `{ verdict, reasons, packs }`, where `packs` is `[{ pack, reason }]` in
// catalogue order.
//
// ⚠️ ONE VERDICT, NOT A RANKING. An earlier version scored both paths and
// showed the loser underneath, which reads as a shop rather than as advice —
// and a screen that recommends everything has recommended nothing. The other
// path is reachable from the recommendation screen by a plain link; it is just
// not the answer.
//
// ⚠️ THE PACK LIST IS COMPUTED FOR BOTH VERDICTS. Custom work still tells you
// which modules are in play, and the custom brief sends them to partners as the
// scope — so the rules run either way and the verdict decides what is done with
// the result, not whether it exists.
export const recommendationFor = (form) => {
  const f = {
    employees: form?.employees ?? '',
    segments: form?.segments ?? [],
    operations: form?.operations ?? '',
    problems: form?.problems ?? [],
    country: form?.country ?? '',
  }

  const triggered = CUSTOM_TRIGGERS.filter((t) => t.test(f))

  const packs = STARTER_PACKS.map((pack) => ({ pack, reason: PACK_RULES[pack.value]?.(f) ?? null }))
    .filter((row) => row.reason)

  if (triggered.length) {
    return {
      verdict: 'custom',
      triggers: triggered.map((t) => t.key),
      reasons: triggered.map((t) => t.reason(f)),
      packs,
    }
  }

  return {
    verdict: 'packs',
    triggers: [],
    // ⚠️ SENTENCES, AND THE SECOND ATTEMPT AT THEIR LENGTH. They started as two
    // paragraphs that each stated a fact and then re-argued the headline; they
    // were cut to bare fragments — "11 to 50 people, and no ERP to migrate off"
    // — and that went too far. A fragment under a headline has no frame: it
    // does not say whether it is a fact about you, a condition of the offer or
    // a feature of the product, and two of them stacked read as a system
    // printing its variables.
    //
    // Each one is now a sentence carrying its own consequence, which is what
    // makes it legible without a label above it saying "why". One clause of
    // fact, one of what follows.
    reasons: [
      `You're ${f.employees} people with no ERP to migrate off, so a fixed scope fits without anyone scoping it first.`,
      f.operations
        ? `Today it's ${operationsLabel(f.operations).toLowerCase()} — which is what these packs replace.`
        : null,
    ].filter(Boolean),
    packs,
  }
}

// ⚠️ The pack values only, for seeding the basket. The recommendation screen
// opens with these already ticked — the whole point of asking nine questions is
// that somebody should not then have to choose from a catalogue — and this is
// what it ticks them from.
export const recommendedPackValues = (form) => recommendationFor(form).packs.map((r) => r.pack.value)
