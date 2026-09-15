<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Button, Dialog, ScrollArea, toast } from 'frappe-ui'
// Reached for directly because frappe-ui's `Dialog` renders `message` only as
// the FALLBACK content of its default slot — so any dialog with a body of its
// own loses the description, and the underlying primitive then warns that
// `aria-describedby` is missing. This is that primitive, used as intended.
// reka-ui is frappe-ui's own dialog dependency, not a new one.
import { DialogDescription } from 'reka-ui'
import { teamFor } from '../data/messages'
import { bookableDays, dayKey, slotsByDay } from '../data/availability'
import IconClock from '~icons/lucide/clock'
import IconVideo from '~icons/lucide/video'
import IconGlobe from '~icons/lucide/globe'
import IconMoon from '~icons/lucide/moon'
import IconLeft from '~icons/lucide/chevron-left'
import IconRight from '~icons/lucide/chevron-right'

// "Request a slot" — the calendar action in the profile header, and the primary
// action on the confirmed screen. The FILE keeps its old name: renaming it means
// touching every import to rename a component nobody sees the name of.
//
// Scope: this is the modal's SHAPE, not a scheduler. Nothing is submitted, and
// every date, time and spot count comes out of `data/availability.js`, which
// says at length that none of it is real. What IS reviewable here: the two
// columns, the month grid bounded to a week, the slot list with capacity on it,
// and the confirm state.
const props = defineProps({
  open: { type: Boolean, default: false },
  partner: { type: Object, required: true },
})
const emit = defineEmits(['close'])

// ── Zones ──────────────────────────────────────────────────────────────────
// The viewer's, read off the browser. It is the zone the slots are SHOWN in,
// because the viewer is the one deciding whether they can make a time.
const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// The partner's, and the zone the slots are ANCHORED to — their working day is
// their working day whoever is looking at it.
//
// Falls back to the viewer's for a partner whose city is not in the zone table,
// which degrades to what this file did before it knew about zones: the hours
// shown as if they were yours. Wrong, but wrong in the one direction that
// cannot mislead — if we don't know where they are, we don't move their clock.
const partnerZone = computed(() => props.partner.zone ?? viewerZone)

// ── The window ─────────────────────────────────────────────────────────────
// ⚠️ `nonce` is what makes the computeds below recompute on open. Both read
// `Date.now()`, which is not reactive, so without it a dialog mounted at 23:59
// and opened at 00:01 would serve the window it cached yesterday — the exact
// staleness the `watch` further down claims to prevent.
const nonce = ref(0)

const byDay = computed(() => (nonce.value, slotsByDay(props.partner.id, partnerZone.value)))
const days = computed(() => (nonce.value, bookableDays(props.partner.id, partnerZone.value)))
const openKeys = computed(() => new Set(days.value.map(dayKey)))

const selected = ref(null)
// Holds a slot's `id`, not a wall-clock string: the same reading can name two
// different instants once a day's slots come from two of the partner's days.
const time = ref(null)

// The month the grid is showing. Not derived from `selected`, because the two
// come apart the moment you page to next month without picking anything.
const cursor = ref({ year: 0, month: 0 })

const showMonth = (d) => (cursor.value = { year: d.getFullYear(), month: d.getMonth() })

// ⚠️ Seeded on OPEN, not on mount. The window is relative to now, so a modal
// mounted at 11pm and opened after midnight would otherwise offer yesterday.
// It also opens on the first bookable day rather than on nothing: the slot list
// is the point of the screen, and an empty right-hand column on open makes the
// calendar look like the whole modal.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    nonce.value++
    const first = days.value[0] ?? new Date()
    selected.value = first
    time.value = null
    showMonth(first)
  },
  { immediate: true },
)

