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
// So: `REPS` below is fiction, deliberately. Nobody in it works anywhere.

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
const REPS = {
  'Tridots Tech': 'Anitha Balakrishnan',
  '8848 Digital': 'Rohan Deshmukh',
  Wahni: 'Nikhil Menon',
  'Finbyz Tech': 'Parth Shah',
}

// Falls back to the firm's own name, so a partner with no rep listed still
// renders — as the company, which is exactly what this file used to do
// everywhere.
export const repFor = (partnerName) => REPS[partnerName] ?? partnerName

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
// The other way in: Contact, from a listing row or a partner's profile. Empty
// on purpose — booking a pack has three things to say on the visitor's behalf
// (the ask, the company details, the call), and Contact has none of them. The
// visitor has not said anything yet, and opening with a sentence they didn't
// write would put words in their mouth to a real company.
//
// `startedAt` carries the only fact there is, and `lastAt` reads it — see the
// note there.
export const contactThread = (partner) => ({
  id: partner.id,
  partnerId: partner.id,
  startedAt: Date.now(),
  messages: [],
})

export const bookingThread = ({ partner, pack, slot }) => {
  const at = Date.now()
  return {
    id: partner.id,
    partnerId: partner.id,
    messages: [
      msg('you', at, {
        body: `Hi, we are looking at a ${pack.name} Starter Pack implementation for ERPNext. Could you take this on?`,
      }),
      { id: `m${++seq}`, from: 'you', at, kind: 'company' },
      { id: `m${++seq}`, from: 'you', at, kind: 'call', when: slot ?? null },
    ],
  }
}
