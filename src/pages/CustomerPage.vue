<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Avatar, Badge, Button, Dialog, TabList, TabPanel, Tabs, TabTrigger, Textarea, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { customerInvoices } from '../data/partnerAccount'
import { TIERS, firmFor, longDate, money } from '../data/partnership'

// SCREEN — one customer, laid out like a deal in Frappe CRM: a side panel with
// the facts, and the main area, in tabs, for what changes over time.
// See PARTNER-VIEW-PLAN.md §2.

const route = useRoute()
const store = useConnectStore()
const account = usePartnerAccountStore()
const firm = computed(() => firmFor(store.partnerTier))

const c = computed(() => account.customers.find((x) => x.id === route.params.id) ?? null)

const isOwner = computed(() => store.partnerRole === 'owner')
const seesInvoices = computed(() => store.partnerRole !== 'sales')
const partnerPays = computed(() => c.value?.billing === 'partner')

const STAGE = {
  onboarding: { label: 'Onboarding', theme: 'blue' },
  live: { label: 'Live', theme: 'green' },
  churned: { label: 'Churned', theme: 'gray' },
}

// ── Tabs ────────────────────────────────────────────────────────────────────
const tabs = computed(() =>
  [
    { value: 'sites', label: 'Sites' },
    seesInvoices.value && { value: 'invoices', label: 'Invoices' },
    c.value?.source === 'connect' && { value: 'connect', label: 'Connect' },
    { value: 'notes', label: 'Notes' },
  ].filter(Boolean),
)
const tab = ref('sites')
watch(() => route.params.id, () => (tab.value = 'sites'))

// Sites linked by an approved request, before their first bill.
const sites = computed(() =>
  c.value?.sites.length ? c.value.sites : (c.value?.linkedSites ?? []).map((s) => ({ ...s, status: 'Active', apps: [] })),
)
const invoices = computed(() =>
  c.value ? customerInvoices(store.partnerTier, store.partnershipState, c.value.name) : [],
)

// ── Notes ───────────────────────────────────────────────────────────────────
const notes = ref('')
watch(c, (v) => (notes.value = v?.notes ?? ''), { immediate: true })
const saveNotes = () => {
  account.setNotes(c.value.id, notes.value)
  toast.success('Notes saved', { id: 'notes-saved' })
}

// ── Switching to Partner pays ───────────────────────────────────────────────
// The owner starts it; the customer confirms in Frappe Cloud, since their
// billing moves away from them. See the plan's switching flow.
const switching = ref(false)
const discount = computed(() => TIERS[store.partnerTier === 'beginner' ? 'bronze' : 'silver'].discount)
function requestSwitch() {
  account.requestPartnerPays(c.value.id)
  switching.value = false
  toast.success(`Sent to ${c.value.contact || c.value.name} to confirm`)
}
</script>