// ── The grid ───────────────────────────────────────────────────────────────
// ⚠️ A local reproduction of frappe-ui's `CalendarPanel`, not the component
// itself. `CalendarPanel` is not exported — frappe-ui's `exports` map publishes
// `.`, `./charts`, `./editor` and a handful of others with no wildcard, so
// `frappe-ui/src/components/DatePicker/CalendarPanel.vue` fails to resolve at
// build time. `DatePicker` IS exported, but it is an input with a popover, and
// a calendar you have to click an input to see is the opposite of this screen.
//
// So the MARKUP and the classes below are lifted from `CalendarPanel.vue` on
// purpose — `size-7` cells, `gap-0.5`, `rounded-4`, the `surface-gray-9`
// selected fill, `opacity-30` for unavailable — and the only departures are the
// ones this screen needs: no month-year split view to cycle into, and no
// `dayjs`, which frappe-ui owns and this app does not depend on.
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Always six rows of seven, so the grid's height doesn't change as you page.
const weeks = computed(() => {
  const start = new Date(cursor.value.year, cursor.value.month, 1)
  start.setDate(start.getDate() - start.getDay())
  const out = []
  for (let w = 0; w < 6; w++) {
    const row = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + w * 7 + i)
      row.push({
        date: d,
        key: dayKey(d),
        inMonth: d.getMonth() === cursor.value.month,
        isToday: dayKey(d) === dayKey(new Date()),
        isSelected: Boolean(selected.value) && dayKey(d) === dayKey(selected.value),
        isUnavailable: !openKeys.value.has(dayKey(d)),
        // Cells that spill into the FOLLOWING month, which the grid blanks
        // rather than prints — see the template.
        isNext: d.getFullYear() * 12 + d.getMonth() > cursor.value.year * 12 + cursor.value.month,
      })
    }
    out.push(row)
  }
  return out
})

// Lifted from `CalendarPanel.cellClass`, minus the range states this screen
// has no use for.
const cellClass = (cell) => {
  const todayFont = cell.isToday ? 'font-semibold' : ''
  const resting = [
    cell.inMonth ? 'text-ink-gray-8' : 'text-ink-gray-3',
    cell.isToday ? 'text-ink-gray-9' : '',
  ]
  if (cell.isUnavailable) return ['rounded-4', ...resting, todayFont, 'opacity-30 cursor-not-allowed']
  if (cell.isSelected)
    return ['rounded-4', todayFont, 'bg-surface-gray-9 text-ink-base hover:bg-surface-gray-9 cursor-pointer']
  return ['rounded-4', ...resting, todayFont, 'hover:bg-surface-gray-2 cursor-pointer']
}

// The arrows only exist when the window actually straddles a month boundary —
// six days can do that, and any other month is entirely out of reach. A pair of
// arrows that page into 31 disabled cells would be offering navigation that
// leads nowhere.
const monthOf = (d) => d.getFullYear() * 12 + d.getMonth()
const shown = computed(() => cursor.value.year * 12 + cursor.value.month)
const canPrev = computed(() => days.value.length > 0 && shown.value > monthOf(days.value[0]))
const canNext = computed(() => days.value.length > 0 && shown.value < monthOf(days.value.at(-1)))
const page = (step) => {
  const d = new Date(cursor.value.year, cursor.value.month + step, 1)
  showMonth(d)
}

const pick = (cell) => {
  if (cell.isUnavailable) return
  selected.value = cell.date
  // The chosen time belongs to the day it was chosen on. Carrying 3pm across to
  // a day where 3pm is full leaves the footer enabled on a slot you can't have.
  time.value = null
}

// ── Slots ──────────────────────────────────────────────────────────────────
// ⚠️ PAST times are dropped, FULL ones are kept, and the difference is what
// each state tells you. "Full" is a fact about the partner — someone else took
// the spot, and the counts on the slots around it only mean something if the
// zero is there to read against. "9:30, gone" at four in the afternoon is a
// fact about the clock, which the viewer already has; four dead rows at the top
// of the list pushed the first bookable time out of sight on the one day you
// are most likely to want it.
const slots = computed(() =>
  selected.value ? (byDay.value.get(dayKey(selected.value)) ?? []).filter((s) => !s.past) : [],
)
const chosen = computed(() => slots.value.find((s) => s.id === time.value) ?? null)

// The marker column is reserved only on days that have something to mark. Eight
// of the thirteen partners share the viewer's zone and never will, and for them
// an always-empty 14px gutter is the device charging rent on every row for a
// case that cannot arise. Same rule as the month arrows: it appears when it has
// something to say.
const anyOffHours = computed(() => slots.value.some((slot) => slot.offHours))

