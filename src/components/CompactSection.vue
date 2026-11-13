<script setup>
// A profile section the partner can't edit, folded to one row on their own
// page in edit mode: the section's title, one line on what's there, and its
// action on the right. Used for Featured by Frappe, Success stories and
// Marketplace contributions, grouped together; Preview shows them in full.
// The title keeps the profile's h2 style, so the rows still read as sections.
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <h2 class="min-w-0 truncate text-base font-semibold text-ink-gray-8">{{ title }}</h2>
      <div v-if="$slots.default" class="flex shrink-0 items-center gap-2">
        <slot />
      </div>
    </div>
    <p v-if="description" class="mt-1 text-p-base text-ink-gray-6">{{ description }}</p>
  </section>
</template>
