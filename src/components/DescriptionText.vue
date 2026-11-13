<script setup>
import { computed } from 'vue'
import { wordDiff } from '../lib/wordDiff'

// The description on a requirements message. On an update (`prev` given) the
// changes are marked in place, always on: added words tinted, removed words
// struck through. A rewrite shows clean, since its markers would interleave two
// versions; the event line says "Description rewritten" instead.
// See docs/edit-requirements.md, "In the thread".
const props = defineProps({
  text: { type: String, default: '' },
  prev: { type: String, default: null },
  rewritten: { type: Boolean, default: false },
})

const runs = computed(() =>
  props.prev == null || props.rewritten || props.prev.trim() === props.text.trim()
    ? [{ type: 'same', text: props.text }]
    : wordDiff(props.prev, props.text),
)
</script>

<template>
  <p class="whitespace-pre-line text-p-base text-ink-gray-8">
    <template v-for="(r, i) in runs" :key="i">
      <span v-if="r.type === 'same'">{{ r.text }}</span>
      <ins v-else-if="r.type === 'add'" class="rounded-2 bg-surface-green-2 text-ink-green-7 no-underline"
        ><span class="sr-only">Added: </span>{{ r.text }}</ins
      >
      <del v-else class="text-ink-gray-5 line-through"
        ><span class="sr-only">Removed: </span>{{ r.text }}</del
      >
    </template>
  </p>
</template>