<template>
  <ConnectShell root-label="Customers" root-to="/connect/customers" :crumb="c?.name ?? 'Not found'">
    <EmptyState
      v-if="!c"
      icon="lucide-building-2"
      title="This customer isn’t in your list"
    >
      <Button label="All customers" route="/connect/customers" />
    </EmptyState>

    <div v-else class="flex min-h-full flex-col-reverse lg:flex-row">
      <!-- ── The main area ─────────────────────────────────────────────── -->
      <div class="min-w-0 flex-1 px-3 py-6 sm:px-5">
        <Tabs v-model="tab">
          <TabList variant="underline">
            <TabTrigger v-for="t in tabs" :key="t.value" :value="t.value" :label="t.label" />
          </TabList>

          <TabPanel value="sites">
            <div class="pt-4">
              <EmptyState
                v-if="!sites.length"
                icon="lucide-globe"
                title="Not on Frappe Cloud yet"
                description="Sites show here once they link."
              />
              <ul v-else class="divide-y divide-outline-gray-1">
                <li v-for="site in sites" :key="site.name" class="flex items-start justify-between gap-4 py-3">
                  <span class="min-w-0">
                    <span class="block truncate text-base text-ink-gray-8">{{ site.name }}</span>
                    <span class="mt-1.5 block text-sm text-ink-gray-5">
                      {{ site.plan }}
                      <template v-if="!partnerPays">
                        · {{ site.region }} · {{ site.status }}<template v-if="site.apps.length">
                          · {{ site.apps.join(', ') }}</template>
                      </template>
                    </span>
                  </span>
                  <span v-if="site.amount != null" class="shrink-0 tabular-nums text-ink-gray-7">
                    {{ money(site.amount, site.currency) }}
                  </span>
                </li>
              </ul>
              <Button
                v-if="sites.length && !partnerPays"
                class="mt-4"
                label="Open in Frappe Cloud"
                href="https://frappecloud.com/dashboard"
              />
            </div>
          </TabPanel>

          <TabPanel value="invoices">
            <div class="pt-4">
              <p v-if="partnerPays" class="text-p-sm text-ink-gray-5">
                Billed to you. These are the per-customer invoices from Billing.
              </p>
              <EmptyState v-if="!invoices.length" icon="lucide-receipt" title="No invoices yet" />
              <ul v-else class="divide-y divide-outline-gray-1" :class="partnerPays && 'mt-3'">
                <li v-for="inv in invoices" :key="inv.id" class="flex items-center justify-between gap-4 py-3">
                  <span class="min-w-0">
                    <span class="block text-base text-ink-gray-8">{{ inv.month }}</span>
                    <span class="mt-1 block text-sm tabular-nums text-ink-gray-5">{{ inv.invoice }}</span>
                  </span>
                  <span class="flex shrink-0 items-center gap-3">
                    <Badge v-if="inv.status === 'unpaid'" theme="amber" variant="subtle" size="sm" label="Unpaid" />
                    <span class="tabular-nums text-ink-gray-7">{{ money(inv.amount, inv.currency) }}</span>
                  </span>
                </li>
              </ul>
            </div>
          </TabPanel>

          <TabPanel value="connect">
            <div class="space-y-4 pt-4">
              <div>
                <p class="text-sm text-ink-gray-5">Project</p>
                <p class="mt-1 text-base text-ink-gray-8">{{ c.project }}</p>
              </div>
              <Button label="Open conversation" route="/connect/messages" />
            </div>
          </TabPanel>

          <TabPanel value="notes">
            <div class="space-y-3 pt-4">
              <Textarea v-model="notes" :rows="8" placeholder="Anything your team should know about this customer" />
              <Button label="Save notes" @click="saveNotes" />
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <!-- ── The side panel ────────────────────────────────────────────── -->
      <aside class="shrink-0 border-b border-outline-gray-1 px-3 py-6 sm:px-5 lg:w-80 lg:border-b-0 lg:border-l">
        <div class="flex items-center gap-3">
          <Avatar :label="c.name" size="xl" shape="square" />
          <div class="min-w-0">
            <p class="truncate text-lg-semibold text-ink-gray-9">{{ c.name }}</p>
            <Badge class="mt-1" :theme="STAGE[c.stage].theme" variant="subtle" size="sm" :label="STAGE[c.stage].label" />
          </div>
        </div>

        <dl class="mt-6 divide-y divide-outline-gray-1">
          <div class="py-3">
            <dt class="text-sm text-ink-gray-5">Contact</dt>
            <dd class="mt-1 text-base text-ink-gray-8">{{ c.contact || '—' }}</dd>
            <dd v-if="c.email" class="mt-0.5 truncate text-sm text-ink-gray-5">{{ c.email }}</dd>
          </div>
          <div class="py-3">
            <dt class="text-sm text-ink-gray-5">MRR</dt>
            <dd class="mt-1 text-base tabular-nums text-ink-gray-8">
              {{ c.mrr ? money(c.mrr, firm.currency) : '—' }}
            </dd>
          </div>
          <div class="py-3">
            <dt class="text-sm text-ink-gray-5">Billing</dt>
            <dd class="mt-1 text-base text-ink-gray-8">
              {{ partnerPays ? 'Partner pays' : 'Customer pays' }}
            </dd>
            <dd v-if="c.billingSwitch" class="mt-1 text-sm text-ink-gray-5">
              Partner pays from {{ longDate(c.billingSwitch.from) }}, waiting for the customer
            </dd>
            <dd v-else-if="!partnerPays && isOwner && c.stage !== 'churned' && c.linked" class="mt-2">
              <Button size="sm" label="Switch to Partner pays" @click="switching = true" />
            </dd>
          </div>
          <div class="py-3">
            <dt class="text-sm text-ink-gray-5">Partner code</dt>
            <dd class="mt-1 text-base text-ink-gray-8">
              <template v-if="c.linked">Linked {{ longDate(c.linked) }}</template>
              <template v-else-if="c.codeShared">Shared {{ longDate(c.codeShared) }}, not linked yet</template>
              <template v-else>Not linked yet</template>
            </dd>
          </div>
        </dl>
      </aside>
    </div>

    <Dialog v-if="c" v-model:open="switching" title="Switch to Partner pays?">
      <ul class="space-y-2 text-p-base text-ink-gray-7">
        <li>Frappe bills you for {{ c.name }} from 1 Nov 2026, the next billing cycle.</li>
        <li>Your {{ discount }}% tier discount applies to it.</li>
        <li>You’ll see the monthly amount only, not their plans and invoices.</li>
        <li>{{ c.contact || c.name }} confirms in Frappe Cloud before it changes.</li>
      </ul>
      <template #actions>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" @click="switching = false" />
          <Button variant="solid" label="Send to customer" @click="requestSwitch" />
        </div>
      </template>
    </Dialog>
  </ConnectShell>
</template>
