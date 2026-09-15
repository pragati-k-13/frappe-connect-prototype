// Invented availability for the Request a slot modal (`BookSlotDialog.vue`).
//
// ⚠️ NONE of this is real. A partner's calendar is the only thing that can say
// when they are free and how many people can join a session, and Frappe Connect
// has no link to one. Everything below is generated so the modal has a shape to
// review: a bookable window, a grid of times, and per-slot capacity that varies
// the way a real one would. Don't quote a number out of this file.
//
// It is DETERMINISTIC, not random. `Math.random()` reshuffles on every render,
// so a slot that said "2 spots left" would say "Full" a keystroke later and the
// screen would be unreviewable. Every number here is a hash of the partner and
// the slot, so it is stable for as long as the partner and the date are.
//
// ── The two calendars ──────────────────────────────────────────────────────
// A slot is an INSTANT, and the two sides of the booking read it on different
// calendars. Which calendar answers which question is the whole design of this
// file:
//
//   The partner's — what counts as working time. `TIMES` is their working day
//   and the weekend rule is their weekend, because it is their hours being
//   offered. A Chicago partner's 9:30 is 9:30 in Chicago whoever is looking.
//
//   The viewer's — which day a slot belongs to, and which days are offerable.
//   The window is the viewer's next five days because the viewer is the one
//   deciding, and a day on the grid holds the slots that fall on THEIR date.
//
// So a partner's Friday 5pm can be the viewer's Saturday morning, and it
// appears under Saturday: the partner is still working, and the viewer still
// has to be free on their own Saturday to take it. Getting this backwards —
// bucketing by the partner's day — puts times on the grid that are not on the
// day the grid says they are.

const DAY = 24 * 60 * 60 * 1000
const pad = (n) => String(n).padStart(2, '0')

// ── The bookable window ────────────────────────────────────────────────────
// Today through five days out, in the VIEWER's days. A discovery call this far
// ahead is a real calendar question and the partner has to answer it; offering
// a date three weeks out would be a promise nothing behind this screen can
// keep.
export const WINDOW_DAYS = 5

export const startOfDay = (d) => {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

// The viewer-local calendar date of an instant.
export const dayKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// ── The grid of times ──────────────────────────────────────────────────────
// A fixed working day rather than per-partner hours: a mock that greys out
// arbitrary times invites questions about a rule that doesn't exist yet. The
// gap is lunch, which is the one shape of a working day that needs no rule.
//
// ⚠️ Read in the PARTNER's zone. These are the hours they work.
export const TIMES = ['09:30', '10:30', '11:30', '14:00', '15:00', '16:00', '17:00']

// ── Zone arithmetic ────────────────────────────────────────────────────────
// `Intl` is the only zone database in the browser, and it converts one way:
// instant → wall clock in a zone. Everything here is built out of that.
//
// No date library: `dayjs` belongs to frappe-ui and this app does not depend on
// it, and the two functions below are the whole of what a library would be
// imported for.
const partsIn = (ts, tz) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(ts)
      .map((p) => [p.type, p.value]),
  )

// How far `tz` is from UTC at a given instant. Read by formatting the instant
// into the zone and treating the result as if it were UTC — the difference is
// the offset. It is a function of the INSTANT, not of the zone alone: Berlin is
// +1 in January and +2 in July.
const offsetAt = (ts, tz) => {
  const p = partsIn(ts, tz)
  // `hour` comes back as 24 rather than 0 for midnight in some ICU builds.
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second)
  return asUtc - Math.floor(ts / 1000) * 1000
}

// The reverse: a wall-clock reading in `tz` → the instant it names.
//
// ⚠️ Two passes, and the second one is not belt and braces. The first guess has
// to use the offset at the WRONG instant — the wall time read as if it were UTC
// — which lands on the other side of a DST change for the hours around one.
// Re-reading the offset at the corrected instant fixes the case that matters:
// a 9:30 slot on a spring-forward morning.
const instantOf = ({ year, month, day, hour, minute }, tz) => {
  const naive = Date.UTC(year, month - 1, day, hour, minute)
  const first = naive - offsetAt(naive, tz)
  return new Date(naive - offsetAt(first, tz))
}

