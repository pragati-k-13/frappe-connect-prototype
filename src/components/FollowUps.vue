<script setup>
import { computed, ref } from 'vue'
import { Button } from 'frappe-ui'
import { List, ListCell, ListRow, ListRows } from 'frappe-ui/list'
import EmptyState from './EmptyState.vue'
import FollowUpDialog from './FollowUpDialog.vue'
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
  // When set, a section title heads the tab, with Add follow-up beside it.
  title: { type: String, default: '' },
  // In a side panel: a one-line empty state instead of the full one.
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['add'])

const nameOf = (id) => props.people.find((p) => p.id === id)?.name ?? 'Someone'
const addable = computed(() => props.canAdd && !props.syncedFrom)

const open = ref(false)
const start = () => (open.value = true)
const ICON = { Call: 'lucide-phone', Demo: 'lucide-presentation', Email: 'lucide-mail', Meeting: 'lucide-users' }
</script>

<template>
  <div>
    <!-- Frappe CRM's tab title row: 32px down, the title large, the tab's one
         solid action beside it. -->
    <div v-if="title" class="mb-3 mt-3 flex items-center justify-between gap-3 sm:mb-4 sm:mt-8">
      <h2 class="flex h-8 items-center text-2xl-semibold text-ink-gray-8">{{ title }}</h2>
      <Button v-if="addable" variant="solid" icon-left="lucide-plus" label="Add follow-up" @click="start" />
    </div>
    <p v-if="title && syncedFrom && items.length" class="mb-2 text-sm text-ink-gray-5">Synced from {{ syncedFrom }}</p>
    <div v-else-if="!title && items.length && (addable || syncedFrom)" class="mb-2 flex items-center justify-between gap-3">
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

    <div v-else-if="compact">
      <p class="text-p-sm text-ink-gray-5">{{ syncedFrom ? `None yet from ${syncedFrom}` : 'None yet' }}</p>
      <Button v-if="addable" class="mt-2" size="sm" label="Add follow-up" @click="start" />
    </div>
    <EmptyState
      v-else
      icon="lucide-phone"
      title="No follow-ups yet"
      :description="syncedFrom ? `They’ll show here from ${syncedFrom}.` : ''"
    >
      <Button v-if="addable && !title" label="Add follow-up" @click="start" />
    </EmptyState>

    <FollowUpDialog v-model:open="open" :contact="contact" @add="emit('add', $event)" />
  </div>
</template>
