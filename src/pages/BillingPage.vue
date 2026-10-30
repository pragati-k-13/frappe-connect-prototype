<script setup>
import { computed, ref, watch } from 'vue'
import { Alert, Badge, Button, Select, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { billingFor } from '../data/partnerAccount'
import { contributionMonths, money } from '../data/partnership'

// SCREEN — Billing: what the firm paid Frappe on its customers' behalf, and
// what to bill them. Only Partner-pays customers, since the firm pays nothing
// for the rest. Contributions is Frappe's view; this is the accountant's.
// See PARTNER-VIEW-PLAN.md §3.
//
// An invoice opens in the docked panel, like Frappe Cloud's own: the
// customer's servers and sites, then subtotal, discount and total. That panel
// IS the per-customer invoice the firm passes on.

const store = useConnectStore()
const months = contributionMonths()
const month = ref(months[0].key)
const openId = ref(null)

const b = computed(() => billingFor(store.partnerTier, store.partnershipState, month.value))
const customers = computed(() => b.value.rows.filter((r) => !r.own))
const open = computed(() => {
  if (openId.value === 'invoice') return { whole: true }
  return b.value.rows.find((r) => r.id === openId.value) ?? null
})

watch(month, () => (openId.value = null))
const monthOptions = months.map((m) => ({ label: m.open ? `${m.label}, so far` : m.label, value: m.key }))
const cur = computed(() => b.value.currency)

const STATUS = { paid: { label: 'Paid', theme: 'green' }, unpaid: { label: 'Unpaid', theme: 'amber' } }

// The month's rows as a file, so the firm can bill each customer from its own
// ERPNext. Only once the month is final.
function exportCsv() {
  const lines = [
    ['Customer', 'Invoice', 'Frappe billed', 'Discount', 'You paid', 'Currency'],
    ...b.value.rows.map((r) => [r.own ? 'Your account' : r.customer, r.invoice, r.billed, r.off, r.paid, cur.value]),
  ]
  const blob = new Blob([lines.map((l) => l.join(',')).join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `billing-${month.value}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

const notReady = () => toast.info('Available once Frappe Cloud issues the invoice')
</script>

<template>
  <ConnectShell root-label="Billing">
    <div class="fc-page-list py-8">
      <EmptyState
        v-if="!customers.length"
        icon="lucide-wallet"
        title="No customers on Partner pays"
        description="Customers you pay for show here."
      >
        <Button label="View customers" route="/connect/customers" />
      </EmptyState>

      <template v-else>
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm text-ink-gray-5">
              {{ b.month.open ? 'You’ve paid so far this month' : `You paid for ${b.month.label}` }}
            </p>
            <p class="mt-1 text-2xl-semibold tabular-nums text-ink-gray-9">{{ money(b.total, cur) }}</p>
            <p v-if="b.discount" class="mt-1.5 text-sm text-ink-gray-5">After your {{ b.discount }}% tier discount</p>
          </div>
          <div class="flex items-center gap-2">
            <Select v-model="month" :options="monthOptions" class="w-48" />
            <Button
              icon-left="lucide-download"
              label="Export CSV"
              @click="b.month.open ? notReady() : exportCsv()"
            />
          </div>
        </div>

        <Alert
          v-if="b.status === 'unpaid'"
          class="mt-6"
          theme="amber"
          :title="`Your ${b.month.label} invoice is unpaid. ${customers.map((r) => r.customer).join(', ')} may be suspended.`"
        />

        <!-- The firm's own Frappe Cloud invoice: the rows below add up to it. -->
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
            <ListCell class="gap-3">
              <Badge v-if="STATUS[b.status]" :theme="STATUS[b.status].theme" variant="subtle" size="sm" :label="STATUS[b.status].label" />
              <span class="tabular-nums text-ink-gray-8">{{ money(b.total, cur) }}</span>
            </ListCell>
          </ListRow>
        </List>

        <List
          v-if="b.rows.length"
          v-model:active="openId"
          class="-mx-3 mt-4 list-row-px-3"
          :columns="{ base: ['minmax(0,1fr)', '7rem'], sm: ['minmax(0,1fr)', '7rem', '6rem', '7rem'] }"
          :row-height="48"
        >
          <ListHeader>
            <ListHeaderCell>Customer</ListHeaderCell>
            <ListHeaderCell class="hidden justify-end sm:flex">Frappe billed</ListHeaderCell>
            <ListHeaderCell class="hidden justify-end sm:flex">Discount</ListHeaderCell>
            <ListHeaderCell class="justify-end">You paid</ListHeaderCell>
          </ListHeader>
          <ListRows :items="b.rows" v-slot="{ item, value }">
            <ListRow :value="value" @click="openId = item.id">
              <ListCell class="min-w-0 gap-2">
                <span class="truncate text-ink-gray-8">{{ item.own ? 'Your account' : item.customer }}</span>
              </ListCell>
              <ListCell class="hidden justify-end tabular-nums text-ink-gray-7 sm:flex">{{ money(item.billed, cur) }}</ListCell>
              <ListCell class="hidden justify-end tabular-nums text-ink-gray-5 sm:flex">
                {{ item.off ? `−${money(item.off, cur)}` : '—' }}
              </ListCell>
              <ListCell class="justify-end tabular-nums text-ink-gray-8">{{ money(item.paid, cur) }}</ListCell>
            </ListRow>
          </ListRows>
        </List>
      </template>
    </div>

    <!-- ── An invoice, docked ───────────────────────────────────────────── -->
    <template v-if="open" #panel>
      <div class="flex items-start justify-between gap-3 border-b border-outline-gray-1 p-4">
        <div class="min-w-0">
          <p class="truncate text-base-semibold text-ink-gray-9">
            {{ open.whole ? 'Your Frappe Cloud invoice' : open.own ? 'Your account' : open.customer }}
          </p>
          <p class="mt-1 text-sm text-ink-gray-5">{{ open.whole ? b.invoice : open.invoice }} · {{ b.month.label }}</p>
        </div>
        <div class="flex shrink-0 items-center">
          <Button variant="ghost" icon="lucide-mail" aria-label="Email invoice" tooltip="Email invoice" @click="b.month.open ? notReady() : toast.success('Invoice sent to your billing email')" />
          <Button variant="ghost" icon="lucide-download" aria-label="Download PDF" tooltip="Download PDF" @click="b.month.open ? notReady() : toast.success('Invoice downloaded')" />
          <Button variant="ghost" icon="lucide-x" aria-label="Close" @click="openId = null" />
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <!-- The whole invoice: split by customer, with servers under each. -->
        <template v-if="open.whole">
          <section v-for="r in b.rows" :key="r.id" class="border-b border-outline-gray-1 py-3 first:pt-0 last:border-b-0">
            <div class="flex justify-between gap-3 text-base">
              <span class="text-ink-gray-8">{{ r.own ? 'Your account' : r.customer }}</span>
              <span class="tabular-nums text-ink-gray-8">{{ money(r.paid, cur) }}</span>
            </div>
            <ul class="mt-1.5 space-y-1">
              <li v-for="site in r.sites" :key="site.name" class="flex justify-between gap-3 text-sm text-ink-gray-5">
                <span class="truncate">{{ site.name }}</span>
                <span class="shrink-0">{{ site.plan }}</span>
              </li>
            </ul>
          </section>
        </template>

        <!-- One customer's invoice. -->
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
            <div class="flex justify-between gap-3">
              <dt class="text-ink-gray-7">Subtotal</dt>
              <dd class="tabular-nums text-ink-gray-8">{{ money(open.billed, cur) }}</dd>
            </div>
            <div v-if="open.off" class="flex justify-between gap-3">
              <dt class="text-ink-gray-7">Tier discount</dt>
              <dd class="tabular-nums text-ink-gray-8">−{{ money(open.off, cur) }}</dd>
            </div>
            <div class="flex justify-between gap-3 font-medium">
              <dt class="text-ink-gray-8">Total</dt>
              <dd class="tabular-nums text-ink-gray-9">{{ money(open.paid, cur) }}</dd>
            </div>
          </dl>
        </template>
      </div>
    </template>
  </ConnectShell>
</template>
