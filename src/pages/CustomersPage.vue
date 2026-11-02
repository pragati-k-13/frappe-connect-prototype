<script setup>
import { computed, ref } from 'vue'
import { Avatar, Button, Dialog, Dropdown, FormControl, Select, TabButtons, TextInput, dialog, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerCode from '../components/PartnerCode.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { customerInvoices } from '../data/partnerAccount'
import { firmFor, money, shortDate } from '../data/partnership'

// SCREEN — Customers, as Frappe CRM's list (and Leads): a plain breadcrumb, quick filters with Refresh, Filter, Sort and Columns, a
// full-width table, and a footer with page size and count. A customer row
// opens the customer's page; its menu has the quick trips (open a site,
// download the last invoice) so a peek needs no sheet. See PARTNER-VIEW-PLAN.md §2.
//
// Link requests sit in the same list, at the top: a request is a customer
// that hasn't linked yet. One opens in the docked panel, since approving it is
// a quick decision rather than a record to open.

const store = useConnectStore()
const account = usePartnerAccountStore()
const firm = computed(() => firmFor(store.partnerTier))

const isOwner = computed(() => store.partnerRole === 'owner')
const canAdd = computed(() => store.partnerRole !== 'finance')

// ── Quick filters and controls ──────────────────────────────────────────────
const query = ref('')
const stage = ref('')
const pays = ref('')
const source = ref('')
const stageOptions = [
  { label: 'Any stage', value: '' },
  { label: 'Wants to link', value: 'requested' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Live', value: 'live' },
  { label: 'Churned', value: 'churned' },
]
const paysOptions = [
  { label: 'Anyone pays', value: '' },
  { label: 'Customer pays', value: 'customer' },
  { label: 'Partner pays', value: 'partner' },
]
// Filter holds what the quick filters don't: where the customer came from.
const filterMenu = computed(() =>
  [['', 'Any source'], ['connect', 'Connect'], ['own', 'Added by you']].map(([v, l]) => ({
    label: l,
    icon: source.value === v ? 'lucide-check' : 'lucide-blank',
    onClick: () => (source.value = v),
  })),
)
const SORTS = [
  { value: 'name', label: 'Name' },
  { value: 'mrr', label: 'MRR' },
  { value: 'linked', label: 'Linked' },
]
const sort = ref('name')
const sortMenu = computed(() =>
  SORTS.map((o) => ({ label: o.label, icon: sort.value === o.value ? 'lucide-check' : 'lucide-blank', onClick: () => (sort.value = o.value) })),
)
const COLUMNS = [
  { key: 'contact', label: 'Contact', width: 'minmax(0,1fr)' },
  { key: 'stage', label: 'Stage', width: '8rem' },
  { key: 'pays', label: 'Who pays', width: '8rem' },
  { key: 'owner', label: 'Owner', width: '10rem' },
  { key: 'sites', label: 'Sites', width: '5rem' },
  { key: 'mrr', label: 'MRR', width: '7rem' },
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
  base: ['minmax(0,1fr)', 'auto', '2rem'],
  md: ['minmax(0,1.5fr)', ...COLUMNS.filter((c) => show(c.key)).map((c) => c.width), '2rem'],
}))
const PAGE_SIZES = [20, 50, 100].map((n) => ({ label: String(n), value: n }))
const pageSize = ref(20)
const refreshing = ref(false)
function refresh() {
  refreshing.value = true
  setTimeout(() => (refreshing.value = false), 500)
}

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return account.customers
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.contact?.toLowerCase().includes(q))
    .filter((c) => !stage.value || c.stage === stage.value)
    .filter(() => stage.value !== 'requested')
    .filter((c) => !pays.value || c.billing === pays.value)
    .filter((c) => !source.value || c.source === source.value)
    .sort((a, b) =>
      sort.value === 'mrr' ? b.mrr - a.mrr : sort.value === 'linked' ? (b.linked ?? '').localeCompare(a.linked ?? '') : a.name.localeCompare(b.name),
    )
})
// Requests come first, since they wait on the owner. A filter they can't
// match (who pays, source, a customer stage) leaves them out.
const requestRows = computed(() => {
  const q = query.value.trim().toLowerCase()
  if ((stage.value && stage.value !== 'requested') || pays.value || source.value) return []
  return account.requests
    .filter((r) => !q || r.company.toLowerCase().includes(q) || r.contact?.toLowerCase().includes(q))
    .map((r) => ({ ...r, name: r.company, request: true }))
})
const all = computed(() => [...requestRows.value, ...rows.value])
const page = computed(() => all.value.slice(0, pageSize.value))
const filtered = computed(() => Boolean(query.value.trim() || stage.value || pays.value || source.value))
const clear = () => {
  query.value = ''
  stage.value = ''
  pays.value = ''
  source.value = ''
}

