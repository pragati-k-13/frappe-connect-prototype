<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Button, Dropdown, Select, TextInput } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { PRM_STAGES } from '../data/partnerAccount'
import { companyName, isClosed, lastAt, needsReply, queue, theirLast, useLeads } from '../composables/useLeads'

// SCREEN — Leads, styled as Frappe CRM's list: the view switcher in the
// breadcrumb, a row of quick filters, then a full-width table and a footer
// count. A row opens the lead's own page. See PARTNER-VIEW-PLAN.md, Leads.
//
// No Create: every lead here is a Connect brief. A Beginner isn't listed, so
// no brief reaches them until Bronze.

const store = useConnectStore()
const account = usePartnerAccountStore()
const leads = useLeads()

// Who "Mine" means: the person the demo role stands for, from Team.
const me = computed(() => (store.partnerRole === 'sales' ? 'rahul-verma' : 'farhan-qureshi'))
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
    .sort((a, b) => (view.value === 'needs' ? theirLast(a) - theirLast(b) : lastAt(b) - lastAt(a)))
})
watch(rows, (r) => (queue.value = r.map((t) => t.id)), { immediate: true })
const filtered = computed(() => Boolean(query.value.trim() || stage.value || owner.value))
const clear = () => {
  query.value = ''
  stage.value = ''
  owner.value = ''
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
  <ConnectShell v-if="store.partnerTier === 'beginner'" root-label="Leads">
    <EmptyState icon="lucide-inbox" title="Leads from Connect start at Bronze">
      <Button label="View milestones" route="/connect/partnership" />
    </EmptyState>
  </ConnectShell>

  <ConnectShell v-else root-label="Leads" root-to="/connect/leads" flush>
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
      <div class="flex shrink-0 flex-wrap items-center gap-2 px-3 py-4 sm:px-5">
        <TextInput v-model="query" type="search" placeholder="Lead or company" class="w-full sm:w-56">
          <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
        </TextInput>
        <Select v-model="stage" :options="stageOptions" class="min-w-36" aria-label="Stage" />
        <Select v-model="owner" :options="ownerOptions" class="min-w-36" aria-label="Assigned to" />
        <Button v-if="filtered" variant="ghost" label="Clear" @click="clear" />
      </div>

      <!-- ── The table, full width ─────────────────────────────────────── -->
      <div class="min-h-0 flex-1 overflow-y-auto px-3 sm:px-5">
        <List
          v-if="rows.length"
          class="list-row-px-2"
          :columns="{
            base: ['minmax(0,1fr)', 'auto'],
            md: ['minmax(0,2fr)', 'minmax(0,1fr)', '11rem', '11rem', '7rem', '6rem'],
          }"
          :row-height="40"
        >
          <ListHeader class="mb-2 rounded-4 bg-surface-gray-2 px-2">
            <ListHeaderCell>Lead</ListHeaderCell>
            <ListHeaderCell class="hidden md:flex">Company</ListHeaderCell>
            <ListHeaderCell class="hidden md:flex">Stage</ListHeaderCell>
            <ListHeaderCell class="hidden md:flex">Assigned to</ListHeaderCell>
            <ListHeaderCell class="hidden md:flex">Probability</ListHeaderCell>
            <ListHeaderCell class="justify-end">Updated</ListHeaderCell>
          </ListHeader>
          <ListRows :items="rows" v-slot="{ item }">
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
              <ListCell class="hidden min-w-0 md:flex">
                <span class="truncate text-base text-ink-gray-7">{{ companyName(item) }}</span>
              </ListCell>
              <ListCell class="hidden min-w-0 gap-2 md:flex">
                <span :class="dot(item.stage)" class="size-2 shrink-0 rounded-full" aria-hidden="true" />
                <span class="truncate text-base text-ink-gray-7">{{ item.stage }}</span>
              </ListCell>
              <ListCell class="hidden min-w-0 gap-2 md:flex">
                <template v-if="item.owner">
                  <Avatar :label="nameOf(item.owner)" size="sm" />
                  <span class="truncate text-base text-ink-gray-7">{{ nameOf(item.owner) }}</span>
                </template>
                <span v-else class="text-base text-ink-gray-5">Unassigned</span>
              </ListCell>
              <ListCell class="hidden text-base text-ink-gray-7 md:flex">{{ item.probability ?? '—' }}</ListCell>
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

      <!-- ── Footer, as CRM's: the count on the right. -->
      <div class="flex shrink-0 items-center justify-end border-t border-outline-gray-1 px-3 py-2 sm:px-5">
        <span class="text-base tabular-nums text-ink-gray-5">{{ rows.length }} of {{ inView.length }}</span>
      </div>
    </div>
  </ConnectShell>
</template>
