<script setup>
import { computed, ref } from 'vue'
import { Alert, Avatar, Badge, Button, Dropdown, Select, TabButtons, TextInput } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import AddLeadDialog from '../components/AddLeadDialog.vue'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { useConnectStore } from '../stores/connect'
import { PRM_STAGES } from '../data/partnerAccount'
import { ORIGINS, companyName, isClosed, lastAt, needsReply, originOf, useLeads } from '../composables/useLeads'

// SCREEN — Leads, styled as Frappe CRM's list: a plain breadcrumb, quick
// filters with Refresh, Filter, Sort and Columns beside
// them, then a full-width table and a footer with page size and count. A row opens the lead's own page. See PARTNER-VIEW-PLAN.md, Leads.
//
// Leads are Connect briefs, the firm's CRM leads while CRM sync is on, and
// leads added here. Add lead shows only without a CRM: a firm with one adds
// leads there, and they sync in. Every tier gets briefs, Beginners included.
//
// Open leads by default: Won, Lost, Junk and Closed leave the view and stay a
// filter away. No count on the rail; a lead waiting on a reply is bold, and
// Needs reply narrows to those.

const account = usePartnerAccountStore()
const store = useConnectStore()

// Taking new work lives in Firm settings › Leads, owners only. While it's off,
// this page is where its effect shows (no new briefs), so it says so here.
// Only owners get the button: no one else can change it.
const paused = computed(() => account.edits.profile.taking === false)
const pausedAction = computed(() =>
  store.partnerRole === 'owner' ? { label: 'Open settings', onClick: () => store.openFirmSettings('leads') } : undefined,
)
const leads = useLeads()
const canAdd = computed(() => !account.edits.crm && ['owner', 'sales'].includes(store.partnerRole))
const adding = ref(false)

const nameOf = (id) => account.team.find((p) => p.id === id)?.name

// ── Views ───────────────────────────────────────────────────────────────────
// None yet: one list of every lead. CRM's switcher (List, Group by, Kanban)
// comes later, in the breadcrumb.

// ── Quick filters ───────────────────────────────────────────────────────────
const query = ref('')
const view = ref('open')
const VIEWS = [
  { label: 'Open leads', value: 'open' },
  { label: 'Needs reply', value: 'reply' },
  { label: 'All leads', value: 'all' },
]
const stage = ref('')
const owner = ref('')
const stageOptions = [{ label: 'Any stage', value: '' }, ...PRM_STAGES.map((s) => ({ label: s, value: s }))]
const ownerOptions = computed(() => [
  { label: 'Anyone', value: '' },
  { label: 'Unassigned', value: 'none' },
  ...account.team.filter((p) => p.roles.includes('sales') || p.roles.includes('owner')).map((p) => ({ label: p.name, value: p.id })),
])

// ── Filter, sort, columns, page size: CRM's controls ───────────────────────
// Filter holds what the quick filters don't: probability, and who found the
// lead. Source isn't a column: a row's source rarely changes how you treat
// it, and the lead's panel says it.
const probability = ref('')
const source = ref('')
const filterMenu = computed(() => [
  {
    group: 'Probability',
    options: ['', 'Hot', 'Warm', 'Cold'].map((p) => ({
      label: p || 'Any probability',
      icon: probability.value === p ? 'lucide-check' : 'lucide-blank',
      onClick: () => (probability.value = p),
    })),
  },
  {
    group: 'Source',
    options: [['', 'Any source'], ...Object.entries(ORIGINS)].map(([v, l]) => ({
      label: l,
      icon: source.value === v ? 'lucide-check' : 'lucide-blank',
      onClick: () => (source.value = v),
    })),
  },
])
const filterCount = computed(() => [probability.value, source.value].filter(Boolean).length)
const SORTS = [
  { value: 'reply', label: 'Last reply' },
  { value: 'stage', label: 'Stage' },
  { value: 'probability', label: 'Probability' },
  { value: 'name', label: 'Lead name' },
]
const sort = ref('reply')
const sortMenu = computed(() =>
  SORTS.map((o) => ({ label: o.label, icon: sort.value === o.value ? 'lucide-check' : 'lucide-blank', onClick: () => (sort.value = o.value) })),
)
const COLUMNS = [
  { key: 'company', label: 'Company', width: 'minmax(0,1fr)' },
  { key: 'stage', label: 'Stage', width: '11rem' },
  { key: 'owner', label: 'Assigned to', width: '11rem' },
  { key: 'probability', label: 'Probability', width: '7rem' },
]
const shownCols = ref(COLUMNS.map((c) => c.key))
const show = (k) => shownCols.value.includes(k)
const columnsMenu = computed(() =>
  COLUMNS.map((c) => ({
    label: c.label,
    icon: show(c.key) ? 'lucide-check' : 'lucide-blank',
    onClick: () => (shownCols.value = show(c.key) ? shownCols.value.filter((k) => k !== c.key) : [...shownCols.value, c.key]),
  })),
)
const gridColumns = computed(() => ({
  base: ['minmax(0,1fr)', 'auto'],
  md: ['minmax(0,2fr)', ...COLUMNS.filter((c) => show(c.key)).map((c) => c.width), '6rem'],
}))
const PAGE_SIZES = [20, 50, 100].map((n) => ({ label: String(n), value: n }))
const pageSize = ref(20)
const refreshing = ref(false)
function refresh() {
  refreshing.value = true
  setTimeout(() => (refreshing.value = false), 500)
}