const STAGE = {
  onboarding: { label: 'Onboarding', dot: 'bg-surface-blue-7' },
  live: { label: 'Live', dot: 'bg-surface-green-7' },
  churned: { label: 'Churned', dot: 'bg-surface-gray-5' },
  requested: { label: 'Wants to link', dot: 'bg-surface-amber-7' },
}
const BILLING = { customer: 'Customer pays', partner: 'Partner pays' }
const nameOf = (id) => account.team.find((p) => p.id === id)?.name

// ── Link requests ───────────────────────────────────────────────────────────
const openId = ref(null)
const open = computed(() => account.requests.find((r) => r.id === openId.value) ?? null)
const match = computed(() =>
  open.value?.matches ? account.customers.find((c) => c.id === open.value.matches) : null,
)

// A few seconds to undo instead of an "Are you sure?" dialog: approving by
// mistake exposes a stranger's invoices, declining sends a rejection.
function handle(outcome, request = open.value) {
  const req = request
  account.handleRequest(req.id, outcome)
  openId.value = null
  const done = outcome === 'approved' ? `${req.company} linked` : `${req.company} declined`
  toast.success(done, { action: { label: 'Undo', onClick: () => account.undoRequest(req.id) } })
}

// ── Row actions ─────────────────────────────────────────────────────────────
// What each role can do from the list, without opening the customer first.
// Removing a linked customer unlinks it: its MRR stops counting toward tier,
// so it asks first. One added by hand that never linked is just deleted.
const canEdit = computed(() => ['owner', 'sales'].includes(store.partnerRole))
const seesInvoices = computed(() => store.partnerRole !== 'sales')
function actionsFor(item) {
  if (item.request) {
    return isOwner.value
      ? [
          { label: 'Approve', icon: 'lucide-check', onClick: () => handle('approved', item) },
          { label: 'Decline', icon: 'lucide-x', onClick: () => handle('declined', item) },
        ]
      : []
  }
  const linked = Boolean(item.linked || item.sites.length)
  const last = seesInvoices.value ? customerInvoices(store.partnerTier, store.partnershipState, item.name).find((i) => !i.open) : null
  return [
    // The quick trips, so a look at one customer needs no page.
    item.sites.length && item.billing !== 'partner' && {
      label: 'Open in Frappe Cloud',
      icon: 'lucide-external-link',
      onClick: () => window.open('https://frappecloud.com/dashboard', '_blank', 'noopener'),
    },
    last && {
      label: `Download ${last.month} invoice`,
      icon: 'lucide-download',
      onClick: () => toast.success(`${item.name}’s ${last.month} invoice downloaded`),
    },
    canEdit.value && { label: 'Edit details', icon: 'lucide-pencil', onClick: () => startEdit(item) },
    isOwner.value && item.billing === 'customer' && linked && !item.billingSwitch && {
      label: 'Switch to Partner pays',
      icon: 'lucide-wallet',
      route: `/connect/customers/${item.id}`,
    },
    isOwner.value && linked && { label: 'Unlink', icon: 'lucide-unlink', theme: 'red', onClick: () => unlink(item) },
    canEdit.value && !linked && { label: 'Delete', icon: 'lucide-trash-2', theme: 'red', onClick: () => remove(item) },
  ].filter(Boolean)
}

function unlink(item) {
  dialog.danger({
    title: `Unlink ${item.name}?`,
    message: 'Their MRR stops counting toward your tier, and you lose sight of their sites and invoices.',
    confirmLabel: 'Unlink',
    onConfirm: () => {
      account.removeCustomer(item.id)
      toast.success(`${item.name} unlinked`)
    },
  })
}
function remove(item) {
  account.removeCustomer(item.id)
  toast.success(`${item.name} deleted`, { action: { label: 'Undo', onClick: () => account.restoreCustomer(item.id) } })
}

