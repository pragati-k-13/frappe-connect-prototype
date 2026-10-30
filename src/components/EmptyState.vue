<script setup>
// The one empty state, from the frappe-ui skill's pattern: a larger glyph in a
// quiet circle, a title, at most one short line, and an optional action in the
// default slot. Screens pass words, not markup, so every empty state matches.
defineProps({
  icon: { type: String, default: 'lucide-inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div class="rounded-full bg-surface-gray-2 p-3 text-ink-gray-5">
      <span :class="icon" class="block size-6" aria-hidden="true" />
    </div>
    <p class="text-base text-ink-gray-7">{{ title }}</p>
    <p v-if="description" class="max-w-xs text-p-sm text-ink-gray-5">{{ description }}</p>
    <div v-if="$slots.default" class="mt-2"><slot /></div>
  </div>
</template>
