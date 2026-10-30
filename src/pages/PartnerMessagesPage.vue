<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Avatar, Badge, Button, Dialog, ScrollArea, Select, TabButtons, toast } from 'frappe-ui'
import {
  CommentKit,
  commentToolbar,
  Editor,
  EditorContent,
  EditorFixedMenu,
} from 'frappe-ui/editor'
import IconSend from '~icons/lucide/send-horizontal'
import IconBuilding from '~icons/lucide/building-2'
import IconPanel from '~icons/lucide/panel-right'
import IconClose from '~icons/lucide/x'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { budgetLabel, criteriaLines } from '../data/custom'
import { answerRows } from '../data/company'
import { scopeSentence } from '../data/modules'
import { PARTNER_SELF, PRM_LOST_REASONS, partnerThreads } from '../data/partnerView'
import { CRMS, PRM_STAGES } from '../data/partnerAccount'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// SCREEN — Messages, from the partner's side.
//
// ⚠️ THE COMPANY CARD IS NOT A MESSAGE HERE. On the business side, shortlisting
// posts the company's details into the thread as a card — that card is the
// company's own record of what it handed over. A partner needs the same facts
// differently: they refer back to them for as long as the conversation runs,
// and a card scrolls away. So the details live in the sidebar, next to the
// project, and the thread keeps one line marking the moment they arrived.
//
// Local state only. The role switch restarts the demo, so nothing the business
// side does can reach this inbox, and the seed covers both states.
// A Beginner isn't listed, so no brief reaches them: they find their own leads
// until Bronze. See the plan's Messages section.
const store = useConnectStore()

const self = PARTNERS.find((p) => p.id === PARTNER_SELF.partnerId)
const selfLogo = logoFor(PARTNER_SELF.partnerId)

const account = usePartnerAccountStore()
const threads = ref(partnerThreads())

// ── Views ───────────────────────────────────────────────────────────────────
// This is the landing screen for Sales, so it has to stay calm: leads only,
// and by default only the ones where the firm owes the next move. Finished
// leads leave the default view; Won ones live on as customers.
const CLOSED = ['Won', 'Lost', 'Junk', 'Closed']
const isClosed = (t) => CLOSED.includes(t.stage)
const needsReply = (t) => !isClosed(t) && t.messages.at(-1)?.from === 'them'

// Who "Mine" means: the person the demo role stands for, from Team.
const me = computed(() => (store.partnerRole === 'sales' ? 'rahul-verma' : 'farhan-qureshi'))

const view = ref('needs')
const VIEWS = computed(() => [
  // No count here: the rail's Messages row already shows it.
  { label: 'To reply', value: 'needs' },
  { label: 'Mine', value: 'mine' },
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' },
])

// Only the business moves a row: order by their last message, not ours, and
// not by a stage change. "Needs reply" goes oldest waiting first, since that's
// the order to answer in.
const theirLast = (t) => [...t.messages].reverse().find((m) => m.from === 'them' || m.from === 'frappe')?.at ?? 0
const lastAt = (t) => t.messages.at(-1)?.at ?? 0
const ordered = computed(() => {
  const list = threads.value.filter((t) =>
    view.value === 'needs'
      ? needsReply(t)
      : view.value === 'mine'
        ? !isClosed(t) && t.owner === me.value
        : view.value === 'open'
          ? !isClosed(t)
          : isClosed(t),
  )
  return list.sort((a, b) => (view.value === 'needs' ? theirLast(a) - theirLast(b) : theirLast(b) - theirLast(a)))
})

const openId = ref(null)
watch(
  ordered,
  (list) => {
    if (!list.some((t) => t.id === openId.value)) openId.value = list[0]?.id ?? null
  },
  { immediate: true },
)
const open = computed(() => threads.value.find((t) => t.id === openId.value) ?? null)

// Who the other side is, as far as this partner knows. Until shortlisting the
// honest answer is nobody in particular.
const companyName = (t) => t.company?.name ?? 'Anonymous company'
const authorOf = (t, m) =>
  m.from === 'you' ? PARTNER_SELF.person : (t.company?.contact ?? companyName(t))

// The stage, with colour only where it says the lead is finished.
const stageTheme = (stage) => ({ Won: 'green', Lost: 'red', Junk: 'gray', Closed: 'gray' })[stage] ?? 'blue'
const sourceLabel = (t) => (t.source === 'frappe' ? 'Passed by Frappe' : 'Through Connect')

