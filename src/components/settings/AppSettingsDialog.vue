<script setup>
import { markRaw, onUnmounted, ref, watchEffect } from 'vue'
import {
  Avatar,
  SettingsContent,
  SettingsDialog,
  SettingsNavGroup,
  SettingsNavItem,
  SettingsPanel,
  SettingsSidebar,
} from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'
import ProfilePanel from './ProfilePanel.vue'
import PreferencesPanel from './PreferencesPanel.vue'
import NotificationsPanel from './NotificationsPanel.vue'
import CompanyPanel from './CompanyPanel.vue'
import UsersPanel from './UsersPanel.vue'

// frappe-ui's settings dialog with its default tabs, less Integrations and
// Billing, plus Company — the details a new project used to ask every time.
const open = defineModel('open', { type: Boolean, default: false })

const store = useConnectStore()

// ⚠️ HIDDEN FOR NOW: Preferences (one theme row), Notifications (switches
// for email nothing sends) and Users (one person, an inert Invite). Flip this
// to bring them back. With two tabs left, the group labels — "User settings",
// "Administration" — each headed one item, so the nav is one unlabelled list.
const SHOW_ALL_TABS = false

const allTabs = [
  { label: 'Profile', value: 'profile', avatar: true, component: markRaw(ProfilePanel) },
  {
    label: 'Preferences',
    value: 'preferences',
    icon: 'lucide-sliders-horizontal',
    component: markRaw(PreferencesPanel),
    hidden: true,
  },
  {
    label: 'Notifications',
    value: 'notifications',
    icon: 'lucide-bell',
    component: markRaw(NotificationsPanel),
    hidden: true,
  },
  { label: 'Company', value: 'company', icon: 'lucide-building-2', component: markRaw(CompanyPanel) },
  { label: 'Users', value: 'users', icon: 'lucide-users', component: markRaw(UsersPanel), hidden: true },
]
const tabs = allTabs.filter((t) => SHOW_ALL_TABS || !t.hidden)
const tab = ref('profile')

// Appearance applies to the whole page, so it is set here rather than in its
// panel, which unmounts when another tab is open. frappe-ui's dark tokens key
// off `data-theme` on the root.
const dark = window.matchMedia('(prefers-color-scheme: dark)')
const applyTheme = () => {
  const t = store.preferences.theme
  document.documentElement.dataset.theme = t === 'system' ? (dark.matches ? 'dark' : 'light') : t
}
watchEffect(applyTheme)
dark.addEventListener('change', applyTheme)
onUnmounted(() => dark.removeEventListener('change', applyTheme))
</script>

<template>
  <SettingsDialog v-model:open="open" v-model:tab="tab">
    <SettingsSidebar>
      <SettingsNavGroup>
        <SettingsNavItem v-for="t in tabs" :key="t.value" :value="t.value">
          <template #prefix>
            <Avatar v-if="t.avatar" size="xs" :label="store.viewer.name" class="shrink-0" />
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
