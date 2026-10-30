<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, Dialog, Dropdown, ScrollArea, Select, toast } from 'frappe-ui'
import { CommentKit, commentToolbar, Editor, EditorContent, EditorFixedMenu } from 'frappe-ui/editor'
import IconBuilding from '~icons/lucide/building-2'
import IconClose from '~icons/lucide/x'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import FollowUpDialog from '../components/FollowUpDialog.vue'
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
import { companyName, isClosed, queue, stageTheme, useLeads } from '../composables/useLeads'

// SCREEN — one lead, laid out like a Helpdesk ticket: one timeline in the
// middle, a docked panel of facts on the right, and the actions pinned under
// the timeline. No tabs: the brief, the quote, the replies, what the team
// changed, the follow-ups and the team's own notes all read in one feed.
//
// ⚠️ THE COMPANY CARD IS NOT A MESSAGE HERE. On the business side, shortlisting
// posts the company's details into the thread as a card. A partner refers back
// to those facts for as long as the lead runs, and a card scrolls away, so they
// live in the panel and the timeline keeps one line marking when they arrived.

const route = useRoute()
const router = useRouter()
const store = useConnectStore()
const account = usePartnerAccountStore()
const leads = useLeads()

const self = PARTNERS.find((p) => p.id === PARTNER_SELF.partnerId)
const selfLogo = logoFor(PARTNER_SELF.partnerId)

const lead = computed(() => leads.value.find((t) => t.id === route.params.id) ?? null)
const closed = computed(() => (lead.value ? isClosed(lead.value) : false))
const crm = computed(() => account.edits.crm)
// Leads are Sales' and the owner's: the rail hides them from Finance and
// Members, so anyone else arriving by link reads without acting. A Beginner
// gets no briefs at all.
const canAct = computed(() => ['owner', 'sales'].includes(store.partnerRole))
const beginner = computed(() => store.partnerTier === 'beginner')

// Who's acting: the person the demo role stands for, from Team.
const me = computed(() => (store.partnerRole === 'sales' ? 'rahul-verma' : 'farhan-qureshi'))
const nameOf = (id) => account.team.find((p) => p.id === id)?.name ?? 'Unassigned'
const meName = computed(() => nameOf(me.value))
const authorOf = (m) => (m.from === 'you' ? (m.by ? nameOf(m.by) : PARTNER_SELF.person) : (lead.value.company?.contact ?? companyName(lead.value)))

// ── Previous and next ───────────────────────────────────────────────────────
// Working through replies without going back to the list each time.
const order = computed(() => {
  const ids = queue.value.includes(lead.value?.id) ? queue.value : leads.value.filter((t) => isClosed(t) === closed.value).map((t) => t.id)
  return ids.map((id) => leads.value.find((t) => t.id === id)).filter(Boolean)
})
const at = computed(() => order.value.findIndex((t) => t.id === lead.value?.id))
const go = (step) => {
  const next = order.value[at.value + step]
  if (next) router.push(`/connect/leads/${next.id}`)
}

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

// ── The timeline ────────────────────────────────────────────────────────────
// Messages, the team's notes, follow-ups and changes, oldest first.
const MODE_ICON = { Call: 'lucide-phone', Demo: 'lucide-presentation', Email: 'lucide-mail', Meeting: 'lucide-users' }
const timeline = computed(() => {
  if (!lead.value) return []
  const id = lead.value.id
  return [
    ...lead.value.messages.map((m) => ({ type: 'message', key: m.id, at: m.at, m })),
    ...(lead.value.notes ?? []).map((n) => ({ type: 'note', key: n.id, at: n.at, n })),
    ...account.followUpsOf(id).map((f) => ({ type: 'followup', key: f.id, at: f.at, f })),
    ...account.activityOf(id).filter((e) => e.kind === 'change').map((e) => ({ type: 'change', key: e.id, at: e.at, e })),
  ].sort((a, b) => a.at - b.at)
})