// ── The lead ────────────────────────────────────────────────────────────────
// With a CRM connected, stages come from it and aren't set here.
const crm = computed(() => account.edits.crm)
const people = computed(() =>
  account.team
    .filter((p) => p.roles.includes('sales') || p.roles.includes('owner'))
    .map((p) => ({ label: p.name, value: p.id })),
)
const ownerOptions = computed(() => [{ label: 'Unassigned', value: 'none' }, ...people.value])
const stageOptions = PRM_STAGES.filter((s) => s !== 'Won').map((s) => ({ label: s, value: s }))

// Lost always asks why, from the PRM portal's list.
const losing = ref(false)
const lostReason = ref(PRM_LOST_REASONS[0])
function setStage(stage) {
  if (stage === 'Lost') {
    lostReason.value = PRM_LOST_REASONS[0]
    losing.value = true
    return
  }
  open.value.stage = stage
  if (CLOSED.includes(stage)) open.value.closed = { stage }
}
function confirmLost() {
  open.value.stage = 'Lost'
  open.value.closed = { stage: 'Lost', reason: lostReason.value }
  losing.value = false
  toast.success('Marked as lost')
}
function setOwner(id) {
  open.value.owner = id === 'none' ? null : id
}
function stillWorking() {
  open.value.stalled = false
  toast.success('Thanks. Frappe can see it’s still open.')
}

const preview = (t) => {
  const m = t.messages.at(-1)
  if (!m) return ''
  if (m.kind === 'shared') return 'Shared their contact details'
  if (m.kind === 'bid') return m.from === 'you' ? `You: ${m.bid.price}` : m.bid.price
  if (m.kind === 'brief') return t.project
  const el = document.createElement('div')
  el.innerHTML = m.body ?? ''
  return m.from === 'you' ? `You: ${el.textContent}` : el.textContent
}

const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── The sidebar ─────────────────────────────────────────────────────────────
const projectRows = computed(() => {
  const b = open.value?.brief ?? {}
  return [
    { label: 'Modules', value: scopeSentence(b.modules) },
    { label: 'Budget', value: budgetLabel(b.budget) },
    { label: 'Industry', value: b.segments?.[0] ?? '' },
    { label: 'Size', value: b.employees ? `${b.employees} people` : '' },
    ...answerRows(b),
  ].filter((r) => r.value)
})

const criteria = computed(() =>
  open.value
    ? criteriaLines(
        { country: open.value.brief.country, segments: open.value.brief.segments },
        open.value.brief,
      )
    : [],
)

const companyRows = computed(() => {
  const c = open.value?.company
  if (!c) return []
  return [
    { label: 'Name', value: c.name },
    { label: 'Contact', value: c.contact },
    { label: 'Email', value: c.email },
  ].filter((r) => r.value)
})

// Always beside the thread from `xl`; below that there is no room for three
// columns, so it opens over the conversation from the header.
const sideOpen = ref(false)

// ── Composer ────────────────────────────────────────────────────────────────
const draft = ref('')
const composer = ref(null)
const feed = ref(null)
const EXTENSIONS = [
  CommentKit.configure({ image: false, video: false, attachment: false, table: false }),
]

const toBottom = () => {
  nextTick(() => {
    const el = feed.value?.$el?.querySelector('[data-reka-scroll-area-viewport]') ?? null
    if (el) el.scrollTop = el.scrollHeight
  })
}

const send = () => {
  if (composer.value?.isEmpty || !open.value) return
  open.value.messages.push({
    id: `m-${Date.now()}`,
    from: 'you',
    kind: 'text',
    at: Date.now(),
    body: draft.value,
  })
  draft.value = ''
  toBottom()
}

const onKey = (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  e.preventDefault()
  e.stopPropagation()
  send()
}

watch(openId, () => {
  sideOpen.value = false
  toBottom()
})
const reasonOptions = PRM_LOST_REASONS.map((r) => ({ label: r, value: r }))
</script>

