<script setup>
import { computed, markRaw, ref, watch } from 'vue'
import {
  Avatar,
  Button,
  FormControl,
  SettingsBody,
  SettingsContent,
  SettingsDialog,
  SettingsHeader,
  SettingsNavGroup,
  SettingsNavItem,
  SettingsPanel,
  SettingsSidebar,
  toast,
} from 'frappe-ui'
import PreferencesPanel from './PreferencesPanel.vue'
import { useConnectStore } from '../../stores/connect'
import { usePartnerAccountStore } from '../../stores/partnerAccount'
import { firmFor } from '../../data/partnership'

// The signed-in person's own settings, opened from the sidebar's footer.
// Separate from the firm's settings (CRM sync, leaving), which only the owner
// opens from the header.
const open = defineModel('open', { type: Boolean, default: false })
const store = useConnectStore()
const account = usePartnerAccountStore()

const person = computed(() => account.edits.me ?? firmFor(store.partnerTier).person)
const name = ref('')
watch(open, (v) => v && (name.value = person.value))
const dirty = computed(() => name.value.trim() && name.value.trim() !== person.value)
const save = () => {
  account.edits.me = name.value.trim()
  toast.success('Profile saved')
}

const tab = ref('profile')
const Preferences = markRaw(PreferencesPanel)
</script>

<template>
  <SettingsDialog v-model:open="open" v-model:tab="tab">
    <SettingsSidebar>
      <SettingsNavGroup>
        <SettingsNavItem value="profile">
          <template #prefix><Avatar size="xs" :label="person" class="shrink-0" /></template>
          Profile
        </SettingsNavItem>
        <SettingsNavItem value="preferences">
          <template #prefix><span class="lucide-sliders-horizontal size-4 shrink-0 text-ink-gray-6" /></template>
          Preferences
        </SettingsNavItem>
      </SettingsNavGroup>
    </SettingsSidebar>
    <SettingsContent>
      <SettingsPanel value="profile">
        <SettingsHeader title="Profile">
          <template #actions>
            <Button variant="solid" label="Save" :disabled="!dirty" @click="save" />
          </template>
        </SettingsHeader>
        <SettingsBody>
          <div class="flex flex-col gap-6">
            <Avatar size="3xl" :label="person" />
            <FormControl v-model="name" label="Full name" />
          </div>
        </SettingsBody>
      </SettingsPanel>
      <SettingsPanel value="preferences">
        <component :is="Preferences" />
      </SettingsPanel>
    </SettingsContent>
  </SettingsDialog>
</template>
