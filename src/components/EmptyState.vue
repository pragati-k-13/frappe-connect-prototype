<script setup>
// The one empty state, from the frappe-ui skill's pattern: a larger glyph in a
// quiet circle, a title, at most one short line, and an optional action in the
// default slot. Screens pass words, not markup, so every empty state matches.
defineProps({
  icon: { type: String, default: 'lucide-inbox' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  // Framed, for an empty section inside a page with other content (Reviews
  // on a partner's profile): the About card's border and radius, less height.
  boxed: { type: Boolean, default: false },
})
</script>

<template>
  <!-- Icon, then title and line as one pair 4px apart, then the action.
       Centred both ways: on a page with nothing else, give it `flex-1` inside
       a full-height flex parent so it sits in the middle of the content area. -->
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="boxed ? 'rounded-5 border border-outline-gray-2 px-4 py-10' : 'py-16'"
  >
    <div class="rounded-full bg-surface-gray-2 p-3 text-ink-gray-5">
      <span :class="icon" class="block size-6" aria-hidden="true" />
    </div>
    <div class="mt-3 flex flex-col items-center gap-1">
      <p class="text-base text-ink-gray-7">{{ title }}</p>
      <p v-if="description" class="max-w-xs text-p-sm text-ink-gray-5">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="mt-5"><slot /></div>
  </div>
</template>
