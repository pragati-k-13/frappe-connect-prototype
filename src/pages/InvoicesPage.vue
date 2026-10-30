<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Alert, Badge, Button, Dropdown, Select, TabButtons, TextInput, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import { useConnectStore } from '../stores/connect'
import { billingFor } from '../data/partnerAccount'
import { contributionMonths, contributionsFor, firmFor, money, shortDate } from '../data/partnership'

// SCREEN — Invoices: the Frappe Cloud invoices for the firm's customers, seen
// from two sides. "All customers" is every linked customer's invoice, which is
// what counts toward tier (the MRR on Partnership). "Your Frappe bill" is the
// one monthly invoice Frappe Cloud sends the firm, shown as the document it is:
// its lines grouped by whose sites they are (each Partner-pays customer, then
// the firm's own), and the tier discount off the total, not off each customer.
// What customers pay the firm isn't here: that's billed from their own ERPNext.
//
// On All customers, an invoice opens in the shell's docked panel, beside the
// list rather than over it, so stepping through customers keeps your place.

const store = useConnectStore()
const route = useRoute()
const router = useRouter()
const firm = computed(() => firmFor(store.partnerTier))
const cur = computed(() => firm.value.currency)
const months = contributionMonths()

const TABS = [
  { label: 'All customers', value: 'all' },
  { label: 'Your Frappe bill', value: 'bill' },
]
// The tab lives in the URL, so Partnership's MRR row can open "All customers".
const tab = computed({
  get: () => (route.query.tab === 'bill' ? 'bill' : 'all'),
  set: (v) => router.replace({ query: { ...route.query, tab: v } }),
})

const month = ref(months[0].key)
const status = ref('all')
const query = ref('')
const openId = ref(null)
const monthMeta = computed(() => months.find((m) => m.key === month.value))
const monthOptions = months.map((m) => ({ label: m.open ? `${m.label}, so far` : m.label, value: m.key }))

watch([month, tab], () => {
  openId.value = null
  status.value = 'all'
})

const matches = (name) => {
  const q = query.value.trim().toLowerCase()
  return !q || name.toLowerCase().includes(q)
}

// ── All customers ───────────────────────────────────────────────────────────
const all = computed(() => contributionsFor(store.partnerTier, month.value, store.partnershipState))
const mrr = computed(() => all.value.reduce((sum, r) => sum + r.converted, 0))
const allShown = computed(() =>
  all.value.filter((r) => (status.value === 'all' || r.status === status.value) && matches(r.own ? 'Your account' : r.customer)),
)
const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Unpaid', value: 'unpaid' },
]
// The current month has no status to show: every invoice in it is still
// building up, and a badge on each row would repeat the picker.
const showStatus = computed(() => !monthMeta.value.open)
const allColumns = computed(() =>
  showStatus.value
    ? { base: ['minmax(0,1fr)', '8rem'], sm: ['minmax(0,1fr)', '10rem', '6rem', '8rem'] }
    : { base: ['minmax(0,1fr)', '8rem'], sm: ['minmax(0,1fr)', '10rem', '8rem'] },
)

// ── Your Frappe bill ────────────────────────────────────────────────────────
const b = computed(() => billingFor(store.partnerTier, store.partnershipState, month.value))
const payFor = computed(() => b.value.rows.filter((r) => !r.own))
// Customers first, the firm's own sites last.
const groups = computed(() => [...payFor.value, ...b.value.rows.filter((r) => r.own)])

