<script setup>
import { Select, SettingsBody, SettingsHeader, SettingsRow } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'

const store = useConnectStore()

const THEMES = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
]
</script>

<template>
  <SettingsHeader title="Preferences" />
  <SettingsBody>
    <SettingsRow title="Appearance">
      <Select v-model="store.preferences.theme" :options="THEMES" />
    </SettingsRow>
  </SettingsBody>
</template>
