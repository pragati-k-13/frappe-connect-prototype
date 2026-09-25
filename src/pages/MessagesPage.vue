<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dropdown, ScrollArea, TabButtons, toast } from 'frappe-ui'
// ⚠️ `frappe-ui/editor`, not the `TextEditor` parked in `frappe-ui/experimental`.
// That one is the v0 family, kept only as an interim import path while apps
// migrate off it ("Moved out of root (#974)"); this is the replacement, and it
// ships its own ProseMirror styles so nothing else has to be imported.
import {
  CommentKit,
  commentToolbar,
  Editor,
  EditorContent,
  EditorFixedMenu,
} from 'frappe-ui/editor'
import IconCalendar from '~icons/lucide/calendar'
import IconEmoji from '~icons/lucide/smile-plus'
import IconMore from '~icons/lucide/ellipsis'
import IconExternal from '~icons/lucide/external-link'
import IconSend from '~icons/lucide/send-horizontal'
import IconChevronDown from '~icons/lucide/chevron-down'
import IconCheck from '~icons/lucide/circle-check'
import IconBan from '~icons/lucide/ban'
import ConnectShell from '../components/ConnectShell.vue'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import CompanyDetailsDialog from '../components/CompanyDetailsDialog.vue'
import BriefDetailsDialog from '../components/BriefDetailsDialog.vue'
import PartnerMessagesPage from './PartnerMessagesPage.vue'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { STATUS_LABELS, isActive, lastAt, threadStatus } from '../data/messages'
import { budgetLabel } from '../data/custom'
import { useConnectStore } from '../stores/connect'

// SCREEN — messages. The destination the confirmed screen has been promising
// ("Project details sent via Messaging") and the one every Contact button in
// the product has been apologising for.
//
// Two panes, each scrolling on its own: a list of conversations and one
// conversation. `flush` on the shell is what makes that possible — the default
// content region is a single ScrollArea for a page that scrolls as one
// document, which a chat is not.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const partnerOf = (id) => PARTNERS.find((p) => p.id === id) ?? null

// Newest conversation first, which is the order an inbox is read in.
const threads = computed(() =>
  [...store.threads]
    .map((t) => ({ ...t, partner: partnerOf(t.partnerId), active: isActive(t) && !t.archived }))
    .filter((t) => t.partner)
    .sort((a, b) => lastAt(b) - lastAt(a)),
)

// ⚠️ Active is DERIVED, not stored: a thread is active while something has been
// said in it in the last 30 days. See `INACTIVE_AFTER` in `data/messages.js`.
// The counts are in the labels because an empty tab should be legible before
// you click it, not after.
const filter = ref('active')
const shown = computed(() => threads.value.filter((t) => t.active === (filter.value === 'active')))
// `count` is not a `TabButton` field — the component doesn't know about it. It
// rides along on the option and comes back through the `#suffix` slot, which
// forwards the whole `button` object. That's the documented place for a count on
// a tab; see the `#suffix` usage in the template.
// ── The broadcast group ─────────────────────────────────────────────────────
// ⚠️ A DOZEN THREADS ARRIVE AT ONCE when a custom brief goes out, and without
// this they bury every real conversation the account has under eleven copies of
// the same sent message. The inbox is a flat list of firms; a broadcast is one
// gesture that touches twelve of them, and those are not the same kind of
// thing.
//
// So a broadcast thread stays folded into a group UNTIL THE PARTNER ANSWERS.
// The moment there is a reply the thread leaves the group and takes its place
// in the list by recency, because at that point it is a conversation. That rule
// is what keeps the fold honest: nothing is hidden except silence.
const hasReply = (t) => t.messages.some((m) => m.from === 'them')
const inGroup = (t) => Boolean(t.broadcast) && !hasReply(t)

const loose = computed(() => shown.value.filter((t) => !inGroup(t)))
const grouped = computed(() => shown.value.filter(inGroup))

const groupOpen = ref(false)

// One flat sequence for the List: the threads with replies, the group's toggle,
// then the silent threads when the group is open.
const listRows = computed(() => [
  ...loose.value.map((t) => ({ kind: 'thread', key: t.id, t })),
  ...(grouped.value.length ? [{ kind: 'group', key: 'group' }] : []),
  ...(groupOpen.value ? grouped.value.map((t) => ({ kind: 'thread', key: t.id, t })) : []),
])

const tabs = computed(() => [
  { label: 'Active', value: 'active', count: threads.value.filter((t) => t.active).length },
  { label: 'Inactive', value: 'inactive', count: threads.value.filter((t) => !t.active).length },
])

// The open conversation is in the URL, like the pack on the two screens before
// this one: reloading keeps the thread you were reading, and a thread can be
// linked to. An id that names nothing falls back to the first in view rather
// than showing an error about a conversation nobody asked for.
const openId = computed(() => route.query.thread ?? null)
const open = computed(
  () => threads.value.find((t) => t.id === openId.value) ?? shown.value[0] ?? null,
)

const select = (id) => router.replace({ query: { ...route.query, thread: id } })

// ⚠️ Switching tabs opens the first thread in the tab you switched TO. Without
// that, the list showed one tab and the pane a conversation from the other; and
// syncing the other way (filter follows the open thread) made the Inactive tab
// bounce straight back to Active, because the thread in the URL was still an
// active one.
const setFilter = (value) => {
  filter.value = value
  const first = threads.value.find((t) => t.active === (value === 'active'))
  const query = { ...route.query }
  if (first) query.thread = first.id
  else delete query.thread
  router.replace({ query })
}

