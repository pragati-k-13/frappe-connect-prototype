<script setup>
import { computed } from 'vue'
import { SettingsBody, SettingsHeader, SettingsRow, Switch, toast } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'
import { usePartnerAccountStore } from '../../stores/partnerAccount'

// Firm settings › Leads, owners only. "Taking new work" moved here from the
// Public profile: it's a setting about the firm, not profile copy. Off, the
// firm leaves every place a client finds partners (the directory,
// recommendations, a brief's recipients), and the Leads page says so.
const store = useConnectStore()
const account = usePartnerAccountStore()

// The firm's directory id, as the Public profile resolves it.
const firmId = computed(() => (store.partnerTier === 'beginner' ? 'lumen-digital' : 'software-work'))
const taking = computed(() => account.edits.profile.taking !== false)

function set(on) {
  account.setTaking(on, firmId.value)
  toast.success('Saved', { id: 'taking-saved' })
}
</script>

<template>
  <SettingsHeader title="Leads" />
  <SettingsBody>
    <SettingsRow title="Taking new work">
      <Switch :model-value="taking" aria-label="Taking new work" @update:model-value="set" />
    </SettingsRow>
  </SettingsBody>
</template>