const editing = ref(null)
const editForm = ref({ name: '', contact: '', email: '' })
const editErrors = ref({})
function startEdit(item) {
  editing.value = item
  editForm.value = { name: item.name, contact: item.contact ?? '', email: item.email ?? '' }
  editErrors.value = {}
}
function saveEdit() {
  const f = editForm.value
  const e = {}
  if (!f.name.trim()) e.name = 'Enter the company name'
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email, like name@company.com'
  editErrors.value = e
  if (Object.keys(e).length) return
  account.editCustomer(editing.value.id, { name: f.name.trim(), contact: f.contact.trim(), email: f.email.trim() })
  editing.value = null
  toast.success('Details saved')
}


// ── Add customer ────────────────────────────────────────────────────────────
// Saved as Onboarding, then the dialog ends on the partner code: sharing it
// is the next step, and nothing links until the customer enters it.
const adding = ref(false)
const step = ref('form')
const form = ref({ name: '', contact: '', email: '' })
const errors = ref({})
const addedId = ref(null)

function startAdd() {
  form.value = { name: '', contact: '', email: '' }
  errors.value = {}
  step.value = 'form'
  adding.value = true
}

function save() {
  const f = form.value
  const e = {}
  if (!f.name.trim()) e.name = 'Enter the company name'
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email, like name@company.com'
  const dupe = account.customers.find(
    (c) => c.name.toLowerCase() === f.name.trim().toLowerCase() || c.email === f.email.trim().toLowerCase(),
  )
  if (dupe) e.name = `${dupe.name} is already in your customers`
  errors.value = e
  if (Object.keys(e).length) return
  addedId.value = account.addCustomer({ name: f.name.trim(), contact: f.contact.trim(), email: f.email.trim().toLowerCase() })
  step.value = 'share'
}

function finishAdd() {
  account.markCodeShared(addedId.value)
  adding.value = false
}
</script>

