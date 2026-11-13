<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Alert, Avatar, Badge, Button, Dialog, Dropdown, FormControl, Select, TabButtons, TextInput, Tooltip, dialog, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerCode from '../components/PartnerCode.vue'
import { ORIGINS, customerNeedsReply, isClosed, originLabel, originOf, useLeads } from '../composables/useLeads'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { customerInvoices } from '../data/partnerAccount'
import { contributionMonths, contributionsFor, firmFor, money, shortDate } from '../data/partnership'

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
// Link requests: owners and sales both bring customers in.
const canReview = computed(() => ['owner', 'sales'].includes(store.partnerRole))

// ── Quick filters and controls ──────────────────────────────────────────────
const query = ref('')
// A customer's message waiting on a reply makes the row bold; Needs reply
// narrows to those. No count on the rail.
const leads = useLeads()
const waiting = (c) => customerNeedsReply(c, leads.value, account)
const view = ref('all')
const VIEWS = [
  { label: 'All customers', value: 'all' },
  { label: 'Needs reply', value: 'reply' },
]
const stage = ref('')
const pays = ref('')
const source = ref('')
const stageOptions = [
  { label: 'Any stage', value: '' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Live', value: 'live' },
  { label: 'Churned', value: 'churned' },
]
const paysOptions = [
  { label: 'Anyone pays', value: '' },
  { label: 'Customer pays', value: 'customer' },
  { label: 'Partner pays', value: 'partner' },
]
// Filter holds what the quick filters don't: who found the customer, the
// same values as the Source column.
const filterMenu = computed(() =>
  [['', 'Any source'], ...Object.entries(ORIGINS)].map(([v, l]) => ({
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
// Partnership's MRR row opens this page sorted by MRR (?sort=mrr).
const sortParam = useRoute().query.sort
const sort = ref(SORTS.some((o) => o.value === sortParam) ? sortParam : 'name')
const sortMenu = computed(() =>
  SORTS.map((o) => ({ label: o.label, icon: sort.value === o.value ? 'lucide-check' : 'lucide-blank', onClick: () => (sort.value = o.value) })),
)
// Customers who pay Frappe Cloud themselves and haven't paid their last closed
// invoice. It doesn't count toward tier until they do, so it's the partner's
// to chase. Partner-pays customers are on the firm's own bill instead.
const lastClosed = contributionMonths().find((m) => !m.open)
const unpaid = computed(
  () =>
    new Set(
      contributionsFor(store.partnerTier, lastClosed.key, store.partnershipState)
        .filter((r) => r.status === 'unpaid' && !r.own)
        .map((r) => r.customer),
    ),
)
const isUnpaid = (c) => c.billing === 'customer' && unpaid.value.has(c.name)

// Contact and Who pays aren't columns: both are looked up on the customer's
// page, not scanned down a list. Search still matches the contact.
const COLUMNS = [
  { key: 'stage', label: 'Stage', width: 'minmax(8rem,1fr)' },
  { key: 'source', label: 'Source', width: 'minmax(9rem,1fr)' },
  { key: 'owner', label: 'Owner', width: 'minmax(10rem,1fr)' },
  { key: 'sites', label: 'Sites', width: 'minmax(5rem,0.6fr)' },
  { key: 'mrr', label: 'MRR', width: 'minmax(7rem,0.8fr)' },
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
  md: ['minmax(12rem,2fr)', ...COLUMNS.filter((c) => show(c.key)).map((c) => c.width), '2rem'],
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
    .filter((c) => view.value !== 'reply' || waiting(c))
    .filter((c) => !stage.value || c.stage === stage.value)
    .filter((c) => !pays.value || c.billing === pays.value)
    .filter((c) => !source.value || originOf(c) === source.value)
    .sort((a, b) =>
      sort.value === 'mrr' ? b.mrr - a.mrr : sort.value === 'linked' ? (b.linked ?? '').localeCompare(a.linked ?? '') : a.name.localeCompare(b.name),
    )
})
const all = rows
const page = computed(() => all.value.slice(0, pageSize.value))
const filtered = computed(() => Boolean(query.value.trim() || view.value !== 'all' || stage.value || pays.value || source.value))
const clear = () => {
  query.value = ''
  view.value = 'all'
  stage.value = ''
  pays.value = ''
  source.value = ''
}

const STAGE = {
  onboarding: { label: 'Onboarding', dot: 'bg-surface-blue-7' },
  live: { label: 'Live', dot: 'bg-surface-green-7' },
  churned: { label: 'Churned', dot: 'bg-surface-gray-5' },
}
const nameOf = (id) => account.team.find((p) => p.id === id)?.name

// ── Link requests ───────────────────────────────────────────────────────────
// Not customers yet, so not in the table: every row opens a customer page. A
// bar above the list says how many wait, to owners only (they approve), and
// Review steps through them in a dialog.
const route = useRoute()
const router = useRouter()
// A review session: the requests it covers, fixed when it opens. The banner
// steps through every request waiting then, with "2 of 3" so the total never
// shrinks under the reader; one arriving meanwhile waits for the next session.
// A notification opens its one request, and the dialog closes after it.
const reviewing = ref(false)
const session = ref({ ids: [], single: false })
const open = computed(() => (reviewing.value || session.value.ids.length ? account.requests.find((r) => session.value.ids.includes(r.id)) ?? null : null))
watch(open, (r) => !r && (reviewing.value = false))
// The last request stays on screen while the dialog fades out after it.
const shown = ref(null)
watch(open, (r) => r && (shown.value = r), { immediate: true })
const step = computed(() => Math.min(session.value.ids.filter((id) => !account.requests.some((r) => r.id === id)).length + 1, session.value.ids.length))
const showStep = computed(() => !session.value.single && session.value.ids.length > 1)
function reviewAll() {
  session.value = { ids: account.requests.map((r) => r.id), single: false }
  reviewing.value = true
}

// A notification opens one request: Customers with ?review=<id>.
watch(
  () => route.query.review,
  (id) => {
    if (!id || !canReview.value) return
    session.value = { ids: [id], single: true }
    reviewing.value = Boolean(account.requests.find((r) => r.id === id))
    router.replace({ query: { ...route.query, review: undefined } })
  },
  { immediate: true },
)

// ── The lead behind a request ───────────────────────────────────────────────
// The firm's lead for this business, by email first, then by company name.
// Approving gives the sites to that lead's customer (or makes it), so a won
// lead doesn't come back as a second customer.
const sameText = (a, b) => Boolean(a && b) && a.trim().toLowerCase() === b.trim().toLowerCase()
const candidates = computed(() => leads.value.filter((l) => l.company && (!isClosed(l) || l.stage === 'Won')))
function matchedLead(r) {
  return candidates.value.find((l) => sameText(l.company.email, r.email)) ?? candidates.value.find((l) => sameText(l.company.name, r.company)) ?? null
}
const leadId = ref('')
watch(open, (r) => (leadId.value = r ? (matchedLead(r)?.id ?? '') : ''), { immediate: true })
const leadOptions = computed(() => [
  { label: 'No lead', value: '' },
  ...candidates.value.map((l) => ({ label: `${l.company.name} · ${l.project}`, value: l.id })),
])
const chosenLead = computed(() => leads.value.find((l) => l.id === leadId.value) ?? null)

// A few seconds to undo instead of an "Are you sure?" dialog: approving by
// mistake exposes a stranger's invoices, declining sends a rejection.
function handle(outcome) {
  const req = open.value
  const lead = outcome === 'approved' ? chosenLead.value : null
  const into = lead?.customerId ?? null
  account.handleRequest(req.id, outcome, lead ? { leadId: lead.id, origin: originOf(lead), owner: lead.owner ?? null, into } : null)
  if (lead && !into) lead.customerId = req.id.replace('req-', '')
  const done = outcome === 'approved' ? `${req.company} linked` : `${req.company} declined`
  toast.success(done, {
    action: {
      label: 'Undo',
      onClick: () => {
        account.undoRequest(req.id)
        if (lead && !into) lead.customerId = null
      },
    },
  })
}

// ── Row actions ─────────────────────────────────────────────────────────────
// What each role can do from the list, without opening the customer first.
// Removing a linked customer unlinks it: its MRR stops counting toward tier,
// so it asks first.
const canEdit = computed(() => ['owner', 'sales'].includes(store.partnerRole))
const seesInvoices = computed(() => store.partnerRole !== 'sales')
function actionsFor(item) {
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


</script>

<template>
  <ConnectShell root-label="Customers" flush>
    <!-- The firm's own code, the same for every customer: the way in. Nobody
         adds a customer by hand; they arrive by a hire, a CRM win, or a link
         through this code. -->
    <template #action>
      <PartnerCode :code="firm.code" />
    </template>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- ── Quick filters and controls ────────────────────────────────── -->
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-5">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Customer or contact" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
          <Select v-model="view" :options="VIEWS" class="min-w-36" aria-label="Show" />
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

      <!-- ── Link requests, owners and sales ───────────────────────────── -->
      <div v-if="canReview && account.requests.length" class="shrink-0 px-3 pb-3 sm:px-5">
        <Alert
          :title="account.requests.length === 1 ? '1 company wants to link to your partner code' : `${account.requests.length} companies want to link to your partner code`"
          :primary-action="{ label: 'Review', onClick: reviewAll }"
        />
      </div>

      <!-- ── The table, full width ─────────────────────────────────────── -->
      <!-- Scrolls sideways too: with the request panel docked, the columns
           can be wider than what's left, and the panel must stay in view. -->
      <div class="min-h-0 flex-1 overflow-auto px-3 sm:px-5">
        <List v-if="page.length" class="list-row-px-2" :columns="gridColumns" :row-height="40">
            <ListHeader class="mb-2 rounded-4 bg-surface-gray-2 px-2">
              <ListHeaderCell>Customer</ListHeaderCell>
              <ListHeaderCell v-if="show('stage')" class="hidden md:flex">Stage</ListHeaderCell>
              <ListHeaderCell v-if="show('source')" class="hidden md:flex">Source</ListHeaderCell>
              <ListHeaderCell v-if="show('owner')" class="hidden md:flex">Owner</ListHeaderCell>
              <ListHeaderCell v-if="show('sites')" class="hidden md:flex">Sites</ListHeaderCell>
              <ListHeaderCell v-if="show('mrr')" class="hidden justify-end md:flex">MRR</ListHeaderCell>
              <ListHeaderCell class="md:hidden"><span class="sr-only">Stage</span></ListHeaderCell>
              <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
            </ListHeader>
            <ListRows :items="page" v-slot="{ item }">
              <ListRow :to="`/connect/customers/${item.id}`">
                <ListCell class="min-w-0 gap-2 overflow-hidden">
                  <Avatar :label="item.name" size="sm" shape="square" />
                  <span class="truncate text-base text-ink-gray-9" :class="waiting(item) && 'font-medium'">{{ item.name }}</span>
                  <Tooltip v-if="isUnpaid(item)" :text="`${lastClosed.label} invoice unpaid`">
                    <Badge class="shrink-0" theme="amber" variant="subtle" size="sm" label="Unpaid" />
                  </Tooltip>
                </ListCell>
                <ListCell v-if="show('stage')" class="hidden min-w-0 gap-2 md:flex">
                  <span :class="STAGE[item.stage].dot" class="size-2 shrink-0 rounded-full" aria-hidden="true" />
                  <span class="truncate text-base text-ink-gray-7">{{ STAGE[item.stage].label }}</span>
                </ListCell>
                <!-- Connect stands out: it's the source the product brings. -->
                <ListCell v-if="show('source')" class="hidden min-w-0 md:flex">
                  <span class="truncate text-base" :class="originOf(item) === 'connect' ? 'text-ink-gray-8' : 'text-ink-gray-5'">{{ originLabel(item) }}</span>
                </ListCell>
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
        <EmptyState v-else icon="lucide-building-2" :title="view === 'reply' && !query.trim() && !stage && !pays && !source ? 'No one is waiting on a reply' : filtered ? 'No customers match' : 'No customers yet'">
          <Button v-if="filtered" label="Clear filters" @click="clear" />
          <!-- A new firm's next step: the code is how customers arrive. -->
          <PartnerCode v-else :code="firm.code" />
        </EmptyState>
      </div>

      <!-- ── Footer, as CRM's ──────────────────────────────────────────── -->
      <div class="flex shrink-0 items-center justify-between border-t border-outline-gray-1 px-3 py-2 sm:px-5">
        <TabButtons v-model="pageSize" :options="PAGE_SIZES" />
        <span class="text-base tabular-nums text-ink-gray-5">{{ page.length }} of {{ all.length }}</span>
      </div>
    </div>

    <!-- ── Link requests, one at a time ──────────────────────────────── -->
    <Dialog v-model:open="reviewing" :title="shown?.company ?? 'Link requests'">
      <!-- Fixed height, so Decline and Approve stay put while stepping through. -->
      <div v-if="shown" class="h-80 space-y-6 overflow-hidden">
        <p class="text-p-base text-ink-gray-5">Entered your code {{ shortDate(shown.at) }}</p>
        <div>
          <p class="text-sm text-ink-gray-5">Contact</p>
          <p class="mt-1 text-base text-ink-gray-8">{{ shown.contact }}</p>
          <p class="mt-0.5 text-sm text-ink-gray-5">{{ shown.email }}</p>
        </div>
        <div>
          <p class="text-sm text-ink-gray-5">Sites it links</p>
          <ul class="mt-1 divide-y divide-outline-gray-1">
            <li v-for="site in shown.sites" :key="site.name" class="py-2">
              <p class="truncate text-base text-ink-gray-8">{{ site.name }}</p>
              <p class="mt-0.5 text-sm text-ink-gray-5">{{ site.plan }} · {{ site.region }}</p>
            </li>
          </ul>
        </div>
        <!-- Prefilled with the firm's lead for this business, if there is one. -->
        <div>
          <Select v-model="leadId" :options="leadOptions" label="Lead" />
          <p v-if="chosenLead" class="mt-1.5 text-sm text-ink-gray-5">{{ chosenLead.stage }} · {{ originLabel(chosenLead) }}</p>
        </div>
      </div>
      <template #actions>
        <div class="flex items-center justify-between gap-2">
          <span class="text-p-sm tabular-nums text-ink-gray-5"><template v-if="showStep">{{ step }} of {{ session.ids.length }}</template></span>
          <div class="flex gap-2">
            <Button label="Decline" @click="handle('declined')" />
            <Button variant="solid" label="Approve" @click="handle('approved')" />
          </div>
        </div>
      </template>
    </Dialog>

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

  </ConnectShell>
</template>
