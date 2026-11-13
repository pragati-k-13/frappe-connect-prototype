<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Badge, Button, Dialog, Dropdown, ScrollArea, Select, TabList, Tabs, TabTrigger, TextInput, Textarea, toast } from 'frappe-ui'
import IconBuilding from '~icons/lucide/building-2'
import IconClose from '~icons/lucide/x'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import FollowUps from '../components/FollowUps.vue'
import ActivityFeed from '../components/ActivityFeed.vue'
import PanelSection from '../components/PanelSection.vue'
import PanelField from '../components/PanelField.vue'
import PanelLink from '../components/PanelLink.vue'
import ThreadMessages from '../components/ThreadMessages.vue'
import ReplyBox from '../components/ReplyBox.vue'
import BriefDetailsDialog from '../components/BriefDetailsDialog.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PARTNERS } from '../data/partners'
import { logoFor } from '../data/logos'
import { budgetLabel, timelineLabel } from '../data/custom'
import { scopeSentence } from '../data/modules'
import { PARTNER_SELF, PRM_LOST_REASONS } from '../data/partnerView'
import { CRMS, PRM_STAGES } from '../data/partnerAccount'
import { PROBABILITY } from '../data/records'
import { firmFor } from '../data/partnership'
import { companyName, confirmQuote, crmLabel, hasThread, winLead, isClosed, isCrm, originLabel, matchFor, meFor, sendHireRequest, sendQuote, stageTheme, useLeads, withdrawHireRequest } from '../composables/useLeads'
import SendQuoteDialog from '../components/SendQuoteDialog.vue'

// SCREEN — one lead, the same shape as a customer: tabs (Messages,
// Follow-ups, Activity, Notes) and a docked panel of facts on the right.
// Messages opens first with the reply box always open under it.
//
// Two sources (PARTNER-VIEW-PLAN.md, "Lead to customer"). A Connect brief has
// its thread; a CRM lead has none, since the business isn't on Connect, and
// its stage is the CRM's. Won comes from the business hiring in Connect or
// from the CRM, never by hand here. A won lead stays a lead: its thread ends
// at the hire and points to the customer.
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
const won = computed(() => lead.value?.stage === 'Won')
const fromCrm = computed(() => (lead.value ? isCrm(lead.value) : false))
// CRM leads and leads added here: the business isn't on Connect, so no thread.
const threaded = computed(() => (lead.value ? hasThread(lead.value) : false))
const crm = computed(() => account.edits.crm)
const customer = computed(() => account.customers.find((c) => c.id === lead.value?.customerId) ?? null)