// The partner's own calendar days, starting a day before the viewer's window
// and running a day past it — a slot at either edge of the window can land on
// the viewer's side of a date line, and a day clipped off here would take real
// slots out of the grid.
const partnerDays = (tz) => {
  const p = partsIn(Date.now() - DAY, tz)
  // Stepped as a naive UTC date so `getUTCDay` gives the partner's weekday:
  // the day of the week is a property of the calendar date, not of the zone.
  const cursor = new Date(Date.UTC(+p.year, +p.month - 1, +p.day))
  const out = []
  for (let i = 0; i < WINDOW_DAYS + 3; i++) {
    out.push({
      year: cursor.getUTCFullYear(),
      month: cursor.getUTCMonth() + 1,
      day: cursor.getUTCDate(),
      weekday: cursor.getUTCDay(),
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

// ── The viewer's day ───────────────────────────────────────────────────────
// ⚠️ The VIEWER's hours, not the partner's. The partner's working day is
// already what `TIMES` is; this is the other side of the same question, and the
// two only agree when both are in the same zone. A Chicago partner's 9:30 is
// half past midnight in Chennai, and the modal knew that and printed it as an
// ordinary choice — the numbers were right and the screen said nothing about
// what it was offering.
//
// Deliberately WIDE (8am to 9pm) and not a filter. Somebody working with a
// partner eleven hours away may well take a call at 8pm, and dropping those
// slots would hide real availability to protect them from a decision that is
// theirs. It marks, it does not remove.
const DAY_STARTS = 8
const DAY_ENDS = 21

// ── Capacity ───────────────────────────────────────────────────────────────
// A discovery session takes a handful of businesses, not one — which is why a
// slot has spots at all rather than being simply free or taken. Two to four,
// fixed per partner, because how many a firm will sit in one session is a
// property of the firm.
const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const capacityFor = (partnerId) => 2 + (hash(partnerId) % 3)

// Remaining spots. The modulus runs two past capacity so the top of the range
// saturates — most slots sit at or near full capacity, roughly one in
// `capacity + 2` has been taken out entirely, and the counts in between are
// what make the number worth printing at all.
//
// ⚠️ Keyed on the PARTNER's day and time, so a slot keeps its count whoever is
// looking at it. Keyed on the viewer's, the same session would report different
// availability in Chennai and in Chicago.
const spotsLeft = (partnerId, partnerDayKey, time) => {
  const cap = capacityFor(partnerId)
  return Math.min(hash(`${partnerId}|${partnerDayKey}|${time}`) % (cap + 2), cap)
}

// ── Slots ──────────────────────────────────────────────────────────────────
// Every slot the partner offers around the window, oldest first. `at` is the
// instant; `time` is the partner's own reading of it, kept because it is what
// the count is keyed on and what a real request would be sent as.
//
// Weekends are dropped on the PARTNER's weekday. A business booking a discovery
// call with an implementation partner is booking working time, and whether it
// is working time is a fact about their week, not the viewer's.
const allSlots = (partnerId, tz) => {
  const now = Date.now()
  const out = []
  for (const d of partnerDays(tz)) {
    if (d.weekday === 0 || d.weekday === 6) continue
    const key = `${d.year}-${pad(d.month)}-${pad(d.day)}`
    for (const time of TIMES) {
      const [hour, minute] = time.split(':').map(Number)
      const at = instantOf({ ...d, hour, minute }, tz)
      // A time that has already gone is not bookable. Nothing else in here is a
      // real constraint, but this one is — and it is the one question with no
      // zone in it, because an instant is past or it is not.
      const past = at.getTime() <= now
      const left = past ? 0 : spotsLeft(partnerId, key, time)
      // `getHours()` with no zone argument is the VIEWER's clock, which is the
      // whole point of the flag.
      const viewerHour = at.getHours()
      out.push({
        id: `${key}T${time}`,
        at,
        time,
        past,
        left,
        full: !past && left === 0,
        offHours: viewerHour < DAY_STARTS || viewerHour >= DAY_ENDS,
      })
    }
  }
  return out.sort((a, b) => a.at - b.at)
}

// Those slots filed under the viewer's calendar date. This is the map the grid
// and the slot list both read.
export const slotsByDay = (partnerId, tz) => {
  const map = new Map()
  for (const slot of allSlots(partnerId, tz)) {
    const key = dayKey(slot.at)
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(slot)
  }
  return map
}

// The days the calendar will accept: inside the viewer's window, and holding at
// least one slot that has not already gone. A day with nothing left on it —
// today, late in the afternoon — is not offerable, and the calendar has to know
// that before it decides which cell to open on.
export const bookableDays = (partnerId, tz) => {
  const byDay = slotsByDay(partnerId, tz)
  const out = []
  const d = startOfDay(new Date())
  for (let i = 0; i <= WINDOW_DAYS; i++) {
    if ((byDay.get(dayKey(d)) ?? []).some((slot) => !slot.past)) out.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}
