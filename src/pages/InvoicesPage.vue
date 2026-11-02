<script setup>
import { computed, ref, watch } from 'vue'
import { Alert, Avatar, Badge, Button, Dropdown, ScrollArea, Select, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListHeaderCellSort, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import { useConnectStore } from '../stores/connect'
import { billingFor, customersFor } from '../data/partnerAccount'
import { contributionMonths, firmFor, money, shortDate } from '../data/partnership'
import fcLogo from '../assets/apps/frappe-cloud.svg'

// SCREEN — Invoices: the one monthly invoice Frappe Cloud sends the firm, shown
// as the document it is: a row per Partner-pays customer, then the firm's own
// sites, and the tier discount off the total, not off each customer.
// Customers who pay Frappe Cloud themselves aren't here: their invoices are on
// each customer's page, and the Customers page flags the unpaid ones. MRR is on
// Partnership. What customers pay the firm is billed from their own ERPNext.
//
// A row opens its invoice in the shell's docked panel, beside the list rather
// than over it, so stepping through customers keeps your place.

const store = useConnectStore()
const firm = computed(() => firmFor(store.partnerTier))
const cur = computed(() => firm.value.currency)
const months = contributionMonths()

const month = ref(months[0].key)
const openId = ref(null)
const monthMeta = computed(() => months.find((m) => m.key === month.value))
const monthOptions = months.map((m) => ({ label: m.label, value: m.key }))
watch(month, () => (openId.value = null))

const b = computed(() => billingFor(store.partnerTier, store.partnershipState, month.value))
const payFor = computed(() => b.value.rows.filter((r) => !r.own))
// Customers sorted by the header (amount high to low by default); the firm's
// own sites stay last, since they aren't a customer.
const sort = ref({ key: 'amount', dir: 'desc' })
// A new column starts at its natural order (amounts high to low, names A to Z);
// clicking the same column again flips it.
function sortBy(key) {
  const flip = { asc: 'desc', desc: 'asc' }
  sort.value =
    sort.value.key === key ? { key, dir: flip[sort.value.dir] } : { key, dir: key === 'amount' ? 'desc' : 'asc' }
}
const dirOf = (key) => (sort.value.key === key ? sort.value.dir : null)
const rows = computed(() => {
  const { key, dir } = sort.value
  const sign = dir === 'asc' ? 1 : -1
  const sorted = [...payFor.value].sort((a, b) =>
    sign * (key === 'amount' ? a.converted - b.converted : a.customer.localeCompare(b.customer)),
  )
  return [...sorted, ...b.value.rows.filter((r) => r.own)]
})
const figures = computed(() => [
  { label: 'Subtotal', value: money(b.value.subtotal, cur.value) },
  ...(b.value.off ? [{ label: `Tier discount, ${b.value.discount}%`, value: `−${money(b.value.off, cur.value)}` }] : []),
  { label: 'Total', value: money(b.value.total, cur.value), status: b.value.status },
])
// The avatar has its own track, as in Gameplan's people list, so the inset
// dividers start at the name.
const columns = { base: ['2.5rem', 'minmax(0,1fr)', '6rem'], sm: ['2.5rem', 'minmax(0,1fr)', '9rem', '8rem'] }
// The row's second line: the customer's contact, or for the firm's own row,
// its Frappe Cloud billing email.
const customers = computed(() => customersFor(store.partnerTier, store.partnershipState))
const emailOf = (r) => (r.own ? firm.value.billingEmail : customers.value.find((c) => c.name === r.customer)?.email)

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
// Both live in the docked panel's header, so the list's amounts reach the
// column's right edge.
const downloadFor = (r) => whenIssued(() => toast.success(`${r.customer}’s breakdown downloaded`))()
const emailTo = (r) => whenIssued(() => toast.success(`${r.customer}’s breakdown sent to ${emailOf(r)}`))()
const billMenu = computed(() => [
  { label: 'Download PDF', icon: 'lucide-download', onClick: whenIssued(() => toast.success('Invoice downloaded')) },
  { label: 'Email invoice', icon: 'lucide-mail', onClick: whenIssued(() => toast.success('Invoice sent to your billing email')) },
  { label: 'Export CSV', icon: 'lucide-file-spreadsheet', onClick: whenIssued(exportCsv) },
])

const STATUS = {
  accruing: { label: 'Accruing', theme: 'gray' },
  paid: { label: 'Paid', theme: 'green' },
  unpaid: { label: 'Unpaid', theme: 'amber' },
}

// ── The docked invoice ──────────────────────────────────────────────────────
const open = computed(() => rows.value.find((r) => r.id === openId.value) || null)
</script>

<template>
  <ConnectShell root-label="Invoices">
    <!-- The same invoice lives in Frappe Cloud's billing; the demo doesn't go there. -->
    <template #action>
      <Button label="Billing">
        <template #prefix><img :src="fcLogo" alt="Frappe Cloud" class="size-4" /></template>
      </Button>
    </template>

    <div class="fc-page-list py-8">
      <!-- The month and the bill's actions sit in the title row, above
           everything the month changes: the figures, the warning and the list. -->
      <PageIntro title="Your Frappe Cloud bill">
        <template #actions>
          <Select v-model="month" :options="monthOptions" class="w-44" />
          <Dropdown v-if="payFor.length" :options="billMenu">
            <Button icon="lucide-ellipsis" aria-label="More" />
          </Dropdown>
        </template>
      </PageIntro>

      <EmptyState
        v-if="!payFor.length"
        icon="lucide-wallet"
        title="No customers on Partner pays"
        description="Customers you pay for show here."
      >
        <Button label="View customers" route="/connect/customers" />
      </EmptyState>

      <template v-else>
        <!-- The bill's figures, with its status beside the total. -->
        <dl class="grid grid-cols-1 gap-3" :class="figures.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'">
          <div v-for="f in figures" :key="f.label" class="rounded-4 border border-outline-gray-1 px-4 py-3">
            <dt class="text-sm text-ink-gray-5">{{ f.label }}</dt>
            <dd class="mt-1.5 flex items-center gap-2">
              <span class="text-xl-semibold tabular-nums text-ink-gray-9">{{ f.value }}</span>
              <Badge v-if="f.status" :theme="STATUS[f.status].theme" variant="subtle" :label="STATUS[f.status].label" />
            </dd>
          </div>
        </dl>

        <Alert
          v-if="b.status === 'unpaid'"
          class="mt-4"
          theme="amber"
          :title="`${b.month.label} invoice is unpaid`"
          :description="`${payFor.map((r) => r.customer).join(', ')} may be suspended.`"
        />

        <List v-model:active="openId" class="-mx-3 mt-6 list-row-px-3 text-base" :columns="columns" divider="inset" :row-height="56">
          <ListHeader>
            <ListHeaderCellSort class="col-span-2" :direction="dirOf('customer')" @click="sortBy('customer')">Customer</ListHeaderCellSort>
            <ListHeaderCell class="hidden sm:flex">Invoice</ListHeaderCell>
            <ListHeaderCellSort align="end" :direction="dirOf('amount')" @click="sortBy('amount')">Amount</ListHeaderCellSort>
          </ListHeader>
          <ListRows :items="rows" v-slot="{ item, value }">
            <ListRow :value="value" @click="openId = item.id">
              <!-- 40px, Gameplan's people-list size, fills the two-line row. -->
              <ListCell>
                <Avatar :label="item.own ? firm.name : item.customer" size="2xl" shape="square" />
              </ListCell>
              <ListCell class="min-w-0">
                <div class="min-w-0">
                  <div class="truncate text-ink-gray-8">{{ item.own ? 'Your account' : item.customer }}</div>
                  <div v-if="emailOf(item)" class="mt-1 truncate text-ink-gray-5">{{ emailOf(item) }}</div>
                </div>
              </ListCell>
              <ListCell class="hidden whitespace-nowrap tabular-nums text-ink-gray-5 sm:flex">{{ item.invoice }}</ListCell>
              <ListCell class="justify-end tabular-nums text-ink-gray-7">{{ money(item.converted, cur) }}</ListCell>
            </ListRow>
          </ListRows>
        </List>
      </template>
    </div>

    <!-- ── An invoice, docked ───────────────────────────────────────────── -->
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
        <div class="flex shrink-0 items-center gap-1">
          <template v-if="!open.own">
            <Button icon="lucide-download" :tooltip="`Download ${open.customer}’s breakdown`" :aria-label="`Download ${open.customer}’s breakdown`" @click="downloadFor(open)" />
            <Button icon="lucide-mail" :tooltip="`Email to ${emailOf(open)}`" :aria-label="`Email ${open.customer}’s breakdown`" @click="emailTo(open)" />
          </template>
          <Button variant="ghost" icon="lucide-x" aria-label="Close" @click="openId = null" />
        </div>
      </div>

      <ScrollArea class="min-h-0 flex-1" viewport-class="p-4">
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
          <div v-if="open.rate && open.status !== 'unpaid'" class="flex justify-between gap-3 text-sm text-ink-gray-5">
            <dt>Counts toward MRR as</dt>
            <dd class="tabular-nums">{{ money(open.converted, cur) }}</dd>
          </div>
        </dl>
        <p v-if="open.rate && open.status !== 'unpaid'" class="mt-1.5 text-sm text-ink-gray-5">At ₹{{ open.rate }} per $ on {{ shortDate(open.date) }}</p>
      </ScrollArea>
    </template>
  </ConnectShell>
</template>
