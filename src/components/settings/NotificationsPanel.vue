<script setup>
import { SettingsBody, SettingsHeader, SettingsRow, Switch } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'

const store = useConnectStore()
</script>

<template>
  <SettingsHeader title="Notifications" />
  <SettingsBody>
    <div class="divide-y divide-outline-gray-1">
      <SettingsRow title="Messages" description="Email me when a partner replies.">
        <Switch v-model="store.preferences.notifyMessages" />
      </SettingsRow>
      <SettingsRow title="Project updates" description="Email me when a project moves to its next step.">
        <Switch v-model="store.preferences.notifyProjects" />
      </SettingsRow>
    </div>
  </SettingsBody>
</template>