// ⚠️ Formats the INSTANT, with no `timeZone` option, which is what puts the
// partner's 9:30 on the viewer's clock. Everything upstream of this line exists
// so that this one can be a plain `toLocaleTimeString`.
const fmtTime = (slot) =>
  slot.at.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const fmtLongDay = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

// ⚠️ Read, not chosen. A picker here would be a real feature — it is how you
// check a time against a colleague in another office — and this is not it: the
// line states which clock the slots are on so the reading is not ambiguous.
const offset = new Date()
  .toLocaleTimeString(undefined, { timeZoneName: 'shortOffset' })
  .split(' ')
  .pop()

const team = computed(() => teamFor(props.partner.name))

// ⚠️ The PARTNER's zone, beside the partner's people — not the viewer's, which
// is the line above the calendar. These are the two clocks in the booking and
// they are answering different questions: the one over the slots is "can I make
// this time", the one beside the names is "am I asking them to take a call at
// half past ten at night". Five of the thirteen partners are outside India, so
// for a third of this directory those are not the same answer.
//
// Offsets rather than abbreviations because `Intl` only has abbreviations for
// some of them — America/Chicago resolves to CDT, Asia/Kolkata to GMT+5:30 —
// and a column that says CDT on one row and GMT+5:30 on another is comparing
// two things in two units. It also matches the viewer's own line, which is the
// number it is there to be read against.
//
// Resolved against the DAY SHOWN, not against today: book into late October
// from a Munich partner and the honest answer is GMT+1, not GMT+2.
const zoneLabel = (tz, on) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' })
    .formatToParts(on)
    .find((part) => part.type === 'timeZoneName').value

// Suppressed when we are falling back to the viewer's zone: a partner with no
// zone on file would otherwise be labelled with the reader's own offset, which
// is a claim about where they are and not a blank.
const partnerOffset = computed(() =>
  props.partner.zone ? zoneLabel(props.partner.zone, selected.value ?? new Date()) : null,
)

const canConfirm = computed(() => Boolean(chosen.value))

const close = () => {
  emit('close')
  // Reset after the close transition so the panel doesn't visibly empty out.
  setTimeout(() => {
    time.value = null
  }, 200)
}

// Confirming used to call the identical `close()` as Cancel, which made the two
// paths byte-identical: the panel shut either way and nothing told you which
// one had happened. `:disabled` distinguished them BEFORE the click and nothing
// distinguished them after.
//
// ⚠️ Nothing is submitted — real availability and a real request both need the
// partner's calendar. The toast is what a completed request would say, and it's
// the only thing separating confirm from abandon, so it names the slot back:
// a confirmation that repeats your choice is checkable, one that says "Done"
// isn't.
const confirm = () => {
  const when = `${fmtLongDay(chosen.value.at)} at ${fmtTime(chosen.value)}`
  close()
  toast.success('Slot requested', {
    description: `${props.partner.name} will confirm ${when} by email.`,
  })
}
</script>