// The URL is the one that moves the tab: arriving at a link to a quiet thread
// should show the tab that holds it. Watching the query rather than `open`
// keeps this from firing on a tab change and undoing it.
watch(
  () => route.query.thread,
  (id) => {
    const t = threads.value.find((x) => x.id === id)
    if (t) filter.value = t.active ? 'active' : 'inactive'
  },
  { immediate: true },
)

const logo = computed(() => (open.value ? logoFor(open.value.partnerId) : null))
// The name on a message. Partner-side replies come from a PERSON on that
// partner's sales team — see the note at the top of `data/messages.js` — and
// `author` is where their name lives.
//
// ⚠️ Falls back to the firm. Booking and Contact threads have no partner replies
// in them at all today, but a message that ever arrives without an author should
// render as the company rather than as a blank line.
const authorOf = (m) =>
  m.from === 'you' ? store.viewer.name : (m.author ?? open.value.partner.name)

// The badge is on the PERSON, not on the message: it answers "who is this human
// and why are they in my inbox", which is a question the company's own messages
// never raised. So it is suppressed on the fallback above — "Tridots Tech" with
// a badge reading "Tridots Tech" is the label repeating itself.
const isPartnerPerson = (m) => m.from !== 'you' && Boolean(m.author)

// Same day gets a clock, anything older gets a date: "12:16 pm" answers "how
// long ago" only while today is still today.
const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const callWhen = (when) =>
  when
    ? new Date(when).toLocaleString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Time to be confirmed'

// The last line of a thread, for the list. A card has no text of its own, so it
// says what it is rather than rendering blank.
// ⚠️ Tags OUT. A message body is HTML now, and a preview is one line of plain
// text in a 320px column — printing the markup put "<p>" in the inbox.
const asText = (html) => {
  const el = document.createElement('div')
  el.innerHTML = html ?? ''
  return el.textContent ?? ''
}

const preview = (thread) => {
  // A company message outside a broadcast draws nothing in the thread — the
  // company is inside the requirements card there — so the preview skips it
  // too rather than naming an event the thread does not show.
  const m = thread.broadcast
    ? thread.messages.at(-1)
    : thread.messages.findLast((x) => x.kind !== 'company')
  // A thread can still have nothing in it: Message, from a project whose
  // partner is already assigned, opens one with no inquiry in front of it.
  // Contact no longer produces this state — it sends requirements — but the
  // guard stays, because reading `.kind` off `undefined` is what it prevents
  // and the row needs a sentence where every other row has one.
  if (!m) return 'No messages yet'
  // ⚠️ Every CARD kind needs a line here, because a card has no body text and
  // the preview would come out blank — which in a column of firms reads as a
  // conversation that failed to load. A bid says its NUMBER rather than the
  // word "quote": down a list of replies, the figure is what tells them apart.
  const body =
    m.kind === 'company'
      ? ''
      : m.kind === 'call'
        ? 'Introduction call'
        : m.kind === 'decline'
          ? // ⚠️ THE REASON, NOT THE WORD. This said "Declined" until the badge
            // beside it started saying "Declined" too, and a row reading
            // "Declined · Declined" is the state printed twice with the one
            // useful fact — why — left out. The badge carries the state; the
            // preview carries what was said. Truncation is fine here: the first
            // few words of "We are at capacity until the new year" are the
            // part worth scanning.
            m.reason
          : m.kind === 'bid'
            ? // The figure alone, for the same reason: the badge says "Quoted".
              m.bid.price
            : m.kind === 'brief' || m.kind === 'packs'
              ? // The project's name, not the word "Requirements": the preview
                // line is read down a column of firms, and which project it was
                // about is the part that tells them apart.
                m.brief.project
              : asText(m.body)
  if (m.kind === 'company') return `${companyName.value} · shared`
  return m.from === 'you' ? `You: ${body}` : body
}

// ── What kind of conversation each row is ───────────────────────────────────
// ⚠️ ONE BADGE, AND MOST ROWS HAVE NONE. A broadcast now produces five
// outcomes — awaiting, declined, quoted, shortlisted, passed — and the preview
// line cannot carry them: it is the last thing SAID, which for a shortlisted
// thread is whatever the two of you talked about afterwards. The badge is the
// state; the preview is the conversation. A label on every row would be a label
// on none of them, so an ordinary back-and-forth gets nothing.
//
// The bid's state lives on its PROJECT, so it is looked up here and handed to
// `threadStatus` — that file has no store.
const bidStateFor = (thread) => {
  const project = store.projects.find((p) =>
    (p.bids ?? []).some((b) => b.partnerId === thread.partnerId),
  )
  return project?.bids?.find((b) => b.partnerId === thread.partnerId)?.state ?? null
}

const statusOf = (thread) => STATUS_LABELS[threadStatus(thread, bidStateFor(thread))] ?? null

const details = ref(false)

// ⚠️ THE BRIEF ITSELF, not a boolean: a thread can in principle carry two
// requirements, and a dialog opened by a flag would show whichever one the
// template found first.
const briefDetails = ref(null)

const companyName = computed(() => store.company.name || store.viewer.company)

// The company, inside the requirements card's details, wherever it went out
// WITH the requirements — a pack booking or a direct contact. On a broadcast
// it went later, on its own line, so the card leaves it out.
const briefCompany = computed(() =>
  open.value && !open.value.broadcast && open.value.messages.some((m) => m.kind === 'company')
    ? companyName.value
    : '',
)

