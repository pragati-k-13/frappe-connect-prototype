<script setup>
// The top of a partner page: a title that says what the page is for (not just
// its name, which the bar already shows), the page's primary actions, and,
// optionally, the two or three figures worth seeing first. It's the anchor;
// everything below is the working list.
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  // [{ label, value }] — at most three, or the row stops being a highlight.
  stats: { type: Array, default: () => [] },
  // Line the suffix up on the title's baseline instead of its centre, for a
  // suffix that is plain text in a smaller size (an audit's ID). Off by
  // default: a badge or icon suffix wants centring.
  baseline: { type: Boolean, default: false },
})
</script>

<template>
  <header class="pb-8">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div class="min-w-0">
        <div class="flex gap-2" :class="baseline ? 'items-baseline' : 'items-center'">
          <slot name="prefix" />
          <h1 class="text-2xl-semibold text-ink-gray-9">{{ title }}</h1>
          <slot name="suffix" />
        </div>
        <p v-if="description" class="mt-1.5 text-p-base text-ink-gray-6">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <dl v-if="stats.length" class="mt-6 flex flex-wrap gap-x-12 gap-y-4">
      <div v-for="s in stats" :key="s.label">
        <dt class="text-sm text-ink-gray-5">{{ s.label }}</dt>
        <dd class="mt-1 text-xl-semibold tabular-nums text-ink-gray-9">{{ s.value }}</dd>
      </div>
    </dl>
  </header>
</template>
