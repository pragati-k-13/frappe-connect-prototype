<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dropdown, ScrollArea, Tooltip, toast } from 'frappe-ui'
import StageDot from './StageDot.vue'
import TierIcon from './TierIcon.vue'
import EmptyState from './EmptyState.vue'
import SendRequirementsDialog from './SendRequirementsDialog.vue'
import NotInterestedDialog from './NotInterestedDialog.vue'
import { List, ListCell, ListHeader, ListHeaderCell, ListHeaderCellSort, ListRow } from 'frappe-ui/list'
import IconMessage from '~icons/lucide/message-square'
import IconMore from '~icons/lucide/ellipsis'
import { PARTNERS, cityOf } from '../data/partners'
import { logoFor } from '../data/logos'
import { quoteStanding } from '../data/messages'
import { MISS_LABEL, briefErrors, fitRank, recommendedPartners } from '../data/custom'
import { SEND_HOLD_MS, useConnectStore } from '../stores/connect'
import { INTEREST_STEP } from '../data/features'

// The replies to a broadcast, and the whole of choosing a partner.
//
// ⚠️ ONE TABLE FROM THE START. Before anything is sent it lists the recommended
// partners, each with its own Send; sending changes a row's status, not the
// table. It used to be a separate list ("N matching partners") with one Share
// button to all of them, which changed shape on sharing and, when nobody
// matched, left the project on an empty state with nothing to do.
//
// ⚠️ THIS IS WHERE BIDS ARE COMPARED, AND MESSAGES IS WHERE THEY ARRIVE. A
// quote lands in the partner's own thread; the numbers are pulled together
// here, against the project they were quoted for.
//
// ⚠️ ONE LIST, NARROWED BY A FILTER. It was two tabs, Interested and Others,
// and the tabs read as two separate lists: most quotes sat behind the second
// one, and Hire existed only on the first, so nothing said you could hire a
// firm you had not marked first. Now every quote is in All quotes and every
// row can be hired.
//
// ⚠️ "SHARE DETAILS", NOT "INTERESTED". The gesture posts the company's name
// and contact details into the partner's thread (`setBidState`). A word for a
// preference hid that; the label now says what it does, and the row says
// "Details shared" once done. The stored state is still `'shortlisted'`.
//
// ⚠️ THREE COLUMNS, NOT FOUR, AND THREE CONTROLS A ROW. Quote and Timeline
// were two columns for one offer, and Share details sat in the row beside
// them — dark text repeated on every row, read before the price. Now the quote
// stacks its weeks under it, Share details lives in More, and a shared firm
// says so under its name. Hire also shares details, so the row's path is
// still one click.
//
// ⚠️ NOT INTERESTED HAS A VIEW OF ITS OWN, with Restore. It used to leave the
// list with only the toast's Undo as a way back — miss the toast and the firm
// was gone from this page for good.
const props = defineProps({
  project: { type: Object, required: true },
})

const emit = defineEmits(['choose'])

const store = useConnectStore()

const partnerOf = (id) => PARTNERS.find((p) => p.id === id) ?? null

// When this firm's first quote landed in its thread.
const arrivedAt = (partnerId) =>
  store.threads.find((t) => t.partnerId === partnerId)?.messages.find((m) => m.kind === 'bid')?.at ?? Infinity

// Whether a quote came before the requirements changed and its partner hasn't
// confirmed or replaced it yet. See docs/edit-requirements.md.
const isStale = (partnerId) => {
  const msgs = store.threads.find((t) => t.partnerId === partnerId)?.messages ?? []
  const i = msgs.findLastIndex((m) => m.kind === 'bid')
  return i >= 0 && quoteStanding(msgs, i) === 'stale'
}

