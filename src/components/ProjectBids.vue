<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dropdown, ScrollArea, Tooltip, toast } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import EmptyState from './EmptyState.vue'
import { List, ListCell, ListHeader, ListHeaderCell, ListHeaderCellSort, ListRow } from 'frappe-ui/list'
import IconMessage from '~icons/lucide/message-square'
import IconMore from '~icons/lucide/ellipsis'
import { PARTNERS, cityOf } from '../data/partners'
import { logoFor } from '../data/logos'
import { quoteStanding } from '../data/messages'
import { useConnectStore } from '../stores/connect'

// The replies to a broadcast, and the whole of choosing a partner.
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
const SORTS = [
  { key: null, label: 'Arrived first' },
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
  partner: (a, b) => a.partner.name.localeCompare(b.partner.name),
  quote: (a, b) => a.amount - b.amount,
  timeline: (a, b) => a.weeks - b.weeks || a.amount - b.amount,
}
const rows = computed(() => {
  const { key, dir } = sort.value
  const sign = dir === 'asc' ? 1 : -1
  const shared = (r) => (r.state === 'shortlisted' ? 0 : 1)
  const byDefault = (a, b) => shared(a) - shared(b) || a.arrivedAt - b.arrivedAt
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

const VIEWS = {
  all: { label: 'All quotes', match: (r) => r.state !== 'not-interested' },
  shared: { label: 'Details shared', match: (r) => r.state === 'shortlisted' },
  declined: { label: 'Not interested', match: (r) => r.state === 'not-interested' },
}
const view = ref('all')
const count = (key) => rows.value.filter(VIEWS[key].match).length
const visible = computed(() => rows.value.filter(VIEWS[view.value].match))

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

const notInterested = (row) => {
  store.setBidState(props.project.id, row.partnerId, 'not-interested')
  toast(`${row.partner.name} moved to Not interested`, {
    id: `not-interested-${row.partnerId}`,
    action: {
      label: 'Undo',
      onClick: () => store.setBidState(props.project.id, row.partnerId, row.state),
    },
  })
}

// Back to where it was before: shared stays shared in the thread, so a firm
// whose details went out comes back as shared.
const restore = (row) => {
  const thread = store.threads.find((t) => t.partnerId === row.partnerId)
  const wasShared = thread?.messages.some((m) => m.kind === 'company')
  store.setBidState(props.project.id, row.partnerId, wasShared ? 'shortlisted' : 'pending')
  toast.success(`${row.partner.name} restored`)
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
  row.state === 'pending' && {
    label: 'Share details',
    icon: 'lucide-send',
    onClick: () => shareDetails(row),
  },
  row.state !== 'not-interested' && {
    label: 'Not interested',
    icon: 'lucide-ban',
    onClick: () => notInterested(row),
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
  all: { icon: 'lucide-inbox', title: 'No quotes to compare' },
  shared: { icon: 'lucide-send', title: 'No details shared yet' },
  declined: { icon: 'lucide-ban', title: 'No one marked not interested' },
}
</script>

<template>
  <section>
    <!-- Nothing back yet. A real state: a broadcast sent an hour ago has no
         replies, and the page says so rather than draw an empty table. -->
    <EmptyState
      v-if="!rows.length"
      icon="lucide-inbox"
      title="No quotes yet"
      :description="`Sent to ${sent} partners`"
    />

    <template v-else>
      <!-- The column's anchor and the filter beside the list it narrows. No
           "N of M replied": the filter menu counts the quotes, and how many
           stayed silent doesn't help choose among those that answered. -->
      <!-- Wraps on a phone: the controls drop under the title rather than
           pushing the filter off the edge. -->
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 class="whitespace-nowrap text-xl font-semibold text-ink-gray-8">Hire a Partner</h2>
        <div class="flex shrink-0 items-center gap-2">
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

      <div ref="listEl" class="mt-4">
        <EmptyState v-if="!visible.length" :icon="EMPTY[view].icon" :title="EMPTY[view].title" />

        <!-- frappe-ui's List in column mode. Static rows: each carries a
             profile link and buttons of its own, so the row is not a target. -->
        <ScrollArea v-else orientation="horizontal">
          <List
            :class="narrow ? '' : 'min-w-max'"
            :columns="narrow ? ['minmax(0,1fr)', 'auto'] : ['minmax(0,5fr)', 'minmax(9rem,2fr)', '8rem']"
            :row-height="narrow ? 84 : 72"
          >
            <ListHeader>
              <ListHeaderCellSort :direction="dirOf('partner')" @click="sortBy('partner')">Partner</ListHeaderCellSort>
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
                      {{ cityOf(row.partner) }}<template v-if="row.state === 'shortlisted'">
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
                <Button v-if="row.state !== 'not-interested'" label="Hire" @click="emit('choose', row.partner)" />
                <!-- The way back, on the row, where Hire would be. -->
                <Button v-else label="Restore" @click="restore(row)" />
                <Dropdown v-if="moreFor(row).length" :options="moreFor(row)" align="end">
                  <Button variant="ghost" :aria-label="`More for ${row.partner.name}`">
                    <template #icon><IconMore class="size-4" /></template>
                  </Button>
                </Dropdown>
              </ListCell>
            </ListRow>
          </List>
        </ScrollArea>
      </div>
    </template>
  </section>
</template>
