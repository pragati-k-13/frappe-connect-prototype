import { PARTNERS } from './partners'

// The messages screen's data: what a thread is, when one counts as active, and
// the ways threads come into existence.
//
// ⚠️ EVERY NAME IN HERE IS INVENTED, on both sides of the conversation.
//
// Partner-side messages used to be authored by the COMPANY — "Tridots Tech
// said this" — on the reasoning that the partners in this directory are real
// firms and naming an employee invents a person for a business that can't
// correct it. That is still true of the names, and it is why they are flagged
// this loudly. But it modelled the product wrongly: a partner's sales team
// coordinates through individual accounts, so a reply arrives from a PERSON who
// works there, not from the firm as a whole. The thread is still with the
// company — header, logo, profile link, all partner-level — and the badge
// beside each name is what ties the person back to it.
//
// So: `TEAMS` below is fiction, deliberately. Nobody in it works anywhere.

const DAY = 24 * 60 * 60 * 1000

// ⚠️ A thread is INACTIVE when nothing has been said in it for 30 days. It is
// derived from the last message rather than stored, so nothing has to remember
// to flip a flag — but it also means a thread crosses the line on its own, and
// a seeded one is dated relative to now so the demo never goes stale.
export const INACTIVE_AFTER = 30 * DAY

// ⚠️ Falls back to `startedAt`. A thread opened from Contact has no messages in
// it yet, and with `?? 0` such a thread reads as "last spoken in 1970" — which
// `isActive` below turns into INACTIVE, filing a conversation you started ten
// seconds ago under the quiet tab.
export const lastAt = (thread) => thread.messages.at(-1)?.at ?? thread.startedAt ?? 0
export const isActive = (thread) => Date.now() - lastAt(thread) < INACTIVE_AFTER

const ago = (days, hours = 0) => Date.now() - days * DAY - hours * 60 * 60 * 1000

// By name rather than by id: `id` is derived from the name (`slug`), so a
// hard-coded id here would rot silently the day a partner is renamed. An
// unresolved name drops its thread instead of leaving one keyed to nobody.
const idOf = (name) => PARTNERS.find((p) => p.name === name)?.id ?? null

let seq = 0
const msg = (from, at, rest) => ({ id: `m${++seq}`, from, at, kind: 'text', ...rest })

// ── Who replies, on the partner's side ─────────────────────────────────────
// One invented salesperson per partner, keyed by firm the same way `SEEDS` is —
// by NAME, not id, for the same reason `idOf` is: an id here would rot the day a
// partner is renamed.
//
// One each is a floor, not a rule: `author` lives on the MESSAGE, so a thread
// where two people from the same firm answer is a second entry in the array
// below, not a code change.
//
// ⚠️ No pronouns anywhere, and no roles beyond "someone in sales who replied".
// These are placeholders in a prototype; the less they assert about a person who
// does not exist, the better.
// ⚠️ Now a TEAM per firm, not one name, because `BookSlotDialog` lists who
// would actually be on the call and a call with one attendee named and the
// rest implied is a worse fiction than naming them. Between one and three,
// which is what a discovery call from an implementation partner looks like.
//
// Order matters: the FIRST name is the one who replies in Messages, so the
// four that already existed stay first in their firm's list and no seeded
// thread changes hands. `repFor` reads that position.
//
// Names are region-appropriate to the firm's city — a Munich partner fielding
// only Indian names would be its own small false claim — and no name repeats
// across firms.
const TEAMS = {
  'Tridots Tech': ['Anitha Balakrishnan', 'Suresh Karthik', 'Divya Raghavan'],
  'Software@Work': ['Farhan Qureshi', 'Snehal Bhosale'],
  'New Indictrans': ['Aditi Kulkarni'],
  '8848 Digital': ['Rohan Deshmukh', 'Meghana Joshi'],
  'Greycube Technologies': ['Vivek Nair', 'Prachi Sawant', 'Imran Shaikh'],
  Wahni: ['Nikhil Menon', 'Ann Mary Thomas'],
  Hybrowlabs: ['Tejas Pawar'],
  'Finbyz Tech': ['Parth Shah', 'Krupa Mehta', 'Jigar Trivedi'],
  ALYF: ['Lena Brandt', 'Tobias Kruger'],
  'Craft Interactive': ['Omar Haddad', 'Reem Al Zaabi'],
  'Kingstech Services': ['Wei Ling Tan'],
  Navari: ['Wanjiru Kamau', 'Brian Otieno'],
  Korecent: ['Dana Whitfield', 'Marcus Ellery', 'Priya Anand'],
}