function exportCsv() {
  const lines = [
    ['Customer', 'Invoice', 'Frappe billed', 'Currency'],
    ...b.value.rows.map((r) => [r.own ? 'Your account' : r.customer, r.invoice, r.converted, cur.value]),
  ]
  const blob = new Blob([lines.map((l) => l.join(',')).join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `invoices-${month.value}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
const notReady = () => toast.info('Available once Frappe Cloud issues the invoice')
const whenIssued = (fn) => () => (monthMeta.value.open ? notReady() : fn())
// The PDF per customer is what the firm bills that customer from.
const downloadFor = (r) => whenIssued(() => toast.success(`${r.customer}’s breakdown downloaded`))()
const billMenu = computed(() => [
  { label: 'Email invoice', icon: 'lucide-mail', onClick: whenIssued(() => toast.success('Invoice sent to your billing email')) },
  { label: 'Export CSV', icon: 'lucide-file-spreadsheet', onClick: whenIssued(exportCsv) },
])

// ── The intro's figures follow the tab ──────────────────────────────────────
const stats = computed(() => {
  // The bill carries its own total and discount, so the intro adds none.
  return tab.value === 'all' ? [{ label: 'MRR', value: money(mrr.value, cur.value) }] : []
})

const STATUS = {
  accruing: { label: 'Accruing', theme: 'gray' },
  paid: { label: 'Paid', theme: 'green' },
  unpaid: { label: 'Unpaid', theme: 'amber' },
}

// ── The docked invoice ──────────────────────────────────────────────────────
const open = computed(() => (tab.value === 'all' && all.value.find((r) => r.id === openId.value)) || null)
</script>

<template>
  <ConnectShell root-label="Invoices">
    <div class="fc-page-list py-8">
      <PageIntro title="Frappe Cloud invoices for your customers" :stats="stats">
        <template #actions>
          <Select v-model="month" :options="monthOptions" class="w-48" />
          <template v-if="tab === 'bill' && payFor.length">
            <Button icon-left="lucide-download" label="Download PDF" @click="whenIssued(() => toast.success('Invoice downloaded'))()" />
            <Dropdown :options="billMenu">
              <Button icon="lucide-ellipsis" aria-label="More" />
            </Dropdown>
          </template>
        </template>
      </PageIntro>

      <TabButtons v-model="tab" :options="TABS" />

      <!-- ── All customers ─────────────────────────────────────────────── -->
      <template v-if="tab === 'all'">
        <div class="mt-6 flex flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Search customers" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
          <Select v-if="showStatus" v-model="status" :options="statusOptions" class="w-36" />
        </div>

        <List
          v-if="allShown.length"
          v-model:active="openId"
          class="-mx-3 mt-4 list-row-px-3"
          :columns="allColumns"
          :row-height="48"
        >
          <ListHeader>
            <ListHeaderCell>Customer</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Invoice</ListHeaderCell>
            <ListHeaderCell v-if="showStatus" class="hidden sm:flex">Status</ListHeaderCell>
            <ListHeaderCell class="justify-end">Amount</ListHeaderCell>
          </ListHeader>
          <ListRows :items="allShown" v-slot="{ item, value }">
            <ListRow :value="value" @click="openId = item.id">
              <!-- The firm's own account is named as theirs, the same on both tabs. -->
              <ListCell class="min-w-0">
                <span class="truncate text-ink-gray-8">{{ item.own ? 'Your account' : item.customer }}</span>
              </ListCell>
              <ListCell class="hidden whitespace-nowrap tabular-nums text-ink-gray-5 sm:flex">{{ item.invoice }}</ListCell>
              <ListCell v-if="showStatus" class="hidden sm:flex">
                <Badge :theme="STATUS[item.status].theme" variant="subtle" size="sm" :label="STATUS[item.status].label" />
              </ListCell>
              <ListCell class="justify-end tabular-nums text-ink-gray-7">{{ money(item.amount, item.currency) }}</ListCell>
            </ListRow>
          </ListRows>
        </List>
        <EmptyState
          v-else
          icon="lucide-receipt"
          :title="all.length ? 'No invoices match' : 'No invoices this month'"
          :description="all.length ? 'Try another search or status.' : ''"
        />
      </template>

      <!-- ── Your Frappe bill ───────────────────────────────────────────────── -->
      <template v-else>
        <EmptyState
          v-if="!payFor.length"
          icon="lucide-wallet"
          title="No customers on Partner pays"
          description="Customers you pay for show here."
        >
          <Button label="View customers" route="/connect/customers" />
        </EmptyState>

        <template v-else>
          <Alert
            v-if="b.status === 'unpaid'"
            class="mt-6"
            theme="amber"
            :title="`${b.month.label} invoice is unpaid`"
            :description="`${payFor.map((r) => r.customer).join(', ')} may be suspended.`"
          />

          <!-- The bill as a document: its number, then a group per customer
               with their sites, then the discount off the total. -->
          <p class="mt-6 flex items-center gap-2 text-sm text-ink-gray-5">
            <span class="tabular-nums">{{ b.invoice }}</span>
            <Badge v-if="b.status === 'paid'" theme="green" variant="subtle" size="sm" label="Paid" />
          </p>

          <ul class="mt-3 divide-y divide-outline-gray-1">
            <li v-for="r in groups" :key="r.id" class="py-4">
              <div class="flex items-center gap-3">
                <span class="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-8">
                  {{ r.own ? 'Your sites' : r.customer }}
                </span>
                <span class="shrink-0 text-base tabular-nums text-ink-gray-8">{{ money(r.converted, cur) }}</span>
                <Button
                  v-if="!r.own"
                  variant="ghost"
                  icon="lucide-download"
                  class="text-ink-gray-5"
                  :aria-label="`Download ${r.customer}’s breakdown`"
                  :tooltip="`Download ${r.customer}’s breakdown`"
                  @click="downloadFor(r)"
                />
                <!-- Holds the column, so amounts line up with the rows above. -->
                <span v-else class="size-7 shrink-0" aria-hidden="true" />
              </div>
              <ul class="mt-1.5 space-y-1 pr-10">
                <li v-for="site in r.sites" :key="site.name" class="flex justify-between gap-3 text-sm text-ink-gray-5">
                  <span class="truncate">{{ site.name }}</span>
                  <span class="shrink-0">{{ site.plan }}</span>
                </li>
              </ul>
            </li>
          </ul>

          <dl class="space-y-2 border-t border-outline-gray-2 pt-4 pr-10 text-base">
            <div class="flex justify-between gap-3">
              <dt class="text-ink-gray-7">Subtotal</dt>
              <dd class="tabular-nums text-ink-gray-8">{{ money(b.subtotal, cur) }}</dd>
            </div>
            <div v-if="b.off" class="flex justify-between gap-3">
              <dt class="text-ink-gray-7">Tier discount, {{ b.discount }}%</dt>
              <dd class="tabular-nums text-ink-gray-8">−{{ money(b.off, cur) }}</dd>
            </div>
            <div class="flex justify-between gap-3 font-medium">
              <dt class="text-ink-gray-8">Total</dt>
              <dd class="tabular-nums text-ink-gray-9">{{ money(b.total, cur) }}</dd>
            </div>
          </dl>
        </template>
      </template>
    </div>

    <!-- ── An invoice, docked (All customers) ───────────────────────────── -->
    <template v-if="open" #panel>
      <div class="flex items-start justify-between gap-3 border-b border-outline-gray-1 p-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-base-semibold text-ink-gray-9">{{ open.own ? 'Your account' : open.customer }}</span>
            <Badge
              v-if="open.status !== 'accruing'"
              :theme="STATUS[open.status].theme"
              variant="subtle"
              size="sm"
              :label="STATUS[open.status].label"
            />
          </div>
          <p class="mt-1 text-sm text-ink-gray-5">{{ open.invoice }} · {{ monthMeta.label }}</p>
        </div>
        <Button variant="ghost" icon="lucide-x" aria-label="Close" @click="openId = null" />
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <ul class="divide-y divide-outline-gray-1">
          <li v-for="site in open.sites" :key="site.name" class="flex items-baseline justify-between gap-3 py-2.5">
            <span class="min-w-0">
              <span class="block truncate text-base text-ink-gray-8">{{ site.name }}</span>
              <span class="mt-1 block text-sm text-ink-gray-5">{{ site.plan }}</span>
            </span>
            <span class="shrink-0 tabular-nums text-ink-gray-7">{{ money(site.amount, open.currency) }}</span>
          </li>
        </ul>
        <dl class="mt-4 space-y-2 border-t border-outline-gray-2 pt-3 text-base">
          <div class="flex justify-between gap-3 font-medium">
            <dt class="text-ink-gray-8">Total</dt>
            <dd class="tabular-nums text-ink-gray-9">{{ money(open.amount, open.currency) }}</dd>
          </div>
          <!-- Converted at the invoice date's rate, so the figure that counts
               toward MRR can be checked by hand. -->
          <div v-if="open.rate" class="flex justify-between gap-3 text-sm text-ink-gray-5">
            <dt>Counts toward MRR as</dt>
            <dd class="tabular-nums">{{ money(open.converted, cur) }}</dd>
          </div>
        </dl>
        <p v-if="open.rate" class="mt-1.5 text-sm text-ink-gray-5">At ₹{{ open.rate }} per $ on {{ shortDate(open.date) }}</p>
      </div>
    </template>
  </ConnectShell>
</template>
