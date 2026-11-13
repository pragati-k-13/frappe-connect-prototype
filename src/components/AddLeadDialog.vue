<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, Dialog, FormControl, MultiSelect, ScrollArea, Select, Textarea, toast } from 'frappe-ui'
import { addLead, meFor } from '../composables/useLeads'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { APPS } from '../data/partners'
import { appLogo } from '../data/apps'

// Add lead: a business the firm found itself, for a firm with no CRM
// connected (one with a CRM adds it there). Only what's needed to know the
// lead again; the rest goes on the lead's page. The title is built from the
// apps ("Frappe HR and ERPNext for Halcyon") and renamed there if needed.
// Lands on the new lead.

const open = defineModel('open', { type: Boolean, default: false })
const router = useRouter()
const store = useConnectStore()
const account = usePartnerAccountStore()

const APP_OPTIONS = APPS.filter((a) => a.value !== 'framework')
const nameOf = (id) => account.team.find((p) => p.id === id)?.name
const ownerOptions = computed(() => [
  { label: 'Unassigned', value: 'none' },
  ...account.team.filter((p) => p.roles.includes('sales') || p.roles.includes('owner')).map((p) => ({ label: p.name, value: p.id })),
])

const blankForm = () => ({ company: '', contact: '', email: '', apps: [], requirements: '', owner: meFor(store) })
const form = ref(blankForm())
const errors = ref({})
watch(open, (v) => {
  if (!v) return
  form.value = blankForm()
  errors.value = {}
})
// An error goes once its field changes.
// A snapshot, since a deep watch hands back the same object as old and new.
watch(
  () => JSON.stringify(form.value),
  (now, was) => {
    const [f, w] = [JSON.parse(now), JSON.parse(was ?? '{}')]
    for (const k of Object.keys(errors.value)) if (JSON.stringify(f[k]) !== JSON.stringify(w[k])) delete errors.value[k]
  },
)

function validate() {
  const f = form.value
  const e = {}
  if (!f.company.trim()) e.company = 'Enter the company name'
  if (!f.contact.trim()) e.contact = 'Enter who you’re talking to'
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email'
  if (!f.apps.length) e.apps = 'Pick at least one app'
  errors.value = e
  return !Object.keys(e).length
}

const actions = [
  {
    label: 'Add lead',
    variant: 'solid',
    onClick: ({ close }) => {
      if (!validate()) return
      const f = form.value
      const labels = f.apps.map((v) => APP_OPTIONS.find((a) => a.value === v)?.label ?? v)
      const id = addLead(
        store,
        { company: f.company.trim(), contact: f.contact.trim(), email: f.email.trim(), apps: labels, requirements: f.requirements.trim(), owner: f.owner },
        meFor(store),
      )
      close()
      toast.success('Lead added')
      router.push(`/connect/leads/${id}`)
    },
  },
]
</script>

<template>
  <Dialog v-model:open="open" size="md" title="Add lead" :actions="actions">
    <!-- frappe-ui's scrollbar, as in EditRequirementsDialog, for short windows. -->
    <ScrollArea class="fc-scroll-dialog -mr-4 sm:-mr-6" viewport-class="pr-4 sm:pr-6">
    <div class="space-y-4">
      <FormControl v-model="form.company" label="Company" required :error="errors.company" />
      <div class="grid gap-4 sm:grid-cols-2">
        <FormControl v-model="form.contact" label="Contact name" required :error="errors.contact" />
        <FormControl v-model="form.email" type="email" label="Email" required :error="errors.email" />
      </div>
      <MultiSelect v-model="form.apps" label="Apps" placeholder="Select" required :options="APP_OPTIONS" :error="errors.apps">
        <!-- Each app's own mark; one without artwork gets Avatar's initial. -->
        <template #item-prefix="{ item }">
          <Avatar size="xs" shape="square" :image="appLogo(item.value) ?? undefined" :label="item.label" />
        </template>
      </MultiSelect>
      <Textarea v-model="form.requirements" label="Requirements" :rows="3" />
      <Select v-model="form.owner" label="Owner" :options="ownerOptions">
        <template #item-prefix="{ item }">
          <Avatar v-if="item.value !== 'none'" size="xs" :label="nameOf(item.value)" />
          <span v-else class="lucide-user size-4 text-ink-gray-5" aria-hidden="true" />
        </template>
      </Select>
    </div>
    </ScrollArea>
  </Dialog>
</template>
