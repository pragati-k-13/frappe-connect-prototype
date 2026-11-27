<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, Dropdown, TabList, TabTrigger, Tabs, Tooltip, toast } from 'frappe-ui'
import StageDot from './StageDot.vue'
import PartnerCard from './PartnerCard.vue'
import EmptyState from './EmptyState.vue'
import SendRequirementsDialog from './SendRequirementsDialog.vue'
import NotInterestedDialog from './NotInterestedDialog.vue'
import { PARTNERS } from '../data/partners'
import { quoteStanding } from '../data/messages'
import { MISS_LABEL, briefErrors, fitRank, recommendedPartners } from '../data/custom'
import { SEND_HOLD_MS, useConnectStore } from '../stores/connect'
import { INTEREST_STEP } from '../data/features'

// The replies to a broadcast, and the whole of choosing a partner.
//
// ⚠️ ONE LIST FROM THE START. Before anything is sent it lists the recommended
// partners, each with its own Send; sending changes a card's status, not the
// list. It used to be a separate list ("N matching partners") with one Share
// button to all of them, which changed shape on sharing and, when nobody
// matched, left the project on an empty state with nothing to do.
//
// ⚠️ THIS IS WHERE BIDS ARE COMPARED, AND MESSAGES IS WHERE THEY ARRIVE. A
// quote lands in the partner's own thread; the numbers are pulled together
// here, against the project they were quoted for.
//
// ⚠️ TABS BY STATUS, NOT BY PREFERENCE. An earlier version had two tabs,
// Interested and Others, which split the quotes themselves: most sat behind
// the second, and Hire existed only on the first. Now every quote is in one
// tab, Quotes, and every quote can be hired; the other tabs hold firms you
// can't decide on yet (waiting, declined, suggested) or have set aside.
//
// ⚠️ "SHARE DETAILS", NOT "INTERESTED". The gesture posts the company's name
// and contact details into the partner's thread (`setBidState`). A word for a
// preference hid that; the label now says what it does, and the row says
// "Details shared" once done. The stored state is still `'shortlisted'`.
//
// ⚠️ CARDS, NOT A TABLE — see `PartnerCard`. Each quote is the partner, its
// note, the price right-aligned with when it was quoted, and Hire, Message and
// Not interested stacked behind a rule. Hide and Share details left the quote
// cards with the More menu; Not interested is the way to set a quote aside.
//
// ⚠️ NOT INTERESTED HAS A VIEW OF ITS OWN, so a firm you passed on is still
// findable. There's no Restore there: the firm was told, and the way back is a
// message.
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

// ⚠️ SORTED FROM ONE MENU: partner, quote, timeline or arrival. Either way the
// firm that asked to be hired stays first, so the notice above has its card.
//
// ⚠️ WITH NO SORT CHOSEN, THE ORDER QUOTES ARRIVED — NOT TIER. People pick
// from the top rows, so a tier-first order handed most broadcasts to the same
// few Gold firms on position alone, and their wins kept them on top. Arrival
// order is neutral, rewards replying promptly, and stays put between visits.
// The tier badge on the card still lets a business choose for tier. A re-quote
// keeps the card where its first quote put it.
//
// ⚠️ FIRMS YOU SHARED DETAILS WITH COME FIRST in that default order — they are
// the ones you are taking forward. A chosen sort is a request for that order
// and only that, so it doesn't group them.
const sort = ref({ key: null, dir: 'asc' })

// ⚠️ BEST FIT BY DEFAULT, and the controls are there from the start. The
// list now opens before anything is sent, when "Arrived first" orders
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

