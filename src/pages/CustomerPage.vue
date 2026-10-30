<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  Dropdown,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
  Textarea,
  TextInput,
  dialog,
  toast,
} from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import FollowUps from '../components/FollowUps.vue'
import ActivityFeed from '../components/ActivityFeed.vue'
import PanelSection from '../components/PanelSection.vue'
import PanelField from '../components/PanelField.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { CRMS, customerInvoices } from '../data/partnerAccount'
import { TIERS, firmFor, longDate, money } from '../data/partnership'

// SCREEN — one customer, laid out like a deal in Frappe CRM: owner and stage
// in the top bar, the record in tabs, and a side panel of facts you edit in
// place. The same tabs a lead has (Follow-ups, Activity, Notes), so a lead
// that's won keeps its history. See PARTNER-VIEW-PLAN.md §2.

const route = useRoute()
const router = useRouter()
const store = useConnectStore()
const account = usePartnerAccountStore()
const firm = computed(() => firmFor(store.partnerTier))

const c = computed(() => account.customers.find((x) => x.id === route.params.id) ?? null)

const isOwner = computed(() => store.partnerRole === 'owner')
const canEdit = computed(() => ['owner', 'sales'].includes(store.partnerRole))
const seesInvoices = computed(() => store.partnerRole !== 'sales')
const partnerPays = computed(() => c.value?.billing === 'partner')
const crm = computed(() => account.edits.crm)

// Who's acting, for the activity log.
const me = computed(() => (store.partnerRole === 'sales' ? 'rahul-verma' : store.partnerTier === 'beginner' ? 'sana-malik' : 'farhan-qureshi'))
const nameOf = (id) => account.team.find((p) => p.id === id)?.name ?? 'Unassigned'
const meName = computed(() => nameOf(me.value))
const teamPeople = computed(() => account.team.map((p) => ({ id: p.id, name: p.name })))

// ── Top bar: owner and stage ────────────────────────────────────────────────
const STAGE = {
  onboarding: { label: 'Onboarding', theme: 'blue' },
  live: { label: 'Live', theme: 'green' },
  churned: { label: 'Churned', theme: 'gray' },
}
function change(field, label, from, to, display = (v) => v) {
  if (from === to) return
  account.editCustomer(c.value.id, { [field]: to })
  account.log(c.value.id, { by: meName.value, kind: 'change', field: label, from: display(from) || 'Not set', to: display(to) || 'Not set' })
}
const stageMenu = computed(() =>
  Object.entries(STAGE).map(([value, s]) => ({
    label: s.label,
    onClick: () => change('stage', 'Stage', c.value.stage, value, (v) => STAGE[v]?.label),
  })),
)
const ownerMenu = computed(() =>
  account.team
    .filter((p) => p.roles.includes('sales') || p.roles.includes('owner'))
    .map((p) => ({ label: p.name, onClick: () => change('owner', 'Owner', c.value.owner, p.id, nameOf) })),
)

// ── Tabs ────────────────────────────────────────────────────────────────────
const tabs = computed(() =>
  [
    { value: 'sites', label: 'Sites', icon: 'lucide-globe' },
    seesInvoices.value && { value: 'invoices', label: 'Invoices', icon: 'lucide-receipt' },
    { value: 'followups', label: 'Follow-ups', icon: 'lucide-phone' },
    { value: 'activity', label: 'Activity', icon: 'lucide-history' },
    { value: 'notes', label: 'Notes', icon: 'lucide-notebook-pen' },
    c.value?.source === 'connect' && { value: 'connect', label: 'Connect', icon: 'lucide-message-square' },
  ].filter(Boolean),
)
// On a phone the side panel is a tab of its own, so the record comes first
// rather than a screen of facts above it.
const PHONE = '(max-width: 1023px)'
const mq = typeof window !== 'undefined' ? window.matchMedia(PHONE) : null
const narrow = ref(mq?.matches ?? false)
mq?.addEventListener('change', (e) => (narrow.value = e.matches))
watch(narrow, (v) => !v && tab.value === 'details' && (tab.value = 'sites'))
const tab = ref('sites')
watch(() => route.params.id, () => (tab.value = 'sites'))

// Sites linked by an approved request, before their first bill.
const sites = computed(() =>
  c.value?.sites.length ? c.value.sites : (c.value?.linkedSites ?? []).map((s) => ({ ...s, status: 'Active', apps: [] })),
)
const invoices = computed(() =>
  c.value ? customerInvoices(store.partnerTier, store.partnershipState, c.value.name) : [],
)

