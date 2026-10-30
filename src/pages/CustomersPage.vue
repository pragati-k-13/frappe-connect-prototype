<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button, Dialog, FormControl, TabButtons, TextInput, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerCode from '../components/PartnerCode.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { contributionsFor, firmFor, money, OPEN_MONTH, shortDate } from '../data/partnership'

// SCREEN — Customers: who the firm works with and what each brings in.
// See PARTNER-VIEW-PLAN.md §2.
//
// Link requests sit above the list because they're waiting on the owner; a
// request opens in the docked panel, where there's room to judge it.

const store = useConnectStore()
const account = usePartnerAccountStore()
const firm = computed(() => firmFor(store.partnerTier))

const isOwner = computed(() => store.partnerRole === 'owner')
const canAdd = computed(() => store.partnerRole !== 'finance')

// ── The list ────────────────────────────────────────────────────────────────
const source = ref('all')
const query = ref('')
const SOURCES = [
  { label: 'All', value: 'all' },
  { label: 'Through Connect', value: 'connect' },
  { label: 'Your own', value: 'own' },
]

const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return account.customers.filter(
    (c) =>
      (source.value === 'all' || c.source === source.value) &&
      (!q || c.name.toLowerCase().includes(q) || c.contact?.toLowerCase().includes(q)),
  )
})

// The customers' total, and what the firm's own account adds to reach the
// figure on Partnership.
const total = computed(() => account.customers.reduce((sum, c) => sum + c.mrr, 0))
const own = computed(
  () => contributionsFor(store.partnerTier, OPEN_MONTH, store.partnershipState).find((r) => r.own)?.converted ?? 0,
)

const STAGE = {
  onboarding: { label: 'Onboarding', theme: 'blue' },
  live: { label: 'Live', theme: 'green' },
  churned: { label: 'Churned', theme: 'gray' },
}
const BILLING = { customer: 'Customer pays', partner: 'Partner pays' }

// ── Link requests ───────────────────────────────────────────────────────────
const openId = ref(null)
const open = computed(() => account.requests.find((r) => r.id === openId.value) ?? null)
const match = computed(() =>
  open.value?.matches ? account.customers.find((c) => c.id === open.value.matches) : null,
)

// A few seconds to undo instead of an "Are you sure?" dialog: approving by
// mistake exposes a stranger's invoices, declining sends a rejection.
function handle(outcome) {
  const req = open.value
  account.handleRequest(req.id, outcome)
  openId.value = null
  const done = outcome === 'approved' ? `${req.company} linked` : `${req.company} declined`
  toast.success(done, { action: { label: 'Undo', onClick: () => account.undoRequest(req.id) } })
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
  <ConnectShell root-label="Customers">
    <div class="fc-page-list py-8">
      <!-- The total, the code and the one action. -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm text-ink-gray-5">MRR from customers this month</p>
          <p class="mt-1 text-2xl-semibold tabular-nums text-ink-gray-9">{{ money(total, firm.currency) }}</p>
          <p class="mt-1.5 text-sm text-ink-gray-5">
            Your own account adds {{ money(own, firm.currency) }} · Updated 2 hours ago
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <PartnerCode :code="firm.code" :firm="firm.name" />
          <Button v-if="canAdd" variant="solid" label="Add customer" @click="startAdd" />
        </div>
      </div>

      <!-- ── Link requests ────────────────────────────────────────────── -->
      <section v-if="account.requests.length" class="mt-10">
        <h2 class="text-lg-semibold text-ink-gray-8">Link requests</h2>
        <List
          v-model:active="openId"
          class="-mx-3 mt-3 list-row-px-3"
          :columns="['minmax(0,1fr)', 'auto']"
          :row-height="56"
        >
          <ListRow
            v-for="r in account.requests"
            :key="r.id"
            :value="r.id"
            @click="openId = r.id"
          >
            <ListCell class="min-w-0">
              <span class="min-w-0">
                <span class="block truncate text-base text-ink-gray-8">{{ r.company }}</span>
                <span class="mt-1 block truncate text-sm text-ink-gray-5">
                  {{ r.contact }} · {{ r.sites.length }} {{ r.sites.length === 1 ? 'site' : 'sites' }}
                  <template v-if="r.matches"> · Matches a customer you added</template>
                </span>
              </span>
            </ListCell>
            <ListCell class="text-sm text-ink-gray-5">{{ shortDate(r.at) }}</ListCell>
          </ListRow>
        </List>
      </section>

      <!-- ── Customers ────────────────────────────────────────────────── -->
      <section class="mt-10">
        <div class="flex flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Search customers" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
          <TabButtons v-model="source" :options="SOURCES" />
        </div>

        <List
          v-if="shown.length"
          class="-mx-3 mt-4 list-row-px-3"
          :columns="{ base: ['minmax(0,1fr)', '7rem'], sm: ['minmax(0,1fr)', '8rem', '7rem', '7rem'] }"
          :row-height="56"
        >
          <ListHeader>
            <ListHeaderCell>Customer</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Billing</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Stage</ListHeaderCell>
            <ListHeaderCell class="justify-end">MRR</ListHeaderCell>
          </ListHeader>
          <ListRows :items="shown" v-slot="{ item }">
            <ListRow :route="`/connect/customers/${item.id}`">
              <ListCell class="min-w-0 gap-3">
                <Avatar :label="item.name" size="md" shape="square" />
                <span class="min-w-0">
                  <span class="block truncate text-base text-ink-gray-8">{{ item.name }}</span>
                  <span class="mt-1 block truncate text-sm text-ink-gray-5">
                    {{ item.source === 'connect' ? 'Through Connect' : 'Your own' }}
                    <template v-if="item.codeShared"> · Code shared {{ shortDate(item.codeShared) }}</template>
                    <template v-else-if="item.stage === 'onboarding' && !item.sites.length && !item.linkedSites">
                      · Not on Frappe Cloud yet
                    </template>
                  </span>
                </span>
              </ListCell>
              <ListCell class="hidden text-sm text-ink-gray-7 sm:flex">{{ BILLING[item.billing] }}</ListCell>
              <ListCell class="hidden sm:flex">
                <Badge :theme="STAGE[item.stage].theme" variant="subtle" size="sm" :label="STAGE[item.stage].label" />
              </ListCell>
              <ListCell class="justify-end tabular-nums text-ink-gray-7">
                {{ item.mrr ? money(item.mrr, firm.currency) : '—' }}
              </ListCell>
            </ListRow>
          </ListRows>
        </List>
        <EmptyState
          v-else
          icon="lucide-building-2"
          title="No customers match"
          description="Try another search or filter."
        />
      </section>
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
