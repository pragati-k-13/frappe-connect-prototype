// What a partner sends back when requirements reach them: a price, a timeline
// and a sentence. "Bid" is this file's word for it and it is a poor one — a
// partner is answering a brief, not competing at auction — but the flow needs
// one noun for a thing the business then approves or passes on, and every
// better candidate ("quote", "proposal") is already the name of a document that
// comes later, after somebody has actually talked to somebody.
//
// ⚠️ A BID IS NOT A CONVERSATION. It arrives before the business has agreed to
// talk, which is the whole mechanism: requirements go out to a dozen firms, the
// replies come back as small structured things that can be compared in a table,
// and only an approved one opens into a thread with a company name attached to
// it. That is what stops a broadcast from being twelve strangers with your
// phone number.
//
// ⚠️ EVERY FIGURE BELOW IS GENERATED, not written — derived from the partner's
// own (invented) rate and tier so that a gold firm in Chennai and a bronze one
// in Nairobi don't quote the same number for the same brief. Nobody at these
// companies quoted anything. Replace wholesale before this is shown outside the
// team.
import { pricingFor, marketFor, DEFAULT_REGION } from './packs'

// Deterministic jitter from a string, so the same partner always answers the
// same way. `Math.random()` here would reshuffle the comparison table on every
// render, which is the one thing a table of prices must not do.
// ⚠️ The multiplier and the modulus are TUNED, not arbitrary, and only because
// the directory is thirteen firms. Any pair of constants produces a plausible
// spread over a real partner list; over six Indian manufacturers it can easily
// produce "6 of 6 replied", which is the one thing this generator exists not to
// show. 29 and 997 give four or five of six, which is what a broadcast actually
// looks like a week later. Re-tune if the seed data changes.
const hash = (s) => [...s].reduce((h, c) => (h * 29 + c.charCodeAt(0)) % 997, 7)

// Tier moves the price and the timeline in opposite directions, which is the
// only claim this generator makes about the partner programme: a gold firm
// costs more and says it will take less time. It is a plausible shape, not a
// published one.
const TIER_FACTOR = { gold: 1.25, silver: 1, bronze: 0.8 }
const TIER_WEEKS = { gold: 0, silver: 2, bronze: 3 }

// The notes are the one part a partner would actually write, so they are
// written rather than assembled — five registers of reply, picked by the same
// hash. Each says something about HOW the firm works instead of restating the
// brief, because a reply that repeats your own requirements back at you is the
// reply everyone ignores.
//
// ⚠️ FIVE, not three, and the count is the fix for a real defect: with three
// notes over a handful of partners the same paragraph appeared on two cards
// stacked directly on top of each other, which reads as a rendering bug rather
// than as two firms who happen to work the same way.
const NOTES = [
  'We would start with a two-day process workshop before quoting the build properly. The figure here assumes what you described is close to what we find.',
  'We have run three implementations of roughly this shape in your industry. Happy to put you in touch with one of them before you decide anything.',
  'This covers configuration, data migration and training. Integrations are quoted separately once we know which systems have to talk to each other.',
  'We would phase this: the core modules live first, then the parts that need integration work. The figure is for both phases.',
  'Our team works on site for the first fortnight and remotely after that. The quote assumes your team can give us two people half-time.',
]

const money = (amount, p) =>
  new Intl.NumberFormat(p.locale, {
    style: 'currency',
    currency: p.currency,
    maximumFractionDigits: 0,
  }).format(amount)

// A single partner's reply to a brief.
//
// ⚠️ PRICED IN THE BUSINESS'S CURRENCY, not the partner's. A Dubai firm bidding
// on an Indian brief quotes rupees, because the comparison table's whole job is
// putting numbers next to each other and a column with two currencies in it
// cannot be read. The rate that produces the figure is still the partner's own.
export const bidFor = (partner, { country, band = 2 } = {}) => {
  const region = marketFor(country) ?? DEFAULT_REGION
  const pricing = pricingFor(region)
  const n = hash(partner.id)

  // Hours scale with the budget band the business picked — a brief with ₹40
  // lakh behind it is a bigger job than one with ₹5 lakh, and a partner reading
  // both would not quote the same size of engagement for them.
  const hours = 120 + band * 90 + (n % 7) * 15
  const amount = Math.round(
    ((hours * pricing.rate * (TIER_FACTOR[partner.tier] ?? 1)) / 1000) * 1000,
  )

  return {
    partnerId: partner.id,
    amount,
    price: money(amount, pricing),
    weeks: 6 + (TIER_WEEKS[partner.tier] ?? 2) + (n % 4),
    note: NOTES[n % NOTES.length],
  }
}

// ⚠️ NOT EVERY PARTNER REPLIES, and the flow is dishonest if they all do.
// Sending to twelve firms and hearing from twelve of them is not what happens;
// the screen that says "8 of 12 have replied" is telling the truth about a
// broadcast, and the two-thirds here is what produces that number.
//
// Deterministic again, and skewed by tier — a gold partner is likelier to
// answer, which is the one thing the tier ought to predict. Roughly five in six
// of them against two in three of everyone else.
//
// ⚠️ The first version compared `hash % 3` against 9 for gold, which is a
// number `% 3` can never produce — so every gold partner replied and the screen
// read "6 of 6 partners replied", which is not what a broadcast looks like a
// week later. The modulus carries the difference now.
export const repliesToBrief = (partner) => hash(partner.id) % (partner.tier === 'gold' ? 6 : 3) !== 0

// The three states a bid moves through. `pending` is what arrives; the business
// moves it on.
//
// ⚠️ 'passed', NOT 'rejected'. The word is read by the person who chose it, in
// a list of firms who spent an hour on their brief, and "rejected" makes a
// routine narrowing-down feel like a verdict on the company. The partner is not
// told either way — see the note in `stores/connect.js`.
export const BID_STATES = ['pending', 'approved', 'passed']