const inView = leads
// Only the business moves a row: ordered by their last message. "To reply"
// goes oldest waiting first, since that's the order to answer in.
const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return inView.value
    .filter((t) => !q || t.project.toLowerCase().includes(q) || t.company?.name.toLowerCase().includes(q))
    .filter((t) => (view.value === 'reply' ? needsReply(t) : view.value === 'all' || stage.value || !isClosed(t)))
    .filter((t) => !stage.value || t.stage === stage.value)
    .filter((t) => !owner.value || (owner.value === 'none' ? !t.owner : t.owner === owner.value))
    .filter((t) => !probability.value || t.probability === probability.value)
    .filter((t) => !source.value || originOf(t) === source.value)
    .sort((a, b) => {
      if (sort.value === 'stage') return PRM_STAGES.indexOf(a.stage) - PRM_STAGES.indexOf(b.stage)
      if (sort.value === 'probability') return ['Hot', 'Warm', 'Cold', undefined].indexOf(a.probability) - ['Hot', 'Warm', 'Cold', undefined].indexOf(b.probability)
      if (sort.value === 'name') return a.project.localeCompare(b.project)
      return lastAt(b) - lastAt(a)
    })
})
const page = computed(() => rows.value.slice(0, pageSize.value))
const filtered = computed(() => Boolean(query.value.trim() || view.value !== 'open' || stage.value || owner.value || filterCount.value))
const clear = () => {
  query.value = ''
  source.value = ''
  view.value = 'open'
  stage.value = ''
  owner.value = ''
  probability.value = ''
}

// A coloured dot for the stage, as CRM shows status; colour only where the
// lead is finished.
const DOT = { Won: 'bg-surface-green-7', Lost: 'bg-surface-red-6', Junk: 'bg-surface-gray-5', Closed: 'bg-surface-gray-5' }
const dot = (s) => DOT[s] ?? 'bg-surface-blue-7'