// Falls back to the firm's own name, so a partner with no rep listed still
// renders — as the company, which is exactly what this file used to do
// everywhere.
export const repFor = (partnerName) => TEAMS[partnerName]?.[0] ?? partnerName

// The whole call sheet. Falls back to a single entry so a partner added
// without a team still renders one row rather than an empty list.
export const teamFor = (partnerName) => TEAMS[partnerName] ?? [partnerName]

// ── The discovery inbox ────────────────────────────────────────────────────
// A business partway through choosing: several conversations open at once, two
// of them gone quiet. This is the demo's "Exploring partners" viewer, and the
// only reason the active/inactive filter has anything to separate.
const SEEDS = [
  {
    name: 'Tridots Tech',
    messages: [
      [
        'you',
        ago(0, 5),
        'Hi, we are looking at an ERPNext implementation for a 40 person retail business. Is that something you take on?',
      ],
      [
        'partner',
        ago(0, 3),
        'Yes, that is close to most of our work. Are you moving off spreadsheets or off another ERP?',
      ],
      ['you', ago(0, 2), 'Spreadsheets and Tally. Inventory is the part that hurts.'],
    ],
  },
  {
    name: '8848 Digital',
    messages: [
      [
        'you',
        ago(4),
        'We are comparing a few partners for a Manufacturing Starter Pack. Do you have capacity this quarter?',
      ],
      [
        'partner',
        ago(3),
        'We do. Two of our consultants free up in three weeks, and the pack is a fixed 70 hours, so the timing works.',
      ],
    ],
  },
  {
    name: 'Wahni',
    messages: [
      ['you', ago(44), 'Hello, do you work with businesses in the UAE?'],
      [
        'partner',
        ago(43),
        'We do, mostly through our Dubai team. Happy to set up a call when you are ready.',
      ],
    ],
  },
  {
    name: 'Finbyz Tech',
    messages: [
      ['you', ago(71), 'Can you share what a payroll rollout usually costs for 50 people?'],
    ],
  },
]

export const discoveryThreads = () =>
  SEEDS.map((s) => ({
    partnerId: idOf(s.name),
    // `author` on partner messages only. The viewer's own name is on the store
    // (`store.viewer`), which is the one human the screen already knew about.
    messages: s.messages.map(([f, at, body]) =>
      msg(f, at, f === 'partner' ? { body, author: repFor(s.name) } : { body }),
    ),
  }))
    .filter((t) => t.partnerId)
    .map((t) => ({ id: t.partnerId, ...t }))

// ── The booked thread ──────────────────────────────────────────────────────
// What "Project details sent via Messaging" on the confirmed screen actually
// means. Three messages, all from the viewer: the ask, the company profile
// onboarding collected, and the call they just booked.
//
// ⚠️ `company` and `call` are not text. They are the two cards in the design,
// and the thread renders them as cards rather than as a paragraph someone has
// to read the fields out of.
// The other way in: Contact, from a listing row or a partner's profile.
//
// ⚠️ THIS USED TO BE EMPTY, on the reasoning that booking a pack has three
// things to say on the visitor's behalf and Contact had none of them — nothing
// had been said yet, and opening with a sentence they didn't write would put
// words in their mouth to a real company. That reasoning is spent: Contact now
// goes through `ContactPartnerDialog`, so by the time a thread exists the
// visitor HAS said something — which apps, which modules, and whatever they
// typed. The card is what they sent, not a greeting written for them.
//
// `inquiry` is a SNAPSHOT — the project's name, apps and module labels as they
// stood when Send inquiry was pressed — and not a reference to the project.
// This differs from the `company` card beside it, which reads live store state,
// and the difference is deliberate: a project's scope keeps moving (it is a
// working document, editable from the project page), and a sent message that
// silently rewrites itself to match is a record of a conversation that didn't
// happen. What the partner quoted against is what has to stay on the screen.
//
// `startedAt` carries the only fact there is, and `lastAt` reads it — see the
// note there.
export const contactThread = (partner, inquiry = null, body = '') => {
  const at = Date.now()
  return {
    id: partner.id,
    partnerId: partner.id,
    startedAt: at,
    messages: [
      ...(inquiry ? [{ id: `m${++seq}`, from: 'you', at, kind: 'inquiry', inquiry }] : []),
      // The optional note, as its own message rather than folded into the card.
      // It is the one part of the inquiry the visitor wrote in their own words,
      // and a sentence quoted inside a summary card reads as a field of the
      // form rather than as something a person said.
      ...(body ? [msg('you', at, { body })] : []),
    ],
  }
}