<template>
  <ConnectShell v-if="store.partnerTier === 'beginner'" root-label="Messages">
    <EmptyState icon="lucide-inbox" title="Leads from Connect start at Bronze">
      <Button label="View milestones" route="/connect/partnership" />
    </EmptyState>
  </ConnectShell>
  <ConnectShell v-else root-label="Messages" flush>
    <div class="relative flex min-h-0 min-w-0 flex-1">
      <!-- ── The inbox ──────────────────────────────────────────────────── -->
      <!-- Titled by PROJECT, not company: before shortlisting there is no
           company name to show, and a list half of "Anonymous company" rows
           tells a partner nothing about which job each one is. -->
      <aside class="flex w-[320px] shrink-0 flex-col border-r border-outline-gray-1">
        <div class="shrink-0 px-3 pb-2 pt-3">
          <TabButtons v-model="view" :options="VIEWS" class="w-full" fluid />
        </div>
        <EmptyState
          v-if="!ordered.length"
          :icon="view === 'needs' ? 'lucide-check-check' : 'lucide-inbox'"
          :title="view === 'needs' ? 'All caught up' : view === 'closed' ? 'No closed leads' : 'No leads here'"
        >
          <Button v-if="view === 'needs'" label="View open leads" @click="view = 'open'" />
        </EmptyState>
        <ScrollArea v-else class="min-h-0 flex-1">
          <!-- frappe-ui's List in feed mode, the same shape as the company's
               inbox. `v-model:active` is the open thread. -->
          <List
            v-model:active="openId"
            class="px-2 py-1"
            :columns="['auto', 'minmax(0,1fr)']"
            divider="none"
          >
            <ListRow v-for="t in ordered" :key="t.id" :value="t.id" class="py-3">
              <ListCell>
                <Avatar v-if="t.company" :label="t.company.name" size="2xl" shape="square" />
                <Avatar v-else size="2xl" shape="square" aria-hidden="true">
                  <IconBuilding class="size-full text-ink-gray-5" />
                </Avatar>
              </ListCell>
              <ListCell>
                <span class="block w-full min-w-0 text-left">
                  <span class="flex items-baseline gap-2">
                    <span class="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-8">
                      {{ t.project }}
                    </span>
                    <span class="shrink-0 text-p-xs text-ink-gray-5">{{ time(lastAt(t)) }}</span>
                  </span>
                  <span class="mt-0.5 flex items-center gap-1.5">
                    <Badge variant="subtle" size="sm" :theme="stageTheme(t.stage)" :label="t.stage" />
                    <span class="min-w-0 flex-1 truncate text-p-sm text-ink-gray-5">
                      {{ preview(t) }}
                    </span>
                  </span>
                  <span v-if="t.source === 'frappe'" class="mt-0.5 block truncate text-p-xs text-ink-gray-5">
                    {{ sourceLabel(t) }}
                  </span>
                </span>
              </ListCell>
            </ListRow>
          </List>
        </ScrollArea>
      </aside>

      <!-- ── The conversation ───────────────────────────────────────────── -->
      <section v-if="open" class="flex min-h-0 min-w-0 flex-1 flex-col">
        <header class="flex shrink-0 items-center gap-3 border-b border-outline-gray-1 px-5 py-3">
          <Avatar v-if="open.company" :label="open.company.name" size="2xl" shape="square" />
          <Avatar v-else size="2xl" shape="square" aria-hidden="true">
            <IconBuilding class="size-full text-ink-gray-5" />
          </Avatar>
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-medium text-ink-gray-8">{{ open.project }}</p>
            <p class="mt-0.5 truncate text-p-sm text-ink-gray-5">{{ companyName(open) }}</p>
          </div>
          <div class="xl:hidden">
            <Button variant="subtle" size="sm" label="Details" @click="sideOpen = true">
              <template #prefix><IconPanel class="size-4" /></template>
            </Button>
          </div>
        </header>

        <ScrollArea ref="feed" class="min-h-0 flex-1">
          <div class="px-5 py-6">
            <p v-if="open.source === 'connect'" class="text-center text-p-sm text-ink-gray-5">
              Sent to you and the other partners who match
            </p>

            <template v-for="m in open.messages" :key="m.id">
              <!-- The moment the company became known. A line, not a card:
                   the details themselves are in the sidebar, and this only has
                   to say that they arrived and when. -->
              <p v-if="m.kind === 'passed'" class="text-center text-p-sm text-ink-gray-5">
                {{ open.frappeOwner }} at Frappe passed on {{ open.company.name }} · {{ time(m.at) }}
              </p>
              <p v-else-if="m.kind === 'shared'" class="mt-6 text-center text-p-sm text-ink-gray-5">
                <span class="text-ink-gray-7">{{ open.company.name }}</span>
                is interested in your quote and shared their contact details · {{ time(m.at) }}
                <button
                  type="button"
                  class="ml-1 text-ink-gray-7 underline underline-offset-2 xl:hidden"
                  @click="sideOpen = true"
                >
                  View
                </button>
              </p>

              <div v-else class="mt-5 flex items-start gap-3">
                <Avatar
                  v-if="m.from === 'you' && selfLogo"
                  :image="selfLogo"
                  :label="self.name"
                  size="xl"
                  shape="square"
                  class="fc-logo-avatar mt-0.5 shrink-0"
                />
                <Avatar
                  v-else-if="m.from === 'you'"
                  :label="self.name"
                  size="xl"
                  shape="square"
                  class="mt-0.5 shrink-0"
                />
                <Avatar
                  v-else-if="open.company"
                  :label="open.company.contact"
                  size="xl"
                  class="mt-0.5 shrink-0"
                />
                <Avatar v-else size="xl" shape="square" class="mt-0.5 shrink-0" aria-hidden="true">
                  <IconBuilding class="size-full text-ink-gray-5" />
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
                    <span class="font-medium text-ink-gray-8">{{ authorOf(open, m) }}</span>
                    <span class="text-ink-gray-5">·</span>
                    <span class="text-ink-gray-5">{{ time(m.at) }}</span>
                  </p>

                  <div
                    v-if="m.kind === 'text'"
                    class="fc-message mt-1 max-w-[480px] text-p-base text-ink-gray-8"
                    v-html="m.body"
                  />

                  <!-- The same two-line card the business sees, less the
                       button: everything behind "View details" is standing in
                       the sidebar. -->
                  <div
                    v-else-if="m.kind === 'brief'"
                    class="mt-1.5 w-full max-w-[480px] rounded-5 border border-outline-gray-2 p-3.5"
                  >
                    <p class="text-p-base font-medium text-ink-gray-8">{{ open.project }}</p>
                    <p
                      class="mt-1.5 line-clamp-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7"
                    >
                      {{ open.brief.scope }}
                    </p>
                    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p class="text-p-base text-ink-gray-8">
                        <span class="text-ink-gray-5">Budget</span>
                        {{ budgetLabel(open.brief.budget) }}
                      </p>
                      <p v-if="open.brief.segments?.[0]" class="text-p-base text-ink-gray-8">
                        <span class="text-ink-gray-5">Industry</span>
                        {{ open.brief.segments[0] }}
                      </p>
                    </div>
                  </div>

                  <div
                    v-else-if="m.kind === 'bid'"
                    class="mt-1.5 w-fit max-w-[480px] rounded-5 border border-outline-gray-2 p-3.5"
                  >
                    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <p class="text-p-lg font-semibold tabular-nums text-ink-gray-9">
                        {{ m.bid.price }}
                      </p>
                      <p class="text-p-base text-ink-gray-6">about {{ m.bid.weeks }} weeks</p>
                    </div>
                    <p class="mt-2 text-p-base leading-relaxed text-ink-gray-7">{{ m.bid.note }}</p>
                    <Badge
                      class="mt-3"
                      :theme="open.company ? 'green' : 'gray'"
                      :label="open.company ? 'Interested' : 'Waiting on their decision'"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </ScrollArea>

        <!-- A closed lead stays as a record of the bid, read-only. -->
        <p v-if="isClosed(open)" class="shrink-0 border-t border-outline-gray-1 px-5 py-4 text-center text-p-sm text-ink-gray-5">
          {{ open.stage }}{{ open.closed?.reason ? `: ${open.closed.reason.toLowerCase()}` : '' }}. This conversation is closed.
        </p>
        <div v-else class="shrink-0 px-5 pb-4 pt-1">
          <Editor
            ref="composer"
            v-model="draft"
            :extensions="EXTENSIONS"
            placeholder="Type a message..."
          >
            <template #default="{ isEmpty }">
              <div
                class="group mx-auto max-w-[640px] rounded-4 border border-[var(--surface-gray-2)] bg-surface-gray-2 p-2 transition-colors focus-within:border-outline-gray-4 focus-within:bg-surface-base focus-within:shadow-sm"
                @keydown.capture="onKey"
              >
                <EditorContent class="fc-composer max-h-40 min-h-6 overflow-y-auto px-1" />
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

      <!-- ── The sidebar ────────────────────────────────────────────────── -->
      <!-- The project first, because it is there from the first message; the
           company under it, because it arrives later and only if they choose.
           ⚠️ The empty company section is kept, not hidden: it is what tells
           a partner that more is coming and what brings it. -->
      <aside
        v-if="open"
        class="w-[320px] shrink-0 flex-col border-l border-outline-gray-1 bg-surface-base"
        :class="
          sideOpen
            ? 'absolute inset-y-0 right-0 z-10 flex shadow-lg xl:static xl:shadow-none'
            : 'hidden xl:flex'
        "
      >
        <div class="flex shrink-0 items-center justify-between px-5 pb-3 pt-3">
          <h2 class="text-base font-medium text-ink-gray-8">Details</h2>
          <div class="xl:hidden">
            <Button variant="ghost" size="sm" aria-label="Close details" @click="sideOpen = false">
              <template #icon><IconClose class="size-4" /></template>
            </Button>
          </div>
        </div>
        <ScrollArea class="min-h-0 flex-1">
          <div class="space-y-8 px-5 pb-6">
            <!-- ── The lead: what Frappe needs back, and who has it ────────── -->
            <section>
              <h3 class="text-p-base font-medium text-ink-gray-8">Lead</h3>
              <div
                v-if="open.stalled && !crm && !isClosed(open)"
                class="mt-3 rounded-6 bg-surface-gray-1 p-3"
              >
                <p class="text-p-base text-ink-gray-8">Still working on this?</p>
                <div class="mt-2 flex gap-2">
                  <Button size="sm" label="Yes" @click="stillWorking" />
                  <Button size="sm" label="Mark as lost" @click="setStage('Lost')" />
                </div>
              </div>
              <dl class="mt-3 space-y-3">
                <div>
                  <dt class="text-p-sm text-ink-gray-5">Stage</dt>
                  <dd class="mt-1">
                    <template v-if="crm || isClosed(open)">
                      <span class="text-p-base text-ink-gray-8">
                        {{ open.stage }}{{ open.closed?.reason ? `, ${open.closed.reason.toLowerCase()}` : '' }}
                      </span>
                      <span v-if="crm && !isClosed(open)" class="mt-0.5 block text-p-sm text-ink-gray-5">
                        Synced from {{ CRMS[crm.crm].label }}
                      </span>
                    </template>
                    <Select v-else :model-value="open.stage" :options="stageOptions" @update:model-value="setStage" />
                  </dd>
                </div>
                <div>
                  <dt class="text-p-sm text-ink-gray-5">Assigned to</dt>
                  <dd class="mt-1">
                    <Select
                      :model-value="open.owner ?? 'none'"
                      :options="ownerOptions"
                      @update:model-value="setOwner"
                    />
                  </dd>
                </div>
                <div>
                  <dt class="text-p-sm text-ink-gray-5">Source</dt>
                  <dd class="mt-0.5 text-p-base text-ink-gray-8">
                    {{ sourceLabel(open) }}<template v-if="open.frappeOwner">, by {{ open.frappeOwner }}</template>
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 class="text-p-base font-medium text-ink-gray-8">Project</h3>
              <!-- No project name: the thread header above says it. -->
              <p class="mt-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7">
                {{ open.brief.scope }}
              </p>
              <!-- Stacked, not side by side: at 320px a label column wide
                   enough for "Current operations" leaves the answers a sliver. -->
              <dl class="mt-4 space-y-3">
                <div v-for="row in projectRows" :key="row.label">
                  <dt class="text-p-sm text-ink-gray-5">{{ row.label }}</dt>
                  <dd class="mt-0.5 text-p-base text-ink-gray-8">{{ row.value }}</dd>
                </div>
              </dl>
              <p class="mt-4 text-p-sm text-ink-gray-5">What they asked for</p>
              <ul class="mt-1.5 space-y-1">
                <li v-for="line in criteria" :key="line.text" class="text-p-base text-ink-gray-7">
                  {{ line.text }}
                </li>
              </ul>
            </section>

            <section>
              <h3 class="text-p-base font-medium text-ink-gray-8">Company</h3>
              <dl v-if="companyRows.length" class="mt-2 space-y-3">
                <div v-for="row in companyRows" :key="row.label">
                  <dt class="text-p-sm text-ink-gray-5">{{ row.label }}</dt>
                  <dd class="mt-0.5 break-words text-p-base text-ink-gray-8">
                    {{ row.value }}
                  </dd>
                </div>
              </dl>
              <p v-else class="mt-2 text-p-base leading-relaxed text-ink-gray-6">
                Their name and contact details appear here if they're interested in your quote.
              </p>
            </section>
          </div>
        </ScrollArea>
      </aside>
    </div>

    <Dialog v-model:open="losing" title="Mark as lost">
      <div class="space-y-4">
        <div>
          <p class="mb-1.5 text-sm text-ink-gray-6">Why was it lost?</p>
          <Select v-model="lostReason" :options="reasonOptions" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="losing = false" />
          <Button variant="solid" label="Mark as lost" @click="confirmLost" />
        </div>
      </div>
    </Dialog>
  </ConnectShell>
</template>
