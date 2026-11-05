<script setup>
import { computed, markRaw, ref, watch } from 'vue'
import {
  SettingsContent,
  SettingsDialog,
  SettingsNavGroup,
  SettingsNavItem,
  SettingsPanel,
  SettingsSidebar,
} from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'
import CrmSyncPanel from './CrmSyncPanel.vue'
import LeadsSettingsPanel from './LeadsSettingsPanel.vue'
// The sidebar's Leads icon, so the tab reads as the same place.
import LeadsIcon from '../icons/LeadsIcon.vue'
import LeavePanel from './LeavePanel.vue'
import PartnerUsersPanel from './PartnerUsersPanel.vue'

// The partner side's settings. Everyone can open it to see who's on the team
// (Users, read-only unless you're an owner); the rest is the owner's.
// See PARTNER-VIEW-PLAN.md §5 and §8.
const open = defineModel('open', { type: Boolean, default: false })
// The tab to open on; Users when not given.
const props = defineProps({ initialTab: { type: String, default: null } })

const store = useConnectStore()
const allTabs = [
  { label: 'Users', value: 'users', icon: 'lucide-users', component: markRaw(PartnerUsersPanel) },
  { label: 'Leads', value: 'leads', iconComp: markRaw(LeadsIcon), component: markRaw(LeadsSettingsPanel), owner: true },
  { label: 'CRM sync', value: 'crm', icon: 'lucide-refresh-cw', component: markRaw(CrmSyncPanel), owner: true },
  { label: 'Leave the partnership', value: 'leave', icon: 'lucide-log-out', component: markRaw(LeavePanel), owner: true },
]
const tabs = computed(() => allTabs.filter((t) => !t.owner || store.partnerRole === 'owner'))
const tab = ref('users')
// Opening lands on the tab asked for if this role has it, else on Users, the
// one panel every role has.
watch(open, (o) => {
  if (o) tab.value = tabs.value.some((t) => t.value === props.initialTab) ? props.initialTab : 'users'
})
</script>

<template>
  <SettingsDialog v-model:open="open" v-model:tab="tab">
    <SettingsSidebar>
      <SettingsNavGroup>
        <SettingsNavItem v-for="t in tabs" :key="t.value" :value="t.value">
          <template #prefix>
            <component :is="t.iconComp" v-if="t.iconComp" class="size-4 shrink-0 text-ink-gray-6" />
            <span v-else :class="[t.icon, 'size-4 shrink-0 text-ink-gray-6']" />
          </template>
          {{ t.label }}
        </SettingsNavItem>
      </SettingsNavGroup>
    </SettingsSidebar>
    <SettingsContent>
      <SettingsPanel v-for="t in tabs" :key="t.value" :value="t.value">
        <component :is="t.component" />
      </SettingsPanel>
    </SettingsContent>
  </SettingsDialog>
</template>