// ⚠️ SORTABLE BY PARTNER, QUOTE AND TIMELINE, the Invoices page's pattern:
// a column starts at its natural order (names A to Z, cheapest and shortest
// first) and a second click flips it. Either way the firm that asked to be
// hired stays first, so the notice above has its row.
//
// ⚠️ WITH NO COLUMN CHOSEN, THE ORDER QUOTES ARRIVED — NOT TIER. People pick
// from the top rows, so a tier-first order handed most broadcasts to the same
// few Gold firms on position alone, and their wins kept them on top. Arrival
// order is neutral, rewards replying promptly, and stays put between visits.
// The tier badge on the row still lets a business choose for tier. A re-quote
// keeps the row where its first quote put it.
//
// ⚠️ FIRMS YOU SHARED DETAILS WITH COME FIRST in that default order — they are
// the ones you are taking forward. A column sort is a request for that order
// and only that, so it doesn't group them.
const sort = ref({ key: null, dir: 'asc' })
const sortBy = (key) => {
  sort.value =
    sort.value.key === key ? { key, dir: sort.value.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
}
const dirOf = (key) => (sort.value.key === key ? sort.value.dir : null)

// ⚠️ THE SAME SORT, NAMED, BESIDE THE FILTER. The headers sort too, but their
// arrows show only on hover — so on a touch screen sorting didn't exist, and
// nothing said why the list was in the order it was in. The button names the
// order ("Arrived first") and the headers and it share one state.
// ⚠️ BEST FIT BY DEFAULT, and the controls are there from the start. The
// table now opens before anything is sent, when "Arrived first" orders
// nothing. Best fit is the recommendation's own order; among quotes that fit
// equally it falls back to arrival, so the neutral order the comment above
// argues for still decides between them.
const SORTS = [
  { key: null, label: 'Best fit' },
  { key: 'arrived', label: 'Arrived first' },
  { key: 'quote', label: 'Lowest quote', desc: 'Highest quote' },
  { key: 'timeline', label: 'Shortest timeline', desc: 'Longest timeline' },
  { key: 'partner', label: 'Partner A–Z', desc: 'Partner Z–A' },
]
const sortLabel = computed(() => {
  const s = SORTS.find((o) => o.key === sort.value.key)
  return sort.value.dir === 'desc' && s.desc ? s.desc : s.label
})
const sortOptions = computed(() =>
  SORTS.map((o) => ({
    label: o.label,
    selected: sort.value.key === o.key,
    onClick: () => (sort.value = { key: o.key, dir: 'asc' }),
  })),
)
const COMPARE = {
  arrived: (a, b) => a.arrivedAt - b.arrivedAt,
  partner: (a, b) => a.partner.name.localeCompare(b.partner.name),
  quote: (a, b) => a.amount - b.amount,
  timeline: (a, b) => a.weeks - b.weeks || a.amount - b.amount,
}
const rank = computed(() => fitRank(answers.value, brief.value))
const byFit = (a, b) => (rank.value.get(a.partnerId) ?? 999) - (rank.value.get(b.partnerId) ?? 999)
// Rows without a quote follow Partner A–Z when it's chosen, and fit otherwise:
// a price or timeline order has nothing to order them by.
const orderUnquoted = (a, b) =>
  sort.value.key === 'partner' ? (sort.value.dir === 'asc' ? 1 : -1) * COMPARE.partner(a, b) : byFit(a, b)
const rows = computed(() => {
  const { key, dir } = sort.value
  const sign = dir === 'asc' ? 1 : -1
  const shared = (r) => (r.state === 'shortlisted' ? 0 : 1)
  const byDefault = (a, b) => shared(a) - shared(b) || byFit(a, b) || a.arrivedAt - b.arrivedAt
  return (props.project.bids ?? [])
    .map((bid) => ({
      ...bid,
      partner: partnerOf(bid.partnerId),
      stale: isStale(bid.partnerId),
      arrivedAt: arrivedAt(bid.partnerId),
    }))
    .filter((r) => r.partner)
    .sort(
      (a, b) =>
        (b.partnerId === props.project.hireRequest) - (a.partnerId === props.project.hireRequest) ||
        (key ? sign * COMPARE[key](a, b) : byDefault(a, b)),
    )
})

// ⚠️ EVERYONE IT WENT TO STAYS IN THE LIST. The firms that haven't quoted
// are rows too — "Waiting", or "Declined" once their thread says so — after
// the quotes, which are what need a decision. Before, a broadcast with no
// quotes yet was an empty state, and the six firms it went to vanished the
// moment Share was pressed.
const declined = (partnerId) => {
  const msgs = store.threads.find((t) => t.partnerId === partnerId)?.messages ?? []
  const i = msgs.findLastIndex((m) => m.kind === 'decline')
  return i >= 0 && !msgs.slice(i).some((m) => m.kind === 'bid')
}
const sending = computed(() => props.project.sending ?? [])
const written = computed(() => [...(props.project.broadcast?.partnerIds ?? []), ...sending.value])
const others = computed(() => {
  const quoted = new Set((props.project.bids ?? []).map((b) => b.partnerId))
  return written.value
    .filter((id) => !quoted.has(id))
    .map((id) => ({
      partnerId: id,
      partner: partnerOf(id),
      status: sending.value.includes(id)
        ? 'sending'
        : (props.project.passed ?? []).includes(id)
          ? 'passed'
          : declined(id)
            ? 'declined'
            : 'waiting',
    }))
    .filter((r) => r.partner)
    .sort((a, b) => (a.status === 'declined') - (b.status === 'declined') || orderUnquoted(a, b))
})

// ── Not sent yet ────────────────────────────────────────────────────────────
// The project's recommended partners nobody has written to, last in the table:
// the firms you're waiting on stay on top. Ranked, never empty — a partner that
// misses one of your answers says which on its row. See `recommendedPartners`.
const brief = computed(() => store.briefOf(props.project.id))
const answers = computed(() => props.project.answers ?? store.company)
const hiddenIds = computed(() => props.project.hidden ?? [])
// Every suggestion, hidden ones included; the views split them. A hidden firm
// makes room for the next-closest one when the exact matches run short.
const suggestions = computed(() => {
  if (props.project.partnerId) return []
  const taken = new Set([...written.value, ...(props.project.bids ?? []).map((b) => b.partnerId)])
  const hidden = new Set(hiddenIds.value)
  const shown = recommendedPartners(answers.value, brief.value, 6 + hidden.size)
  const ids = new Set(shown.map((s) => s.partner.id))
  // A hidden firm that would no longer be suggested still has to be findable.
  const extra = hiddenIds.value.filter((id) => !ids.has(id)).map((id) => ({ partner: partnerOf(id), misses: [] }))
  return [...shown, ...extra]
    .filter(({ partner }) => partner && !taken.has(partner.id))
    .map(({ partner, misses }) => ({
      partnerId: partner.id,
      partner,
      note: misses.map((m) => MISS_LABEL[m]).join(' · '),
      hidden: hidden.has(partner.id),
    }))
    .sort(orderUnquoted)
})
const recommended = computed(() => suggestions.value.filter((r) => !r.hidden))
const hiddenRows = computed(() => suggestions.value.filter((r) => r.hidden))

const unhide = (row) => {
  store.setHidden(props.project.id, row.partnerId, false)
  toast.success(`${row.partner.name} restored`)
}
const hide = (row) => {
  store.setHidden(props.project.id, row.partnerId, true)
  toast(`${row.partner.name} hidden`, {
    id: `hide-${row.partnerId}`,
    action: { label: 'Undo', onClick: () => store.setHidden(props.project.id, row.partnerId, false) },
  })
}
// ⚠️ A MISS EVERY ROW SHARES IS SAID ONCE, above the table, not on six rows.
// Repeated, it stopped telling the rows apart.
// Decided once, when the page opens with nothing sent: computed live, the line
// left on the first Send and pulled the table up under the pointer. The firms
// sent to after that came from the same list, so the sentence stays true.
const sharedNote = (() => {
  if (written.value.length || rows.value.length) return ''
  const notes = new Set(recommended.value.map((r) => r.note))
  const [only] = notes
  return notes.size === 1 && only ? only : ''
})()

// ⚠️ NO CONFIRMATION. The requirements are in the rail and each Send names one
// firm, so a dialog would repeat the page. The send is held for a few seconds
// and the toast's Undo takes it back — see `queueSend`. The dialog opens only
// when the budget or description is missing.
const asking = ref(null)
// Kept after `asking` clears, so the title doesn't empty while the dialog fades.
const askingName = ref('')
const send = (row) => {
  if (Object.keys(briefErrors(brief.value)).length) {
    asking.value = row
    askingName.value = row.partner.name
    return
  }
  queue(row)
}
const queue = (row) => {
  const id = `send-${row.partnerId}`
  // Sonner pauses its timer on hover; the hold doesn't. Closing the toast when
  // the send goes out keeps Undo from outliving what it could undo.
  flip(() => store.queueSend(props.project.id, row.partnerId, () => toast.dismiss(id)), row.partnerId)
  // ⚠️ WHAT WENT IS SAID HERE, not in a line above the table: at the moment
  // it happens, while Undo can still take it back.
  toast(`Sent to ${row.partner.name} with your company details`, {
    id,
    duration: SEND_HOLD_MS,
    action: { label: 'Undo', onClick: () => store.cancelSend(props.project.id, row.partnerId) },
  })
}

// The shared miss as a sentence: what it means for these firms.
const SHARED_NOTE = {
  'Above your budget': 'None of these usually take projects at your budget.',
  'Other industries': 'None of these have worked in your industry.',
  'Outside your region': 'None of these are in your region.',
}

// ⚠️ ONE HEADING AT EVERY STAGE. It was "Recommended partners" until the first
// quote and "Hire a partner" after: neither named the whole table, and the
// page's title changed while you were away. Finding a partner is true from the
// first suggestion to the hire, and the table goes once you hire.
const heading = 'Find a partner'
// Which of these rows each view shows: a firm marked Not interested before it
// quoted sits in that view with the quotes marked the same way.
const OTHERS_IN = {
  all: (r) => r.status !== 'passed',
  quoted: () => false,
  waiting: (r) => r.status === 'waiting' || r.status === 'sending',
  notSent: () => false,
  declined: (r) => r.status === 'declined',
  passed: (r) => r.status === 'passed',
  hidden: () => false,
}

// The lead list's status style: a dot and a word. Waiting is still open, so it
// takes the open-lead blue; a decline takes Lost's red.
const STATUS = {
  sending: { label: 'Sending…', dot: 'bg-surface-gray-5' },
  waiting: { label: 'Awaiting quote', dot: 'bg-surface-blue-7' },
  declined: { label: 'Declined', dot: 'bg-surface-red-6' },
  passed: { label: 'Not interested', dot: 'bg-surface-gray-5' },
}

// ⚠️ TWO WAYS TO SET A FIRM ASIDE. Hide is private and instant, with Undo,
// for "no" or "later". Not interested… tells the firm, so it opens a dialog
// with the words first — see `NotInterestedDialog`. There's no Restore after
// it: the firm has been told, and the way back is a message.
const declining = ref(null)
const decliningName = ref('')
const passOn = (row) => {
  declining.value = row
  decliningName.value = row.partner.name
}
const sendNotInterested = (payload) => {
  const row = declining.value
  if (!row) return
  store.sendNotInterested(props.project.id, row.partnerId, payload)
  toast.success(`Sent to ${row.partner.name}`)
  declining.value = null
}
const moreForOther = (row) =>
  [
    narrow.value && {
      label: 'Message',
      icon: 'lucide-message-square',
      onClick: () => router.push({ name: 'messages', query: { thread: row.partnerId } }),
    },
    !isHidden(row.partnerId) && row.status !== 'sending' && row.status !== 'passed' && {
      label: 'Hide',
      icon: 'lucide-eye-off',
      onClick: () => hide(row),
    },
    row.status === 'waiting' && {
      label: 'Not interested…',
      icon: 'lucide-ban',
      onClick: () => passOn(row),
    },
  ].filter(Boolean)

// ⚠️ VIEWS BY STATUS, the words the Quote column already uses. "Details
// shared" was a view when sharing was a separate step; every Send shares them
// now, so it no longer splits the list.
const VIEWS = {
  all: { label: 'All', match: (r) => r.state !== 'not-interested' },
  quoted: { label: 'Quoted', match: (r) => r.state !== 'not-interested' },
  waiting: { label: 'Awaiting quote', match: () => false },
  notSent: { label: 'Suggested', match: () => false },
  // Their no and yours are different filters: one ends the firm's interest,
  // the other yours.
  declined: { label: 'Declined', match: () => false },
  passed: { label: 'Not interested', match: (r) => r.state === 'not-interested' },
  hidden: { label: 'Hidden', match: () => false },
}
const RECOMMENDED_IN = { all: true, notSent: true }
const view = ref('all')
// Hidden rows leave every view but Hidden, whatever their status. Hidden
// shows them all, quotes and firms you're waiting on as well as suggestions.
const isHidden = (id) => hiddenIds.value.includes(id)
const rowsIn = (key) =>
  key === 'hidden'
    ? rows.value.filter((r) => isHidden(r.partnerId))
    : rows.value.filter((r) => !isHidden(r.partnerId) && VIEWS[key].match(r))
const othersIn = (key) =>
  key === 'hidden'
    ? others.value.filter((r) => isHidden(r.partnerId))
    : others.value.filter((r) => !isHidden(r.partnerId) && OTHERS_IN[key](r))
const count = (key) =>
  rowsIn(key).length +
  othersIn(key).length +
  (RECOMMENDED_IN[key] ? recommended.value.length : 0) +
  (key === 'hidden' ? hiddenRows.value.length : 0)
const visible = computed(() => rowsIn(view.value))
const visibleOthers = computed(() => othersIn(view.value))
// The rows after the quotes, in three runs — see the template.
const tail = computed(() => [
  { key: 'open', rows: visibleOthers.value.filter((r) => r.status !== 'declined') },
  { key: 'suggested', rows: visibleRecommended.value },
  { key: 'declined', rows: visibleOthers.value.filter((r) => r.status === 'declined') },
])
const visibleRecommended = computed(() =>
  RECOMMENDED_IN[view.value] ? recommended.value : view.value === 'hidden' ? hiddenRows.value : [],
)

// "Details shared" under a name only when it tells rows apart: a broadcast
// sends the requirements alone, so some quotes there have the company and
// some don't. Sent from the table, every row has it.
const shareVaries = computed(() => INTEREST_STEP && rows.value.some((r) => r.state === 'pending'))

// ⚠️ EVERY VIEW, ALWAYS, WITH ITS COUNT. Leaving out the empty ones made the
// menu change shape as rows moved — hiding a partner added "Hidden" — and a
// menu that rearranges itself reads as broken. A 0 says the same thing and
// stays put; picking it shows the view's empty state.
const viewOptions = computed(() =>
  Object.entries(VIEWS).map(([key, v]) => ({
    label: v.label,
    count: count(key),
    selected: view.value === key,
    onClick: () => (view.value = key),
  })),
)

// How many firms were written to — the empty state's one line.
const sent = computed(() => props.project.broadcast?.partnerIds?.length ?? 0)

// ── Motion when a row moves ─────────────────────────────────────────────────
// ⚠️ ONLY SHARING ANIMATES. It's the one change that moves a row on its own —
// the firm jumps to the top — and without motion it vanished from under the
// pointer. Sorting and filtering stay instant: they're asked for, repeated,
// and the whole list changes, so motion there would only slow them down.
// The rows slide to their new places (FLIP, transform only, on the Web
// Animations API) and the moved row's background settles from gray, so the eye
// lands on where it went. Reduced motion drops the slide and keeps the settle.
const listEl = ref(null)
const settled = ref(null)
let settleTimer
const rowEls = () => [...(listEl.value?.querySelectorAll('[data-partner]') ?? [])]
// ⚠️ MEASURE, CHANGE, THEN WAIT — in that order. `nextTick` called before the
// change resolves before Vue's update, so the "after" positions came back
// unchanged and nothing moved.
const flip = async (change, lead) => {
  const before = new Map(rowEls().map((el) => [el.dataset.partner, el.getBoundingClientRect().top]))
  change()
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()
  for (const el of rowEls()) {
    const dy = (before.get(el.dataset.partner) ?? el.getBoundingClientRect().top) - el.getBoundingClientRect().top
    if (!dy) continue
    // On-screen movement: a strong ease-in-out, under 300ms.
    const anim = el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
      duration: 250,
      easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
    })
    // The row that moved passes over the others, on its settle background,
    // rather than under their text.
    if (el.dataset.partner === lead) {
      el.style.zIndex = '1'
      anim.onfinish = anim.oncancel = () => (el.style.zIndex = '')
    }
  }
}
const shareDetails = (row) => {
  settled.value = row.partnerId
  clearTimeout(settleTimer)
  settleTimer = setTimeout(() => (settled.value = null), 1200)
  flip(() => store.setBidState(props.project.id, row.partnerId, 'shortlisted'), row.partnerId)
  toast.success(`Details shared with ${row.partner.name}`)
}


