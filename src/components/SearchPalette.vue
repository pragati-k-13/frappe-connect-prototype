<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, useKeyboardShortcut } from 'frappe-ui'
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
} from 'frappe-ui/experimental'
import { companyName, useLeads } from '../composables/useLeads'
import { useConnectStore } from '../stores/connect'
import { ROLE_LABEL } from '../data/partnerAccount'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// The partner's global search, from the rail and ⌘K. Empty, it offers the
// places in the rail; typing adds the firm's people, leads and customers. A
// person opens Firm settings on Users with their row picked out.
//
// ⚠️ `frappe-ui/experimental`: the root CommandPalette left frappe-ui in 1.0.0
// and its rebuild lives here while the API settles.
const props = defineProps({
  places: { type: Array, default: () => [] },
})
const open = defineModel('open', { type: Boolean, default: false })

const router = useRouter()
const leads = useLeads()
const account = usePartnerAccountStore()
const store = useConnectStore()
const query = ref('')

useKeyboardShortcut({
  combo: 'Mod+K',
  description: 'Search',
  allowInInput: true,
  handler: () => (open.value = true),
})

const typing = computed(() => query.value.trim().length > 0)
const leadItems = computed(() =>
  leads.value.map((l) => ({ to: `/connect/leads/${l.id}`, label: l.project, hint: companyName(l) })),
)
const customerItems = computed(() =>
  account.customers.map((c) => ({ to: `/connect/customers/${c.id}`, label: c.name, hint: c.contact ?? '' })),
)

const peopleItems = computed(() =>
  account.team.map((p) => ({ person: p.id, label: p.name, hint: ROLE_LABEL[p.roles[0]] ?? '', email: p.email ?? '' })),
)

function select(value) {
  if (value.person) store.openFirmSettings('users', value.person)
  else router.push(value.to)
  query.value = ''
}
</script>

<template>
  <CommandPalette v-model:open="open" v-model:query="query" @select="select">
    <CommandPaletteInput placeholder="Search people, leads, customers and pages" />
    <CommandPaletteList>
      <CommandPaletteGroup label="Go to">
        <CommandPaletteItem v-for="p in props.places" :key="p.to" :value="p">
          <!-- The rail's own icon, component or class, so each place looks the same in both. -->
          <template #prefix>
            <component :is="p.iconComp" v-if="p.iconComp" class="mr-3 size-4 text-ink-gray-7" aria-hidden="true" />
            <span v-else :class="p.icon" class="mr-3 size-4 text-ink-gray-7" aria-hidden="true" />
          </template>
          {{ p.label }}
        </CommandPaletteItem>
      </CommandPaletteGroup>
      <template v-if="typing">
        <CommandPaletteGroup label="People">
          <CommandPaletteItem v-for="p in peopleItems" :key="p.person" :value="p" :keywords="[p.email]">
            <template #prefix><Avatar :label="p.label" size="xs" class="mr-3" /></template>
            {{ p.label }}
            <template #suffix><span class="text-p-sm text-ink-gray-5">{{ p.hint }}</span></template>
          </CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteGroup label="Leads">
          <CommandPaletteItem v-for="l in leadItems" :key="l.to" :value="l" :keywords="[l.hint]">
            <template #prefix><span class="lucide-target mr-3 size-4 text-ink-gray-7" aria-hidden="true" /></template>
            {{ l.label }}
            <template #suffix><span class="text-p-sm text-ink-gray-5">{{ l.hint }}</span></template>
          </CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteGroup label="Customers">
          <CommandPaletteItem v-for="c in customerItems" :key="c.to" :value="c" :keywords="[c.hint]">
            <template #prefix><span class="lucide-building-2 mr-3 size-4 text-ink-gray-7" aria-hidden="true" /></template>
            {{ c.label }}
          </CommandPaletteItem>
        </CommandPaletteGroup>
      </template>
    </CommandPaletteList>
    <CommandPaletteEmpty>No matches</CommandPaletteEmpty>
  </CommandPalette>
</template>
