<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Alert, Badge, Button, Select, TabButtons, TextInput, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import { useConnectStore } from '../stores/connect'
import { billingFor } from '../data/partnerAccount'
import { contributionMonths, contributionsFor, firmFor, money, shortDate } from '../data/partnership'

// SCREEN — Invoices: the Frappe Cloud invoices for the firm's customers, seen
// from two sides. "All customers" is every linked customer's invoice, which is
// what counts toward tier (the MRR on Partnership). "Paid by you" is only the
// Partner-pays customers, on the one monthly invoice the firm owes Frappe;
// the tier discount comes off that invoice's total, not off each customer.
//
// An invoice opens in the shell's docked panel, beside the list rather than
// over it, so stepping through customers keeps your place.

const store = useConnectStore()
const route = useRoute()
const router = useRouter()
const firm = computed(() => firmFor(store.partnerTier))
const cur = computed(() => firm.value.currency)
const months = contributionMonths()

const TABS = [
  { label: 'All customers', value: 'all' },
  { label: 'Paid by you', value: 'paid' },
]
// The tab lives in the URL, so Partnership's MRR row can open "All customers".
const tab = computed({
  get: () => (route.query.tab === 'paid' ? 'paid' : 'all'),
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

// ── Paid by you ─────────────────────────────────────────────────────────────
const b = computed(() => billingFor(store.partnerTier, store.partnershipState, month.value))
const payFor = computed(() => b.value.rows.filter((r) => !r.own))
const paidShown = computed(() => b.value.rows.filter((r) => matches(r.own ? 'Your account' : r.customer)))

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

// ── The intro's figures follow the tab ──────────────────────────────────────
const stats = computed(() => {
  if (tab.value === 'all') return [{ label: 'MRR', value: money(mrr.value, cur.value) }]
  if (!payFor.value.length) return []
  return [
    {
      label: monthMeta.value.open ? 'You owe so far' : b.value.status === 'unpaid' ? 'You owe' : 'You paid',
      value: money(b.value.total, cur.value),
    },
    ...(b.value.discount ? [{ label: 'Tier discount', value: `${b.value.discount}%` }] : []),
  ]
})

const STATUS = {
  accruing: { label: 'Accruing', theme: 'gray' },
  paid: { label: 'Paid', theme: 'green' },
  unpaid: { label: 'Unpaid', theme: 'amber' },
}

// ── The docked invoice ──────────────────────────────────────────────────────
const open = computed(() => {
  if (!openId.value) return null
  if (tab.value === 'paid') {
    if (openId.value === 'invoice') return { whole: true }
    return b.value.rows.find((r) => r.id === openId.value) ?? null
  }
  return all.value.find((r) => r.id === openId.value) ?? null
})
const openTitle = computed(() => (open.value.whole ? 'Your Frappe Cloud invoice' : open.value.own ? 'Your account' : open.value.customer))
</script>

<template>
  <ConnectShell root-label="Invoices">
    <div class="fc-page-list py-8">
      <PageIntro title="Frappe Cloud invoices for your customers" :stats="stats">
        <template #actions>
          <Select v-model="month" :options="monthOptions" class="w-48" />
          <Button
            v-if="tab === 'paid' && payFor.length"
            icon-left="lucide-download"
            label="Export CSV"
            @click="monthMeta.open ? notReady() : exportCsv()"
          />
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

      <!-- ── Paid by you ───────────────────────────────────────────────── -->
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
            :title="`Your ${b.month.label} invoice is unpaid. ${payFor.map((r) => r.customer).join(', ')} may be suspended.`"
          />

          <!-- The firm's own Frappe Cloud invoice: the rows below add up to
               its subtotal, and the discount comes off it. -->
          <List
            v-model:active="openId"
            class="-mx-3 mt-6 list-row-px-3"
            :columns="['minmax(0,1fr)', 'auto']"
            :row-height="56"
          >
            <ListRow value="invoice" @click="openId = 'invoice'">
              <ListCell class="min-w-0">
                <span class="min-w-0">
                  <span class="block text-base text-ink-gray-8">Your Frappe Cloud invoice</span>
                  <span class="mt-1 block text-sm tabular-nums text-ink-gray-5">{{ b.invoice }}</span>
                </span>
              </ListCell>
              <!-- No total here: the figure at the top of the page is it. -->
              <ListCell class="gap-3">
                <Badge v-if="b.status === 'paid'" theme="green" variant="subtle" size="sm" label="Paid" />
                <span class="lucide-chevron-right size-4 text-ink-gray-5" aria-hidden="true" />
              </ListCell>
            </ListRow>
          </List>

          <TextInput v-model="query" type="search" placeholder="Search customers" class="mt-6 w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>

          <List
            v-if="paidShown.length"
            v-model:active="openId"
            class="-mx-3 mt-4 list-row-px-3"
            :columns="['minmax(0,1fr)', '8rem']"
            :row-height="48"
          >
            <ListHeader>
              <ListHeaderCell>Customer</ListHeaderCell>
              <ListHeaderCell class="justify-end">Frappe billed</ListHeaderCell>
            </ListHeader>
            <ListRows :items="paidShown" v-slot="{ item, value }">
              <ListRow :value="value" @click="openId = item.id">
                <ListCell class="min-w-0">
                  <span class="truncate text-ink-gray-8">{{ item.own ? 'Your account' : item.customer }}</span>
                </ListCell>
                <ListCell class="justify-end tabular-nums text-ink-gray-7">{{ money(item.converted, cur) }}</ListCell>
              </ListRow>
            </ListRows>
          </List>
          <EmptyState v-else icon="lucide-receipt" title="No invoices match" />
        </template>
      </template>
    </div>

    <!-- ── An invoice, docked ─────────────────────────────────────────────── -->
    <template v-if="open" #panel>
      <div class="flex items-start justify-between gap-3 border-b border-outline-gray-1 p-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-base-semibold text-ink-gray-9">{{ openTitle }}</span>
            <Badge
              v-if="tab === 'all' && open.status !== 'accruing'"
              :theme="STATUS[open.status].theme"
              variant="subtle"
              size="sm"
              :label="STATUS[open.status].label"
            />
          </div>
          <p class="mt-1 text-sm text-ink-gray-5">{{ open.whole ? b.invoice : open.invoice }} · {{ monthMeta.label }}</p>
        </div>
        <div class="flex shrink-0 items-center">
          <template v-if="tab === 'paid'">
            <Button variant="ghost" icon="lucide-mail" aria-label="Email invoice" tooltip="Email invoice" @click="monthMeta.open ? notReady() : toast.success('Invoice sent to your billing email')" />
            <Button variant="ghost" icon="lucide-download" aria-label="Download PDF" tooltip="Download PDF" @click="monthMeta.open ? notReady() : toast.success('Invoice downloaded')" />
          </template>
          <Button variant="ghost" icon="lucide-x" aria-label="Close" @click="openId = null" />
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <!-- The whole invoice: each customer, then the discount on the total. -->
        <template v-if="open.whole">
          <section v-for="r in b.rows" :key="r.id" class="border-b border-outline-gray-1 py-3 first:pt-0">
            <div class="flex justify-between gap-3 text-base">
              <span class="text-ink-gray-8">{{ r.own ? 'Your account' : r.customer }}</span>
              <span class="tabular-nums text-ink-gray-8">{{ money(r.converted, cur) }}</span>
            </div>
            <ul class="mt-1.5 space-y-1">
              <li v-for="site in r.sites" :key="site.name" class="flex justify-between gap-3 text-sm text-ink-gray-5">
                <span class="truncate">{{ site.name }}</span>
                <span class="shrink-0">{{ site.plan }}</span>
              </li>
            </ul>
          </section>
          <dl class="mt-3 space-y-2 text-base">
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

        <!-- One customer: what Frappe billed for their sites. -->
        <template v-else>
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
            <!-- Converted at the invoice date's rate, so the figure that
                 counts toward MRR can be checked by hand. -->
            <div v-if="open.rate" class="flex justify-between gap-3 text-sm text-ink-gray-5">
              <dt>{{ tab === 'all' ? 'Counts toward MRR as' : 'On your invoice as' }}</dt>
              <dd class="tabular-nums">{{ money(open.converted, cur) }}</dd>
            </div>
          </dl>
          <p v-if="open.rate" class="mt-1.5 text-sm text-ink-gray-5">
            At ₹{{ open.rate }} per $ on {{ shortDate(open.date) }}
          </p>
        </template>
      </div>
    </template>
  </ConnectShell>
</template>
