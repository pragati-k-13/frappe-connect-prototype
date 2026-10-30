<script setup>
import { Badge, Button } from 'frappe-ui'

// One section of the partner's own directory page, in edit mode: the section
// as a business sees it, with its name and an Edit control above. Edits happen
// where the content is, not in a separate form.
defineProps({
  label: { type: String, required: true },
  // Hidden for people who can only view (Sales, Finance) and for sections
  // Frappe sets.
  editable: { type: Boolean, default: false },
  // 'review' while Frappe reviews a change; the live version stays below.
  state: { type: String, default: null },
  // Read-only sections say where they're changed instead.
  note: { type: String, default: '' },
})
defineEmits(['edit'])
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-3 border-b border-outline-gray-1 pb-2">
      <span class="flex items-center gap-2">
        <span class="text-sm text-ink-gray-5">{{ label }}</span>
        <Badge v-if="state === 'review'" theme="blue" variant="subtle" size="sm" label="In review" />
      </span>
      <Button v-if="editable" variant="ghost" size="sm" icon-left="lucide-pencil" label="Edit" @click="$emit('edit')" />
      <span v-else-if="note" class="text-sm text-ink-gray-5">{{ note }}</span>
    </div>
    <div class="mt-4"><slot /></div>
  </section>
</template>
