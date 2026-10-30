<script setup>
import { computed, ref } from 'vue'
import { Button, FormControl, Select, SettingsBody, SettingsHeader, SettingsRow, toast } from 'frappe-ui'
import { usePartnerAccountStore } from '../../stores/partnerAccount'
import { CRMS, PRM_STAGES } from '../../data/partnerAccount'

// Connect the firm's CRM, so lead stages stay in one place. The mapping from
// the CRM's statuses to the PRM stages comes prefilled for Frappe CRM and
// ERPNext; the owner checks it rather than building it.
//
// What syncs: a lead goes to the CRM once the business is named, so an
// anonymous brief stays in Connect. Won from the partner code link always
// wins over a CRM status.
const account = usePartnerAccountStore()
const connected = computed(() => account.edits.crm)

const crm = ref('frappe-crm')
const url = ref('')
const key = ref('')
const errors = ref({})
const mapping = ref(Object.fromEntries(CRMS['frappe-crm'].statuses))

const crmOptions = Object.entries(CRMS).map(([value, c]) => ({ label: c.label, value }))
const stageOptions = PRM_STAGES.map((s) => ({ label: s, value: s }))

function pickCrm(v) {
  crm.value = v
  mapping.value = Object.fromEntries(CRMS[v].statuses)
}

function connect() {
  const e = {}
  if (!/^https?:\/\/\S+\.\S+/.test(url.value.trim())) e.url = 'Enter the site URL, like https://crm.yourfirm.com'
  if (key.value.trim().length < 8) e.key = 'That key looks too short. Copy it again from your CRM.'
  errors.value = e
  if (Object.keys(e).length) return
  account.connectCrm({ crm: crm.value, url: url.value.trim(), mapping: { ...mapping.value }, at: '2026-10-30 14:05' })
  key.value = ''
  toast.success(`${CRMS[crm.value].label} connected`)
}
</script>

<template>
  <SettingsHeader title="CRM sync" />
  <SettingsBody>
    <template v-if="connected">
      <SettingsRow :title="CRMS[connected.crm].label" :description="`${connected.url} · Last synced ${connected.at}`">
        <Button label="Disconnect" @click="account.disconnectCrm()" />
      </SettingsRow>
      <SettingsRow
        v-for="[status] in CRMS[connected.crm].statuses"
        :key="status"
        :title="status"
      >
        <span class="text-base text-ink-gray-7">{{ connected.mapping[status] }}</span>
      </SettingsRow>
    </template>

    <template v-else>
      <SettingsRow title="CRM">
        <Select :model-value="crm" :options="crmOptions" @update:model-value="pickCrm" />
      </SettingsRow>
      <div class="space-y-4 py-4">
        <FormControl v-model="url" label="Site URL" placeholder="https://crm.yourfirm.com" :error="errors.url" />
        <FormControl v-model="key" type="password" label="API key" :error="errors.key" />
      </div>
      <SettingsRow
        v-for="[status] in CRMS[crm].statuses"
        :key="status"
        :title="status"
        description="Lead status in your CRM"
      >
        <Select v-model="mapping[status]" :options="stageOptions" class="w-48" />
      </SettingsRow>
      <div class="pt-4">
        <Button variant="solid" label="Connect" @click="connect" />
      </div>
    </template>
  </SettingsBody>
</template>
