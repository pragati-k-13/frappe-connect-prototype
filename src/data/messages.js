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
// ⚠️ A TEAM per firm, not one name: a partner's replies come from more than
// one person, and one name standing in for a firm is a worse fiction than a
// small team. Between one and three,
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
  // ⚠️ THE BALL IS IN YOUR COURT, which is a state the inbox had none of.
  // Every other seeded thread either ends with the partner answering or with
  // silence; this one ends with a question waiting on the customer, which is
  // the most common reason a promising conversation stalls.
  {
    name: 'New Indictrans',
    messages: [
      ['you', ago(2), 'We are scoping a move off Tally. Do you do the data migration yourselves?'],
      [
        'partner',
        ago(1, 6),
        'We do, though it depends what shape the data is in. How many years of history are you bringing across, and is it one company or several?',
      ],
    ],
  },
  // A partner who answered by saying no — AS A SENTENCE, not as a decline card.
  //
  // ⚠️ THIS USED TO BE A `decline`, AND THAT WAS THE WRONG SHAPE HERE. A
  // decline is a reply to a REQUIREMENT: something formal went out, a firm
  // formally answered it, and the product tracks that because the business is
  // waiting on a set of named partners and needs to know which of them are
  // still live. Nothing formal went out here. One person asked another whether
  // they had time, and "not until January" is the answer to that question, not
  // a status change — rendering it as a bordered card under a "Declined" badge
  // turns an ordinary no into a verdict, and puts a state on a conversation
  // that has none. See `threadStatus`, which now only reads declines off
  // broadcast threads.
  {
    name: 'Hybrowlabs',
    messages: [
      ['you', ago(9), 'Do you have availability for a manufacturing implementation starting next month?'],
      [
        'partner',
        ago(8),
        'Not next month, sorry — we are at capacity until the new year. Worth asking again in January if the timing still works for you.',
      ],
    ],
  },
]

export const discoveryThreads = () =>
  SEEDS.map((s) => ({
    partnerId: idOf(s.name),
    // `author` on partner messages only. The viewer's own name is on the store
    // (`store.viewer`), which is the one human the screen already knew about.
    //
    // ⚠️ TWO SENDERS, AND NO `kind`. A seed briefly grew a third sender,
    // `'decline'`, so a discovery thread could carry a decline card; these
    // threads are ordinary conversations and a decline belongs to a broadcast,
    // so every message here is text and the format stays a triple.
    messages: s.messages.map(([f, at, body]) =>
      msg(f, at, f === 'partner' ? { body, author: repFor(s.name) } : { body }),
    ),
  }))
    .filter((t) => t.partnerId)
    .map((t) => ({ id: t.partnerId, ...t }))

// ── Threads the viewer starts ──────────────────────────────────────────────
// The other way in: Contact, from a listing row or a partner's profile.
//
// ⚠️ THE SAME BRIEF CARD A BROADCAST SENDS, to one firm, AND THE COMPANY WITH
// IT. Contacting a partner directly used to send its own "inquiry" card — apps
// and modules — which stopped matching the product once requirements became a
// written scope and a budget. What differs from a broadcast is who chose whom:
// a broadcast hands a requirement to a dozen strangers, so the company waits
// for a reply worth answering; here the business picked this firm, so the
// company goes out with the brief and there is no Interested step to wait on.
//
// ⚠️ NO `broadcast` MARK. This thread is one conversation, not one of a set,
// so it is never folded into a broadcast group and never gets a broadcast
// status — see `threadStatus`.
//
// `brief` is a SNAPSHOT, like the broadcast's: what the partner quoted against
// has to stay on the screen while the project's own scope keeps moving.
//
// `startedAt` carries the only fact there is, and `lastAt` reads it — see the
// note there.
export const contactThread = (partner, brief = null, body = '') => {
  const at = Date.now()
  return {
    id: partner.id,
    partnerId: partner.id,
    startedAt: at,
    messages: [
      ...(brief
        ? [
            { id: `m${++seq}`, from: 'you', at, kind: 'brief', brief },
            { id: `m${++seq}`, from: 'you', at, kind: 'company' },
          ]
        : []),
      // The optional note, as its own message rather than folded into the card.
      // It is the one part of the contact the visitor wrote in their own words,
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
//
// ⚠️ THE REQUIREMENTS GO TOO, as their own card. A pack buyer never writes a
// brief, but the greeting promises "here is where we are today" — so the card
// carries what they bought and the answers they gave (industry, size, how they
// run today, what they want fixed), snapshotted like a brief. The company line
// after it is who they are; this is what the work is. See `packBrief`.
export const bookingThread = ({ partner, packs, brief = null }) => {
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
        body: `Hi — we have just bought the ${list} ${names.length > 1 ? 'Starter Packs' : 'Starter Pack'} and Frappe has assigned you to us. Here is where we are today.`,
      }),
      ...(brief ? [{ id: `m${++seq}`, from: 'you', at, kind: 'packs', brief }] : []),
      { id: `m${++seq}`, from: 'you', at, kind: 'company' },
    ],
  }
}

