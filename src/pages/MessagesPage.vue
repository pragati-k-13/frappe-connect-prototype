<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, ScrollArea, TabButtons, toast } from 'frappe-ui'
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
import IconExternal from '~icons/lucide/external-link'
import IconSend from '~icons/lucide/send-horizontal'
import ConnectShell from '../components/ConnectShell.vue'
import CompanyDetailsDialog from '../components/CompanyDetailsDialog.vue'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { isActive, lastAt } from '../data/messages'
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
    .map((t) => ({ ...t, partner: partnerOf(t.partnerId), active: isActive(t) }))
    .filter((t) => t.partner)
    .sort((a, b) => lastAt(b) - lastAt(a)),
)

// ⚠️ Active is DERIVED, not stored: a thread is active while something has been
// said in it in the last 30 days. See `INACTIVE_AFTER` in `data/messages.js`.
// The counts are in the labels because an empty tab should be legible before
// you click it, not after.
const filter = ref('active')
const shown = computed(() => threads.value.filter((t) => t.active === (filter.value === 'active')))
const tabs = computed(() => [
  { label: `Active ${threads.value.filter((t) => t.active).length}`, value: 'active' },
  { label: `Inactive ${threads.value.filter((t) => !t.active).length}`, value: 'inactive' },
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
const authorOf = (m) => (m.from === 'you' ? store.viewer.name : open.value.partner.name)

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
  const m = thread.messages.at(-1)
  const body =
    m.kind === 'company'
      ? 'Company details'
      : m.kind === 'call'
        ? 'Introduction call'
        : asText(m.body)
  return m.from === 'you' ? `You: ${body}` : body
}

const details = ref(false)

// ⚠️ Inert by instruction: the call lives in a calendar the prototype has no
// access to. Saying so is the point of the click.
const openCalendar = () =>
  toast.info('This opens your calendar app', {
    id: 'calendar',
    description: 'The invite lives outside Frappe Connect.',
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
  <ConnectShell root-label="Messages" flush>
    <div class="flex min-h-0 min-w-0 flex-1">
      <!-- ── The inbox ──────────────────────────────────────────────────── -->
      <!-- ⚠️ No inbox at all until there is something in it. An empty list
           beside an empty pane is two ways of saying nothing, and the rule and
           the tabs draw a frame around the absence. -->
      <aside
        v-if="threads.length"
        class="flex w-[320px] shrink-0 flex-col border-r border-outline-gray-1"
      >
        <div class="shrink-0 px-4 pb-3 pt-4">
          <h1 class="text-base font-medium text-ink-gray-8">Inbox</h1>
          <!-- ⚠️ Not in the design, and asked for: without it a quiet thread
               from two months ago sits in the same list as the conversation you
               are having today, and the list is sorted by recency, so the dead
               ones pile up at the bottom of the only view there is. -->
          <TabButtons
            class="mt-3"
            :model-value="filter"
            :options="tabs"
            size="sm"
            @update:model-value="setFilter"
          />
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

          <ul>
            <li v-for="t in shown" :key="t.id">
              <button
                type="button"
                class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                :class="open?.id === t.id ? 'bg-surface-gray-2' : 'hover:bg-surface-gray-1'"
                :aria-current="open?.id === t.id ? 'true' : undefined"
                @click="select(t.id)"
              >
                <Avatar
                  v-if="logoFor(t.partnerId)"
                  :image="logoFor(t.partnerId)"
                  :label="t.partner.name"
                  size="2xl"
                  shape="square"
                  class="fc-logo-avatar"
                />
                <Avatar v-else :label="t.partner.name" size="2xl" shape="square" />
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline gap-2">
                    <span class="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-8">
                      {{ t.partner.name }}
                    </span>
                    <span class="shrink-0 text-p-xs text-ink-gray-5">{{ time(lastAt(t)) }}</span>
                  </span>
                  <span class="mt-0.5 block truncate text-p-sm text-ink-gray-5">
                    {{ preview(t) }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
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
          <!-- The design's "Hire" button, as the thing this app can actually
               do: hiring happens on the pack flow, and the profile is what a
               conversation makes you want to check. -->
          <Button
            variant="subtle"
            size="sm"
            label="View profile"
            :route="`/connect/partners/${open.partnerId}`"
          />
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
            <div v-for="m in open.messages" :key="m.id" class="mt-5 flex items-start gap-3">
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
                <p class="flex items-baseline gap-1.5 text-p-sm">
                  <span class="font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
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

                <!-- The company profile onboarding collected, as it was sent. -->
                <div
                  v-else-if="m.kind === 'company'"
                  class="mt-1.5 w-fit rounded-5 border border-outline-gray-2 p-3.5"
                >
                  <dl class="space-y-1.5">
                    <div class="flex gap-6 text-p-base">
                      <dt class="w-36 text-ink-gray-5">Company name</dt>
                      <dd class="font-medium text-ink-gray-8">
                        {{ store.company.name || store.viewer.company }}
                      </dd>
                    </div>
                    <div class="flex gap-6 text-p-base">
                      <dt class="w-36 text-ink-gray-5">Industry</dt>
                      <dd class="font-medium text-ink-gray-8">
                        {{ store.company.segments?.[0] || 'Not provided' }}
                      </dd>
                    </div>
                    <div class="flex gap-6 text-p-base">
                      <dt class="w-36 text-ink-gray-5">No. of employees</dt>
                      <dd class="font-medium text-ink-gray-8">
                        {{ store.company.employees || 'Not provided' }}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    class="mt-3"
                    variant="subtle"
                    size="sm"
                    label="View all details"
                    @click="details = true"
                  />
                </div>

                <!-- The booked call. The external mark is the whole point of the
                   control: the invite is in a calendar this app doesn't own. -->
                <div
                  v-else-if="m.kind === 'call'"
                  class="mt-1.5 flex w-fit items-center gap-3 rounded-5 border border-outline-gray-2 p-3.5"
                >
                  <Avatar size="2xl" shape="square" aria-hidden="true">
                    <IconCalendar class="size-full" />
                  </Avatar>
                  <div class="min-w-0">
                    <p class="text-base font-medium text-ink-gray-8">
                      Scheduled an introduction call
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
              </div>
            </div>
          </div>
        </ScrollArea>

        <!-- The composer. ⚠️ No rule above it: the conversation ends in white
             space, and a line there fenced the composer off from the thread it
             belongs to.
             `Editor` is RENDERLESS — it owns the editor, the model and the
             placeholder, and hands back `{ isEmpty }` for the slot to lay out.
             The field's own surface is on the wrapper rather than on
             EditorContent, so focus can light the whole box. -->
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
          <!-- ⚠️ Service agnostic, and no CTA. A Starter Pack is one way a
               conversation starts and not the only one: guided onboarding books
               the same way, and a visitor can reach out to a partner from the
               directory without buying anything. There is no single next step
               to offer, and a button here would pick one of them for you. -->
          <p class="mt-1.5 text-p-base text-ink-gray-6">
            Conversations open here once you book a service or reach out to a partner.
          </p>
        </div>
      </section>
    </div>

    <CompanyDetailsDialog :open="details" @close="details = false" />
  </ConnectShell>
</template>
