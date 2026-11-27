<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Badge, Button, FormControl, ScrollArea, Select, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import StageDot from '../components/StageDot.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { firmFor } from '../data/partnership'
import {
  AUDIT_STATUS,
  DEPARTMENTS,
  NC_STATUS,
  auditDate,
  auditDay,
  auditShortDate,
  auditTitle,
  canRespond,
  isDone,
  isOverdue,
} from '../data/audits'

// SCREEN — one audit, the same shape at every stage, in the 768px column
// Invoices uses. Named by the PMM level it's for, which a reschedule can't
// change, with press's ID beside it to quote in email. Three cards whose values
// fill in as the audit moves: the date with its status, the partner manager
// auditing, then the type, or once it's done, Frappe's result. What's still
// open shows in the list below, so the card doesn't count it.
//
// A completed audit lists its non-conformances as a compact list, what the
// partner has to fix first. A row opens it in the shell's docked panel, as an
// invoice does, where the partner says what changed and submits it for
// Frappe to review.

const route = useRoute()
const store = useConnectStore()
const account = usePartnerAccountStore()

const audit = computed(() => account.audits.find((a) => a.id === route.params.id) ?? null)
const crumb = computed(() => (audit.value ? auditTitle(audit.value) : 'Not found'))
const status = computed(() => AUDIT_STATUS[audit.value?.status] ?? AUDIT_STATUS.Requested)
const completed = computed(() => audit.value?.status === 'Completed')

const downloadReport = () => toast.success('Report downloaded')

// Before there are findings. A canceled audit won't have any, so it doesn't
// say "yet"; its badge already says why. On hold can still go ahead.
const emptyTitle = computed(() => {
  if (completed.value) return 'No non-conformances'
  if (audit.value?.status === 'Cancelled') return 'No findings'
  return 'No findings yet'
})

// ── Non-conformances ────────────────────────────────────────────────────────
const statusFilter = ref('all')
const department = ref('all')
// Both filters offer only what this audit has, in the list's own order, so
// no option leads to an empty list.
const STATUS_OPTIONS = computed(() => [
  { label: 'All statuses', value: 'all' },
  ...Object.keys(NC_STATUS)
    .filter((s) => audit.value?.ncs.some((n) => n.status === s))
    .map((s) => ({ label: NC_STATUS[s].label, value: s, dot: NC_STATUS[s].dot })),
])
const DEPARTMENT_OPTIONS = computed(() => [
  { label: 'All departments', value: 'all' },
  ...DEPARTMENTS.filter((d) => audit.value?.ncs.some((n) => n.department === d)).map((d) => ({ label: d, value: d })),
])
function clearFilters() {
  statusFilter.value = 'all'
  department.value = 'all'
}

// What needs the partner first, then what's waiting on Frappe, then what's
// done. Soonest due first within each.
const ncs = computed(() =>
  (audit.value?.ncs ?? [])
    .filter((n) => statusFilter.value === 'all' || n.status === statusFilter.value)
    .filter((n) => department.value === 'all' || n.department === department.value)
    .sort((a, b) => NC_STATUS[a.status].rank - NC_STATUS[b.status].rank || a.due.localeCompare(b.due)),
)

// The finding leads, as the audit does on the audits list and the lead does
// on Leads; its status sits next to it. On a phone the status shrinks to its
// dot beside the title, as Leads does.
const columns = { base: ['minmax(0,1fr)'], sm: ['minmax(0,1fr)', '7.5rem', '7rem'] }

// ── The docked non-conformance ──────────────────────────────────────────────
const openId = ref(null)
watch(() => route.params.id, () => (openId.value = null))
const nc = computed(() => audit.value?.ncs.find((n) => n.id === openId.value) ?? null)

// A draft per non-conformance, so stepping to another row keeps what was typed.
const drafts = reactive({})
watch(openId, (id) => {
  if (id && !drafts[id]) drafts[id] = { changed: '', evidence: null, error: '' }
})
const draft = computed(() => drafts[openId.value])
watch(() => draft.value?.changed, () => draft.value && (draft.value.error = ''))