// Message is on every row, so More holds Share details (until it's done) and
// Not interested — and nothing on a row that is already not interested, where
// More is left out.
const router = useRouter()
const moreFor = (row) => [
  narrow.value && {
    label: 'Message',
    icon: 'lucide-message-square',
    onClick: () => router.push({ name: 'messages', query: { thread: row.partnerId } }),
  },
  INTEREST_STEP && row.state === 'pending' && {
    label: 'Share details',
    icon: 'lucide-send',
    onClick: () => shareDetails(row),
  },
  // A firm told "not interested" has its own filter; hiding it too would
  // offer a Restore that undoes nothing the firm was told.
  !isHidden(row.partnerId) && row.state !== 'not-interested' && {
    label: 'Hide',
    icon: 'lucide-eye-off',
    onClick: () => hide(row),
  },
  row.state !== 'not-interested' && {
    label: 'Not interested…',
    icon: 'lucide-ban',
    onClick: () => passOn(row),
  },
].filter(Boolean)

// ⚠️ ON A PHONE, TWO COLUMNS. Three didn't fit 287px, so the list scrolled
// sideways and the price and Hire sat off-screen with nothing saying so. Below
// `sm` the quote moves under the city, and Message joins More.
const query = matchMedia('(max-width: 639px)')
const narrow = ref(query.matches)
const onWidth = (e) => (narrow.value = e.matches)
query.addEventListener('change', onWidth)
onBeforeUnmount(() => query.removeEventListener('change', onWidth))

