<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Badge, Button, Dialog, Dropdown, ScrollArea, Select, TabList, Tabs, TabTrigger, Textarea, toast } from 'frappe-ui'
import { CommentKit, commentToolbar, Editor, EditorContent, EditorFixedMenu } from 'frappe-ui/editor'
import IconBuilding from '~icons/lucide/building-2'
import IconClose from '~icons/lucide/x'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import FollowUps from '../components/FollowUps.vue'
import ActivityFeed from '../components/ActivityFeed.vue'
import PanelSection from '../components/PanelSection.vue'
import PanelField from '../components/PanelField.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { budgetLabel, criteriaLines } from '../data/custom'
import { answerRows } from '../data/company'
import { scopeSentence } from '../data/modules'
import { PARTNER_SELF, PRM_LOST_REASONS } from '../data/partnerView'
import { CRMS, PRM_STAGES } from '../data/partnerAccount'
import { PROBABILITY } from '../data/records'
import { firmFor } from '../data/partnership'
import { companyName, isClosed, meFor, stageTheme, useLeads } from '../composables/useLeads'

// SCREEN — one lead, the same shape as a customer: tabs (Messages,
// Follow-ups, Activity, Notes) and a docked panel of facts on the right.
// Messages opens first with the reply box always open under it.
//
// ⚠️ THE COMPANY CARD IS NOT A MESSAGE HERE. On the business side, shortlisting
// posts the company's details into the thread as a card. A partner refers back
// to those facts for as long as the lead runs, and a card scrolls away, so they
// live in the panel and the timeline keeps one line marking when they arrived.

const route = useRoute()
const store = useConnectStore()
const account = usePartnerAccountStore()
const leads = useLeads()

// The firm, as it signs its messages: Software@Work has a listing and a logo;
// the Beginner firm isn't listed yet, so it's its name.
const self = computed(() =>
  store.partnerTier === 'beginner' ? { name: firmFor('beginner').name } : PARTNERS.find((p) => p.id === PARTNER_SELF.partnerId),
)
const selfLogo = computed(() => (store.partnerTier === 'beginner' ? null : logoFor(PARTNER_SELF.partnerId)))

const lead = computed(() => leads.value.find((t) => t.id === route.params.id) ?? null)
const closed = computed(() => (lead.value ? isClosed(lead.value) : false))
const crm = computed(() => account.edits.crm)
// Leads are Sales' and the owner's: the rail hides them from Finance and
// Members, so anyone else arriving by link reads without acting.
const canAct = computed(() => ['owner', 'sales'].includes(store.partnerRole))

// Who's acting: the person the demo role stands for, from Team.
const me = computed(() => meFor(store))
const nameOf = (id) => account.team.find((p) => p.id === id)?.name ?? 'Unassigned'
const meName = computed(() => nameOf(me.value))
const authorOf = (m) => (m.from === 'you' ? (m.by ? nameOf(m.by) : store.partnerTier === 'beginner' ? nameOf(me.value) : PARTNER_SELF.person) : (lead.value.company?.contact ?? companyName(lead.value)))

// ── Stage, owner, probability ───────────────────────────────────────────────
// With a CRM connected, stages come from it and aren't set here.
const logChange = (field, from, to) => account.log(lead.value.id, { by: meName.value, kind: 'change', field, from, to })
const stageOptions = PRM_STAGES.filter((s) => s !== 'Won').map((s) => ({ label: s, value: s }))
const losing = ref(false)
const lostReason = ref(PRM_LOST_REASONS[0])
function setStage(stage) {
  if (stage === lead.value.stage) return
  // Lost always asks why, from the PRM portal's list.
  if (stage === 'Lost') {
    lostReason.value = PRM_LOST_REASONS[0]
    losing.value = true
    return
  }
  logChange('Stage', lead.value.stage, stage)
  lead.value.stage = stage
  // Moving a closed lead back to an open stage reopens it.
  lead.value.closed = isClosed(lead.value) ? { stage } : null
}
function confirmLost() {
  logChange('Stage', lead.value.stage, 'Lost')
  lead.value.stage = 'Lost'
  lead.value.closed = { stage: 'Lost', reason: lostReason.value }
  losing.value = false
  toast.success('Marked as lost')
}
const people = computed(() =>
  account.team.filter((p) => p.roles.includes('sales') || p.roles.includes('owner')).map((p) => ({ label: p.name, value: p.id })),
)
const ownerOptions = computed(() => [{ label: 'Unassigned', value: 'none' }, ...people.value])
function setOwner(id) {
  const next = id === 'none' ? null : id
  if (next === lead.value.owner) return
  logChange('Assigned to', nameOf(lead.value.owner), nameOf(next))
  lead.value.owner = next
}
function setProbability(p) {
  logChange('Probability', lead.value.probability ?? 'Not set', p)
  lead.value.probability = p
}
const stageMenu = computed(() => stageOptions.map((o) => ({ label: o.label, onClick: () => setStage(o.value) })))
const ownerMenu = computed(() => ownerOptions.value.map((o) => ({ label: o.label, onClick: () => setOwner(o.value) })))
const probabilityOptions = PROBABILITY.map((p) => ({ label: p, value: p }))