const fileInput = ref(null)
function pickEvidence(e) {
  const file = e.target.files?.[0]
  if (file) draft.value.evidence = file.name
  e.target.value = ''
}

// ── The timeline ──
// The signed-in person reads as "You", as the store names them on submit.
const me = computed(() => account.edits?.me ?? firmFor(store.partnerTier).person)
const thisYear = new Date().getFullYear()
const when = (iso) => (Number(iso.slice(0, 4)) === thisYear ? auditShortDate(iso) : auditDate(iso))
// Neutral for a step, amber for the one that hands it back to the partner,
// green once it's closed.
const TONE = { neutral: 'bg-surface-gray-5', amber: 'bg-surface-amber-5', green: 'bg-surface-green-7' }
const LABEL = {
  submitted: (e) => `${e.by === me.value ? 'You' : e.by} submitted`,
  returned: (e) => `${e.by} sent it back`,
  closed: (e) => `${e.by} closed it`,
}
const events = computed(() => {
  const n = nc.value
  const a = audit.value
  if (!n || !a) return []
  return [
    { label: `${a.auditor?.name ?? 'Frappe'} raised this`, on: a.date, tone: 'neutral' },
    ...n.log.map((e) => ({
      label: LABEL[e.kind](e),
      on: e.on,
      text: e.text,
      evidence: e.evidence,
      tone: e.kind === 'returned' ? 'amber' : e.kind === 'closed' ? 'green' : 'neutral',
    })),
  ]
})
const nextLabel = computed(() => (nc.value?.log.length ? 'Your next answer' : 'Your answer'))

function submit() {
  const changed = draft.value.changed.trim()
  if (!changed) return (draft.value.error = 'Say what you changed')
  account.submitNonConformance(audit.value.id, nc.value.id, { changed, evidence: draft.value.evidence })
  delete drafts[nc.value.id]
  toast.success('Submitted for review')
}
</script>

