<script setup>
import { ref, watch } from 'vue'
import { Dialog, FormControl, Select, Textarea } from 'frappe-ui'
import { FOLLOW_UP_MODES } from '../data/records'

// Logging a call, demo, email or meeting. Shared by a customer's Follow-ups
// tab and the lead page's composer bar.
const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  // Who it suggests they spoke to.
  contact: { type: String, default: '' },
})
const emit = defineEmits(['add'])

const form = ref({})
watch(open, (v) => {
  if (v) form.value = { date: '2026-10-30', mode: 'Call', spokeTo: props.contact, notes: '' }
})
function save() {
  const today = form.value.date === '2026-10-30'
  emit('add', {
    // Today's lands at now, so it sorts after what just happened.
    at: today ? Date.now() : new Date(`${form.value.date}T12:00:00`).getTime(),
    mode: form.value.mode,
    spokeTo: form.value.spokeTo.trim(),
    notes: form.value.notes.trim(),
  })
  open.value = false
}
const modeOptions = FOLLOW_UP_MODES.map((m) => ({ label: m, value: m }))
</script>

<template>
  <Dialog
    v-model:open="open"
    title="Log follow-up"
    :actions="[
      { label: 'Cancel', onClick: ({ close }) => close() },
      { label: 'Log', variant: 'solid', onClick: save },
    ]"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <FormControl v-model="form.date" type="date" label="Date" />
        <Select v-model="form.mode" label="How" :options="modeOptions" />
      </div>
      <FormControl v-model="form.spokeTo" label="Spoke to" />
      <Textarea v-model="form.notes" label="Notes" :rows="4" />
    </div>
  </Dialog>
</template>