<template>
  <!-- ⚠️ `size` is 3xl (768px), not 4xl. At 4xl the two columns came out the
       same width — the calendar and its slots took 432px and the details column
       took 420 of pure slack — which read as two equal halves when only one of
       them is the screen's job. Narrowing the panel takes that slack out of the
       details column alone: the calendar and the slot list are fixed widths and
       do not move, so the same pixels now make them the larger share. -->
  <Dialog
    :model-value="open"
    :title="`Request a slot with ${partner.name}`"
    size="3xl"
    @update:model-value="!$event && close()"
  >
    <!-- Default slot, not `#body-content`: this version of frappe-ui's Dialog
         exposes only `default`, `title` and `actions`. `#body-content` is the
         older API and fails silently — the panel renders with its title and
         footer and an empty middle. -->
    <template #default>
      <!-- Full-bleed, so the rule between the two columns runs to the panel's
           edges instead of floating inside the body's padding.

           ⚠️ WHEN first, WHAT second. Picking a time is the only thing this
           modal does; the duration, the description and the people are what you
           check that choice against. The reference leads with its details
           because a Calendly link arrives cold — you may not know what the
           meeting is. Here you arrived from the partner's own profile. -->
      <div class="-mx-4 flex flex-col sm:-mx-6 md:flex-row">
        <!-- ── When ──────────────────────────────────────────────────────── -->
        <div class="shrink-0 px-4 pb-5 sm:px-6 md:pb-0 md:pr-5">
          <div class="flex flex-col gap-5 sm:flex-row">
            <!-- The grid, bounded to the bookable window. Every cell outside it
                 renders and is disabled rather than being hidden, because a
                 month with holes in it stops reading as a month. -->
            <div class="mx-auto shrink-0 select-none sm:mx-0">
              <div class="flex items-center justify-between gap-1 p-2 pb-0">
                <Button
                  variant="ghost"
                  aria-label="Previous month"
                  :class="{ invisible: !canPrev }"
                  @click="page(-1)"
                >
                  <template #icon><IconLeft class="size-4" /></template>
                </Button>
                <span class="text-sm-medium text-ink-gray-7">
                  {{ MONTHS[cursor.month] }} {{ cursor.year }}
                </span>
                <Button
                  variant="ghost"
                  aria-label="Next month"
                  :class="{ invisible: !canNext }"
                  @click="page(1)"
                >
                  <template #icon><IconRight class="size-4" /></template>
                </Button>
              </div>

              <div class="p-2">
                <div role="grid" aria-label="Calendar dates" class="text-base text-ink-gray-9">
                  <div
                    class="mb-1 flex items-center gap-0.5 text-xs-medium uppercase text-ink-gray-4"
                  >
                    <div
                      v-for="(d, di) in WEEKDAYS"
                      :key="di"
                      class="flex size-7 items-center justify-center"
                    >
                      {{ d }}
                    </div>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <div v-for="(week, wi) in weeks" :key="wi" class="flex gap-0.5" role="row">
                      <template v-for="cell in week" :key="cell.key">
                        <!-- ⚠️ Next month's spill is BLANK, not greyed. Those
                             dates are past the window and always will be — the
                             grid never pages forward far enough to reach them —
                             so printing them offered a row of numbers whose only
                             state is "no". The month you are in is the whole of
                             what this calendar has to say.

                             A placeholder, not nothing: the cell has to hold its
                             column or the days before it slide across. Same
                             device as frappe-ui's own `hideOutOfMonth`, which
                             exists for the dual-pane range picker.

                             ⚠️ The month's LEADING days stay. They are the same
                             kind of dead cell, but they sit under the weekday
                             letters that name them, and blanking the front of
                             the first row reads as a month starting late rather
                             than as a month starting on a Tuesday. -->
                        <div v-if="cell.isNext" class="size-7" aria-hidden="true" />
                        <button
                          v-else
                          type="button"
                          role="gridcell"
                          class="flex size-7 items-center justify-center text-sm transition-colors duration-100"
                          :class="cellClass(cell)"
                          :disabled="cell.isUnavailable"
                          :aria-selected="cell.isSelected ? 'true' : 'false'"
                          :aria-label="cell.key + (cell.isToday ? ' (Today)' : '')"
                          @click="pick(cell)"
                        >
                          {{ cell.date.getDate() }}
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- The times for the chosen day. Scrolls rather than stretching
                 the panel: a partner with a longer day should lengthen the
                 list, not the modal. -->
            <div class="flex w-full flex-col sm:w-[188px]">
              <!-- `h-9` and `pt-2` restate the calendar's own header and body
                   padding, so the day label sits on the month label's line and
                   the first slot on the first week's. -->
              <p class="flex h-9 items-center text-sm-medium text-ink-gray-7">
                {{ selected ? fmtLongDay(selected) : 'Pick a day' }}
              </p>
              <!-- ⚠️ Which clock, directly over the times it applies to. It used
                   to sit above BOTH columns, where it was a caption on the
                   calendar as much as on the slots — and the calendar is the one
                   thing on this screen a time zone cannot change. A date is a
                   date; only the hours move.

                   `h-9 pt-2 mb-1` is the calendar's body padding plus its
                   weekday row, restated — border-box, so the padding sits inside
                   the 36px rather than adding to it. This line then occupies the
                   same band as S M T W T F S and the first slot starts level
                   with the first week. Both are the legend for what is under
                   them.

                   "Times shown in" is gone because position now says it.

                   ⚠️ "Your time", not the zone's own name. This printed the raw
                   IANA id — `Asia/Calcutta`, a machine string naming a city that
                   stopped being called that in 2001, chosen by a database rather
                   than by anyone here. What the reader needs is which clock these
                   hours are on, and the answer is theirs. The offset is the part
                   that does work, and it reads against the partner's offsets on
                   the other side of the panel.

                   The zone id survives as the `title`, so anyone who suspects
                   their browser has guessed wrong can still check. -->
              <p class="mb-1 flex h-9 items-center gap-1.5 pt-2 text-p-sm text-ink-gray-5">
                <IconGlobe class="size-3.5 shrink-0" />
                <span class="min-w-0 truncate" :title="viewerZone">
                  Your time ({{ offset }})
                </span>
              </p>
              <!-- Fixed height only once the slots sit BESIDE the calendar, where the
                   two columns have to end on the same line. Stacked, a fixed
                   height holds open a hundred-odd pixels of nothing under a
                   short day, so it shrinks to its content instead. -->
              <ScrollArea class="-mr-2.5" viewport-class="max-h-[186px] pr-2.5 sm:h-[186px]">
                <div class="space-y-1.5">
                  <!-- ⚠️ One row, not a stacked pair. A slot carries two short
                       facts, and stacking them made every button 56px tall in a
                       list of seven — a column of cards for what is really a
                       list of times. Side by side, the time leads and the count
                       sits where a secondary column belongs, and a whole day
                       fits without the list becoming the tallest thing here. -->
                  <button
                    v-for="slot in slots"
                    :key="slot.id"
                    type="button"
                    class="flex w-full items-center gap-2 rounded-4 border px-2.5 py-1.5 transition-colors"
                    :class="[
                      slot.full
                        ? 'cursor-not-allowed border-outline-gray-1 bg-surface-gray-1'
                        : time === slot.id
                          ? 'border-transparent bg-surface-gray-9'
                          : 'border-outline-gray-2 bg-surface-base hover:bg-surface-gray-1',
                    ]"
                    :disabled="slot.full"
                    :aria-pressed="time === slot.id"
                    @click="time = slot.id"
                  >
                    <!-- ⚠️ The column is RESERVED on every row, marked on few.
                         Letting the moon push the time along would break the one
                         alignment this list depends on — a column of times you
                         read by scanning straight down. 14px of empty is the
                         price of that, paid on every row. -->
                    <span
                      v-if="anyOffHours"
                      class="flex size-3.5 shrink-0 items-center justify-center"
                    >
                      <!-- ⚠️ Marked, not disabled. A call at half past midnight
                           is a real slot and somebody eleven hours from their
                           partner may genuinely take it — that is their call to
                           make, and the screen's job is to make sure they are
                           making it knowingly rather than reading 0:30 as an
                           ordinary morning. Dimmed and marked; still clickable.

                           It is also what marks the GAP. Chicago's working day
                           reaches an Indian viewer as 0:30–3:30 and then 20:00,
                           sixteen hours later, rendered six pixels apart. Where
                           the moons stop is where the jump is, so no divider is
                           needed to say it twice. -->
                      <IconMoon
                        v-if="slot.offHours"
                        class="size-3.5"
                        :class="time === slot.id ? 'text-ink-base opacity-70' : 'text-ink-gray-4'"
                      />
                    </span>

                    <!-- ⚠️ 16px against the count's 12px. At 14 and 13 they were
                         the same voice, and the time — the thing being chosen —
                         had no more presence than the footnote beside it. -->
                    <span
                      class="min-w-0 flex-1 text-left text-lg-medium"
                      :class="
                        time === slot.id
                          ? 'text-ink-base'
                          : slot.full
                            ? 'text-ink-gray-4'
                            : slot.offHours
                              ? 'text-ink-gray-6'
                              : 'text-ink-gray-8'
                      "
                    >
                      {{ fmtTime(slot) }}
                    </span>

                    <!-- ⚠️ The count is the reason a slot is a slot and not a
                         yes/no: a discovery session takes a few businesses at
                         once. Full ones stay in the list — a slot that vanishes
                         when it fills reads as one that never existed, and the
                         numbers on the slots around it stop meaning anything.

                         ⚠️ The LAST spot is darker than the rest. Five rows all
                         reading "3 spots left" is texture, not information; a
                         count only says something when it varies, so the one
                         value that changes the decision is the one given weight.
                         Weight and not colour — this modal is monochrome, and a
                         lone amber row would be the loudest thing on a screen
                         whose loudest thing should be the slot you picked. -->
                    <span
                      class="shrink-0 text-p-xs"
                      :class="
                        time === slot.id
                          ? 'text-ink-base opacity-70'
                          : slot.full
                            ? 'text-ink-gray-4'
                            : slot.left === 1
                              ? 'text-ink-gray-7'
                              : 'text-ink-gray-5'
                      "
                    >
                      <template v-if="slot.full">Full</template>
                      <template v-else>
                        {{ slot.left }} {{ slot.left === 1 ? 'spot' : 'spots' }} left
                      </template>
                    </span>
                  </button>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <!-- ── What the meeting is ───────────────────────────────────────── -->
        <aside class="min-w-0 flex-1 px-4 sm:px-6 md:border-l md:border-outline-gray-1 md:pl-5">
          <dl class="space-y-2">
            <div class="flex items-center gap-2">
              <IconClock class="size-4 shrink-0 text-ink-gray-5" />
              <dt class="sr-only">Duration</dt>
              <dd class="text-p-base text-ink-gray-7">30 minutes</dd>
            </div>
            <div class="flex items-center gap-2">
              <IconVideo class="size-4 shrink-0 text-ink-gray-5" />
              <dt class="sr-only">Format</dt>
              <dd class="text-p-base text-ink-gray-7">Video call</dd>
            </div>
          </dl>

          <!-- `as-child` hands the description role to this <p> rather than
               adding a wrapper element.

               ⚠️ NOT about money. "Before any money changes hands" was the
               previous line, borrowed from the confirm screen's step list, and
               it framed the call as a hedge — the safe look before you pay.
               What the call is really for is finding out whether these are
               people you want to spend six months with, which is the question
               the whole directory exists to help answer. Naming the money also
               makes it the unsettled thing, on a screen where nothing is being
               settled at all. -->
          <DialogDescription as-child>
            <p class="mt-4 text-p-sm text-ink-gray-6">
              A conversation to find out whether you want to work together. You explain what you are
              trying to fix, and {{ partner.name }} tells you how they would approach it.
            </p>
          </DialogDescription>

          <!-- ⚠️ Named people, not a headcount. "3 people from the partner
               team" is the same fact and tells you nothing about the call;
               these are the names that reply in Messages, so the person who
               answers your thread is the person you are booking. -->
          <p class="mt-5 text-sm text-ink-gray-7">Who you will meet</p>
          <ul class="mt-2 space-y-2">
            <li v-for="person in team" :key="person" class="flex items-center gap-2">
              <Avatar size="sm" :label="person" />
              <span class="min-w-0 flex-1 truncate text-p-base text-ink-gray-8">{{ person }}</span>
              <!-- Repeated per person rather than stated once for the firm: it
                   is a property of who you are meeting, and a team that later
                   spans two offices is a second value in this column, not a
                   redesign. -->
              <span v-if="partnerOffset" class="shrink-0 text-p-sm text-ink-gray-5">
                {{ partnerOffset }}
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </template>

    <template #actions>
      <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" label="Cancel" @click="close" />
        <!-- ⚠️ One verb, start to finish: the control that opens this modal,
             its title, this button and the toast all say REQUEST. It used to
             open on "Book a slot", act on "Request slot" and report "Slot
             requested" — three names for one act, and the reader has to work out
             that they are the same thing.

             Request and not book, because request is what happens. The partner
             confirms the time by email; nothing here puts it in anyone's
             calendar. "Book" would be the stronger word and the wrong one. -->
        <Button
          variant="solid"
          size="sm"
          label="Request a slot"
          :disabled="!canConfirm"
          @click="confirm"
        />
      </div>
    </template>
  </Dialog>
</template>
