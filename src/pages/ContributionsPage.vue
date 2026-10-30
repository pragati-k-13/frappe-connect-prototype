<script setup>
import { computed, ref, watch } from 'vue'
import { Badge, Button, Select, TextInput } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PageIntro from '../components/PageIntro.vue'
import { useConnectStore } from '../stores/connect'
import {
  contributionMonths,
  contributionsFor,
  firmFor,
  money,
  shortDate,
} from '../data/partnership'

// SCREEN — Contributions: every Frappe Cloud invoice behind the MRR on
// Partnership, for one month. Frappe's view of the money; the partner's own
// (what they paid for customers) is Billing.
//
// An invoice opens in the shell's docked panel, beside the list rather than
// over it, so stepping through customers keeps your place. Same shape as
// Frappe Cloud's own invoices.

const store = useConnectStore()
const firm = computed(() => firmFor(store.partnerTier))
const months = contributionMonths()

const month = ref(months[0].key)
const status = ref('all')
const query = ref('')
const openId = ref(null)

const rows = computed(() =>
  contributionsFor(store.partnerTier, month.value, store.partnershipState),
)
const total = computed(() => rows.value.reduce((sum, r) => sum + r.converted, 0))
const monthMeta = computed(() => months.find((m) => m.key === month.value))

const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter(
    (r) => (status.value === 'all' || r.status === status.value) && (!q || r.customer.toLowerCase().includes(q)),
  )
})
const open = computed(() => rows.value.find((r) => r.id === openId.value) ?? null)

watch(month, () => {
  openId.value = null
  status.value = 'all'
})

const monthOptions = months.map((m) => ({ label: m.open ? `${m.label}, so far` : m.label, value: m.key }))
const statusOptions = computed(() =>
  monthMeta.value.open
    ? [{ label: 'All', value: 'all' }]
    : [
        { label: 'All statuses', value: 'all' },
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
      ],
)

// The current month has no status to show: every invoice in it is still
// building up, and a "This month" badge on each row would repeat the picker.
const showStatus = computed(() => !monthMeta.value.open)
const columns = computed(() =>
  showStatus.value
    ? { base: ['minmax(0,1fr)', '8rem'], sm: ['minmax(0,1fr)', '10rem', '6rem', '8rem'] }
    : { base: ['minmax(0,1fr)', '8rem'], sm: ['minmax(0,1fr)', '10rem', '8rem'] },
)

const STATUS = {
  accruing: { label: 'Accruing', theme: 'gray' },
  paid: { label: 'Paid', theme: 'green' },
  unpaid: { label: 'Unpaid', theme: 'amber' },
}
</script>

<template>
  <ConnectShell root-label="Partnership" root-to="/connect/partnership" crumb="Contributions">
    <div class="fc-page-list py-8">
      <!-- The total first: it is the figure on Partnership, and the reason
           anyone opens this page is to see what makes it up. -->
      <PageIntro
        title="What counts toward your tier"
        :stats="[{ label: 'MRR', value: money(total, firm.currency) }]"
      >
        <template #actions>
          <Select v-model="month" :options="monthOptions" class="w-48" />
        </template>
      </PageIntro>

      <div class="flex flex-wrap items-center gap-2">
        <TextInput v-model="query" type="search" placeholder="Search customers" class="w-full sm:w-56">
          <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
        </TextInput>
        <Select v-if="!monthMeta.open" v-model="status" :options="statusOptions" class="w-36" />
      </div>

      <List
        v-if="shown.length"
        class="-mx-3 mt-4 list-row-px-3"
        :columns="columns"
        :row-height="48"
        v-model:active="openId"
      >
        <ListHeader>
          <ListHeaderCell>Customer</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Invoice</ListHeaderCell>
          <ListHeaderCell v-if="showStatus" class="hidden sm:flex">Status</ListHeaderCell>
          <ListHeaderCell class="justify-end">Amount</ListHeaderCell>
        </ListHeader>
        <ListRows :items="shown" v-slot="{ item, value }">
          <ListRow :value="value" @click="openId = item.id">
            <ListCell class="min-w-0 gap-2">
              <span class="truncate text-ink-gray-8">{{ item.customer }}</span>
              <Badge v-if="item.own" theme="gray" variant="subtle" size="sm" label="Your account" />
            </ListCell>
            <ListCell class="hidden whitespace-nowrap tabular-nums text-ink-gray-5 sm:flex">
              {{ item.invoice }}
            </ListCell>
            <ListCell v-if="showStatus" class="hidden sm:flex">
              <Badge
                :theme="STATUS[item.status].theme"
                variant="subtle"
                size="sm"
                :label="STATUS[item.status].label"
              />
            </ListCell>
            <ListCell class="justify-end tabular-nums text-ink-gray-7">
              {{ money(item.amount, item.currency) }}
            </ListCell>
          </ListRow>
        </ListRows>
      </List>

      <EmptyState
        v-else
        icon="lucide-receipt"
        :title="rows.length ? 'No invoices match' : 'No invoices this month'"
        :description="rows.length ? 'Try another search or status.' : ''"
      />
    </div>

    <!-- ── The invoice, docked ──────────────────────────────────────────── -->
    <template v-if="open" #panel>
      <div class="flex items-start justify-between gap-3 border-b border-outline-gray-1 p-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-base-semibold text-ink-gray-9">{{ open.customer }}</span>
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
          <div class="flex justify-between gap-3">
            <dt class="text-ink-gray-8">Total</dt>
            <dd class="tabular-nums text-ink-gray-9">{{ money(open.amount, open.currency) }}</dd>
          </div>
          <!-- Converted at the invoice date's rate, shown so the figure that
               counts toward MRR can be checked by hand. -->
          <div v-if="open.rate" class="flex justify-between gap-3 text-sm text-ink-gray-5">
            <dt>Counts toward MRR as</dt>
            <dd class="tabular-nums">{{ money(open.converted, firm.currency) }}</dd>
          </div>
        </dl>
        <p v-if="open.rate" class="mt-1.5 text-sm text-ink-gray-5">
          At ₹{{ open.rate }} per $ on {{ shortDate(open.date) }}
        </p>
      </div>
    </template>
  </ConnectShell>
</template>
