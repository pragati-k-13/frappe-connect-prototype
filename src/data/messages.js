import { PARTNERS } from './partners'

// The messages screen's data: what a thread is, when one counts as active, and
// the two ways threads come into existence.
//
// ⚠️ Partner-side messages are authored by the COMPANY, never by a named
// person. The partners in this directory are real firms, and putting words in
// the mouth of "Rakesh at Tridots" invents an employee and a quote for a
// business that can't correct it. The viewer is the only named human in here,
// and they are the demo's own invention (`store.viewer`).

const DAY = 24 * 60 * 60 * 1000

// ⚠️ A thread is INACTIVE when nothing has been said in it for 30 days. It is
// derived from the last message rather than stored, so nothing has to remember
// to flip a flag — but it also means a thread crosses the line on its own, and
// a seeded one is dated relative to now so the demo never goes stale.
export const INACTIVE_AFTER = 30 * DAY

export const lastAt = (thread) => thread.messages.at(-1)?.at ?? 0
export const isActive = (thread) => Date.now() - lastAt(thread) < INACTIVE_AFTER

const ago = (days, hours = 0) => Date.now() - days * DAY - hours * 60 * 60 * 1000

// By name rather than by id: `id` is derived from the name (`slug`), so a
// hard-coded id here would rot silently the day a partner is renamed. An
// unresolved name drops its thread instead of leaving one keyed to nobody.
const idOf = (name) => PARTNERS.find((p) => p.name === name)?.id ?? null

let seq = 0
const msg = (from, at, rest) => ({ id: `m${++seq}`, from, at, kind: 'text', ...rest })

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
    messages: s.messages.map(([f, at, body]) => msg(f, at, { body })),
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