// ── A partner saying no ─────────────────────────────────────────────────────
// ⚠️ DECLINING IS NOT SILENCE, and the flow had only silence. A broadcast goes
// to a dozen firms; some never answer, and some answer to say they are not
// taking it. Those read identically in an inbox that models only "replied" and
// "did not", and they are completely different facts to the business waiting:
// one is a maybe that is still running, the other is a closed door you can stop
// counting on.
//
// ⚠️ IT CARRIES A REASON, and the reasons are short and unapologetic. A partner
// declining a brief is not a rejection of the company and the copy should not
// sound like one — "we are full until March" is information; "unfortunately we
// regret to inform you" is a form letter.
//
// ⚠️ ONLY EVER ON A BROADCAST THREAD. What makes a decline worth a card and a
// badge is that it closes one of a SET: requirements went to a dozen firms, the
// business is counting who is still live, and a firm dropping out changes that
// count. A one-to-one conversation has no set and no count — somebody asked a
// question and got a no, which is a message. Formalising it there states a
// verdict over a chat and puts a status on a thread that has none. `threadStatus`
// enforces this, and the seeds obey it: see the Hybrowlabs thread in `SEEDS`,
// which says the same thing in a sentence.
export const DECLINE_REASONS = [
  'We are at capacity until the new year, so we would not be able to start this properly.',
  'This one is outside what we do — we do not take on integrations with legacy warehouse systems.',
  'Our team does not have the industry experience this needs. We would rather say so than learn on your project.',
  'The budget band is below the smallest engagement we can staff.',
]

export const declineMessage = (partner, reason, at = Date.now()) => ({
  id: `dec-${partner.id}-${++seq}`,
  from: 'them',
  at,
  kind: 'decline',
  reason,
  author: repFor(partner.name),
})

// ⚠️ ONE PLACE DECIDES WHAT A THREAD *IS*, because three surfaces ask: the row
// badge, the preview line, and the empty-state copy. Derived from the messages
// plus the project's own bid state — never stored, so a thread cannot disagree
// with the conversation inside it.
//
// `bidState` is passed in rather than looked up, because this file has no
// access to the store and the project is where a bid's state actually lives.
//
// ⚠️ EVERY STATUS BELOW IS A BROADCAST STATUS, and that is not a coincidence —
// it is what a status IS on this screen. Each one answers "where does this firm
// stand on the requirements I sent", and a thread nobody sent requirements to
// cannot stand anywhere. So an ordinary conversation returns `null` however it
// is going: a partner who says no in it has said no, not declined.
export const threadStatus = (thread, bidState = null) => {
  const msgs = thread?.messages ?? []
  if (thread?.broadcast && msgs.some((m) => m.kind === 'decline')) return 'declined'
  const bid = [...msgs].reverse().find((m) => m.kind === 'bid')
  if (bid) {
    if (bidState === 'shortlisted') return 'shortlisted'
    if (bidState === 'not-interested') return 'not-interested'
    return 'quoted'
  }
  if (thread?.broadcast && !msgs.some((m) => m.from === 'them')) return 'awaiting'
  return null
}

// What each status is called, and how loudly. `null` is the ordinary
// conversation, which gets no badge at all — a label on every row is a label on
// none of them.
export const STATUS_LABELS = {
  declined: { label: 'Declined', theme: 'gray' },
  quoted: { label: 'Quoted', theme: 'blue' },
  shortlisted: { label: 'Interested', theme: 'green' },
  'not-interested': { label: 'Not interested', theme: 'gray' },
  awaiting: { label: 'Awaiting reply', theme: 'gray' },
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
