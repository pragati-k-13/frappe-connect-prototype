<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Button, Dropdown, Select, TabButtons, TextInput } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PRM_STAGES } from '../data/partnerAccount'
import { companyName, isClosed, lastAt, meFor, needsReply, queue, theirLast, useLeads } from '../composables/useLeads'

// SCREEN — Leads, styled as Frappe CRM's list: the view switcher in the
// breadcrumb, quick filters with Refresh, Filter, Sort and Columns beside
// them, then a full-width table and a footer with page size and count. A row opens the lead's own page. See PARTNER-VIEW-PLAN.md, Leads.
//
// No Create: every lead here is a Connect brief. Every tier gets them,
// Beginners included.

const store = useConnectStore()
const account = usePartnerAccountStore()
const leads = useLeads()

// Who "Mine" means: the person the demo role stands for, from Team.
const me = computed(() => meFor(store))
const nameOf = (id) => account.team.find((p) => p.id === id)?.name

// ── Views, in the breadcrumb as CRM has them ────────────────────────────────
// Landing for Sales, so the default is only what waits on the firm.
const VIEWS = [
  { label: 'To reply', value: 'needs', icon: 'lucide-reply' },
  { label: 'Mine', value: 'mine', icon: 'lucide-user' },
  { label: 'Open', value: 'open', icon: 'lucide-inbox' },
  { label: 'Closed', value: 'closed', icon: 'lucide-archive' },
]
const view = ref('needs')
const current = computed(() => VIEWS.find((v) => v.value === view.value))
const viewMenu = VIEWS.map((v) => ({ label: v.label, icon: v.icon, onClick: () => (view.value = v.value) }))

// ── Quick filters ───────────────────────────────────────────────────────────
const query = ref('')
const stage = ref('')
const owner = ref('')
const stageOptions = [{ label: 'Any stage', value: '' }, ...PRM_STAGES.map((s) => ({ label: s, value: s }))]
const ownerOptions = computed(() => [
  { label: 'Anyone', value: '' },
  { label: 'Unassigned', value: 'none' },
  ...account.team.filter((p) => p.roles.includes('sales') || p.roles.includes('owner')).map((p) => ({ label: p.name, value: p.id })),
])

// ── Filter, sort, columns, page size: CRM's controls ───────────────────────
// Filter holds what the quick filters don't: probability.
const probability = ref('')
const filterMenu = computed(() =>
  ['', 'Hot', 'Warm', 'Cold'].map((p) => ({
    label: p || 'Any probability',
    icon: probability.value === p ? 'lucide-check' : 'lucide-blank',
    onClick: () => (probability.value = p),
  })),
)
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

const inView = computed(() =>
  leads.value.filter((t) =>
    view.value === 'needs'
      ? needsReply(t)
      : view.value === 'mine'
        ? !isClosed(t) && t.owner === me.value
        : view.value === 'open'
          ? !isClosed(t)
          : isClosed(t),
  ),
)
// Only the business moves a row: ordered by their last message. "To reply"
// goes oldest waiting first, since that's the order to answer in.
const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return inView.value
    .filter((t) => !q || t.project.toLowerCase().includes(q) || t.company?.name.toLowerCase().includes(q))
    .filter((t) => !stage.value || t.stage === stage.value)
    .filter((t) => !owner.value || (owner.value === 'none' ? !t.owner : t.owner === owner.value))
    .filter((t) => !probability.value || t.probability === probability.value)
    .sort((a, b) => {
      if (sort.value === 'stage') return PRM_STAGES.indexOf(a.stage) - PRM_STAGES.indexOf(b.stage)
      if (sort.value === 'probability') return ['Hot', 'Warm', 'Cold', undefined].indexOf(a.probability) - ['Hot', 'Warm', 'Cold', undefined].indexOf(b.probability)
      if (sort.value === 'name') return a.project.localeCompare(b.project)
      return view.value === 'needs' ? theirLast(a) - theirLast(b) : lastAt(b) - lastAt(a)
    })
})
const page = computed(() => rows.value.slice(0, pageSize.value))
watch(rows, (r) => (queue.value = r.map((t) => t.id)), { immediate: true })
const filtered = computed(() => Boolean(query.value.trim() || stage.value || owner.value || probability.value))
const clear = () => {
  query.value = ''
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

const EMPTY = { needs: 'All caught up', mine: 'None assigned to you', open: 'No open leads', closed: 'No closed leads' }
</script>

<template>
  <ConnectShell root-label="Leads" root-to="/connect/leads" flush>
    <!-- "Leads / To reply ▾", CRM's view switcher. -->
    <template #crumb>
      <Dropdown :options="viewMenu">
        <Button variant="ghost" class="text-lg-medium text-nowrap" icon-right="lucide-chevron-down">
          <template #prefix><span :class="current.icon" class="size-4" aria-hidden="true" /></template>
          {{ current.label }}
        </Button>
      </Dropdown>
    </template>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- ── Quick filters ─────────────────────────────────────────────── -->
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-5">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Lead or company" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
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
              <template v-if="probability" #suffix>
                <span class="grid size-5 place-items-center rounded-4 bg-surface-base text-xs font-medium shadow-sm">1</span>
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
              </ListCell>
              <ListCell v-if="show('company')" class="hidden min-w-0 md:flex">
                <span class="truncate text-base text-ink-gray-7">{{ companyName(item) }}</span>
              </ListCell>
              <ListCell v-if="show('stage')" class="hidden min-w-0 gap-2 md:flex">
                <span :class="dot(item.stage)" class="size-2 shrink-0 rounded-full" aria-hidden="true" />
                <span class="truncate text-base text-ink-gray-7">{{ item.stage }}</span>
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
          :icon="view === 'needs' && !filtered ? 'lucide-check-check' : 'lucide-inbox'"
          :title="filtered ? 'No leads match' : EMPTY[view]"
        >
          <Button v-if="filtered" label="Clear filters" @click="clear" />
          <Button v-else-if="view === 'needs'" label="View open leads" @click="view = 'open'" />
        </EmptyState>
      </div>

      <!-- ── Footer, as CRM's: page size on the left, the count on the right. -->
      <div class="flex shrink-0 items-center justify-between border-t border-outline-gray-1 px-3 py-2 sm:px-5">
        <TabButtons v-model="pageSize" :options="PAGE_SIZES" />
        <span class="text-base tabular-nums text-ink-gray-5">{{ page.length }} of {{ rows.length }}</span>
      </div>
    </div>
  </ConnectShell>
</template>
