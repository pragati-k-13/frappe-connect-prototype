<script setup>
import { computed } from 'vue'
import { Button, Dialog, toast } from 'frappe-ui'
import IconExternal from '~icons/lucide/arrow-up-right'
import { useConnectStore } from '../stores/connect'

// What the partner received, shown back to the sender. READ ONLY, deliberately:
// this is a record of what was already sent, and a form here would let someone
// edit a message after it landed. Changing the company profile belongs in
// settings, which is why the footer points there.
const props = defineProps({ open: { type: Boolean, required: true } })
const emit = defineEmits(['close'])

const store = useConnectStore()

// The company as onboarding collected it. Falls back to the viewer's own
// company for a demo viewer who never filled that form in, and says nothing
// rather than inventing an answer for the fields that follow.
const rows = computed(() => {
  const c = store.company
  return [
    { label: 'Company name', value: c.name || store.viewer.company },
    { label: 'Industry', value: c.segments?.join(', ') },
    { label: 'No. of employees', value: c.employees },
    { label: 'Current operations', value: c.operations },
    { label: 'Problems to solve', value: c.problems },
  ]
})

// ⚠️ Inert by instruction. Settings aren't in this prototype, and a link that
// silently does nothing reads as broken where one that says so reads as
// unfinished.
const openSettings = () =>
  toast.info('Team settings are not built yet', {
    id: 'settings',
    description: 'This is where the company profile would be edited.',
  })
</script>

<template>
  <Dialog
    :model-value="open"
    title="Company details"
    size="lg"
    @update:model-value="!$event && emit('close')"
  >
    <template #default>
      <!-- A description list, not a table: these are labelled facts about one
           thing, and `dl` is what says so without drawing a grid around five
           rows. -->
      <dl class="space-y-3">
        <div
          v-for="row in rows"
          :key="row.label"
          class="grid grid-cols-[140px_minmax(0,1fr)] gap-3"
        >
          <dt class="text-p-base text-ink-gray-5">{{ row.label }}</dt>
          <dd v-if="row.value" class="text-p-base text-ink-gray-8">{{ row.value }}</dd>
          <dd v-else class="text-p-base text-ink-gray-4">Not provided</dd>
        </div>
      </dl>

      <p class="mt-5 text-p-sm text-ink-gray-5">
        These details were shared with the partner when the pack was booked.
      </p>
    </template>

    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" label="Team settings" @click="openSettings">
          <template #suffix><IconExternal class="size-4" /></template>
        </Button>
        <Button variant="subtle" label="Close" @click="emit('close')" />
      </div>
    </template>
  </Dialog>
</template>