// ── The customer this company already is ────────────────────────────────────
// Asked once the company is known, inline in the panel, never blocking: an
// automatic match (same Connect account, or the CRM's organization) just
// shows; a guess from the email domain asks.
const match = computed(() => (lead.value && !customer.value ? matchFor(lead.value, account.customers) : null))
const asking = computed(() => match.value && !match.value.auto && !lead.value.customerMatch && !closed.value && canAct.value)
const linkedCustomer = computed(() =>
  customer.value ?? (match.value && (match.value.auto || lead.value.customerMatch === 'yes') ? match.value.customer : null),
)
function answerMatch(yes) {
  lead.value.customerMatch = yes ? 'yes' : 'no'
  if (yes) {
    logChange('Customer', 'Not set', match.value.customer.name)
    toast.success(`Linked to ${match.value.customer.name}`)
  }
}
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
// Won is in the menu so the rule is visible where you'd look for it: picking
// it asks the business to confirm the hire, since the hire is where they agree
// to the terms. The stage turns Won when they do.
const stageOptions = PRM_STAGES.map((s) => ({ label: s, value: s }))
const losing = ref(false)
const lostReason = ref(PRM_LOST_REASONS[0])
const askingHire = ref(false)
const notYet = ref(false)
function renameLead(title) {
  const t = title.trim()
  if (!t || t === lead.value.project) return
  logChange('Title', lead.value.project, t)
  lead.value.project = t
}
function setStage(stage) {
  if (stage === lead.value.stage) return
  if (stage === 'Won') {
    // No thread, so no hire to ask for: Won is the partner's to set.
    if (!threaded.value) {
      winLead(lead.value, account, meName.value)
      toast.success(`${lead.value.company.name} is now a customer`)
      return
    }
    if (lead.value.hireRequest) return
    if (lead.value.company) askingHire.value = true
    else notYet.value = true
    return
  }
  // Closing a lead takes back a hire request that's still out.
  if (['Lost', 'Junk', 'Closed'].includes(stage)) withdrawHireRequest(lead.value, account, meName.value)
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
function sendRequest() {
  sendHireRequest(lead.value, account, meName.value)
  askingHire.value = false
  toast.success(`Sent to ${lead.value.company.name}`)
}
function withdraw() {
  const l = lead.value
  const request = l.hireRequest
  withdrawHireRequest(l, account, meName.value)
  toast.success('Hire request withdrawn', {
    action: {
      label: 'Undo',
      onClick: () => {
        l.messages = l.messages.filter((m) => m.kind !== 'hire-withdrawn' || m.at < request.at)
        l.hireRequest = request
      },
    },
  })
}
function confirmLost() {
  withdrawHireRequest(lead.value, account, meName.value)
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
// A CRM lead has no Messages: there's no thread to show.
const TABS = computed(() =>
  [
    threaded.value && { value: 'messages', label: 'Messages', icon: 'lucide-message-square' },
    { value: 'followups', label: 'Follow-ups', icon: 'lucide-phone' },
    { value: 'activity', label: 'Activity', icon: 'lucide-history' },
    { value: 'notes', label: 'Notes', icon: 'lucide-sticky-note' },
  ].filter(Boolean),
)
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
const reply = ref(null)
const feed = ref(null)
const toBottom = () =>
  nextTick(() => {
    const el = feed.value?.$el?.querySelector('[data-reka-scroll-area-viewport]') ?? null
    if (el) el.scrollTop = el.scrollHeight
  })
function send(body) {
  lead.value.messages.push({ id: `m-${Date.now()}`, from: 'you', kind: 'text', at: Date.now(), body, by: me.value })
  toBottom()
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
// Every short fact of the requirements, once. The Requirements dialog opened
// from here leaves them out and holds only the written parts.
const projectRows = computed(() => {
  const b = lead.value?.brief ?? {}
  return [
    { label: 'Modules', value: scopeSentence(b.modules) },
    { label: 'Budget', value: budgetLabel(b.budget) },
    { label: 'Timeline', value: b.timeline ? timelineLabel(b.timeline) : '' },
    { label: 'Industry', value: b.segments?.[0] ?? '' },
    { label: 'Size', value: b.employees ? `${b.employees} people` : '' },
  ].filter((r) => r.value)
})
const briefOpen = ref(false)
// What the dialog leaves out: always the facts, which the panel lists; and the
// description too when opened from under the message that carries it.
const briefOmit = ref(['facts'])
// A specific version, when opened from one message's Requirements button; the
// lead's current requirements otherwise.
const briefVersion = ref(null)
const briefPrevious = ref(null)
const briefDoc = computed(() => {
  const b = briefVersion.value ?? lead.value?.brief
  return b ? { ...b, project: lead.value.project } : null
})
// From a message: the description is that message's own text. From an update,
// the facts stay in, because they show what changed and the panel can't.
function readBrief({ brief = null, previous = null } = {}) {
  briefVersion.value = brief
  briefPrevious.value = previous
  briefOmit.value = previous ? ['description'] : ['facts', 'description']
  briefOpen.value = true
}

// ── Answering a requirements update ─────────────────────────────────────────
const quoting = ref(false)
const lastBid = computed(() => lead.value?.messages?.findLast((m) => m.kind === 'bid' && m.from === 'you')?.bid ?? null)
function keepQuote() {
  confirmQuote(lead.value)
  toast.success('Quote confirmed')
}
function requote(bid) {
  sendQuote(lead.value, bid)
  toast.success('Quote sent')
}
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

// A message arriving while the thread is open (a requirements update, say)
// lands in view, with whatever it asks of you.
watch(
  () => lead.value?.messages?.length,
  (n, was) => {
    if (was != null && n > was) toBottom()
  },
)

watch(
  () => route.params.id,
  () => {
    sideOpen.value = false
    tab.value = lead.value && !hasThread(lead.value) ? 'followups' : 'messages'
    reply.value?.clear()
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
          <!-- Won only comes from the hire or the CRM, so it isn't a menu:
               a hired lead can't be reopened here by a slip. -->
          <Badge
            v-if="crm || fromCrm || won"
            variant="subtle"
            :theme="stageTheme(lead.stage)"
            :label="lead.stage"
            :title="fromCrm || crm ? `Set in ${crmLabel(account)}` : undefined"
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

    <EmptyState v-if="!lead" class="flex-1" icon="lucide-inbox" title="This lead isn’t in your list">
      <Button label="All leads" route="/connect/leads" />
    </EmptyState>

    <div v-else class="relative flex min-h-0 min-w-0 flex-1">
      <!-- ── The timeline ─────────────────────────────────────────────── -->
      <section class="flex min-h-0 min-w-0 flex-1 flex-col">
        <!-- Helpdesk's tabs bar: `md`, an icon with each, the rule edge to edge.
             The scroll sits on a wrapper, not the TabList: the underline hangs
             1px below the list, and the list's own overflow would clip it. -->
        <Tabs v-model="tab" class="shrink-0">
          <div class="fc-tabs-scroll">
            <TabList size="md" class="min-w-max px-3 py-1.5 sm:px-5">
              <TabTrigger v-for="t in TABS" :key="t.value" :value="t.value" :label="t.label" :icon-left="t.icon" />
            </TabList>
          </div>
        </Tabs>
        <ScrollArea ref="feed" class="min-h-0 flex-1">
          <!-- CRM's content inset: 40px each side, the title 32px down. -->
          <div class="px-3 pb-6 sm:px-10">
            <!-- ── Messages ─────────────────────────────────────────── -->
            <ThreadMessages
              v-if="tab === 'messages'"
              :messages="lead.messages"
              :company="lead.company"
              :brief="lead.brief"
              :self="self"
              :self-logo="selfLogo"
              :author-of="authorOf"
              :can-reply="canAct && !closed"
              @quote="(text) => reply?.quote(text)"
              @read-brief="readBrief"
              @confirm-quote="keepQuote"
              @new-quote="quoting = true"
            />

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
          <!-- Won: the thread carries on with the customer, so the box points
               there. The label names the list it opens in. -->
          <div v-if="won && customer" class="flex items-center justify-between gap-3 border-t border-outline-gray-1 px-3 py-2.5 sm:px-10">
            <p class="text-p-base text-ink-gray-7">{{ customer.name }} is a customer now.</p>
            <Button class="shrink-0" label="View in Customers" :route="`/connect/customers/${customer.id}?tab=messages`" />
          </div>
          <p v-else-if="closed || !canAct" class="border-t border-outline-gray-1 px-3 py-2.5 text-center text-p-sm text-ink-gray-5 sm:px-10">
            {{ closed ? 'This lead is closed.' : 'Sales and your firm’s owner work on leads.' }}
          </p>
          <div v-else class="px-3 py-2.5 sm:px-10">
            <ReplyBox ref="reply" @send="send" />
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
          <div class="border-b border-outline-gray-1 p-5">
          <div class="flex items-center gap-5">
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
          <!-- Who this is, so it sits under the name: asked once the company is
               known, and a win then adds the project to that customer. -->
          <div v-if="asking" class="mt-4 rounded-4 bg-surface-gray-2 p-3">
            <p class="text-pretty text-p-base text-ink-gray-8">
              Same company as <span class="font-medium">{{ match.customer.name }}</span>, your customer?
            </p>
            <div class="mt-2 flex gap-2">
              <Button variant="outline" label="Yes, link" @click="answerMatch(true)" />
              <Button variant="ghost" label="Not them" @click="answerMatch(false)" />
            </div>
          </div>
          </div>

          <div class="divide-y divide-outline-gray-1">
            <PanelSection title="Lead">
              <!-- Phones only: the top bar has no room for these. -->
              <PanelField class="sm:hidden" label="Stage">
                <span v-if="crm || fromCrm || won || !canAct" class="px-2">{{ lead.stage }}</span>
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
              <PanelField label="Source"><span class="px-2">{{ originLabel(lead) }}</span></PanelField>
              <!-- Where the lead is tracked, whatever its source: every lead
                   syncs while a CRM is connected. -->
              <PanelField v-if="crm" label="CRM">
                <PanelLink :label="crmLabel(account)" :href="crm.url" />
              </PanelField>
              <template v-if="lead.hireRequest">
                <PanelField label="Hire request">
                  <div class="px-2">
                    <p>Waiting for {{ lead.company.name }}</p>
                    <Button v-if="canAct" class="mb-1 mt-1.5" label="Withdraw" @click="withdraw" />
                  </div>
                </PanelField>
              </template>
              <PanelField v-if="linkedCustomer" label="Customer">
                <PanelLink :label="linkedCustomer.name" :avatar="linkedCustomer.name" :to="`/connect/customers/${linkedCustomer.id}`" />
              </PanelField>
            </PanelSection>

            <PanelSection v-if="!threaded" title="Project">
              <!-- A lead added here is titled from its apps; renamed here. -->
              <PanelField v-if="lead.source === 'added'" label="Title">
                <TextInput
                  v-if="canAct && !closed"
                  :model-value="lead.project"
                  variant="ghost"
                  aria-label="Title"
                  @change="renameLead($event.target.value)"
                  @keydown.enter="$event.target.blur()"
                />
                <span v-else class="truncate px-2">{{ lead.project }}</span>
              </PanelField>
              <PanelField v-if="lead.apps?.length" label="Apps">
                <span class="px-2">{{ lead.apps.join(', ') }}</span>
              </PanelField>
              <p v-if="lead.need" class="whitespace-pre-line px-3 text-p-base leading-relaxed text-ink-gray-7">{{ lead.need }}</p>
            </PanelSection>
            <PanelSection v-else title="Project">
              <PanelField v-for="row in projectRows" :key="row.label" :label="row.label">
                <span class="px-2">{{ row.value }}</span>
              </PanelField>
              <PanelField label="Requirements">
                <PanelLink label="View requirements" icon="lucide-file-text" @click="briefVersion = null; briefPrevious = null; briefOmit = ['facts']; briefOpen = true" />
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


    <BriefDetailsDialog v-model:open="briefOpen" :brief="briefDoc" :omit="briefOmit" :previous="briefPrevious" />
    <SendQuoteDialog v-model:open="quoting" :from="lastBid" @send="requote" />
    <Dialog
      v-if="lead?.company"
      v-model:open="askingHire"
      :title="`Ask ${lead.company.name} to confirm the hire?`"
      size="sm"
      :actions="[
        { label: 'Cancel', onClick: ({ close }) => close() },
        { label: 'Send request', variant: 'solid', onClick: sendRequest },
      ]"
    >
      <p class="text-p-base text-ink-gray-7">They agree to the terms in Connect. The lead turns Won when they do.</p>
    </Dialog>
    <Dialog
      v-model:open="notYet"
      title="Not yet"
      size="sm"
      :actions="[{ label: 'Close', onClick: ({ close }) => close() }]"
    >
      <p class="text-p-base text-ink-gray-7">They need to shortlist you before they can hire you.</p>
    </Dialog>
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
