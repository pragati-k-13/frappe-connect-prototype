<script setup>
import { computed, ref } from 'vue'
import { Avatar, Badge, Button, Dialog, Dropdown, FormControl, TextInput, dialog, toast } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow, ListRows } from 'frappe-ui/list'
import ConnectShell from '../components/ConnectShell.vue'
import EmptyState from '../components/EmptyState.vue'
import PartnerCode from '../components/PartnerCode.vue'
import PageIntro from '../components/PageIntro.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { firmFor, money, shortDate } from '../data/partnership'

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
// One list: where a customer came from doesn't change how the firm works
// with them, so the list doesn't split by source.
const query = ref('')

// Link requests sit in the same list, at the top: a request is a customer
// that hasn't linked yet. They open in the docked panel rather than a page,
// since there's nothing to show until the owner approves.
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  const hit = (name, contact) => !q || name.toLowerCase().includes(q) || contact?.toLowerCase().includes(q)
  const requests = account.requests
    .filter((r) => hit(r.company, r.contact))
    .map((r) => ({ ...r, id: r.id, name: r.company, request: true }))
  return [...requests, ...account.customers.filter((c) => hit(c.name, c.contact))]
})

// The customers' total. Partnership's MRR also counts the firm's own account.
const total = computed(() => account.customers.reduce((sum, c) => sum + c.mrr, 0))

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
  return [
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

// Only the figure the list doesn't already show: stages and requests are in
// the rows themselves.
const stats = computed(() => [{ label: 'MRR from customers', value: money(total.value, firm.value.currency) }])

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
      <PageIntro title="Businesses on your partner code" :stats="stats">
        <template #actions>
          <PartnerCode :code="firm.code" :firm="firm.name" />
          <!-- Subtle while a request is open: Approve is the one primary then. -->
          <Button v-if="canAdd" :variant="openId ? 'subtle' : 'solid'" label="Add customer" @click="startAdd" />
        </template>
      </PageIntro>

      <section>
        <div class="flex flex-wrap items-center gap-2">
          <TextInput v-model="query" type="search" placeholder="Search customers" class="w-full sm:w-56">
            <template #prefix><span class="lucide-search size-4 text-ink-gray-5" aria-hidden="true" /></template>
          </TextInput>
        </div>

        <List
          v-if="shown.length"
          v-model:active="openId"
          class="-mx-3 mt-4 list-row-px-3"
          :columns="{ base: ['minmax(0,1fr)', '6rem', '2rem'], sm: ['minmax(0,1fr)', '8rem', '7rem', '7rem', '2rem'] }"
          :row-height="56"
        >
          <ListHeader>
            <ListHeaderCell>Customer</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Billing</ListHeaderCell>
            <ListHeaderCell class="hidden sm:flex">Stage</ListHeaderCell>
            <ListHeaderCell class="justify-end">MRR</ListHeaderCell>
            <ListHeaderCell><span class="sr-only">Actions</span></ListHeaderCell>
          </ListHeader>
          <ListRows :items="shown" v-slot="{ item }">
            <ListRow v-if="item.request" :value="item.id" @click="openId = item.id">
              <ListCell class="min-w-0 gap-3">
                <Avatar :label="item.name" size="md" shape="square" />
                <span class="min-w-0">
                  <span class="block truncate text-base text-ink-gray-8">{{ item.name }}</span>
                  <span class="mt-1 block truncate text-sm text-ink-gray-5">
                    {{ item.contact }} · Entered your code {{ shortDate(item.at) }}
                  </span>
                </span>
              </ListCell>
              <ListCell class="hidden text-sm text-ink-gray-5 sm:flex">—</ListCell>
              <ListCell class="hidden sm:flex">
                <Badge theme="amber" variant="subtle" size="sm" label="Wants to link" />
              </ListCell>
              <ListCell class="justify-end text-ink-gray-5">—</ListCell>
              <ListCell class="justify-end" @click.stop.prevent>
                <Dropdown v-if="actionsFor(item).length" :options="actionsFor(item)" align="end">
                  <Button variant="ghost" icon="lucide-ellipsis" :aria-label="`Actions for ${item.name}`" />
                </Dropdown>
              </ListCell>
            </ListRow>
            <ListRow v-else :to="`/connect/customers/${item.id}`">
              <ListCell class="min-w-0 gap-3">
                <Avatar :label="item.name" size="md" shape="square" />
                <span class="min-w-0">
                  <span class="block truncate text-base text-ink-gray-8">{{ item.name }}</span>
                  <span class="mt-1 block truncate text-sm text-ink-gray-5">
                    {{ item.contact }}<span class="sm:hidden"> · {{ BILLING[item.billing] }}</span>
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
