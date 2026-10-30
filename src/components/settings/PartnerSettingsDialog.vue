<script setup>
import { markRaw, ref } from 'vue'
import {
  SettingsContent,
  SettingsDialog,
  SettingsNavGroup,
  SettingsNavItem,
  SettingsPanel,
  SettingsSidebar,
} from 'frappe-ui'
import CrmSyncPanel from './CrmSyncPanel.vue'
import LeavePanel from './LeavePanel.vue'

// The partner side's settings: owner only, and short, because users and roles
// live on Team. See PARTNER-VIEW-PLAN.md §8.
const open = defineModel('open', { type: Boolean, default: false })

const tabs = [
  { label: 'CRM sync', value: 'crm', icon: 'lucide-refresh-cw', component: markRaw(CrmSyncPanel) },
  { label: 'Leave the partnership', value: 'leave', icon: 'lucide-log-out', component: markRaw(LeavePanel) },
]
const tab = ref('crm')
</script>

<template>
  <SettingsDialog v-model:open="open" v-model:tab="tab">
    <SettingsSidebar>
      <SettingsNavGroup>
        <SettingsNavItem v-for="t in tabs" :key="t.value" :value="t.value">
          <template #prefix><span :class="[t.icon, 'size-4 shrink-0 text-ink-gray-6']" /></template>
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