// ── Tabs ────────────────────────────────────────────────────────────────────
// The customer page's shape: Messages first, since replying is the job, then
// Follow-ups, Activity and Notes. All four always show; each empty one says
// what goes there.
const TABS = [
  { value: 'messages', label: 'Messages', icon: 'lucide-message-square' },
  { value: 'followups', label: 'Follow-ups', icon: 'lucide-phone' },
  { value: 'activity', label: 'Activity', icon: 'lucide-history' },
  { value: 'notes', label: 'Notes', icon: 'lucide-sticky-note' },
]
const tab = ref('messages')

const teamPeople = computed(() => account.team.map((p) => ({ id: p.id, name: p.name })))
const followUps = computed(() => (lead.value ? account.followUpsOf(lead.value.id) : []))
// The history: what the team changed. Newest last, as a timeline reads.
const activity = computed(() => (lead.value ? account.activityOf(lead.value.id) : []))
// The team's own notes, newest first. Never sent to the business.
const notes = computed(() => [...(lead.value?.notes ?? [])].sort((a, b) => b.at - a.at))

const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Reply, always open under Messages ───────────────────────────────────────
// Connect messages are short, so there's no click to open the box. It only
// ever goes to the business: notes have their own tab.
const draft = ref('')
const composer = ref(null)
const feed = ref(null)
const EXTENSIONS = [CommentKit.configure({ image: false, video: false, attachment: false, table: false })]
const toBottom = () =>
  nextTick(() => {
    const el = feed.value?.$el?.querySelector('[data-reka-scroll-area-viewport]') ?? null
    if (el) el.scrollTop = el.scrollHeight
  })
function send() {
  if (composer.value?.isEmpty) return
  lead.value.messages.push({ id: `m-${Date.now()}`, from: 'you', kind: 'text', at: Date.now(), body: draft.value, by: me.value })
  draft.value = ''
  toBottom()
}
// A card's own Reply quotes it into the box, as Helpdesk does.
const plain = (html) => {
  const el = document.createElement('div')
  el.innerHTML = html ?? ''
  return el.textContent.trim()
}
const escape = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function quoteReply(m) {
  draft.value = `<blockquote><p>${escape(plain(m.body))}</p></blockquote><p></p>`
  nextTick(() => composer.value?.editor?.commands?.focus?.('end'))
}
// Says it copied only once it has.
const copy = (text, done) =>
  navigator.clipboard
    ? navigator.clipboard.writeText(text).then(() => toast.success(done), () => toast.error('Couldn’t copy'))
    : toast.error('Couldn’t copy')
const messageMenu = (m) => [
  {
    label: 'Copy text',
    icon: 'lucide-copy',
    onClick: () => copy(plain(m.body), 'Copied'),
  },
  {
    label: 'Copy link',
    icon: 'lucide-link',
    onClick: () => copy(`${window.location.href.split('#')[0]}#msg-${m.id}`, 'Link copied'),
  },
]

const onKey = (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  e.preventDefault()
  e.stopPropagation()
  send()
}

// ── Notes and follow-ups ────────────────────────────────────────────────────
const noteDraft = ref('')
function addNote() {
  const body = noteDraft.value.trim()
  if (!body) return
  ;(lead.value.notes ??= []).push({ id: `note-${Date.now()}`, at: Date.now(), by: me.value, text: body })
  noteDraft.value = ''
  toast.success('Note added')
}
function addFollowUp(f) {
  account.addFollowUp(lead.value.id, { ...f, by: me.value })
  toast.success('Follow-up added')
}