// ⚠️ SENT ON THE CUSTOMER'S BEHALF, before they have typed anything. A pack is
// paid for and a partner is assigned in the same instant, and the thing that
// makes that assignment useful rather than administrative is that the partner
// already knows who they have been given and what they bought. So the thread
// exists before the customer opens it, with a sentence and the answers they
// gave the intake.
//
// The customer sees exactly what went out — it is in their own thread, from
// them — which is the only version of "we messaged them for you" that isn't a
// thing done behind someone's back.
//
// `packs` is a LIST. The basket is normally more than one now, and "a Accounts,
// Sales, Purchase, Stock and HR and Payroll Starter Pack" is not a sentence, so
// the names are joined and the noun is pluralised by the caller's data rather
// than by a guess.
export const bookingThread = ({ partner, packs }) => {
  const at = Date.now()
  const names = [packs].flat().map((p) => p.name)
  const list =
    names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? '')
  return {
    id: partner.id,
    partnerId: partner.id,
    startedAt: at,
    messages: [
      msg('you', at, {
        body: `Hi — we have just bought the ${list} ${names.length > 1 ? 'starter packs' : 'starter pack'} and Frappe has assigned you to us. Here is where we are today.`,
      }),
      { id: `m${++seq}`, from: 'you', at, kind: 'company' },
    ],
  }
}

// ── The custom broadcast ────────────────────────────────────────────────────
// One of these per matching partner when a brief goes out. Same shape as every
// other thread, because it IS one: the whole point of putting the broadcast in
// the inbox rather than in a private queue is that the customer can see exactly
// what each firm received.
//
// ⚠️ NO COMPANY CARD. This is the difference between a broadcast and a booking:
// twelve firms are being handed a requirement, and until one of them has
// replied with something the customer approves, none of them get the company's
// name, its size or its systems. The brief card carries the scope, the budget
// band and the industry — enough to quote, not enough to cold-call. The company
// card is appended when a bid is approved.
export const briefThread = (partner, brief) => {
  const at = Date.now()
  return {
    id: partner.id,
    partnerId: partner.id,
    startedAt: at,
    // ⚠️ Marks the thread as part of a broadcast, which is what lets the inbox
    // collapse a dozen of them into one group instead of burying every real
    // conversation the account has. Carries the project so the group can name
    // what it was for.
    broadcast: brief.projectId,
    messages: [{ id: `m${++seq}`, from: 'you', at, kind: 'brief', brief }],
  }
}

// A partner's reply to a brief: a price, a timeline and a sentence, as a card
// the customer approves or passes on. `state` lives on the message rather than
// on the thread because a thread can in principle carry two — a revised quote
// is a second bid, not an edit of the first.
export const bidMessage = (bid) => ({
  id: `bid-${bid.partnerId}-${++seq}`,
  from: 'them',
  // Staggered by partner so a dozen replies don't all land on the same minute,
  // which is what makes the inbox's ordering meaningless.
  at: Date.now() - (seq % 7) * 3600 * 1000,
  kind: 'bid',
  bid,
})