const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Composer: Reply, Note, Log follow-up ────────────────────────────────────
// Helpdesk's Reply and Comment. A reply goes to the business; a note stays
// with the team and never reaches them.
const mode = ref(null)
const draft = ref('')
const composer = ref(null)
const feed = ref(null)
const EXTENSIONS = [CommentKit.configure({ image: false, video: false, attachment: false, table: false })]
const toBottom = () =>
  nextTick(() => {
    const el = feed.value?.$el?.querySelector('[data-reka-scroll-area-viewport]') ?? null
    if (el) el.scrollTop = el.scrollHeight
  })
function startMode(m) {
  mode.value = m
  nextTick(() => composer.value?.editor?.commands?.focus?.())
}
function send() {
  if (composer.value?.isEmpty) return
  if (mode.value === 'note') {
    ;(lead.value.notes ??= []).push({ id: `note-${Date.now()}`, at: Date.now(), by: me.value, body: draft.value })
  } else {
    lead.value.messages.push({ id: `m-${Date.now()}`, from: 'you', kind: 'text', at: Date.now(), body: draft.value, by: me.value })
  }
  draft.value = ''
  mode.value = null
  toBottom()
}
const onKey = (e) => {
  if (e.key === 'Escape') {
    mode.value = null
    return
  }
  if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  e.preventDefault()
  e.stopPropagation()
  send()
}

const logging = ref(false)
function addFollowUp(f) {
  account.addFollowUp(lead.value.id, { ...f, by: me.value })
  toast.success('Follow-up logged')
  toBottom()
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
    mode.value = null
    sideOpen.value = false
    toBottom()
  },
  { immediate: true },
)
const reasonOptions = PRM_LOST_REASONS.map((r) => ({ label: r, value: r }))
</script>