// ── The panel ───────────────────────────────────────────────────────────────
// Docked from `lg`; below that it opens over the timeline from the top bar.
const sideOpen = ref(false)
const projectRows = computed(() => {
  const b = lead.value?.brief ?? {}
  return [
    { label: 'Modules', value: scopeSentence(b.modules) },
    { label: 'Budget', value: budgetLabel(b.budget) },
    { label: 'Industry', value: b.segments?.[0] ?? '' },
    { label: 'Country', value: b.country ?? '' },
    { label: 'Size', value: b.employees ? `${b.employees} people` : '' },
    ...answerRows(b),
  ].filter((r) => r.value)
})
const criteria = computed(() =>
  lead.value ? criteriaLines({ country: lead.value.brief.country, segments: lead.value.brief.segments }, lead.value.brief) : [],
)
const companyRows = computed(() => {
  const c = lead.value?.company
  if (!c) return []
  return [
    { label: 'Name', value: c.name },
    { label: 'Contact', value: c.contact },
    { label: 'Email', value: c.email },
    { label: 'Phone', value: c.phone },
  ].filter((r) => r.value)
})

watch(
  () => route.params.id,
  () => {
    sideOpen.value = false
    tab.value = 'messages'
    draft.value = ''
    noteDraft.value = ''
    toBottom()
  },
  { immediate: true },
)
function copyLink() {
  navigator.clipboard?.writeText(window.location.href)
  toast.success('Link copied')
}
const reasonOptions = PRM_LOST_REASONS.map((r) => ({ label: r, value: r }))
</script>

