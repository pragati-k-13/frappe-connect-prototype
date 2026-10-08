<script setup>
// One sub-section's screenshot, or a placeholder frame until there is one.
//
// ⚠️ It fills whatever box it is given — the height of the list beside it on
// the pack page, a 16:10 wrapper when stacked — so it sets no size of its own.
// The placeholder is an empty frame; its aria-label names the shot it is
// waiting for. Real shots go on the row in `PACK_SCOPE` as `screenshot`.
defineProps({
  area: { type: Object, required: true },
  // No row: nothing is open, and the frame stands for the module as a whole.
  row: { type: Object, default: null },
})
</script>

<template>
  <img
    v-if="row?.screenshot"
    :src="row.screenshot"
    :alt="`${area.label}${row ? `: ${row.label}` : ''} in the product`"
    class="size-full rounded-7 border border-outline-gray-1 object-cover object-left-top"
  />
  <div
    v-else
    class="size-full rounded-7 bg-surface-gray-2"
    role="img"
    :aria-label="`${area.label}${row ? `: ${row.label}` : ''} screenshot to come`"
  />
</template>