<template>
  <ConnectShell root-label="Leads" root-to="/connect/leads" :crumb="lead?.project ?? 'Not found'" flush>
    <!-- Owner and stage where Helpdesk and CRM put status; then previous and
         next, to work through the list from here. -->
    <template v-if="lead && !beginner" #action>
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
        <div class="flex items-center">
          <Button variant="ghost" icon="lucide-chevron-up" aria-label="Previous lead" :disabled="at <= 0" @click="go(-1)" />
          <Button variant="ghost" icon="lucide-chevron-down" aria-label="Next lead" :disabled="at >= order.length - 1" @click="go(1)" />
        </div>
      </div>
    </template>

    <EmptyState v-if="beginner" icon="lucide-inbox" title="Leads from Connect start at Bronze">
      <Button label="View milestones" route="/connect/partnership" />
    </EmptyState>
    <EmptyState v-else-if="!lead" icon="lucide-inbox" title="This lead isn’t in your list">
      <Button label="All leads" route="/connect/leads" />
    </EmptyState>

    <div v-else class="relative flex min-h-0 min-w-0 flex-1">
      <!-- ── The timeline ─────────────────────────────────────────────── -->
      <section class="flex min-h-0 min-w-0 flex-1 flex-col">
        <ScrollArea ref="feed" class="min-h-0 flex-1">
          <div class="mx-auto max-w-[760px] px-5 py-6">
            <p class="text-center text-p-sm text-ink-gray-5">Sent to you and the other partners who match</p>

            <template v-for="item in timeline" :key="item.key">
              <!-- What the team changed: a line, like Helpdesk's status changes. -->
              <div v-if="item.type === 'change'" class="mt-4 flex items-baseline gap-3">
                <span class="flex w-8 shrink-0 justify-center" aria-hidden="true">
                  <span class="size-1.5 rounded-full bg-surface-gray-5" />
                </span>
                <p class="min-w-0 flex-1 text-p-sm text-ink-gray-5">
                  <span class="text-ink-gray-8">{{ item.e.by }}</span>{{ ' changed ' }}{{ item.e.field }}{{ ' ' }}<span
                    class="text-ink-gray-8"
                    >{{ item.e.from }}</span
                  >{{ ' → ' }}<span class="text-ink-gray-8">{{ item.e.to }}</span>
                </p>
                <span class="shrink-0 text-p-xs text-ink-gray-5">{{ time(item.at) }}</span>
              </div>

              <!-- A follow-up logged. -->
              <div v-else-if="item.type === 'followup'" class="mt-4 flex items-start gap-3">
                <span class="flex w-8 shrink-0 justify-center pt-0.5" aria-hidden="true">
                  <span :class="MODE_ICON[item.f.mode]" class="size-4 text-ink-gray-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline gap-3">
                    <p class="min-w-0 flex-1 text-p-sm text-ink-gray-5">
                      <span class="text-ink-gray-8">{{ nameOf(item.f.by) }}</span>{{ ` logged a ${item.f.mode.toLowerCase()}` }}<template v-if="item.f.spokeTo">{{ ' with ' }}<span class="text-ink-gray-8">{{ item.f.spokeTo }}</span></template>
                    </p>
                    <span class="shrink-0 text-p-xs text-ink-gray-5">{{ time(item.at) }}</span>
                  </div>
                  <p v-if="item.f.notes" class="mt-1 text-p-base text-ink-gray-7">{{ item.f.notes }}</p>
                </div>
              </div>

              <!-- The team's own note. Never sent to the business. -->
              <div v-else-if="item.type === 'note'" class="mt-5 flex items-start gap-3">
                <Avatar :label="nameOf(item.n.by)" size="xl" class="mt-0.5 shrink-0" />
                <div class="min-w-0 flex-1 rounded-5 bg-surface-gray-2 px-3.5 py-3">
                  <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
                    <span class="font-medium text-ink-gray-8">{{ nameOf(item.n.by) }}</span>
                    <span class="text-ink-gray-5">·</span>
                    <span class="text-ink-gray-5">Note, only your team sees it</span>
                    <span class="text-ink-gray-5">·</span>
                    <span class="text-ink-gray-5">{{ time(item.at) }}</span>
                  </p>
                  <div class="fc-message mt-1 text-p-base text-ink-gray-8" v-html="item.n.body" />
                </div>
              </div>

              <!-- The moment the company became known. -->
              <p v-else-if="item.m.kind === 'shared'" class="mt-6 text-center text-p-sm text-ink-gray-5">
                <span class="text-ink-gray-7">{{ lead.company.name }}</span>
                is interested in your quote and shared their contact details · {{ time(item.at) }}
              </p>

              <div v-else class="mt-5 flex items-start gap-3">
                <Avatar
                  v-if="item.m.from === 'you' && selfLogo"
                  :image="selfLogo"
                  :label="self.name"
                  size="xl"
                  shape="square"
                  class="fc-logo-avatar mt-0.5 shrink-0"
                />
                <Avatar v-else-if="item.m.from === 'you'" :label="self.name" size="xl" shape="square" class="mt-0.5 shrink-0" />
                <Avatar v-else-if="lead.company" :label="lead.company.contact" size="xl" class="mt-0.5 shrink-0" />
                <Avatar v-else size="xl" shape="square" class="mt-0.5 shrink-0" aria-hidden="true">
                  <IconBuilding class="size-full text-ink-gray-5" />
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="flex flex-wrap items-baseline gap-x-1.5 text-p-sm">
                    <span class="font-medium text-ink-gray-8">{{ authorOf(item.m) }}</span>
                    <span class="text-ink-gray-5">·</span>
                    <span class="text-ink-gray-5">{{ time(item.at) }}</span>
                  </p>

                  <div v-if="item.m.kind === 'text'" class="fc-message mt-1 max-w-[560px] text-p-base text-ink-gray-8" v-html="item.m.body" />

                  <div v-else-if="item.m.kind === 'brief'" class="mt-1.5 w-full max-w-[560px] rounded-5 border border-outline-gray-2 p-3.5">
                    <p class="text-p-base font-medium text-ink-gray-8">{{ lead.project }}</p>
                    <p class="mt-1.5 line-clamp-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7">{{ lead.brief.scope }}</p>
                    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p class="text-p-base text-ink-gray-8"><span class="text-ink-gray-5">Budget</span> {{ budgetLabel(lead.brief.budget) }}</p>
                      <p v-if="lead.brief.segments?.[0]" class="text-p-base text-ink-gray-8">
                        <span class="text-ink-gray-5">Industry</span> {{ lead.brief.segments[0] }}
                      </p>
                    </div>
                  </div>

                  <div v-else-if="item.m.kind === 'bid'" class="mt-1.5 w-fit max-w-[560px] rounded-5 border border-outline-gray-2 p-3.5">
                    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <p class="text-p-lg font-semibold tabular-nums text-ink-gray-9">{{ item.m.bid.price }}</p>
                      <p class="text-p-base text-ink-gray-6">about {{ item.m.bid.weeks }} weeks</p>
                    </div>
                    <p class="mt-2 text-p-base leading-relaxed text-ink-gray-7">{{ item.m.bid.note }}</p>
                    <!-- Once they're interested, the line under the quote says so. -->
                    <Badge v-if="!lead.company" class="mt-3" theme="gray" label="Waiting on their decision" />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </ScrollArea>

        <!-- ── Actions, pinned ──────────────────────────────────────────── -->
        <div class="shrink-0 border-t border-outline-gray-1">
          <p v-if="closed || !canAct" class="px-5 py-3 text-center text-p-sm text-ink-gray-5">
            {{ closed ? 'This lead is closed.' : 'Sales and your firm’s owner work on leads.' }}
          </p>

          <div v-else-if="mode" class="mx-auto max-w-[760px] px-5 py-3">
            <Editor
              ref="composer"
              v-model="draft"
              :extensions="EXTENSIONS"
              :placeholder="mode === 'note' ? 'Add a note for your team…' : 'Reply to the business…'"
            >
              <template #default="{ isEmpty }">
                <div
                  class="rounded-4 border border-outline-gray-2 p-2 focus-within:border-outline-gray-4"
                  :class="mode === 'note' ? 'bg-surface-gray-2' : 'bg-surface-base'"
                  @keydown.capture="onKey"
                >
                  <EditorContent class="fc-composer max-h-40 min-h-12 overflow-y-auto px-1" />
                  <div class="mt-2 flex items-center gap-2">
                    <EditorFixedMenu :items="commentToolbar" button-size="sm" />
                    <Button class="ml-auto" variant="ghost" size="sm" label="Cancel" @click="mode = null" />
                    <Button
                      variant="solid"
                      size="sm"
                      :label="mode === 'note' ? 'Add note' : 'Send'"
                      :disabled="isEmpty"
                      @click="send"
                    />
                  </div>
                </div>
              </template>
            </Editor>
          </div>

          <div v-else class="flex items-center gap-1 px-3 py-2">
            <Button variant="ghost" icon-left="lucide-reply" label="Reply" @click="startMode('reply')" />
            <Button variant="ghost" icon-left="lucide-sticky-note" label="Note" @click="startMode('note')" />
            <Button
              v-if="!crm"
              variant="ghost"
              icon-left="lucide-phone"
              label="Log follow-up"
              @click="logging = true"
            />
          </div>
        </div>
      </section>

      <!-- ── The panel ─────────────────────────────────────────────────── -->
      <!-- The project first, because it is there from the first message; the
           company under it, because it arrives later and only if they choose.
           ⚠️ The empty company section is kept, not hidden: it is what tells
           a partner that more is coming and what brings it. -->
      <aside
        class="w-full shrink-0 flex-col border-l border-outline-gray-1 bg-surface-base sm:w-[352px] lg:static lg:flex lg:shadow-none"
        :class="sideOpen ? 'absolute inset-y-0 right-0 z-10 flex shadow-lg' : 'hidden'"
      >
        <div class="flex shrink-0 items-center justify-between px-5 pt-3 lg:hidden">
          <h2 class="text-base font-medium text-ink-gray-8">Details</h2>
          <Button variant="ghost" size="sm" aria-label="Close details" @click="sideOpen = false">
            <template #icon><IconClose class="size-4" /></template>
          </Button>
        </div>
        <ScrollArea class="min-h-0 flex-1">
          <div class="space-y-8 px-5 py-5">
            <section>
              <h3 class="text-p-base font-medium text-ink-gray-8">Lead</h3>
              <dl class="mt-3 space-y-3">
                <!-- Phones only: the top bar has no room for these. -->
                <div class="sm:hidden">
                  <dt class="text-p-sm text-ink-gray-5">Stage</dt>
                  <dd class="mt-1">
                    <span v-if="crm || !canAct" class="text-p-base text-ink-gray-8">{{ lead.stage }}</span>
                    <Select v-else :model-value="lead.stage" :options="stageOptions" @update:model-value="setStage" />
                  </dd>
                </div>
                <div class="sm:hidden">
                  <dt class="text-p-sm text-ink-gray-5">Assigned to</dt>
                  <dd class="mt-1">
                    <span v-if="closed || !canAct" class="text-p-base text-ink-gray-8">{{ nameOf(lead.owner) }}</span>
                    <Select v-else :model-value="lead.owner ?? 'none'" :options="ownerOptions" @update:model-value="setOwner" />
                  </dd>
                </div>
                <div v-if="closed && lead.closed?.reason">
                  <dt class="text-p-sm text-ink-gray-5">Reason</dt>
                  <dd class="mt-0.5 text-p-base text-ink-gray-8">{{ lead.closed.reason }}</dd>
                </div>
                <div>
                  <dt class="text-p-sm text-ink-gray-5">Probability</dt>
                  <dd class="mt-1">
                    <span v-if="crm || closed || !canAct" class="text-p-base text-ink-gray-8">{{ lead.probability ?? '—' }}</span>
                    <Select
                      v-else
                      :model-value="lead.probability"
                      :options="probabilityOptions"
                      placeholder="Not set"
                      @update:model-value="setProbability"
                    />
                  </dd>
                </div>
              </dl>
              <p v-if="crm && !closed" class="mt-2 text-p-sm text-ink-gray-5">Synced from {{ CRMS[crm.crm].label }}</p>
            </section>

            <section>
              <h3 class="text-p-base font-medium text-ink-gray-8">Project</h3>
              <p class="mt-2 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-7">{{ lead.brief.scope }}</p>
              <dl class="mt-4 space-y-3">
                <div v-for="row in projectRows" :key="row.label">
                  <dt class="text-p-sm text-ink-gray-5">{{ row.label }}</dt>
                  <dd class="mt-0.5 text-p-base text-ink-gray-8">{{ row.value }}</dd>
                </div>
              </dl>
              <p class="mt-4 text-p-sm text-ink-gray-5">What they asked for</p>
              <ul class="mt-1.5 space-y-1">
                <li v-for="line in criteria" :key="line.text" class="text-p-base text-ink-gray-7">{{ line.text }}</li>
              </ul>
            </section>

            <section>
              <h3 class="text-p-base font-medium text-ink-gray-8">Company</h3>
              <dl v-if="companyRows.length" class="mt-2 space-y-3">
                <div v-for="row in companyRows" :key="row.label">
                  <dt class="text-p-sm text-ink-gray-5">{{ row.label }}</dt>
                  <dd class="mt-0.5 break-words text-p-base text-ink-gray-8">{{ row.value }}</dd>
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

    <FollowUpDialog v-if="lead" v-model:open="logging" :contact="lead.company?.contact ?? ''" @add="addFollowUp" />

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
