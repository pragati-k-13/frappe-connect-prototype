<script setup>
import { computed } from 'vue'

// Espresso 2.0's Tag (Figma: espresso-2.0, atoms › tag), which frappe-ui
// doesn't ship yet. A Badge is a label and never clickable; a Tag has hover,
// active and focus states, so it's the chip people click. With `to` it's a
// router link. Only the subtle gray variant, without the remove ×, is built:
// add the others when a screen needs them, from the same Figma page.
//
// Sizes from Figma: xs is 20px, 12px text, 5px radius; sm is 24px, 13px text,
// 6px radius. Six px each side. Gray-2 at rest, gray-3 on hover, gray-4 while
// pressed, a 2px gray-3 ring on keyboard focus.
const props = defineProps({
  label: { type: String, required: true },
  size: { type: String, default: 'sm' },
  to: { type: [String, Object], default: null },
})

const SIZE = { xs: 'h-5 rounded-2 text-xs', sm: 'h-6 rounded-3 text-sm' }
const classes = computed(() => [
  'inline-flex max-w-full shrink-0 items-center px-1.5 leading-tighter text-ink-gray-7 bg-surface-gray-2',
  SIZE[props.size] ?? SIZE.sm,
  props.to &&
    'transition-colors hover:bg-surface-gray-3 active:bg-surface-gray-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3',
])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <span class="truncate">{{ label }}</span>
  </RouterLink>
  <span v-else :class="classes">
    <span class="truncate">{{ label }}</span>
  </span>
</template>