<template>
  <ConnectShell root-label="Customers" flush>
    <!-- The firm's own code, the same for every customer, and Add customer as
         the one solid button, where CRM puts Create. -->
    <template #action>
      <div class="flex items-center gap-2">
        <div class="hidden md:block"><PartnerCode :code="firm.code" :firm="firm.name" /></div>
        <!-- Subtle while a request is open: Approve is the one primary then. -->
        <Button v-if="canAdd" class="hidden sm:inline-flex" :variant="openId ? 'subtle' : 'solid'" icon-left="lucide-plus" label="Add customer" @click="startAdd" />
        <!-- Phones: icon only, so the title keeps its room. -->
        <Button v-if="canAdd" class="sm:hidden" :variant="openId ? 'subtle' : 'solid'" icon="lucide-plus" aria-label="Add customer" @click="startAdd" />
      </div>
    </template>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- ── Quick filters and controls ────────────────────────────────── -->
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-5">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Customer or contact" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
          <Select v-model="stage" :options="stageOptions" class="min-w-36" aria-label="Stage" />
          <Select v-model="pays" :options="paysOptions" class="min-w-36" aria-label="Who pays" />
          <Button v-if="filtered" variant="ghost" label="Clear" @click="clear" />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="hidden h-5 border-l border-outline-gray-2 sm:block" aria-hidden="true" />
          <Button icon="lucide-refresh-ccw" aria-label="Refresh" tooltip="Refresh" :loading="refreshing" @click="refresh" />
          <Dropdown :options="filterMenu" align="end">
            <Button label="Filter" icon-left="lucide-list-filter">
              <template v-if="source" #suffix>
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
      <!-- Scrolls sideways too: with the request panel docked, the columns
           can be wider than what's left, and the panel must stay in view. -->
      <div class="min-h-0 flex-1 overflow-auto px-3 sm:px-5">
        <List v-if="page.length" v-model:active="openId" class="list-row-px-2" :columns="gridColumns" :row-height="40">
            <ListHeader class="mb-2 rounded-4 bg-surface-gray-2 px-2">
              <ListHeaderCell>Customer</ListHeaderCell>
              <ListHeaderCell v-if="show('contact')" class="hidden md:flex">Contact</ListHeaderCell>
              <ListHeaderCell v-if="show('stage')" class="hidden md:flex">Stage</ListHeaderCell>
              <ListHeaderCell v-if="show('pays')" class="hidden md:flex">Who pays</ListHeaderCell>
              <ListHeaderCell v-if="show('owner')" class="hidden md:flex">Owner</ListHeaderCell>
              <ListHeaderCell v-if="show('sites')" class="hidden md:flex">Sites</ListHeaderCell>
              <ListHeaderCell v-if="show('mrr')" class="hidden justify-end md:flex">MRR</ListHeaderCell>
              <ListHeaderCell class="md:hidden"><span class="sr-only">Stage</span></ListHeaderCell>
              <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
            </ListHeader>
            <ListRows :items="page" v-slot="{ item }">
              <!-- A link request: opens in the docked panel. -->
              <ListRow v-if="item.request" :value="item.id" @click="openId = item.id">
                <ListCell class="min-w-0 gap-2">
                  <Avatar :label="item.name" size="sm" shape="square" />
                  <span class="truncate text-base text-ink-gray-9">{{ item.name }}</span>
                </ListCell>
                <ListCell v-if="show('contact')" class="hidden min-w-0 md:flex">
                  <span class="truncate text-base text-ink-gray-7">{{ item.contact }}</span>
                </ListCell>
                <ListCell v-if="show('stage')" class="hidden min-w-0 gap-2 md:flex">
                  <span :class="STAGE.requested.dot" class="size-2 shrink-0 rounded-full" aria-hidden="true" />
                  <span class="truncate text-base text-ink-gray-7">{{ STAGE.requested.label }}</span>
                </ListCell>
                <ListCell v-if="show('pays')" class="hidden text-base text-ink-gray-5 md:flex">—</ListCell>
                <ListCell v-if="show('owner')" class="hidden text-base text-ink-gray-5 md:flex">—</ListCell>
                <ListCell v-if="show('sites')" class="hidden text-base tabular-nums text-ink-gray-7 md:flex">{{ item.sites.length }}</ListCell>
                <ListCell v-if="show('mrr')" class="hidden justify-end text-base text-ink-gray-5 md:flex">—</ListCell>
                <ListCell class="md:hidden">
                  <span :class="STAGE.requested.dot" class="size-2 rounded-full" :aria-label="STAGE.requested.label" />
                </ListCell>
                <ListCell class="justify-end" @click.stop.prevent>
                  <Dropdown v-if="actionsFor(item).length" :options="actionsFor(item)" align="end">
                    <Button variant="ghost" icon="lucide-ellipsis" :aria-label="`Actions for ${item.name}`" />
                  </Dropdown>
                </ListCell>
              </ListRow>
              <ListRow v-else :to="`/connect/customers/${item.id}`">
                <ListCell class="min-w-0 gap-2">
                  <Avatar :label="item.name" size="sm" shape="square" />
                  <span class="truncate text-base text-ink-gray-9">{{ item.name }}</span>
                </ListCell>
                <ListCell v-if="show('contact')" class="hidden min-w-0 md:flex">
                  <span class="truncate text-base text-ink-gray-7">{{ item.contact || '—' }}</span>
                </ListCell>
                <ListCell v-if="show('stage')" class="hidden min-w-0 gap-2 md:flex">
                  <span :class="STAGE[item.stage].dot" class="size-2 shrink-0 rounded-full" aria-hidden="true" />
                  <span class="truncate text-base text-ink-gray-7">{{ STAGE[item.stage].label }}</span>
                </ListCell>
                <ListCell v-if="show('pays')" class="hidden text-base text-ink-gray-7 md:flex">{{ BILLING[item.billing] }}</ListCell>
                <ListCell v-if="show('owner')" class="hidden min-w-0 gap-2 md:flex">
                  <template v-if="item.owner">
                    <Avatar :label="nameOf(item.owner)" size="sm" />
                    <span class="truncate text-base text-ink-gray-7">{{ nameOf(item.owner) }}</span>
                  </template>
                  <span v-else class="text-base text-ink-gray-5">—</span>
                </ListCell>
                <ListCell v-if="show('sites')" class="hidden text-base tabular-nums text-ink-gray-7 md:flex">
                  {{ (item.sites.length || item.linkedSites?.length) ?? 0 }}
                </ListCell>
                <ListCell v-if="show('mrr')" class="hidden justify-end text-base tabular-nums text-ink-gray-7 md:flex">
                  {{ item.mrr ? money(item.mrr, firm.currency) : '—' }}
                </ListCell>
                <!-- Phones: the stage as a dot beside the menu. -->
                <ListCell class="md:hidden">
                  <span :class="STAGE[item.stage].dot" class="size-2 rounded-full" :aria-label="STAGE[item.stage].label" />
                </ListCell>
                <!-- Inside a row that links to the customer, so the menu stops
                     the click from also opening the page. -->
                <ListCell class="justify-end" @click.stop.prevent>
                  <Dropdown v-if="actionsFor(item).length" :options="actionsFor(item)" align="end">
                    <Button variant="ghost" icon="lucide-ellipsis" :aria-label="`Actions for ${item.name}`" />
                  </Dropdown>
                </ListCell>
              </ListRow>
            </ListRows>
          </List>
        <EmptyState v-else icon="lucide-building-2" :title="filtered ? 'No customers match' : 'No customers yet'">
          <Button v-if="filtered" label="Clear filters" @click="clear" />
        </EmptyState>
      </div>

      <!-- ── Footer, as CRM's ──────────────────────────────────────────── -->
      <div class="flex shrink-0 items-center justify-between border-t border-outline-gray-1 px-3 py-2 sm:px-5">
        <TabButtons v-model="pageSize" :options="PAGE_SIZES" />
        <span class="text-base tabular-nums text-ink-gray-5">{{ page.length }} of {{ all.length }}</span>
      </div>
    </div>

    <!-- ── A link request, docked ───────────────────────────────────────── -->
    <template v-if="open" #panel>
      <div class="flex items-start justify-between gap-3 border-b border-outline-gray-1 p-4">
        <div class="min-w-0">
          <p class="truncate text-base-semibold text-ink-gray-9">{{ open.company }}</p>
          <p class="mt-1 text-sm text-ink-gray-5">Entered your code {{ shortDate(open.at) }}</p>
        </div>
        <Button variant="ghost" icon="lucide-x" aria-label="Close" @click="openId = null" />
      </div>
      <div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <p class="text-sm text-ink-gray-5">Contact</p>
          <p class="mt-1 text-base text-ink-gray-8">{{ open.contact }}</p>
          <p class="mt-0.5 text-sm text-ink-gray-5">{{ open.email }}</p>
        </div>
        <div v-if="match">
          <p class="text-sm text-ink-gray-5">Matches</p>
          <p class="mt-1 text-base text-ink-gray-8">{{ match.name }}, added by you</p>
        </div>
        <div>
          <p class="text-sm text-ink-gray-5">Sites it links</p>
          <ul class="mt-1 divide-y divide-outline-gray-1">
            <li v-for="site in open.sites" :key="site.name" class="py-2">
              <p class="truncate text-base text-ink-gray-8">{{ site.name }}</p>
              <p class="mt-0.5 text-sm text-ink-gray-5">{{ site.plan }} · {{ site.region }}</p>
            </li>
          </ul>
        </div>
      </div>
      <div class="border-t border-outline-gray-1 p-4">
        <div v-if="isOwner" class="flex gap-2">
          <Button variant="solid" label="Approve" class="flex-1" @click="handle('approved')" />
          <Button label="Decline" class="flex-1" @click="handle('declined')" />
        </div>
        <p v-else class="text-p-sm text-ink-gray-5">Your firm’s owner approves link requests.</p>
      </div>
    </template>

    <!-- ── Edit details ─────────────────────────────────────────────────── -->
    <Dialog :open="editing !== null" title="Edit details" @update:open="(v) => !v && (editing = null)">
      <form class="space-y-4" @submit.prevent="saveEdit">
        <FormControl v-model="editForm.name" label="Company" required :error="editErrors.name" />
        <FormControl v-model="editForm.contact" label="Contact name" />
        <FormControl v-model="editForm.email" type="email" label="Contact email" required :error="editErrors.email" />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="editing = null" />
          <Button variant="solid" type="submit" label="Save" />
        </div>
      </form>
    </Dialog>

    <!-- ── Add customer ─────────────────────────────────────────────────── -->
    <Dialog v-model:open="adding" :title="step === 'form' ? 'Add customer' : 'Share your partner code'">
      <form v-if="step === 'form'" class="space-y-4" @submit.prevent="save">
        <FormControl v-model="form.name" label="Company" required :error="errors.name" />
        <FormControl v-model="form.contact" label="Contact name" />
        <FormControl
          v-model="form.email"
          type="email"
          label="Contact email"
          placeholder="name@company.com"
          required
          :error="errors.email"
        />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="adding = false" />
          <Button variant="solid" type="submit" label="Add" />
        </div>
      </form>
      <div v-else class="space-y-4">
        <p class="text-p-base text-ink-gray-7">
          {{ form.name }} links once they enter this code in Frappe Cloud and you approve the request.
        </p>
        <PartnerCode :code="firm.code" :firm="firm.name" />
        <div class="flex justify-end pt-2">
          <Button variant="solid" label="Done" @click="finishAdd" />
        </div>
      </div>
    </Dialog>
  </ConnectShell>
</template>