<template>
  <ConnectShell root-label="Audits" root-to="/connect/audits" :crumb="crumb">
    <EmptyState v-if="!audit" class="flex-1" icon="lucide-clipboard-check" title="This audit isn’t in your list" />

    <div v-else class="fc-page-list py-8">
      <!-- The ID sits beside the title, to quote in email; it doesn't need a
           line of its own. -->
      <PageIntro :title="auditTitle(audit)" baseline class="!pb-3">
        <template #suffix><span class="text-base text-ink-gray-6">{{ audit.id }}</span></template>
        <template v-if="audit.report" #actions>
          <Button icon-left="lucide-download" label="Report" @click="downloadReport" />
        </template>
      </PageIntro>

      <!-- ── The facts, as Invoices shows a bill's figures ── -->
      <dl class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-4 border border-outline-gray-1 px-4 py-3">
          <dt class="text-sm text-ink-gray-5">{{ audit.date ? 'Date' : 'Proposed date' }}</dt>
          <dd class="mt-1.5 flex h-6 items-center gap-2">
            <span class="whitespace-nowrap text-base-medium text-ink-gray-7">{{ auditDate(auditDay(audit)) }}</span>
            <Badge variant="subtle" size="sm" :theme="status.theme" :label="status.label" />
          </dd>
        </div>
        <div class="rounded-4 border border-outline-gray-1 px-4 py-3">
          <dt class="text-sm text-ink-gray-5">Auditor</dt>
          <dd class="mt-1.5 flex h-6 min-w-0 items-center gap-2">
            <template v-if="audit.auditor">
              <Avatar :label="audit.auditor.name" size="sm" />
              <span class="truncate text-base-medium text-ink-gray-7">{{ audit.auditor.name }}</span>
            </template>
            <span v-else class="text-base text-ink-gray-5">Not assigned yet</span>
          </dd>
        </div>
        <div class="rounded-4 border border-outline-gray-1 px-4 py-3">
          <template v-if="completed">
            <dt class="text-sm text-ink-gray-5">Result</dt>
            <dd class="mt-1.5 flex h-6 min-w-0 items-center gap-1.5 whitespace-nowrap">
              <span class="text-base-medium text-ink-gray-7">{{ audit.result ?? 'Not recorded' }}</span>
            </dd>
          </template>
          <template v-else>
            <dt class="text-sm text-ink-gray-5">Type</dt>
            <dd class="mt-1.5 flex h-6 items-center text-base-medium text-ink-gray-7">{{ audit.type }}</dd>
          </template>
        </div>
      </dl>

      <!-- ── Non-conformances ── -->
      <template v-if="completed && audit.ncs.length">
        <div class="mt-10 flex flex-wrap items-center gap-2">
          <!-- Each status carries its list dot, in the menu and, once picked,
               in the closed select too. "All statuses" has none. -->
          <Select v-model="statusFilter" :options="STATUS_OPTIONS" class="min-w-36" aria-label="Status">
            <template #item-prefix="{ item }"><StageDot v-if="item.dot" :color="item.dot" /></template>
          </Select>
          <Select v-model="department" :options="DEPARTMENT_OPTIONS" class="min-w-40" aria-label="Department" />
        </div>

        <List
          v-if="ncs.length"
          v-model:active="openId"
          class="-mx-3 mt-4 list-gap-3 list-row-px-3 text-base"
          :columns="columns"
          :row-height="48"
        >
          <ListHeader>
            <ListHeaderCell>Non-conformance</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Status</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Due</ListHeaderCell>
          </ListHeader>
          <ListRows :items="ncs" v-slot="{ item, value }">
            <ListRow :value="value" @click="openId = item.id">
              <ListCell class="min-w-0 gap-2">
                <StageDot class="sm:hidden" :color="NC_STATUS[item.status].dot" />
                <span class="truncate text-ink-gray-8">{{ item.title }}</span>
              </ListCell>
              <ListCell class="hidden min-w-0 gap-2 sm:flex">
                <StageDot :color="NC_STATUS[item.status].dot" />
                <span class="truncate text-ink-gray-7">{{ NC_STATUS[item.status].label }}</span>
              </ListCell>
              <ListCell class="hidden whitespace-nowrap tabular-nums sm:flex">
                <span v-if="isDone(item)" class="text-ink-gray-4">—</span>
                <span v-else :class="isOverdue(item) ? 'text-ink-red-7' : 'text-ink-gray-6'">{{ auditDate(item.due) }}</span>
              </ListCell>
            </ListRow>
          </ListRows>
        </List>
        <EmptyState v-else icon="lucide-list-filter" title="No non-conformances match">
          <Button label="Clear filters" @click="clearFilters" />
        </EmptyState>
      </template>

      <EmptyState
        v-else
        class="mt-10"
        icon="lucide-clipboard-check"
        :title="emptyTitle"
      />
    </div>

    <!-- ── A non-conformance, docked ──────────────────────────────────────
         The title with its ID and department under it, then what the auditor
         wrote, then the back-and-forth as a timeline (Cloud v2's billing
         aside), oldest first. Its last, hollow point is the partner's turn,
         where the answer goes. Status and due sit in the highlighted row
         beside the panel, so the panel shows them only on a phone, where it
         covers the list. Submit stays pinned under the scroll. -->
    <template v-if="nc" #panel>
      <div class="flex shrink-0 items-start justify-between gap-3 border-b border-outline-gray-1 p-4">
        <div class="min-w-0">
          <h2 class="text-base-semibold text-ink-gray-9">{{ nc.title }}</h2>
          <p class="mt-1 text-p-sm text-ink-gray-6">{{ nc.id }} · {{ nc.department }}</p>
        </div>
        <Button variant="ghost" icon="lucide-x" aria-label="Close" class="-my-1" @click="openId = null" />
      </div>

      <ScrollArea class="min-h-0 flex-1" viewport-class="p-4 pb-10">
        <dl class="mb-6 grid grid-cols-[6rem_minmax(0,1fr)] gap-y-2.5 text-base md:hidden">
          <dt class="text-ink-gray-5">Status</dt>
          <dd class="flex items-center gap-2 text-ink-gray-8">
            <StageDot :color="NC_STATUS[nc.status].dot" />{{ NC_STATUS[nc.status].label }}
          </dd>
          <template v-if="!isDone(nc)">
            <dt class="text-ink-gray-5">Due</dt>
            <dd :class="isOverdue(nc) ? 'text-ink-red-7' : 'text-ink-gray-8'">
              {{ auditDate(nc.due) }}<template v-if="isOverdue(nc)"> · Overdue</template>
            </dd>
          </template>
        </dl>

        <div class="space-y-5">
          <section>
            <h3 class="text-base-medium text-ink-gray-7">Finding</h3>
            <p class="mt-1.5 text-p-base text-ink-gray-6">{{ nc.finding }}</p>
          </section>
          <section>
            <h3 class="text-base-medium text-ink-gray-7">Measures to close</h3>
            <p class="mt-1.5 text-p-base text-ink-gray-7">{{ nc.measures }}</p>
          </section>

          <!-- The timeline, as Cloud v2's billing aside draws its Activity: a
               dot per event on one rail, dropped after the last point so it
               doesn't dangle. Details are the content of the exchange, so
               they read darker than Cloud v2's gray-5 notes. -->
          <ol class="relative">
            <li v-for="(e, i) in events" :key="i" class="relative flex gap-3 pb-4 last:pb-0">
              <div class="relative flex w-2.5 shrink-0 justify-center">
                <span
                  v-if="i < events.length - 1 || canRespond(nc)"
                  class="absolute left-1/2 top-2 h-[calc(100%+1rem)] w-px -translate-x-1/2 bg-[var(--outline-gray-2)]"
                />
                <span class="relative z-10 mt-1 size-2 shrink-0 rounded-full" :class="TONE[e.tone]" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-sm font-medium text-ink-gray-7">{{ e.label }}</span>
                  <span class="shrink-0 tabular-nums text-p-xs text-ink-gray-5">{{ when(e.on) }}</span>
                </div>
                <p v-if="e.text" class="mt-0.5 text-p-sm text-ink-gray-7">{{ e.text }}</p>
                <p v-if="e.evidence" class="mt-1 flex items-center gap-1.5 text-p-sm text-ink-gray-7">
                  <span class="lucide-paperclip size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                  <span class="min-w-0 truncate">{{ e.evidence }}</span>
                </p>
              </div>
            </li>

            <!-- The partner's turn: the one point that hasn't happened yet. -->
            <li v-if="canRespond(nc)" class="relative flex gap-3">
              <div class="relative flex w-2.5 shrink-0 justify-center">
                <span class="relative z-10 mt-1 size-2 shrink-0 rounded-full border border-outline-gray-4 bg-surface-base" />
              </div>
              <div class="min-w-0 flex-1 space-y-2">
                <span class="block text-sm font-medium text-ink-gray-7">{{ nextLabel }}</span>
                <FormControl
                  v-model="draft.changed"
                  type="textarea"
                  placeholder="What you changed"
                  aria-label="What you changed"
                  :rows="4"
                  :error="draft.error"
                />
                <!-- Evidence is part of the answer: the button until a file is
                     picked, then the file. -->
                <div v-if="draft.evidence" class="flex items-center gap-2 text-p-sm text-ink-gray-7">
                  <span class="lucide-paperclip size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                  <span class="min-w-0 truncate">{{ draft.evidence }}</span>
                  <Button variant="ghost" size="sm" icon="lucide-x" :aria-label="`Remove ${draft.evidence}`" @click="draft.evidence = null" />
                </div>
                <Button v-else icon-left="lucide-paperclip" label="Attach evidence" @click="fileInput?.click()" />
                <input ref="fileInput" type="file" class="hidden" @change="pickEvidence" />
              </div>
            </li>
          </ol>
        </div>
      </ScrollArea>

      <div v-if="canRespond(nc)" class="flex shrink-0 items-center border-t border-outline-gray-1 p-4">
        <Button variant="solid" label="Submit for review" @click="submit" />
      </div>
    </template>
  </ConnectShell>
</template>