// ── Bids in the thread ──────────────────────────────────────────────────────
// ⚠️ THE STATE LIVES ON THE PROJECT, not on the message. A message is a record
// of something that was said and does not change; whether a quote is approved
// is a decision the business made afterwards, and the project's own bid list is
// where the comparison table reads it from. Two copies of that fact would
// disagree the first time one surface updated and the other didn't.
const bidProject = computed(() =>
  store.projects.find((p) => (p.bids ?? []).some((b) => b.partnerId === open.value?.partnerId)) ??
  null,
)

// The way back to the decision, and only while there is one to make: this
// partner is shortlisted and nobody has been hired yet. Hiring stays on the
// project page, where every shortlisted quote sits side by side — a thread
// shows one of them.
const compareProject = computed(() => {
  const project = bidProject.value
  if (!project || project.partnerId) return null
  const bid = project.bids.find((b) => b.partnerId === open.value?.partnerId)
  return bid?.state === 'shortlisted' ? project : null
})

// ⚠️ THE DECISION IS ABOUT THE PARTNER, NOT A QUOTE. It used to sit on the
// quote card, which tied it to one figure — and a partner may revise the
// figure after a discovery call, leaving two cards and no answer to "which
// one did I say yes to?". So a quote card is a record, and the decision is a
// bar pinned above the composer while it is still open.
const openBid = computed(
  () => bidProject.value?.bids?.find((b) => b.partnerId === open.value?.partnerId) ?? null,
)

// The thread's own menu. Undo sits here rather than on the thread because it is
// rare, and it cannot take back what was shared — the partner keeps the details.
const threadMenu = computed(() => {
  if (!open.value) return []
  const t = open.value
  return [
    {
      label: 'Search in conversation',
      icon: 'lucide-search',
      onClick: () =>
        toast.info('Search is not built yet', {
          id: 'thread-search',
          description: 'It would find a word anywhere in this conversation.',
        }),
    },
    ...(openBid.value?.state === 'shortlisted'
      ? [
          {
            label: 'Undo interested',
            icon: 'lucide-undo-2',
            onClick: () => {
              setBid('pending')
              toast('No longer marked as interested', {
                id: 'undo-interested',
                description: `${t.partner.name} still has the contact details you shared.`,
              })
            },
          },
        ]
      : []),
    t.archived
      ? {
          label: 'Move to Active',
          icon: 'lucide-archive-restore',
          onClick: () => {
            store.setArchived(t.id, false)
            filter.value = 'active'
          },
        }
      : {
          label: 'Archive',
          icon: 'lucide-archive',
          onClick: () => {
            store.setArchived(t.id, true)
            setFilter(filter.value)
            toast('Archived', {
              id: `archived-${t.id}`,
              description: 'It is under Inactive.',
              action: { label: 'Undo', onClick: () => store.setArchived(t.id, false) },
            })
          },
        },
  ]
})

const setBid = (state) => {
  if (!bidProject.value || !open.value) return
  store.setBidState(bidProject.value.id, open.value.partnerId, state)
  if (state === 'shortlisted') {
    toast.success('Marked as interested', {
      description: `${open.value.partner.name} can now see your company name and contact details.`,
    })
  }
}

// ⚠️ Inert by instruction: the call lives in a calendar the prototype has no
// access to. Saying so is the point of the click.
const openCalendar = () =>
  toast.info('This opens your calendar app', {
    id: 'calendar',
    description: 'The invite lives outside Frappe Connect.',
  })

// The two per-message actions, both inert by instruction — the same shape as
// `openCalendar` above. A reaction needs somewhere to store it and a second
// author to read it, and the overflow menu needs its items decided; neither
// exists, so each names its own gap rather than letting the click vanish.
const react = () =>
  toast.info('Reactions are not built yet', {
    id: 'react',
    description: 'Nothing stores a reaction, and no one is on the other end to see it.',
  })

const messageActions = () =>
  toast.info('Message actions are not built yet', {
    id: 'message-actions',
    description: 'Reply, copy and delete are the likely three, and none is decided.',
  })

// ⚠️ HTML, not a string of text: the editor's format is `html`, so a message
// keeps whatever was typed into it (a link, a bold word, two paragraphs). The
// seeded threads are plain sentences, which pass through unchanged.
const draft = ref('')
const composer = ref(null)
const feed = ref(null)

// Media without an upload function is a paste that lands in a broken state, so
// the kit's image, video and attachment members are off. Mentions and emoji
// stay: they are the two the design draws in the composer.
const EXTENSIONS = [
  CommentKit.configure({ image: false, video: false, attachment: false, table: false }),
]

// ⚠️ CAPTURE phase, and that is the whole trick. The editor handles Enter
// itself, at the ProseMirror level, so a listener on the way UP fires after the
// newline has already been inserted and `preventDefault` is too late.
// Capturing on the wrapper runs first, and `stopPropagation` keeps the
// keystroke away from the editor entirely. Shift+Enter is left alone, so it
// still breaks the line.
const onKey = (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  e.preventDefault()
  e.stopPropagation()
  send()
}

// Sending scrolls the conversation to the bottom, because the message you just
// wrote is the one you want to see land.
const toBottom = () => {
  nextTick(() => {
    const el = feed.value?.$el?.querySelector('[data-reka-scroll-area-viewport]') ?? null
    if (el) el.scrollTop = el.scrollHeight
  })
}