const time = (at) => {
  const d = new Date(at)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

</script>

<template>
  <ConnectShell root-label="Leads" flush>
    <template v-if="canAdd" #action>
      <Button icon-left="lucide-plus" label="Add lead" @click="adding = true" />
    </template>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div v-if="paused" class="shrink-0 px-3 pt-4 sm:px-5">
        <Alert theme="amber" title="Not taking new work" :primary-action="pausedAction" />
      </div>
      <!-- ── Quick filters ─────────────────────────────────────────────── -->
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-5">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Lead or company" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
          <Select v-model="view" :options="VIEWS" class="min-w-36" aria-label="Show" />
          <Select v-model="stage" :options="stageOptions" class="min-w-36" aria-label="Stage" />
          <Select v-model="owner" :options="ownerOptions" class="min-w-36" aria-label="Assigned to" />
          <Button v-if="filtered" variant="ghost" label="Clear" @click="clear" />
        </div>
        <!-- CRM's controls, default subtle, after a rule. Wraps on a phone. -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="hidden h-5 border-l border-outline-gray-2 sm:block" aria-hidden="true" />
          <Button icon="lucide-refresh-ccw" aria-label="Refresh" tooltip="Refresh" :loading="refreshing" @click="refresh" />
          <Dropdown :options="filterMenu" align="end">
            <Button label="Filter" icon-left="lucide-list-filter">
              <template v-if="filterCount" #suffix>
                <span class="grid size-5 place-items-center rounded-4 bg-surface-base text-xs font-medium shadow-sm">{{ filterCount }}</span>
              </template>
            </Button>
          </Dropdown>
          <Dropdown :options="sortMenu" align="end">
            <Button :label="SORTS.find((o) => o.value === sort).label" icon-left="lucide-arrow-down-up" />
          </Dropdown>
          <Dropdown :options="columnsMenu" align="end">
            <Button label="Columns" icon-left="lucide-columns-3" />
          </Dropdown>
        </div>
      </div>

      <!-- ── The table, full width ─────────────────────────────────────── -->
      <div class="min-h-0 flex-1 overflow-y-auto px-3 sm:px-5">
        <List
          v-if="rows.length"
          class="list-row-px-2"
          :columns="gridColumns"
          :row-height="40"
        >
          <ListHeader class="mb-2 rounded-4 bg-surface-gray-2 px-2">
            <ListHeaderCell>Lead</ListHeaderCell>
            <ListHeaderCell v-if="show('company')" class="hidden md:flex">Company</ListHeaderCell>
            <ListHeaderCell v-if="show('stage')" class="hidden md:flex">Stage</ListHeaderCell>
            <ListHeaderCell v-if="show('owner')" class="hidden md:flex">Assigned to</ListHeaderCell>
            <ListHeaderCell v-if="show('probability')" class="hidden md:flex">Probability</ListHeaderCell>
            <ListHeaderCell class="justify-end">Updated</ListHeaderCell>
          </ListHeader>
          <ListRows :items="page" v-slot="{ item }">
            <ListRow :to="`/connect/leads/${item.id}`">
              <!-- Bold while a reply waits on you, as CRM bolds an unseen row. -->
              <ListCell class="min-w-0 gap-2">
                <span :class="dot(item.stage)" class="size-2 shrink-0 rounded-full md:hidden" aria-hidden="true" />
                <span
                  class="truncate text-base"
                  :class="needsReply(item) ? 'font-medium text-ink-gray-9' : 'text-ink-gray-8'"
                >
                  {{ item.project }}
                </span>
                <!-- Until they confirm or requote. See docs/edit-requirements.md. -->
                <Badge v-if="item.requirementsUpdated" class="shrink-0" theme="gray" label="Requirements updated" />
              </ListCell>
              <ListCell v-if="show('company')" class="hidden min-w-0 md:flex">
                <span class="truncate text-base text-ink-gray-7">{{ companyName(item) }}</span>
              </ListCell>
              <ListCell v-if="show('stage')" class="hidden min-w-0 gap-2 md:flex">
                <span :class="dot(item.stage)" class="size-2 shrink-0 rounded-full" aria-hidden="true" />
                <span class="truncate text-base text-ink-gray-7">{{ item.stage }}<template v-if="item.hireRequest"> · Hire sent</template></span>
              </ListCell>
              <ListCell v-if="show('owner')" class="hidden min-w-0 gap-2 md:flex">
                <template v-if="item.owner">
                  <Avatar :label="nameOf(item.owner)" size="sm" />
                  <span class="truncate text-base text-ink-gray-7">{{ nameOf(item.owner) }}</span>
                </template>
                <span v-else class="text-base text-ink-gray-5">Unassigned</span>
              </ListCell>
              <ListCell v-if="show('probability')" class="hidden text-base text-ink-gray-7 md:flex">{{ item.probability ?? '—' }}</ListCell>
              <ListCell class="justify-end whitespace-nowrap text-base text-ink-gray-5">{{ time(lastAt(item)) }}</ListCell>
            </ListRow>
          </ListRows>
        </List>

        <EmptyState
          v-else
          icon="lucide-inbox"
          :title="view === 'reply' && !stage && !owner && !query.trim() ? 'No one is waiting on a reply' : filtered ? 'No leads match' : 'No leads yet'"
        >
          <Button v-if="filtered" label="Clear filters" @click="clear" />
        </EmptyState>
      </div>

      <!-- ── Footer, as CRM's: page size on the left, the count on the right. -->
      <div class="flex shrink-0 items-center justify-between border-t border-outline-gray-1 px-3 py-2 sm:px-5">
        <TabButtons v-model="pageSize" :options="PAGE_SIZES" />
        <span class="text-base tabular-nums text-ink-gray-5">{{ page.length }} of {{ rows.length }}</span>
      </div>
    </div>
    <AddLeadDialog v-model:open="adding" />
  </ConnectShell>
</template>