<template>
  <ConnectShell root-label="Leads" root-to="/connect/leads" :crumb="lead?.project ?? 'Not found'" flush>
    <!-- Owner and stage where Helpdesk and CRM put status. -->
    <template v-if="lead" #action>
      <div class="flex items-center gap-2">
        <div v-if="canAct" class="hidden items-center gap-2 sm:flex">
          <Dropdown v-if="!closed" :options="ownerMenu" align="end">
            <Button variant="subtle" :aria-label="`Assigned to ${nameOf(lead.owner)}`">
              <template #prefix><Avatar v-if="lead.owner" :label="nameOf(lead.owner)" size="xs" /></template>
              {{ lead.owner ? nameOf(lead.owner) : 'Assign' }}
            </Button>
          </Dropdown>
          <Badge
            v-if="crm"
            variant="subtle"
            :theme="stageTheme(lead.stage)"
            :label="lead.stage"
            :title="`Synced from ${CRMS[crm.crm].label}`"
          />
          <!-- Stays a menu on a closed lead: picking an open stage reopens it. -->
          <Dropdown v-else :options="stageMenu" align="end">
            <Button variant="subtle" icon-right="lucide-chevron-down" :label="lead.stage" />
          </Dropdown>
        </div>
        <Badge v-else variant="subtle" :theme="stageTheme(lead.stage)" :label="lead.stage" />
        <Button class="lg:hidden" variant="ghost" icon="lucide-panel-right" aria-label="Details" @click="sideOpen = true" />
      </div>
    </template>

    <EmptyState v-if="!lead" icon="lucide-inbox" title="This lead isn’t in your list">
      <Button label="All leads" route="/connect/leads" />
    </EmptyState>

    <div v-else class="relative flex min-h-0 min-w-0 flex-1">
      <!-- ── The timeline ─────────────────────────────────────────────── -->
      <section class="flex min-h-0 min-w-0 flex-1 flex-col">
        <!-- Frappe CRM's tabs: default size, an icon with each, the row as tall
             as the top bar and running edge to edge. -->
        <Tabs v-model="tab" class="shrink-0">
          <TabList class="fc-tabs-scroll h-11 px-3 sm:px-5">
            <TabTrigger v-for="t in TABS" :key="t.value" :value="t.value" :label="t.label" :icon-left="t.icon" />
          </TabList>
        </Tabs>
        <ScrollArea ref="feed" class="min-h-0 flex-1">
          <!-- CRM's content inset: 40px each side, the title 32px down. -->
          <div class="px-3 pb-6 sm:px-10">
            <!-- ── Messages ─────────────────────────────────────────── -->
            <template v-if="tab === 'messages'">
              <!-- No title: the tab says it, and the conversation is the page. -->
              <p class="mt-6 text-center text-p-sm text-ink-gray-5">Sent to you and the other partners who match</p>
              <template v-for="m in lead.messages" :key="m.id">
              <!-- The moment the company became known. -->
              <p v-if="m.kind === 'shared'" class="mt-6 text-center text-p-sm text-ink-gray-5">
                <span class="text-ink-gray-7">{{ lead.company.name }}</span>
                is interested in your quote and shared their contact details · {{ time(m.at) }}
              </p>

              <div v-else :id="`msg-${m.id}`" class="mt-5 flex items-start gap-3">
                <Avatar
                  v-if="m.from === 'you' && selfLogo"
                  :image="selfLogo"
                  :label="self?.name"
                  size="xl"
                  shape="square"
                  class="fc-logo-avatar mt-0.5 shrink-0"
                />
                <Avatar v-else-if="m.from === 'you'" :label="self?.name" size="xl" shape="square" class="mt-0.5 shrink-0" />
                <Avatar v-else-if="lead.company" :label="lead.company.contact" size="xl" class="mt-0.5 shrink-0" />
                <Avatar v-else size="xl" shape="square" class="mt-0.5 shrink-0" aria-hidden="true">
                  <IconBuilding class="size-full text-ink-gray-5" />
                </Avatar>
                <!-- A reply, as Helpdesk draws one: a full-width card with who
                     and when on its header row, and its own actions on the
                     right. Kept light — a thin border, no band behind the
                     header — since Connect replies are short. -->
                <div v-if="m.kind === 'text'" class="min-w-0 flex-1 rounded-5 border border-outline-gray-2">
                  <div class="flex items-center gap-1.5 py-1 pl-3 pr-1">
                    <span class="truncate text-p-sm font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
                    <span class="text-p-sm text-ink-gray-5">·</span>
                    <span class="shrink-0 text-p-sm text-ink-gray-5">{{ time(m.at) }}</span>
                    <div class="ml-auto flex shrink-0 items-center">
                      <Button
                        v-if="canAct && !closed"
                        variant="ghost"
                        icon="lucide-reply"
                        aria-label="Reply to this message"
                        tooltip="Reply"
                        @click="quoteReply(m)"
                      />
                      <Dropdown :options="messageMenu(m)" align="end">
                        <Button variant="ghost" icon="lucide-ellipsis" aria-label="More actions" />
                      </Dropdown>
                    </div>
                  </div>
                  <div class="fc-message px-3 pb-3 text-p-base text-ink-gray-8" v-html="m.body" />
                </div>

                <div v-else class="min-w-0 flex-1">
                  <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
                    <span class="font-medium text-ink-gray-8">{{ authorOf(m) }}</span>
                    <span class="text-ink-gray-5">·</span>
                    <span class="text-ink-gray-5">{{ time(m.at) }}</span>
                  </p>

                  <div v-if="m.kind === 'brief'" class="mt-1.5 w-full rounded-5 border border-outline-gray-2 p-3.5">
                    <p class="text-p-base font-medium text-ink-gray-8">{{ lead.project }}</p>
                    <p class="mt-1.5 line-clamp-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7">{{ lead.brief.scope }}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p class="text-p-base text-ink-gray-8"><span class="text-ink-gray-5">Budget</span> {{ budgetLabel(lead.brief.budget) }}</p>
                      <p v-if="lead.brief.segments?.[0]" class="text-p-base text-ink-gray-8">
                        <span class="text-ink-gray-5">Industry</span> {{ lead.brief.segments[0] }}
                      </p>
                    </div>
                  </div>

                  <div v-else-if="m.kind === 'bid'" class="mt-1.5 w-full rounded-5 border border-outline-gray-2 p-3.5">
                    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <p class="text-p-lg font-semibold tabular-nums text-ink-gray-9">{{ m.bid.price }}</p>
                      <p class="text-p-base text-ink-gray-6">about {{ m.bid.weeks }} weeks</p>
                    </div>
                    <p class="mt-2 text-p-base leading-relaxed text-ink-gray-7">{{ m.bid.note }}</p>
                    <!-- Once they're interested, the line under the quote says so. -->
                    <Badge v-if="!lead.company" class="mt-3" theme="gray" label="Waiting on their decision" />
                  </div>
                </div>
              </div>
              </template>
            </template>

            <!-- ── Follow-ups: calls, demos, emails and meetings held
                 outside Connect, as the PRM records them. -->
            <FollowUps
              v-else-if="tab === 'followups'"
              title="Follow-ups"
              :items="followUps"
              :people="teamPeople"
              :contact="lead.company?.contact ?? ''"
              :synced-from="crm ? CRMS[crm.crm].label : ''"
              :can-add="canAct && !closed"
              @add="addFollowUp"
            />

            <!-- ── Activity: the history, as on a customer ──────────── -->
            <template v-else-if="tab === 'activity'">
              <div class="mb-3 mt-3 flex items-center justify-between sm:mb-4 sm:mt-8"><h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Activity</h2></div>
              <ActivityFeed :items="activity" />
            </template>

            <!-- ── Notes: the team's own, never sent to the business ── -->
            <template v-else>
              <div class="mb-3 mt-3 flex items-center justify-between sm:mb-4 sm:mt-8"><h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Notes</h2>
                <Button v-if="canAct && !closed" variant="solid" icon-left="lucide-plus" label="Add note" :disabled="!noteDraft.trim()" @click="addNote" />
              </div>
              <Textarea v-if="canAct && !closed" v-model="noteDraft" :rows="3" placeholder="Add a note for your team" />
              <ul v-if="notes.length" class="mt-4 divide-y divide-outline-gray-1">
                <li v-for="n in notes" :key="n.id" class="flex items-start gap-3 py-3">
                  <Avatar :label="nameOf(n.by)" size="md" class="mt-0.5 shrink-0" />
                  <div class="min-w-0 flex-1">
                    <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
                      <span class="font-medium text-ink-gray-8">{{ nameOf(n.by) }}</span>
                      <span class="text-ink-gray-5">·</span>
                      <span class="text-ink-gray-5">{{ time(n.at) }}</span>
                    </p>
                    <p class="mt-1 whitespace-pre-line text-p-base text-ink-gray-8">{{ n.text }}</p>
                  </div>
                </li>
              </ul>
              <EmptyState v-else-if="!canAct || closed" icon="lucide-sticky-note" title="No notes yet" />
            </template>
          </div>
        </ScrollArea>

        <!-- ── Reply, always open under Messages ───────────────────────── -->
        <div v-if="tab === 'messages'" class="shrink-0">
          <p v-if="closed || !canAct" class="border-t border-outline-gray-1 px-3 py-2.5 text-center text-p-sm text-ink-gray-5 sm:px-10">
            {{ closed ? 'This lead is closed.' : 'Sales and your firm’s owner work on leads.' }}
          </p>
          <div v-else class="border-t border-outline-gray-1 px-3 py-2.5 sm:px-10">
            <Editor ref="composer" v-model="draft" :extensions="EXTENSIONS" placeholder="Reply to the business…">
              <template #default="{ isEmpty }">
                <div
                  class="group rounded-4 border border-transparent bg-surface-gray-2 p-2 transition-colors focus-within:border-outline-gray-4 focus-within:bg-surface-base focus-within:shadow-sm"
                  @keydown.capture="onKey"
                >
                  <EditorContent class="fc-composer max-h-40 min-h-6 overflow-y-auto px-1" />
                  <!-- Always shown, so the box doesn't grow on focus and push the
                       conversation up. -->
                  <div class="mt-2 flex items-center gap-2">
                    <EditorFixedMenu :items="commentToolbar" button-size="sm" />
                    <Button class="ml-auto" variant="solid" size="sm" label="Send" :disabled="isEmpty" @click="send" />
                  </div>
                </div>
              </template>
            </Editor>
          </div>
        </div>
      </section>

      <!-- ── The panel ─────────────────────────────────────────────────── -->
      <!-- Frappe CRM's side panel, the same as a customer's: 352px, a header
           block with who it is and quick actions, then collapsible sections of
           label and value. The project before the company, because it is there
           from the first message; the company arrives later and only if they
           choose.
           ⚠️ The empty company section is kept, not hidden: it is what tells
           a partner that more is coming and what brings it. -->
      <aside
        class="w-full shrink-0 flex-col border-l border-outline-gray-1 bg-surface-base sm:w-[352px] lg:static lg:flex lg:shadow-none"
        :class="sideOpen ? 'absolute inset-y-0 right-0 z-10 flex shadow-lg' : 'hidden'"
      >
        <div class="min-h-0 flex-1 overflow-y-auto">
          <div class="flex items-center gap-5 border-b border-outline-gray-1 p-5">
            <Avatar v-if="lead.company" :label="lead.company.name" size="3xl" shape="square" />
            <Avatar v-else size="3xl" shape="square" aria-hidden="true">
              <IconBuilding class="size-full text-ink-gray-5" />
            </Avatar>
            <div class="flex min-w-0 flex-1 flex-col gap-2.5">
              <p class="truncate text-3xl font-medium text-ink-gray-9">{{ companyName(lead) }}</p>
              <div class="flex gap-1.5">
                <Button
                  v-if="lead.company?.email"
                  icon="lucide-mail"
                  :aria-label="`Email ${lead.company.contact}`"
                  :tooltip="`Email ${lead.company.contact}`"
                  :href="`mailto:${lead.company.email}`"
                />
                <Button icon="lucide-link" aria-label="Copy link" tooltip="Copy link" @click="copyLink" />
              </div>
            </div>
            <Button class="self-start lg:hidden" variant="ghost" aria-label="Close details" @click="sideOpen = false">
              <template #icon><IconClose class="size-4" /></template>
            </Button>
          </div>

          <div class="divide-y divide-outline-gray-1">
            <PanelSection title="Lead">
              <!-- Phones only: the top bar has no room for these. -->
              <PanelField class="sm:hidden" label="Stage">
                <span v-if="crm || !canAct" class="px-2">{{ lead.stage }}</span>
                <Select v-else variant="ghost" :model-value="lead.stage" :options="stageOptions" @update:model-value="setStage" />
              </PanelField>
              <PanelField class="sm:hidden" label="Assigned to">
                <span v-if="closed || !canAct" class="px-2">{{ nameOf(lead.owner) }}</span>
                <Select v-else variant="ghost" :model-value="lead.owner ?? 'none'" :options="ownerOptions" @update:model-value="setOwner" />
              </PanelField>
              <PanelField v-if="closed && lead.closed?.reason" label="Reason">
                <span class="px-2">{{ lead.closed.reason }}</span>
              </PanelField>
              <PanelField label="Probability">
                <span v-if="crm || closed || !canAct" class="px-2">{{ lead.probability ?? '—' }}</span>
                <Select
                  v-else
                  variant="ghost"
                  :model-value="lead.probability"
                  :options="probabilityOptions"
                  placeholder="Not set"
                  @update:model-value="setProbability"
                />
              </PanelField>
              <PanelField label="Source"><span class="px-2">Connect</span></PanelField>
              <p v-if="crm && !closed" class="px-3 text-p-sm text-ink-gray-5">Synced from {{ CRMS[crm.crm].label }}</p>
            </PanelSection>

            <PanelSection title="Project">
              <p class="whitespace-pre-line px-3 text-p-base leading-relaxed text-ink-gray-7">{{ lead.brief.scope }}</p>
              <PanelField v-for="row in projectRows" :key="row.label" :label="row.label">
                <span class="px-2">{{ row.value }}</span>
              </PanelField>
              <PanelField label="Asked for">
                <ul class="space-y-1 px-2">
                  <li v-for="line in criteria" :key="line.text">{{ line.text }}</li>
                </ul>
              </PanelField>
            </PanelSection>

            <PanelSection title="Company">
              <template v-if="companyRows.length">
                <PanelField v-for="row in companyRows" :key="row.label" :label="row.label">
                  <span class="break-words px-2">{{ row.value }}</span>
                </PanelField>
              </template>
              <p v-else class="px-3 text-p-base leading-relaxed text-ink-gray-6">
                Their name and contact details appear here if they're interested in your quote.
              </p>
            </PanelSection>
          </div>
        </div>
      </aside>
    </div>


    <Dialog
      v-model:open="losing"
      title="Mark as lost"
      :actions="[
        { label: 'Cancel', onClick: ({ close }) => close() },
        { label: 'Mark lost', variant: 'solid', onClick: confirmLost },
      ]"
    >
      <Select v-model="lostReason" label="Why was it lost?" :options="reasonOptions" />
    </Dialog>
  </ConnectShell>
</template>