const EMPTY = {
  all: { icon: 'lucide-inbox', title: 'No partners yet' },
  quoted: { icon: 'lucide-inbox', title: 'No quotes yet' },
  waiting: { icon: 'lucide-clock', title: 'No quotes pending' },
  notSent: { icon: 'lucide-send', title: 'Sent to every recommended partner' },
  declined: { icon: 'lucide-ban', title: 'No one declined' },
  passed: { icon: 'lucide-ban', title: 'No one marked not interested' },
  hidden: { icon: 'lucide-eye-off', title: 'No hidden partners' },
}
</script>

<template>
  <section>
    <!-- Nothing back yet. A real state: a broadcast sent an hour ago has no
         replies, and the page says so rather than draw an empty table. -->
    <EmptyState
      v-if="!rows.length && !others.length && !recommended.length"
      icon="lucide-inbox"
      title="No quotes yet"
      :description="`Sent to ${sent} partners`"
    />

    <template v-else>
      <!-- The column's anchor and the filter beside the list it narrows. No
           "N of M replied": the filter menu counts the quotes, and how many
           stayed silent doesn't help choose among those that answered. -->
      <!-- Wraps on a phone: the controls drop under the title rather than
           pushing the filter off the edge.
           Sticky, so sort and filter stay in reach down a long list. Its own
           12px above and below (pulled back by -my-3) give the quotes room to
           pass under it; the page's fill hides them as they do. -->
      <div class="sticky top-0 z-10 -my-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-surface-base py-3">
        <h2 class="whitespace-nowrap text-xl font-semibold text-ink-gray-8">{{ heading }}</h2>
        <div class="flex shrink-0 items-center gap-2">
        <!-- Both controls from the start: arriving mid-task, they rebuilt the
             bar under the pointer. -->
        <Dropdown :options="sortOptions" align="end">
          <Button :label="sortLabel" icon-left="lucide-arrow-up-down" icon-right="lucide-chevron-down" />
        </Dropdown>
        <Dropdown :options="viewOptions" align="end">
          <Button :label="VIEWS[view].label" icon-right="lucide-chevron-down" />
          <template #item-suffix="{ item }">
            <span class="text-base tabular-nums text-ink-gray-5">{{ item.count }}</span>
          </template>
        </Dropdown>
        </div>
      </div>

      <!-- Gone once a quote lands ("none of these" would include it) and on
           views that aren't suggestions. Neither is a click on a row, so the
           table never moves under the pointer. -->
      <p
        v-if="sharedNote && !rows.length && (view === 'all' || view === 'notSent') && visibleRecommended.length"
        class="mt-4 text-p-base text-ink-gray-6"
      >
        {{ SHARED_NOTE[sharedNote] ?? `${sharedNote}.` }}
      </p>

      <div ref="listEl" class="mt-4">
        <EmptyState v-if="!visible.length && !visibleOthers.length && !visibleRecommended.length" :icon="EMPTY[view].icon" :title="EMPTY[view].title" />

        <!-- frappe-ui's List in column mode. Static rows: each carries a
             profile link and buttons of its own, so the row is not a target. -->
        <ScrollArea v-else orientation="horizontal">
          <List
            :columns="narrow ? ['minmax(0,1fr)', 'auto'] : ['minmax(0,5fr)', 'minmax(9rem,2fr)', '8rem']"
            :row-height="narrow ? 84 : 72"
          >
            <ListHeader>
              <ListHeaderCellSort :direction="dirOf('partner')" @click="sortBy('partner')">Partner</ListHeaderCellSort>
              <!-- ⚠️ ALWAYS "QUOTE". A row without one says why in the same
                   cell — Suggested, Awaiting quote, Declined — so the column
                   means one thing at every stage. -->
              <ListHeaderCellSort v-if="!narrow" :direction="dirOf('quote')" @click="sortBy('quote')">
                Quote
              </ListHeaderCellSort>
              <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
            </ListHeader>
            <ListRow
              v-for="row in visible"
              :key="row.partnerId"
              :data-partner="row.partnerId"
              class="!items-start pt-4"
              :class="settled === row.partnerId ? 'fc-row-settle' : ''"
            >
              <!-- ⚠️ TOP-ALIGNED: the name, the price and Hire share a first
                   line, so a row reads across. Buttons are 28px on a 20px
                   line, so they sit 4px up to centre on it. -->
              <!-- The firm's logo at the directory's size (`2xl`, 40px), so a
                   quote is recognised before its name is read. -->
              <ListCell class="!items-start gap-3">
                <Avatar
                  :image="logoFor(row.partnerId)"
                  :label="row.partner.name"
                  size="2xl"
                  shape="square"
                  class="fc-logo-avatar shrink-0"
                />
                <div class="min-w-0">
                  <span class="flex items-center gap-2">
                    <RouterLink
                      :to="{ name: 'partner', params: { id: row.partnerId } }"
                      class="truncate text-base text-ink-gray-8 hover:underline"
                    >
                      {{ row.partner.name }}
                    </RouterLink>
                    <TierIcon :tier="row.partner.tier" />
                    <Badge v-if="project.hireRequest === row.partnerId" theme="blue" label="Requested" />
                  </span>
                  <span class="mt-1 flex min-w-0 items-center gap-2 text-sm text-ink-gray-6">
                    <span class="truncate">
                      {{ cityOf(row.partner) }}<template v-if="shareVaries && row.state === 'shortlisted'">
                        ·
                        <!-- What "details" means, in the hire dialog's words. The
                             visible text is enough on its own; this adds which. -->
                        <Tooltip text="They have your company name and contact details">
                          <span aria-label="Details shared: they have your company name and contact details">Details shared</span>
                        </Tooltip>
                      </template>
                    </span>
                    <Badge v-if="row.stale" class="shrink-0" theme="gray" label="Quoted before the update" />
                  </span>
                  <span v-if="narrow" class="mt-1 block text-sm tabular-nums text-ink-gray-8">
                    {{ row.price }} · {{ row.weeks }} weeks
                  </span>
                </div>
              </ListCell>
              <!-- The offer: price over weeks, the partner cell's two lines.
                   ⚠️ LEFT-ALIGNED IN A SHARE OF THE WIDTH, not right-aligned in
                   a fixed 9rem: pushed against the actions, the quotes left the
                   middle of the table empty. Prices are tabular, so they still
                   line up digit for digit at this length. -->
              <ListCell v-if="!narrow" class="!items-start">
                <div>
                  <span class="block text-base tabular-nums text-ink-gray-8">{{ row.price }}</span>
                  <span class="mt-1 block text-sm tabular-nums text-ink-gray-6">{{ row.weeks }} weeks</span>
                </div>
              </ListCell>
              <!-- Message, Hire, then More — More always last. -->
              <ListCell class="-mt-1 !items-start justify-end gap-1.5">
                <!-- Message, on every quote: a question while comparing
                     shouldn't sit behind More, whoever it's for. -->
                <Button
                  v-if="!narrow"
                  variant="ghost"
                  :aria-label="`Message ${row.partner.name}`"
                  tooltip="Message"
                  :route="{ name: 'messages', query: { thread: row.partnerId } }"
                >
                  <template #icon><IconMessage class="size-4" /></template>
                </Button>
                <!-- Hidden: the way back, where Hire would be. Not interested
                     has none — the firm was told. -->
                <Button v-if="isHidden(row.partnerId)" label="Restore" @click="unhide(row)" />
                <Button v-else-if="row.state !== 'not-interested'" label="Hire" @click="emit('choose', row.partner)" />
                <Dropdown v-if="moreFor(row).length" :options="moreFor(row)" align="end">
                  <Button variant="ghost" :aria-label="`More for ${row.partner.name}`">
                    <template #icon><IconMore class="size-4" /></template>
                  </Button>
                </Dropdown>
              </ListCell>
            </ListRow>
            <!-- ⚠️ IN ORDER OF WHAT EACH ASKS OF YOU: quotes (above), then firms
                 you're waiting on, then suggestions you could send to, then
                 declines — closed, kept as a record. A decline used to sit
                 second, above rows you could still act on. -->
            <template v-for="part in tail" :key="part.key">
            <!-- Not quoted yet: the same partner cell, and the status where the
                 quote goes, in the lead list's dot-and-word style. The actions
                 follow a quoted row's order — Message, Restore where Hire would be,
                 More — with no empty slot where there's nothing to hire, so on
                 these rows Message sits one button further right. -->
            <ListRow
              v-for="row in part.key === 'suggested' ? [] : part.rows"
              :key="row.partnerId"
              :data-partner="row.partnerId"
              class="!items-start pt-4"
            >
              <ListCell class="!items-start gap-3">
                <Avatar
                  :image="logoFor(row.partnerId)"
                  :label="row.partner.name"
                  size="2xl"
                  shape="square"
                  class="fc-logo-avatar shrink-0"
                />
                <div class="min-w-0">
                  <span class="flex items-center gap-2">
                    <RouterLink
                      :to="{ name: 'partner', params: { id: row.partnerId } }"
                      class="truncate text-base text-ink-gray-8 hover:underline"
                    >
                      {{ row.partner.name }}
                    </RouterLink>
                    <TierIcon :tier="row.partner.tier" />
                  </span>
                  <span class="mt-1 flex min-w-0 items-center gap-1 text-sm text-ink-gray-6">
                    <span class="truncate">{{ cityOf(row.partner) }}</span>
                    <template v-if="narrow">
                      <span aria-hidden="true">·</span>
                      <StageDot :color="STATUS[row.status].dot" />
                      <span class="truncate">{{ STATUS[row.status].label }}</span>
                    </template>
                  </span>
                </div>
              </ListCell>
              <ListCell v-if="!narrow" class="!items-start gap-2">
                <StageDot class="mt-0.5" :color="STATUS[row.status].dot" />
                <span class="text-base text-ink-gray-7">{{ STATUS[row.status].label }}</span>
              </ListCell>
              <ListCell class="-mt-1 !items-start justify-end gap-1.5">
                <Button
                  v-if="!narrow"
                  variant="ghost"
                  :aria-label="`Message ${row.partner.name}`"
                  tooltip="Message"
                  :route="{ name: 'messages', query: { thread: row.partnerId } }"
                >
                  <template #icon><IconMessage class="size-4" /></template>
                </Button>
                <Button v-if="isHidden(row.partnerId)" label="Restore" @click="unhide(row)" />
                <Dropdown v-if="moreForOther(row).length" :options="moreForOther(row)" align="end">
                  <Button variant="ghost" :aria-label="`More for ${row.partner.name}`">
                    <template #icon><IconMore class="size-4" /></template>
                  </Button>
                </Dropdown>
              </ListCell>
            </ListRow>
            <!-- Not sent yet: the partner cell with what it misses, if
                 anything, and Send where Hire goes once they quote. Hidden
                 suggestions render the same, with Restore. -->
            <ListRow
              v-for="row in part.key === 'suggested' ? part.rows : []"
              :key="row.partnerId"
              :data-partner="row.partnerId"
              class="!items-start pt-4"
            >
              <ListCell class="!items-start gap-3">
                <Avatar
                  :image="logoFor(row.partnerId)"
                  :label="row.partner.name"
                  size="2xl"
                  shape="square"
                  class="fc-logo-avatar shrink-0"
                />
                <div class="min-w-0">
                  <span class="flex items-center gap-2">
                    <RouterLink
                      :to="{ name: 'partner', params: { id: row.partnerId } }"
                      class="truncate text-base text-ink-gray-8 hover:underline"
                    >
                      {{ row.partner.name }}
                    </RouterLink>
                    <TierIcon :tier="row.partner.tier" />
                  </span>
                  <span class="mt-1 flex min-w-0 items-center gap-1 text-sm text-ink-gray-6">
                    <span class="truncate">{{ cityOf(row.partner) }}<template v-if="row.note && !sharedNote"> · {{ row.note }}</template></span>
                    <template v-if="narrow">
                      <span aria-hidden="true">·</span>
                      <span class="truncate">{{ row.hidden ? 'Hidden' : 'Suggested' }}</span>
                    </template>
                  </span>
                </div>
              </ListCell>
              <!-- ⚠️ "SUGGESTED", NOT "NOT SENT", AND A HOLLOW RING. "Not sent"
                   named an action that hadn't happened, so every suggestion
                   read as a task left undone; sending is optional. A filled
                   dot marks a step in the process; the ring, in the same 8px
                   and 16px box as `StageDot`, reads as not started — the same
                   family, lighter than the statuses that need you. -->
              <ListCell v-if="!narrow" class="!items-start gap-2">
                <span class="mt-0.5 grid size-4 shrink-0 place-items-center" aria-hidden="true">
                  <span class="size-2 rounded-full border border-outline-gray-4" />
                </span>
                <span class="text-base text-ink-gray-6">{{ row.hidden ? 'Hidden' : 'Suggested' }}</span>
              </ListCell>
              <!-- Send, then More — the order a quoted row uses for Hire. The
                   message icon says where Send lands: a conversation. -->
              <ListCell class="-mt-1 !items-start justify-end gap-1.5">
                <Button v-if="row.hidden" label="Restore" @click="unhide(row)" />
                <template v-else>
                  <Button label="Send" icon-left="lucide-message-square" @click="send(row)" />
                  <Dropdown
                    :options="[{ label: 'Hide', icon: 'lucide-eye-off', onClick: () => hide(row) }]"
                    align="end"
                  >
                    <Button variant="ghost" :aria-label="`More for ${row.partner.name}`">
                      <template #icon><IconMore class="size-4" /></template>
                    </Button>
                  </Dropdown>
                </template>
              </ListCell>
            </ListRow>
            </template>
          </List>
        </ScrollArea>
      </div>
    </template>

    <NotInterestedDialog
      :open="Boolean(declining)"
      :partner-name="decliningName"
      @update:open="!$event && (declining = null)"
      @send="sendNotInterested"
    />
    <SendRequirementsDialog
      :open="Boolean(asking)"
      :brief="brief"
      :country="answers.country ?? ''"
      :partner-name="askingName"
      @update:open="!$event && (asking = null)"
      @update-brief="store.updateDraftBrief(project.id, $event)"
      @send="queue(asking); asking = null"
    />
  </section>
</template>