const followUps = computed(() => (c.value ? account.followUpsOf(c.value.id) : []))
function addFollowUp(f) {
  account.addFollowUp(c.value.id, { ...f, by: me.value })
  account.log(c.value.id, { by: meName.value, kind: 'note', text: `logged a ${f.mode.toLowerCase()}${f.spokeTo ? ` with ${f.spokeTo}` : ''}` })
  toast.success('Follow-up added')
}

// A customer with no recorded history still has the moment it linked.
const activity = computed(() => {
  if (!c.value) return []
  const list = account.activityOf(c.value.id)
  if (list.length || !c.value.linked) return list
  return [
    { id: 'linked', at: new Date(`${c.value.linked}T10:00:00`).getTime(), by: c.value.contact || c.value.name, kind: 'note', text: 'linked their sites to your partner code' },
    ...(account.edits.activity[c.value.id] ?? []),
  ]
})

// ── Notes ───────────────────────────────────────────────────────────────────
const notes = ref('')
watch(c, (v) => (notes.value = v?.notes ?? ''), { immediate: true })
const saveNotes = () => {
  account.setNotes(c.value.id, notes.value)
  toast.success('Notes saved', { id: 'notes-saved' })
}

// ── Side panel: fields edited in place ──────────────────────────────────────
// Saved on blur, each change logged. Read-only for finance and members, and
// for anything a synced CRM owns.
const CONTACT = [
  { key: 'contact', label: 'Name' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone', type: 'tel' },
]
const DETAILS = [
  { key: 'industry', label: 'Industry' },
  { key: 'country', label: 'Country' },
]
const draft = ref({})
watch(c, (v) => (draft.value = v ? Object.fromEntries([...CONTACT, ...DETAILS].map((f) => [f.key, v[f.key] ?? ''])) : {}), {
  immediate: true,
})
const editable = computed(() => canEdit.value && !crm.value)
function commit(f) {
  const to = draft.value[f.key].trim()
  if (f.key === 'email' && to && !/^\S+@\S+\.\S+$/.test(to)) {
    toast.error('Enter a valid email')
    draft.value[f.key] = c.value[f.key] ?? ''
    return
  }
  if (f.key === 'contact' && !to) {
    draft.value[f.key] = c.value[f.key] ?? ''
    return
  }
  change(f.key, f.label === 'Name' ? 'Contact' : f.label, c.value[f.key] ?? '', to)
}

// ── Quick actions ───────────────────────────────────────────────────────────
function copyLink() {
  navigator.clipboard?.writeText(window.location.href)
  toast.success('Link copied')
}
const linked = computed(() => Boolean(c.value?.linked || c.value?.sites.length))
const moreMenu = computed(() =>
  [
    isOwner.value && linked.value && { label: 'Unlink', icon: 'lucide-unlink', theme: 'red', onClick: unlink },
    canEdit.value && !linked.value && { label: 'Delete', icon: 'lucide-trash-2', theme: 'red', onClick: remove },
  ].filter(Boolean),
)
function unlink() {
  const { id, name } = c.value
  dialog.danger({
    title: `Unlink ${name}?`,
    message: 'Their MRR stops counting toward your tier, and you lose sight of their sites and invoices.',
    confirmLabel: 'Unlink',
    onConfirm: () => {
      account.removeCustomer(id)
      router.push('/connect/customers')
      toast.success(`${name} unlinked`)
    },
  })
}
function remove() {
  const { id, name } = c.value
  account.removeCustomer(id)
  router.push('/connect/customers')
  toast.success(`${name} deleted`, { action: { label: 'Undo', onClick: () => account.restoreCustomer(id) } })
}

// ── Switching to Partner pays ───────────────────────────────────────────────
// The owner starts it; the customer confirms in Frappe Cloud, since their
// billing moves away from them. See the plan's switching flow.
const switching = ref(false)
const discount = computed(() => TIERS[store.partnerTier === 'beginner' ? 'bronze' : 'silver'].discount)
function requestSwitch() {
  account.requestPartnerPays(c.value.id)
  account.log(c.value.id, { by: meName.value, kind: 'note', text: 'asked the customer to switch to Partner pays' })
  switching.value = false
  toast.success(`Sent to ${c.value.contact || c.value.name} to confirm`)
}
</script>

<template>
  <!-- `flush`: the page scrolls its two columns itself, so the side panel's
       border runs the full height instead of stopping where its content does. -->
  <ConnectShell root-label="Customers" root-to="/connect/customers" :crumb="c?.name ?? 'Not found'" flush>
    <!-- Owner and stage, where Frappe CRM puts them. -->
    <template v-if="c" #action>
      <div class="flex items-center gap-2">
        <!-- On a phone the owner is in Details; the bar keeps the stage. -->
        <div v-if="canEdit" class="hidden sm:block">
          <Dropdown :options="ownerMenu" align="end">
            <Button variant="subtle" :aria-label="`Owner: ${nameOf(c.owner)}`">
              <template #prefix><Avatar v-if="c.owner" :label="nameOf(c.owner)" size="xs" /></template>
              {{ c.owner ? nameOf(c.owner) : 'Assign' }}
            </Button>
          </Dropdown>
        </div>
        <Dropdown v-if="canEdit" :options="stageMenu" align="end">
          <Button variant="subtle" icon-right="lucide-chevron-down" :label="STAGE[c.stage].label" />
        </Dropdown>
        <Badge v-else variant="subtle" :theme="STAGE[c.stage].theme" :label="STAGE[c.stage].label" />
      </div>
    </template>

    <EmptyState v-if="!c" icon="lucide-building-2" title="This customer isn’t in your list">
      <Button label="All customers" route="/connect/customers" />
    </EmptyState>

    <div v-else class="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <!-- ── The main area ─────────────────────────────────────────────── -->
      <!-- The tabs row runs edge to edge, as in Frappe CRM: padding is on the
           tabs and the panels, not on this column. -->
      <div class="min-w-0 shrink-0 pb-6 lg:flex-1 lg:shrink lg:overflow-y-auto">
        <Tabs v-model="tab">
          <!-- Frappe CRM's tabs: default size, an icon with each, and the row
               as tall as the top bar. -->
          <TabList class="fc-tabs-scroll h-11 shrink-0 px-3 sm:px-5">
            <TabTrigger v-if="narrow" value="details" label="Details" icon-left="lucide-panel-right" />
            <TabTrigger v-for="t in tabs" :key="t.value" :value="t.value" :label="t.label" :icon-left="t.icon" />
          </TabList>

          <TabPanel value="sites" class="px-3 sm:px-10">
            <div>
              <div class="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-4 sm:mt-8">
              <h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Sites</h2>
              <Button
                v-if="sites.length && !partnerPays"
                label="Open in Frappe Cloud"
                href="https://frappecloud.com/dashboard"
              />
            </div>
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
            </div>
          </TabPanel>

          <TabPanel value="invoices" class="px-3 sm:px-10">
            <div>
              <div class="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-4 sm:mt-8">
              <h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Invoices</h2>
            </div>
              <p v-if="partnerPays" class="text-p-sm text-ink-gray-5">On your Frappe bill</p>
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

          <TabPanel value="followups" class="px-3 sm:px-10">
            <div>
              <FollowUps
                title="Follow-ups"
                :items="followUps"
                :people="teamPeople"
                :contact="c.contact"
                :synced-from="crm ? CRMS[crm.crm].label : ''"
                :can-add="canEdit"
                @add="addFollowUp"
              />
            </div>
          </TabPanel>

          <TabPanel value="activity" class="px-3 sm:px-10">
            <div>
              <div class="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-4 sm:mt-8">
              <h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Activity</h2>
            </div>
              <ActivityFeed :items="activity" />
            </div>
          </TabPanel>

          <TabPanel value="notes" class="px-3 sm:px-10">
            <div class="max-w-[640px]">
              <div class="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-4 sm:mt-8">
              <h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Notes</h2>
              <Button variant="solid" label="Save notes" @click="saveNotes" />
            </div>
              <Textarea v-model="notes" :rows="8" placeholder="Anything your team should know about this customer" />
            </div>
          </TabPanel>

          <TabPanel value="connect" class="px-3 sm:px-10">
            <div>
              <div class="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-4 sm:mt-8">
              <h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">Connect</h2>
            </div>
              <div>
                <p class="text-sm text-ink-gray-5">Project</p>
                <p class="mt-1 text-base text-ink-gray-8">{{ c.project }}</p>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>

      <!-- ── The side panel ────────────────────────────────────────────── -->
      <!-- Frappe CRM's side panel: 352px, a header block with who it is and
           quick actions, then collapsible sections of label and value, edited
           in place. -->
      <aside
        class="shrink-0 border-outline-gray-1 lg:block lg:w-[352px] lg:overflow-y-auto lg:border-l"
        :class="tab === 'details' ? 'block' : 'hidden'"
      >
        <div class="flex items-center gap-5 border-b border-outline-gray-1 p-5">
          <Avatar :label="c.name" size="3xl" shape="square" />
          <div class="flex min-w-0 flex-1 flex-col gap-2.5">
            <p class="truncate text-3xl font-medium text-ink-gray-9">{{ c.name }}</p>
            <div class="flex gap-1.5">
              <Button
                v-if="c.email"
                icon="lucide-mail"
                :aria-label="`Email ${c.contact || c.name}`"
                :tooltip="`Email ${c.contact || c.name}`"
                :href="`mailto:${c.email}`"
              />
              <Button icon="lucide-link" aria-label="Copy link" tooltip="Copy link" @click="copyLink" />
              <Dropdown v-if="moreMenu.length" :options="moreMenu">
                <Button icon="lucide-ellipsis" aria-label="More actions" />
              </Dropdown>
            </div>
          </div>
        </div>

        <div class="divide-y divide-outline-gray-1">
          <PanelSection v-for="group in [{ title: 'Contact', fields: CONTACT }, { title: 'Details', fields: DETAILS }]" :key="group.title" :title="group.title">
            <PanelField v-for="f in group.fields" :key="f.key" :label="f.label">
              <TextInput
                v-if="editable"
                v-model="draft[f.key]"
                variant="ghost"
                :type="f.type ?? 'text'"
                :placeholder="`Add ${f.label.toLowerCase()}`"
                :aria-label="f.label"
                @blur="commit(f)"
                @keydown.enter="$event.target.blur()"
              />
              <span v-else class="truncate px-2">{{ c[f.key] || '—' }}</span>
            </PanelField>
            <template v-if="group.title === 'Details'">
              <PanelField label="Source">
                <span class="px-2">{{ c.source === 'connect' ? 'Connect' : 'Added by you' }}</span>
              </PanelField>
              <!-- Phones only: the top bar has no room for the owner. -->
              <PanelField class="sm:hidden" label="Owner">
                <Dropdown v-if="canEdit" :options="ownerMenu">
                  <Button variant="ghost" :label="nameOf(c.owner)" icon-right="lucide-chevron-down" />
                </Dropdown>
                <span v-else class="px-2">{{ nameOf(c.owner) }}</span>
              </PanelField>
            </template>
            <p v-if="group.title === 'Contact' && crm && canEdit" class="px-3 text-p-sm text-ink-gray-5">
              Synced from {{ CRMS[crm.crm].label }}
            </p>
          </PanelSection>

          <PanelSection title="Billing">
            <PanelField label="MRR">
              <span class="px-2 tabular-nums">{{ c.mrr ? money(c.mrr, firm.currency) : '—' }}</span>
            </PanelField>
            <PanelField label="Who pays">
              <span class="px-2">{{ partnerPays ? 'You' : 'The customer' }}</span>
            </PanelField>
            <p v-if="c.billingSwitch" class="px-3 text-p-sm text-ink-gray-5">You pay once they confirm in Frappe Cloud</p>
            <div v-else-if="!partnerPays && isOwner && c.stage !== 'churned' && c.linked" class="px-3">
              <Button label="Switch to Partner pays" @click="switching = true" />
            </div>
            <PanelField label="Partner code">
              <span class="px-2">
                <template v-if="c.linked">Linked {{ longDate(c.linked) }}</template>
                <template v-else-if="c.codeShared">Shared {{ longDate(c.codeShared) }}, not linked yet</template>
                <template v-else>Not linked yet</template>
              </span>
            </PanelField>
          </PanelSection>
        </div>
      </aside>
    </div>

    <Dialog v-if="c" v-model:open="switching" title="Switch to Partner pays?">
      <ul class="space-y-2 text-p-base text-ink-gray-7">
        <li>Frappe bills you for {{ c.name }} once {{ c.contact || c.name }} confirms in Frappe Cloud.</li>
        <li>Your {{ discount }}% tier discount applies to it.</li>
        <li>You’ll see the monthly amount only, not their plans and invoices.</li>
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
