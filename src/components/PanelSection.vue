<script setup>
import { ref } from 'vue'

// A section of a record's side panel, as Frappe CRM draws them
// (`CollapsibleSection` in SidePanelLayout): a 32px header with the chevron on
// the left, the label in semibold, and the fields under it. Open by default.
defineProps({ title: { type: String, required: true } })
const open = ref(true)
</script>

<template>
  <section class="p-3">
    <button
      type="button"
      class="flex h-8 w-full items-center gap-2 rounded-4 px-2 text-base font-semibold text-ink-gray-9"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span
        class="lucide-chevron-right size-4 text-ink-gray-5 transition-transform duration-300"
        :class="open && 'rotate-90'"
        aria-hidden="true"
      />
      {{ title }}
    </button>
    <div v-show="open" class="mt-3 flex flex-col gap-2">
      <slot />
    </div>
  </section>
</template>
