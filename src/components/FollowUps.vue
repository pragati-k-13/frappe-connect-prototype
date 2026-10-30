<script setup>
import { computed, ref } from 'vue'
import { Button, Dialog, FormControl, Select, Textarea } from 'frappe-ui'
import { List, ListCell, ListRow, ListRows } from 'frappe-ui/list'
import EmptyState from './EmptyState.vue'
import { FOLLOW_UP_MODES } from '../data/records'
import { shortDate } from '../data/partnership'

// The Follow-ups tab on a lead or a customer: each call, demo, email or
// meeting the team logged. A row per follow-up rather than the PRM's
// five-column table, whose Notes column was clipped to two letters.
//
// With a CRM synced, follow-ups come from it, so there's nothing to add here.
const props = defineProps({
  items: { type: Array, required: true },
  // Team, as [{ id, name }], to name who followed up.
  people: { type: Array, default: () => [] },
  // Who the dialog suggests they spoke to.
  contact: { type: String, default: '' },
  syncedFrom: { type: String, default: '' },
  canAdd: { type: Boolean, default: true },
})
const emit = defineEmits(['add'])

const nameOf = (id) => props.people.find((p) => p.id === id)?.name ?? 'Someone'
const addable = computed(() => props.canAdd && !props.syncedFrom)

const open = ref(false)
const form = ref({})
function start() {
  form.value = { date: '2026-10-30', mode: 'Call', spokeTo: props.contact, notes: '' }
  open.value = true
}
function save() {
  emit('add', {
    at: new Date(`${form.value.date}T12:00:00`).getTime(),
    mode: form.value.mode,
    spokeTo: form.value.spokeTo.trim(),
    notes: form.value.notes.trim(),
  })
  open.value = false
}
const modeOptions = FOLLOW_UP_MODES.map((m) => ({ label: m, value: m }))
const ICON = { Call: 'lucide-phone', Demo: 'lucide-presentation', Email: 'lucide-mail', Meeting: 'lucide-users' }
</script>

<template>
  <div>
    <div v-if="items.length && (addable || syncedFrom)" class="mb-2 flex items-center justify-between gap-3">
      <p class="text-sm text-ink-gray-5">{{ syncedFrom ? `Synced from ${syncedFrom}` : '' }}</p>
      <Button v-if="addable" icon-left="lucide-plus" label="Add follow-up" @click="start" />
    </div>

    <List v-if="items.length" class="-mx-3 list-row-px-3" :columns="['minmax(0,1fr)', 'auto']">
      <ListRows :items="items" v-slot="{ item }">
        <ListRow class="py-3">
          <ListCell class="min-w-0 items-start gap-3">
            <span :class="ICON[item.mode]" class="mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
            <span class="min-w-0">
              <span class="block text-base text-ink-gray-8">
                {{ item.mode }}<template v-if="item.spokeTo"> with {{ item.spokeTo }}</template>
              </span>
              <span v-if="item.notes" class="mt-1 block text-p-sm text-ink-gray-7">{{ item.notes }}</span>
              <span class="mt-1 block text-sm text-ink-gray-5">{{ nameOf(item.by) }}</span>
            </span>
          </ListCell>
          <ListCell class="items-start whitespace-nowrap text-sm text-ink-gray-5">{{ shortDate(new Date(item.at).toISOString().slice(0, 10)) }}</ListCell>
        </ListRow>
      </ListRows>
    </List>

    <EmptyState
      v-else
      icon="lucide-phone"
      title="No follow-ups yet"
      :description="syncedFrom ? `They’ll show here from ${syncedFrom}.` : ''"
    >
      <Button v-if="addable" label="Add follow-up" @click="start" />
    </EmptyState>

    <Dialog
      v-model:open="open"
      title="Add follow-up"
      :actions="[
        { label: 'Cancel', onClick: ({ close }) => close() },
        { label: 'Add', variant: 'solid', onClick: save },
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
  </div>
</template>
