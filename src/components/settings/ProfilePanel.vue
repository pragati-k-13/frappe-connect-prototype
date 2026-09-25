<script setup>
import { computed, ref } from 'vue'
import { Avatar, Button, FormControl, SettingsBody, SettingsHeader, toast } from 'frappe-ui'
import { useConnectStore } from '../../stores/connect'

const store = useConnectStore()

// A draft of the name, saved from the header. The panel unmounts when its tab
// is left, so an unsaved edit is dropped rather than left pending.
const name = ref(store.viewer.name)
const dirty = computed(() => name.value.trim() && name.value.trim() !== store.viewer.name)

const save = () => {
  store.saveAccount({ name: name.value, company: store.viewer.company })
  toast.success('Profile saved')
}
</script>

<template>
  <SettingsHeader title="Profile">
    <template #actions>
      <Button variant="solid" label="Save" :disabled="!dirty" @click="save" />
    </template>
  </SettingsHeader>
  <SettingsBody>
    <div class="flex flex-col gap-6">
      <Avatar size="3xl" :label="store.viewer.name" />
      <FormControl v-model="name" label="Full name" />
      <FormControl :model-value="store.viewer.email" label="Email" type="email" disabled />
    </div>
  </SettingsBody>
</template>
