<script setup>
// Three things that happen in order, numbered because the order is the point.
// The recommendation screen and the Starter Packs page both draw this, so the
// two cannot drift. Across when the column has room, stacked when it does not
// — see `.fc-steps` in `index.css`.
defineProps({
  title: { type: String, required: true },
  // `[{ title, body }]`
  steps: { type: Array, required: true },
})
</script>

<template>
  <section class="fc-steps">
    <h2 class="text-lg font-semibold text-ink-gray-8">{{ title }}</h2>
    <ol class="mt-3">
      <li v-for="(step, i) in steps" :key="step.title" class="flex gap-2.5">
        <span
          class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-surface-gray-2 text-p-xs font-medium tabular-nums text-ink-gray-6"
          aria-hidden="true"
        >
          {{ i + 1 }}
        </span>
        <span class="min-w-0">
          <span class="block text-p-base font-medium text-ink-gray-8">{{ step.title }}</span>
          <span class="mt-0.5 block text-p-sm text-ink-gray-6">{{ step.body }}</span>
        </span>
      </li>
    </ol>
  </section>
</template>