// Which of these rows each view shows: a firm marked Not interested before it
// quoted sits in that view with the quotes marked the same way.
const OTHERS_IN = {
  quoted: () => false,
  waiting: (r) => r.status === 'waiting' || r.status === 'sending',
  notSent: () => false,
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

// ⚠️ VIEWS BY STATUS, the words the Quote column already uses. "Details
// shared" was a view when sharing was a separate step; every Send shares them
// now, so it no longer splits the list.
const VIEWS = {
  quoted: { match: (r) => r.state !== 'not-interested' },
  waiting: { match: () => false },
  notSent: { match: () => false },
}
const RECOMMENDED_IN = { notSent: true }
const view = ref('quoted')
// Hidden rows leave every view but Hidden, whatever their status. Hidden
// shows them all, quotes and firms you're waiting on as well as suggestions.
const isHidden = (id) => hiddenIds.value.includes(id)
// ⚠️ CLOSED IS THREE NOES IN ONE TAB: the firm declined, you said not
// interested, or you hid it. Each card still says which. Three tabs for them
// pushed the bar past the column as soon as a suggestion appeared.
const isClosedQuote = (r) => isHidden(r.partnerId) || r.state === 'not-interested'
const isClosedOther = (r) => isHidden(r.partnerId) || r.status === 'declined' || r.status === 'passed'
const rowsIn = (key) =>
  key === 'closed'
    ? rows.value.filter(isClosedQuote)
    : rows.value.filter((r) => !isHidden(r.partnerId) && VIEWS[key].match(r))
const othersIn = (key) =>
  key === 'closed'
    ? others.value.filter(isClosedOther)
    : others.value.filter((r) => !isHidden(r.partnerId) && OTHERS_IN[key](r))
const count = (key) =>
  rowsIn(key).length +
  othersIn(key).length +
  (RECOMMENDED_IN[key] ? recommended.value.length : 0) +
  (key === 'closed' ? hiddenRows.value.length : 0)
const visible = computed(() => rowsIn(view.value))
const visibleOthers = computed(() => othersIn(view.value))
// The rows after the quotes, in three runs — see the template.
const tail = computed(() => [
  { key: 'open', rows: visibleOthers.value.filter((r) => r.status !== 'declined') },
  { key: 'suggested', rows: visibleRecommended.value },
  { key: 'declined', rows: visibleOthers.value.filter((r) => r.status === 'declined') },
])
const visibleRecommended = computed(() =>
  RECOMMENDED_IN[view.value]
    ? recommended.value
    : view.value === 'closed'
      ? hiddenRows.value
      : [],
)

// "Details shared" under a name only when it tells rows apart: a broadcast
// sends the requirements alone, so some quotes there have the company and
// some don't. Sent from the table, every row has it.
const shareVaries = computed(() => INTEREST_STEP && rows.value.some((r) => r.state === 'pending'))

// The tabs, in order. Quotes and Waiting always; the rest when they hold
// someone, so the bar doesn't carry empty tabs.
const TAB_LABEL = {
  quoted: 'Quotes',
  waiting: 'Waiting',
  notSent: 'Suggested',
  closed: 'Closed',
}
const ALWAYS = ['quoted', 'waiting']
// Each tab's dot: the colour its cards' status already uses, so tab and card
// say the same thing. Suggested takes the hollow ring (not started); Closed
// the gray of a no.
const TAB_DOT = {
  quoted: 'bg-surface-green-7',
  waiting: STATUS.waiting.dot,
  closed: STATUS.passed.dot,
}
const tabs = computed(() =>
  Object.keys(TAB_LABEL)
    .filter((k) => ALWAYS.includes(k) || count(k) > 0)
    .map((k) => ({ key: k, label: TAB_LABEL[k], count: count(k) })),
)
// ⚠️ OPEN ON THE FIRST VIEW WITH SOMEONE IN IT — Quotes once a quote lands,
// Waiting right after sending, Suggested before anything is sent — never on
// an empty Quotes tab. If the open tab empties and goes (the last hidden firm
// restored), fall back the same way.
const firstFull = () => ['quoted', 'waiting', 'notSent'].find((k) => count(k) > 0) ?? 'quoted'
// ⚠️ THE OPEN TAB IS IN THE URL (`?tab=waiting`), so going to Messages and
// back lands on the tab you left, not on Quotes.
const route = useRoute()
const router = useRouter()
// Links from before Closed existed name its three parts; they open Closed.
const OLD_TAB = { declined: 'closed', passed: 'closed', hidden: 'closed' }
const fromUrl = OLD_TAB[route.query.tab] ?? route.query.tab
view.value = fromUrl && tabs.value.some((t) => t.key === fromUrl) ? fromUrl : firstFull()
if (route.query.tab && route.query.tab !== view.value) router.replace({ query: { ...route.query, tab: view.value } })
watch(view, (tab) => {
  if (route.query.tab !== tab) router.replace({ query: { ...route.query, tab } })
})
watch(tabs, (t) => {
  if (!t.some((x) => x.key === view.value)) view.value = firstFull()
})

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




// Which layout the cards take — the Demo menu's "Quote layout".
const layout = computed(() => store.quoteLayout)

// Each card's actions as data — see `PartnerCard`.
const messageAction = (row) => ({
  kind: 'secondary',
  label: 'Message',
  icon: 'lucide-message-square',
  route: { name: 'messages', query: { thread: row.partnerId } },
})
const quoteActions = (row) =>
  [
    isHidden(row.partnerId)
      ? { kind: 'primary', label: 'Restore', onClick: () => unhide(row) }
      : row.state !== 'not-interested' && { kind: 'primary', label: 'Hire', hire: true, onClick: () => emit('choose', row.partner) },
    messageAction(row),
    !isHidden(row.partnerId) &&
      row.state !== 'not-interested' && { kind: 'dismiss', label: 'Not interested', icon: 'lucide-thumbs-down', onClick: () => passOn(row) },
  ].filter(Boolean)
const otherActions = (row) =>
  [
    isHidden(row.partnerId) && { kind: 'primary', label: 'Restore', onClick: () => unhide(row) },
    messageAction(row),
    row.status === 'waiting' &&
      !isHidden(row.partnerId) && { kind: 'dismiss', label: 'Not interested', icon: 'lucide-thumbs-down', onClick: () => passOn(row) },
  ].filter(Boolean)
const suggestedActions = (row) =>
  row.hidden
    ? [{ kind: 'primary', label: 'Restore', onClick: () => unhide(row) }]
    : [
        { kind: 'primary', label: 'Send', onClick: () => send(row) },
        { kind: 'dismiss', label: 'Hide', icon: 'lucide-eye-off', onClick: () => hide(row) },
      ]

// Only Quotes and Waiting can be empty: the other tabs go when they empty.
const EMPTY = {
  quoted: { icon: 'lucide-inbox', title: 'No quotes yet' },
  waiting: { icon: 'lucide-clock', title: 'No quotes pending' },
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
      <!-- ⚠️ STATUS TABS, frappe-ui's ghost Tabs (no track; the active one a soft
           gray pill — the installed "subtle" is the segmented toggle),
           each with its status dot and a count badge, with no heading over them: the tabs say what the list is.
           Quotes and Waiting always show; the rest only when they hold
           someone. Sticky, so they stay in reach down a long list.
           ⚠️ SORT SITS AT THE END OF THE TAB ROW, as a ghost button, and only
           on Quotes — the one view a price or timeline order means anything
           in. On its own row under the tabs it read as left behind. -->
      <div class="sticky top-0 z-10 -mt-3 bg-surface-base pt-3">
        <Tabs v-model="view">
          <div class="flex items-center gap-2">
            <TabList variant="ghost" size="md" class="my-1">
              <TabTrigger v-for="t in tabs" :key="t.key" :value="t.key" :label="t.label">
                <!-- The dot each status's cards use, in CRM's 16px box. -->
                <template #prefix>
                  <StageDot v-if="TAB_DOT[t.key]" :color="TAB_DOT[t.key]" />
                  <span v-else class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
                    <span class="size-2 rounded-full border border-outline-gray-4" />
                  </span>
                </template>
                <!-- White on the active pill, which is the badge's own gray. -->
                <template #suffix="{ active }">
                  <Badge size="sm" theme="gray" class="tabular-nums" :class="active ? '!bg-surface-base' : ''" :label="String(t.count)" />
                </template>
              </TabTrigger>
            </TabList>
            <span class="flex-1" />
            <Dropdown v-if="view === 'quoted' && visible.length > 1" :options="sortOptions" align="end">
              <Button variant="ghost" :label="sortLabel" icon-left="lucide-arrow-up-down" icon-right="lucide-chevron-down" />
            </Dropdown>
          </div>
        </Tabs>
      </div>

      <!-- Gone once a quote lands ("none of these" would include it) and on
           views that aren't suggestions. Neither is a click on a row, so the
           table never moves under the pointer. -->
      <p
        v-if="sharedNote && !rows.length && view === 'notSent' && visibleRecommended.length"
        class="mt-4 text-p-base text-ink-gray-6"
      >
        {{ SHARED_NOTE[sharedNote] ?? `${sharedNote}.` }}
      </p>

      <div ref="listEl" class="mt-4">
        <EmptyState v-if="!visible.length && !visibleOthers.length && !visibleRecommended.length" :icon="(EMPTY[view] ?? EMPTY.quoted).icon" :title="(EMPTY[view] ?? EMPTY.quoted).title" />

        <!-- Two layouts while we choose, from the Demo menu — see
             `PartnerCard`. Rows are divided, never ruled above the first;
             cards sit 16px apart. Quotes first, then the firms you're waiting
             on, suggestions, and declines last. -->
        <div v-else class="space-y-4">
          <PartnerCard
            v-for="row in visible"
            :key="row.partnerId"
            :data-partner="row.partnerId"
            :partner="row.partner"
            :layout="layout"
            :weeks="row.weeks"
            :note="row.note"
            :actions="quoteActions(row)"
          >
            <template #badges>
              <Badge v-if="project.hireRequest === row.partnerId" theme="blue" label="Requested" />
              <!-- In Closed, which no it was. -->
              <Badge v-else-if="isHidden(row.partnerId)" theme="gray" label="Hidden" />
              <Badge v-else-if="row.state === 'not-interested'" theme="gray" label="Not interested" />
            </template>
            <template #aside>
              <!-- ⚠️ A QUOTE FROM BEFORE THE REQUIREMENTS CHANGED gets a history
                   icon before its price, named by the tooltip — once per
                   quote, not a badge on every row. -->
              <span class="inline-flex items-center gap-1.5">
                <Tooltip v-if="row.stale" text="Quoted before your requirements changed">
                  <span tabindex="0" class="lucide-history size-4 shrink-0 rounded-3 text-ink-gray-5 focus-visible:focus-ring" aria-label="Quoted before your requirements changed" />
                </Tooltip>
                <span class="text-lg font-semibold tabular-nums text-ink-gray-7">{{ row.price }}</span>
              </span>
            </template>
          </PartnerCard>

          <template v-for="part in tail" :key="part.key">
            <!-- Not quoted yet: the status where the quote goes. -->
            <PartnerCard
              v-for="row in part.key === 'suggested' ? [] : part.rows"
              :key="row.partnerId"
              :data-partner="row.partnerId"
              :partner="row.partner"
              :layout="layout"
              :actions="otherActions(row)"
            >
              <template v-if="isHidden(row.partnerId)" #badges>
                <Badge theme="gray" label="Hidden" />
              </template>
              <template #aside>
                <span class="inline-flex items-center gap-2 text-base text-ink-gray-7">
                  <StageDot :color="STATUS[row.status].dot" />
                  {{ STATUS[row.status].label }}
                </span>
              </template>
            </PartnerCard>
            <!-- Not sent yet: what it misses, if anything, and Send where Hire
                 goes once they quote. -->
            <PartnerCard
              v-for="row in part.key === 'suggested' ? part.rows : []"
              :key="row.partnerId"
              :data-partner="row.partnerId"
              :partner="row.partner"
              :layout="layout"
              :actions="suggestedActions(row)"
            >
              <template v-if="row.note && !sharedNote" #meta>
                <span class="inline-flex items-center gap-1.5 text-sm text-ink-gray-6">
                  <span class="lucide-circle-alert size-4 shrink-0" aria-hidden="true" />
                  {{ row.note }}
                </span>
              </template>
              <!-- Hidden, in Closed: a badge by the name, like every closed card. -->
              <template v-if="row.hidden" #badges>
                <Badge theme="gray" label="Hidden" />
              </template>
              <!-- ⚠️ A HOLLOW RING for Suggested: not started, lighter than
                   the statuses that need you. -->
              <template v-if="!row.hidden" #aside>
                <span class="inline-flex items-center gap-2 text-base text-ink-gray-6">
                  <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
                    <span class="size-2 rounded-full border border-outline-gray-4" />
                  </span>
                  Suggested
                </span>
              </template>
            </PartnerCard>
          </template>
        </div>
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