const send = () => {
  // `isEmpty` comes from the editor rather than from the string: an empty
  // ProseMirror document is `<p></p>`, which is not an empty string.
  if (composer.value?.isEmpty || !open.value) return
  store.sendMessage(open.value.id, draft.value)
  draft.value = ''
  // ⚠️ Replying revives a thread: it was last spoken in two months ago, and now
  // it was spoken in today, so it belongs in Active. Without this the list drops
  // it out of the tab you are looking at the moment you send.
  filter.value = 'active'
  toBottom()
}

watch(open, toBottom)
</script>

<template>
  <!-- The same address from the other side of the product. See
       `PartnerMessagesPage` for what differs and why. -->
  <PartnerMessagesPage v-if="store.role === 'partner'" />
  <ConnectShell v-else root-label="Messages" flush>
    <div class="flex min-h-0 min-w-0 flex-1">
      <!-- ── The inbox ──────────────────────────────────────────────────── -->
      <!-- ⚠️ No inbox at all until there is something in it. An empty list
           beside an empty pane is two ways of saying nothing, and the rule and
           the tabs draw a frame around the absence. -->
      <aside
        v-if="threads.length"
        class="flex w-[320px] shrink-0 flex-col border-r border-outline-gray-1"
      >
        <!-- Tabs, no heading: the screen is already called Messages. The
             track's own rule runs under both tabs. -->
        <div class="shrink-0 px-4 pb-4 pt-2">
          <TabButtons
            class="w-full"
            :model-value="filter"
            :options="tabs"
            variant="underline"
            size="sm"
            fluid
            @update:model-value="setFilter"
          >
            <!-- The count as a badge rather than as part of the label. "Active
                 2" was one string, so the number inherited the label's own
                 weight and colour and read as part of the NAME of the tab; a
                 badge says it is a quantity of what's in it.

                 ⚠️ Bare `size="sm"`, everything else default (gray, subtle) —
                 and identically on both tabs. A `solid` badge on the selected
                 one was tried and is wrong twice over: the underline already
                 says which tab is selected, so the fill is a second answer to a
                 settled question, and a black pill is a lot of emphasis for a
                 small number. It also diverges from frappe-ui's own count-badge
                 examples, which are exactly `<Badge size="sm">{{ count }}</Badge>`
                 on every tab — see `Tabs/stories/BrowserTabCounts.vue`.

                 ⚠️ Rendered even at zero. An empty tab whose badge disappears
                 looks like a tab that failed to load, and "0" is the answer to
                 the question — which is why the counts were in the labels to
                 begin with. -->
            <template #suffix="{ button }">
              <Badge size="sm" :label="button.count" />
            </template>
          </TabButtons>
        </div>

        <ScrollArea class="min-h-0 flex-1">
          <p v-if="!shown.length" class="px-4 py-6 text-p-sm text-ink-gray-5">
            Nothing here.
            {{
              filter === 'active'
                ? 'Every conversation has gone quiet.'
                : 'Every conversation is still live.'
            }}
          </p>

          <!-- frappe-ui's List in feed mode. `v-model:active` is the open
               thread: the List highlights it, and picking a row writes it to
               `?thread=` through `select`. No dividers, as before. -->
          <List
            class="px-2 py-1"
            :columns="['auto', 'minmax(0,1fr)']"
            divider="none"
            :active="open?.id"
            @update:active="select"
          >
            <template v-for="r in listRows" :key="r.key">
              <ListRow v-if="r.kind === 'thread'" :value="r.t.id" class="py-3">
                <ListCell>
                  <Avatar
                    v-if="logoFor(r.t.partnerId)"
                    :image="logoFor(r.t.partnerId)"
                    :label="r.t.partner.name"
                    size="2xl"
                    shape="square"
                    class="fc-logo-avatar"
                  />
                  <Avatar v-else :label="r.t.partner.name" size="2xl" shape="square" />
                </ListCell>
                <ListCell>
                  <span class="block w-full min-w-0 text-left">
                    <span class="flex items-baseline gap-2">
                      <span class="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-8">
                        {{ r.t.partner.name }}
                      </span>
                      <span class="shrink-0 text-p-xs text-ink-gray-5">
                        {{ time(lastAt(r.t)) }}
                      </span>
                    </span>
                    <span class="mt-0.5 flex items-center gap-1.5">
                      <Badge
                        v-if="statusOf(r.t)"
                        variant="subtle"
                        size="sm"
                        :theme="statusOf(r.t).theme"
                        :label="statusOf(r.t).label"
                      />
                      <span class="min-w-0 flex-1 truncate text-p-sm text-ink-gray-5">
                        {{ preview(r.t) }}
                      </span>
                    </span>
                  </span>
                </ListCell>
              </ListRow>
              <!-- ── The silent half of a broadcast ─────────────────────
                   ⚠️ It says how many and it says what they were sent,
                   because the number is the thing the person who sent it is
                   accountable for. Collapsed, not hidden: "who else got
                   this" is a fair question and it is one click. No `value`,
                   so clicking it toggles rather than opening a thread. -->
              <ListRow
                v-else
                class="py-3"
                :aria-expanded="groupOpen"
                @click="groupOpen = !groupOpen"
              >
                <ListCell>
                  <span
                    class="grid size-10 place-items-center rounded-4 bg-surface-gray-2 text-ink-gray-6"
                    aria-hidden="true"
                  >
                    <IconSend class="size-4" />
                  </span>
                </ListCell>
                <ListCell>
                  <span class="flex w-full min-w-0 items-center gap-3 text-left">
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-base font-medium text-ink-gray-8">
                        Requirements sent
                      </span>
                      <span class="mt-0.5 block truncate text-p-sm text-ink-gray-5">
                        {{ grouped.length }}
                        {{ grouped.length === 1 ? 'partner has' : 'partners have' }} not replied
                        yet
                      </span>
                    </span>
                    <IconChevronDown
                      class="size-4 shrink-0 text-ink-gray-5 transition-transform"
                      :class="groupOpen && 'rotate-180'"
                    />
                  </span>
                </ListCell>
              </ListRow>
            </template>
          </List>
        </ScrollArea>
      </aside>

      <!-- ── The conversation ───────────────────────────────────────────── -->
      <section v-if="open" class="flex min-h-0 min-w-0 flex-1 flex-col">
        <header class="flex shrink-0 items-center gap-3 border-b border-outline-gray-1 px-5 py-3">
          <Avatar
            v-if="logo"
            :image="logo"
            :label="open.partner.name"
            size="2xl"
            shape="square"
            class="fc-logo-avatar"
          />
          <Avatar v-else :label="open.partner.name" size="2xl" shape="square" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-medium text-ink-gray-8">{{ open.partner.name }}</p>
            <p class="mt-0.5 truncate text-p-sm text-ink-gray-5">
              {{ open.partner.city }} · Typically {{ open.partner.responds }}
            </p>
          </div>
          <!-- ⚠️ NO HIRE BUTTON, though the design has one. Hiring is a
               comparison and lives on the project page; a thread shows one
               quote. "Compare quotes" is the way back there, and when it shows
               it is the next step, so it takes the fill and View profile drops
               to ghost. It sits last, at the edge, where the next step goes.
               Hidden below `lg`, where two buttons squeeze the partner's name
               to nothing — the name is what the header is for. -->
          <Button
            :variant="compareProject ? 'ghost' : 'subtle'"
            size="sm"
            label="View profile"
            :route="`/connect/partners/${open.partnerId}`"
          />
          <div v-if="compareProject" class="hidden shrink-0 lg:block">
            <Button
              variant="subtle"
              size="sm"
              label="Compare quotes"
              :route="{ name: 'project', params: { id: compareProject.id } }"
            />
          </div>
          <Dropdown :options="threadMenu" align="end">
            <Button variant="ghost" size="sm" aria-label="More">
              <template #icon><IconMore class="size-4" /></template>
            </Button>
          </Dropdown>
        </header>

        <ScrollArea ref="feed" class="min-h-0 flex-1">
          <div class="px-5 py-6">
            <p class="text-center text-p-sm text-ink-gray-5">You started this conversation</p>

            <!-- ⚠️ Every message sits on the LEFT, including your own. A chat
                 between two organisations is a record more than a banter, and
                 the mirrored right-hand bubble buys nothing once each message
                 already carries a name. -->
            <!-- ⚠️ The avatar sits beside the whole GROUP, not beside the
                 bubble: the name, the time and whatever the message is (text or
                 one of the two cards) hang off a single left edge.
                 A person is a circle and a company is a square, which is the
                 shape rule the rest of the app already follows — every partner
                 logo in the listing, the profile and the inbox is square. -->
            <template v-for="m in open.messages" :key="m.id">
            <!-- ⚠️ SHARING THE COMPANY IS A LINE, NOT A CARD. The card
                 repeated three facts the company already knows about itself;
                 what it needs from the thread is WHEN they went out and to
                 whom. The details are one press away. -->
            <!-- ⚠️ ONLY ON A BROADCAST, the one thread where the company goes
                 out later than the brief — when a reply is marked Interested
                 — so that moment needs a mark. Everywhere else the company went
                 with the requirements and is listed inside their card, with no
                 separate "sharing happened" line to read like an alert. -->
            <template v-if="m.kind === 'company'">
              <p v-if="open.broadcast" class="mt-6 text-center text-p-sm text-ink-gray-5">
                <button
                  type="button"
                  class="text-ink-gray-7 underline underline-offset-2"
                  @click="details = true"
                >
                  {{ companyName }}</button
                >
                · shared {{ time(m.at) }}
              </p>
            </template>
            <div v-else class="group/msg mt-5 flex items-start gap-3">
              <Avatar
                v-if="m.from === 'you'"
                :label="store.viewer.name"
                size="xl"
                class="mt-0.5 shrink-0"
              />
              <Avatar
                v-else-if="logo"
                :image="logo"
                :label="open.partner.name"
                size="xl"
                shape="square"
                class="fc-logo-avatar mt-0.5 shrink-0"
              />
              <Avatar
                v-else
                :label="open.partner.name"
                size="xl"
                shape="square"
                class="mt-0.5 shrink-0"
              />

              <div class="min-w-0 flex-1">
                <!-- `gap-1.5` rather than a space in the markup: Vue drops the
                   whitespace between two elements on their own lines, which
                   welded the name to the separator. -->
                <!-- ⚠️ `flex-wrap`. Without it these three shrink instead of
                   wrapping, and in a narrow pane the NAME broke across two
                   lines with the badge stranded in the gap. Wrapping moves
                   whole items, so a long name stays one word per line and the
                   badge follows it down intact. -->
                <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
                  <span class="font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
                  <!-- Which side of the conversation this person is on. The
                       thread header names the company and links its profile, so
                       the badge doesn't repeat the firm — it says the NAME above
                       belongs to that firm's team rather than to the viewer's
                       own. `gray`, because affiliation is a fact about the
                       speaker and not a status: a coloured pill here would read
                       as something having gone right or wrong.
                       ⚠️ `self-center`, not baseline: the row is
                       `items-baseline` so the name and the time sit on one line,
                       and a pill dragged onto that baseline hangs below it. -->
                  <Badge
                    v-if="isPartnerPerson(m)"
                    class="self-center"
                    theme="gray"
                    variant="subtle"
                    size="sm"
                    label="Partner team"
                  />
                  <span class="text-ink-gray-5">·</span>
                  <span class="text-ink-gray-5">{{ time(m.at) }}</span>
                </p>

                <!-- No bubble: the name above each message already says who is
                   speaking, so a fill behind the words was a second answer to a
                   question nobody was still asking. The measure stays capped so
                   the line length is a decision rather than the pane's width.
                   ⚠️ `v-html`, because the composer writes HTML. It is the
                   viewer's own typing rendered back to them in a prototype with
                   no server and no second author, so there is nothing here that
                   one person can inject into another's screen. A real build
                   sanitises on the way in. -->
                <div
                  v-if="m.kind === 'text'"
                  class="fc-message mt-1 max-w-[480px] text-p-base text-ink-gray-8"
                  v-html="m.body"
                />

                <!-- The booked call. The external mark is the whole point of the
                   control: the invite is in a calendar this app doesn't own. -->
                <div
                  v-else-if="m.kind === 'call'"
                  class="mt-1.5 flex w-fit items-start gap-3 rounded-5 p-3.5 shadow-sm"
                >
                  <Avatar size="2xl" shape="square" aria-hidden="true">
                    <IconCalendar class="size-full" />
                  </Avatar>
                  <div class="min-w-0">
                    <!-- ⚠️ "Scheduled" only when there IS a time. Booking no
                         longer asks for a slot, so the card would otherwise say
                         a call was scheduled and then that the time is still to
                         be confirmed, in two lines that contradict each other. -->
                    <p class="text-base font-medium text-ink-gray-8">
                      {{
                        m.when ? 'Scheduled an introduction call' : 'Requested an introduction call'
                      }}
                    </p>
                    <p class="mt-0.5 text-p-base text-ink-gray-6">{{ callWhen(m.when) }}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Open in your calendar"
                    @click="openCalendar"
                  >
                    <template #icon><IconExternal class="size-4" /></template>
                  </Button>
                </div>

                <!-- ── The brief a broadcast carried ──────────────────────
                     ⚠️ WHAT THIS CARD DOES NOT CONTAIN is the point of it: no
                     company name, no contact, no size band beyond the headcount
                     — a dozen firms got this, and until one of their replies is
                     approved none of them are told who sent it. The customer
                     sees the same card the partner got, in their own thread,
                     which is what makes "we sent your requirements to twelve
                     partners" a checkable claim rather than a promise. -->
                <div
                  v-else-if="m.kind === 'brief'"
                  class="mt-1.5 w-full max-w-[480px] rounded-5 p-3.5 shadow-sm"
                >
                  <p class="text-p-base font-medium text-ink-gray-7">{{ m.brief.project }}</p>
                  <!-- ⚠️ THREE FACTS AND A DOOR, where this printed nine. The
                       brief grew a module list, a budget and five
                       criteria, and the card grew with it until it WAS the
                       brief — at which point the thing it is for, deciding
                       whether to read the brief, had to be done by reading the
                       brief. What is left is what that decision is made on:
                       what they need, what they will pay, what trade they are
                       in, and how much more there is. Everything else is one
                       press away.
                       ⚠️ TWO LINES, because a scope can run to paragraphs and
                       the card is read to decide whether to open it — two is
                       enough to say what the job is.
                       ⚠️ `line-clamp-2`, not a truncated string. The scope is
                       whatever somebody typed, and cutting it in JavaScript
                       picks a length for a box whose width nobody knows. -->
                  <p
                    class="mt-1.5 line-clamp-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-6"
                  >
                    {{ m.brief.scope }}
                  </p>
                  <!-- Icon facts, one per line, the listing's idiom: the icon
                       names the field, so no label word is spent on it. -->
                  <ul class="mt-3 space-y-1.5 text-p-base text-ink-gray-6">
                    <li class="flex items-center gap-2">
                      <LucideWallet class="size-4 shrink-0 text-ink-gray-6" aria-label="Budget" />
                      {{ budgetLabel(m.brief.budget) }}
                    </li>
                    <li v-if="m.brief.segments?.[0]" class="flex items-center gap-2">
                      <LucideFactory class="size-4 shrink-0 text-ink-gray-6" aria-label="Industry" />
                      {{ m.brief.segments[0] }}
                    </li>
                  </ul>
                  <Button
                    class="mt-3"
                    variant="subtle"
                    size="sm"
                    label="View details"
                    @click="briefDetails = m.brief"
                  />
                </div>

                <!-- ── A pack booking's requirements ────────────────────
                     The brief card's shape for a buyer who never wrote a
                     brief: what they bought in place of what they need built,
                     and the answers one press away. See `bookingThread`. -->
                <div
                  v-else-if="m.kind === 'packs'"
                  class="mt-1.5 w-full max-w-[480px] rounded-5 p-3.5 shadow-sm"
                >
                  <p class="text-p-base font-medium text-ink-gray-7">{{ m.brief.project }}</p>
                  <!-- Icon facts, the brief card's idiom: the packs on one row,
                       then the industry. Joined with a middle dot, not a comma —
                       a pack's own name holds commas ("Accounts, Sales,
                       Purchase, Stock"), and a comma list blurs where one ends.
                       `items-start` so the icon stays on the first line when a
                       basket wraps. -->
                  <ul class="mt-3 space-y-1.5 text-p-base text-ink-gray-6">
                    <li class="flex items-start gap-2">
                      <LucidePackage
                        class="mt-0.5 size-4 shrink-0 text-ink-gray-6"
                        aria-label="Starter Packs"
                      />
                      {{ m.brief.packs.join(' · ') }}
                    </li>
                    <li v-if="m.brief.segments?.[0]" class="flex items-center gap-2">
                      <LucideFactory class="size-4 shrink-0 text-ink-gray-6" aria-label="Industry" />
                      {{ m.brief.segments[0] }}
                    </li>
                  </ul>
                  <Button
                    class="mt-3"
                    variant="subtle"
                    size="sm"
                    label="View details"
                    @click="briefDetails = m.brief"
                  />
                </div>

                <!-- ── A partner saying no ────────────────────────────────
                     ⚠️ A CARD, NOT A GREY SENTENCE, and it carries the reason
                     in full. A decline is the one partner message the customer
                     cannot reply their way out of, so the thread should make it
                     unmistakable — and the reason is the only useful thing in
                     it: "at capacity until the new year" is worth knowing, "we
                     have declined" is not.
                     ⚠️ WHITE, like every other card here. It had a grey fill to
                     read as closed; the title and the Declined badge already
                     say that, and a filled card among white ones read as a
                     different kind of object rather than a different state.
                     ⚠️ NO CONTROLS. There is nothing to approve, nothing to
                     pass on, and offering to message back would invite somebody
                     to argue with a firm that has already said no.

                     ⚠️ ONLY ON A BROADCAST THREAD. The card is heavy on purpose
                     — a firm is dropping out of a set the business is counting
                     — and that weight is only earned when there was a set. In a
                     one-to-one conversation the same words are somebody
                     answering a question, so they render as what they are: a
                     message. See `threadStatus`, which withholds the badge for
                     the same reason. -->
                <div
                  v-else-if="m.kind === 'decline' && open.broadcast"
                  class="mt-1.5 w-fit max-w-[480px] rounded-5 p-3.5 shadow-sm"
                >
                  <p class="text-p-base font-medium text-ink-gray-8">
                    {{ open.partner.name }} passed on this
                  </p>
                  <p class="mt-1 text-p-base leading-relaxed text-ink-gray-6">{{ m.reason }}</p>
                </div>

                <!-- The same fact outside a broadcast: no frame, no heading, no
                     tint — the sentence, in the same type as every other thing
                     this partner has said. -->
                <p
                  v-else-if="m.kind === 'decline'"
                  class="mt-1 max-w-[480px] text-p-base text-ink-gray-8"
                >
                  {{ m.reason }}
                </p>

                <!-- ── A quote ────────────────────────────────────────────
                     ⚠️ THE DECISION IS ON THE CARD, in the thread, and the
                     project's table is where the numbers are compared. Both
                     surfaces write to the same state — see `ProjectBids` for
                     why the split is deliberate — so approving here is the same
                     act as approving there. -->
                <div
                  v-else-if="m.kind === 'bid'"
                  class="mt-1.5 w-fit max-w-[480px] rounded-5 p-3.5 shadow-sm"
                >
                  <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <p class="text-p-lg font-semibold tabular-nums text-ink-gray-9">
                      {{ m.bid.price }}
                    </p>
                    <p class="text-p-base text-ink-gray-6">about {{ m.bid.weeks }} weeks</p>
                  </div>
                  <p class="mt-2 text-p-base leading-relaxed text-ink-gray-6">{{ m.bid.note }}</p>
                </div>
              </div>

              <!-- ── Per-message actions ────────────────────────────────────
                   Hidden until the row is hovered, so a conversation reads as
                   text rather than as a column of controls repeated down the
                   right edge.

                   `opacity`, not `v-if`/`hidden`: the cluster keeps its width at
                   all times, so revealing it can't reflow the message beside it
                   — and an element that is only transparent is still in the tab
                   order, which `group-focus-within` is what makes usable.

                   ⚠️ A NAMED group (`group/msg`). The composer further down owns
                   a plain `group` of its own; an unnamed one here would be the
                   nearest ancestor for anything nested later and the two would
                   quietly fight.

                   ⚠️ Aligned to the top of the row, not centred on it: these act
                   on the message as a whole, and a message is one line or ten.
                   `mt-0.5` puts them on the meta line, level with the avatar. -->
              <div
                class="mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/msg:opacity-100"
              >
                <Button variant="ghost" size="sm" aria-label="Add reaction" @click="react">
                  <template #icon><IconEmoji class="size-4" /></template>
                </Button>
                <Button variant="ghost" size="sm" aria-label="More actions" @click="messageActions">
                  <template #icon><IconMore class="size-4" /></template>
                </Button>
              </div>
            </div>
            </template>
          </div>
        </ScrollArea>

        <!-- The composer. ⚠️ No rule above it: the conversation ends in white
             space, and a line there fenced the composer off from the thread it
             belongs to.
             `Editor` is RENDERLESS — it owns the editor, the model and the
             placeholder, and hands back `{ isEmpty }` for the slot to lay out.
             The field's own surface is on the wrapper rather than on
             EditorContent, so focus can light the whole box. -->
        <!-- ── The decision ──────────────────────────────────────────────
             Only on a thread that came from shared requirements and has a
             quote on it. Replying stays open underneath: asking a question
             does not reveal who you are. Once Interested, the bar is gone —
             the details are out and there is nothing to take back. Not
             interested keeps a way back, because nothing was shared. -->
        <div v-if="open.broadcast && openBid" class="shrink-0 px-5 pt-3">
          <!-- The reference's shape: a centred line, two buttons with icons
               under it. No frame. The primary answer comes first. -->
          <div v-if="openBid.state === 'pending'" class="pb-3 text-center">
            <p class="text-p-base text-ink-gray-8">
              Take this forward with {{ open.partner.name }}?
            </p>
            <div class="mt-2.5 flex justify-center gap-3">
              <Button
                variant="solid"
                label="Interested"
                @click="setBid('shortlisted')"
              >
                <template #prefix><IconCheck class="size-4" /></template>
              </Button>
              <Button
                variant="subtle"
                label="Not interested"
                @click="setBid('not-interested')"
              >
                <template #prefix><IconBan class="size-4" /></template>
              </Button>
            </div>
          </div>
          <p
            v-else-if="openBid.state === 'not-interested'"
            class="text-center text-p-sm text-ink-gray-5"
          >
            Not interested
            <button
              type="button"
              class="ml-1 text-ink-gray-7 underline underline-offset-2"
              @click="setBid('pending')"
            >
              Undo
            </button>
          </p>
        </div>

        <div class="shrink-0 px-5 pb-4 pt-1">
          <Editor
            ref="composer"
            v-model="draft"
            :extensions="EXTENSIONS"
            placeholder="Type a message..."
          >
            <template #default="{ isEmpty }">
              <!-- Send sits INSIDE the field, under the text it sends, so the
                   box is one object rather than a control with something
                   attached to it. `p-2` on the box and `px-1` on the editor
                   keeps the text and the button on one left edge. -->
              <!-- ⚠️ 640px, wider than a bubble on purpose: a bubble is read
                   at a glance and holds a comfortable measure, and this is
                   written into, where a longer line means fewer wraps while
                   you type. Centred in the pane rather than left-aligned with
                   the thread: the field belongs to the pane, not to the last
                   message above it. -->
              <div
                class="group mx-auto max-w-[640px] rounded-4 border border-[var(--surface-gray-2)] bg-surface-gray-2 p-2 transition-colors focus-within:border-outline-gray-4 focus-within:bg-surface-base focus-within:shadow-sm"
                @keydown.capture="onKey"
              >
                <EditorContent class="fc-composer max-h-40 min-h-6 overflow-y-auto px-1" />
                <!-- ⚠️ `Editor` is renderless, so the formatting controls are a
                     separate building block and nothing draws them for you.
                     `commentToolbar` is the library's own preset for this
                     grade of editor: bold, italic, strike, the two lists, link.
                     No avatar beside the field — the message already carries a
                     name above it, and the thread is between two parties. -->
                <!-- ⚠️ At rest the composer is ONE ROW: the line you type
                     into, nothing else. Focus opens the rest of it.
                     Two conditions, and the second one matters. Hidden by CSS
                     rather than `v-if` so that clicking inside keeps
                     `focus-within` true and the control stays under the
                     pointer; and held open whenever there is something to send,
                     because Safari does not focus a button on click — with a
                     draft in hand, a blur-driven collapse would pull Send out
                     from under the pointer between mousedown and mouseup. -->
                <div
                  class="mt-2 items-center gap-2"
                  :class="isEmpty ? 'hidden group-focus-within:flex' : 'flex'"
                >
                  <EditorFixedMenu :items="commentToolbar" button-size="sm" />
                  <Button
                    class="ml-auto"
                    variant="subtle"
                    size="sm"
                    label="Send"
                    :disabled="isEmpty"
                    @click="send"
                  >
                    <template #suffix><IconSend class="size-4" /></template>
                  </Button>
                </div>
              </div>
            </template>
          </Editor>
        </div>
      </section>

      <!-- Nothing selected, because there is nothing to select. -->
      <section v-else class="flex min-h-0 min-w-0 flex-1 items-center justify-center px-6">
        <div class="max-w-sm text-center">
          <p class="text-p-lg font-medium text-ink-gray-8">No conversation open</p>
          <!-- ⚠️ Service agnostic, and no CTA. A starter pack is one way a
               conversation starts and not the only one: a custom brief opens a
               dozen at once, and a visitor can reach out to a partner from the
               directory without buying anything. There is no single next step
               to offer, and a button here would pick one of them for you. -->
          <p class="mt-1.5 text-p-base text-ink-gray-6">
            Conversations open here once you book a service or reach out to a partner.
          </p>
        </div>
      </section>
    </div>

    <CompanyDetailsDialog
      :open="details"
      :with-requirements="Boolean(open?.broadcast)"
      @close="details = false"
    />
    <BriefDetailsDialog
      :open="Boolean(briefDetails)"
      :brief="briefDetails"
      :company-name="briefCompany"
      @update:open="!$event && (briefDetails = null)"
    />
  </ConnectShell>
</template>
