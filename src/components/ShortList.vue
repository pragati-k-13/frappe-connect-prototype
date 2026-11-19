<script setup>
import { Tooltip } from 'frappe-ui'

// A shortened list ("ERPNext, CRM +3") from `appsText` / `industryText` in
// `data/format.js`. The count shows the rest on hover; the full list is also
// on the requirements dialog, which writes every list out, so the hover only
// saves a click.
defineProps({
  list: { type: Object, required: true },
})
</script>

<template>
  <span v-if="!list.more">{{ list.text }}</span>
  <span v-else>
    {{ list.text.slice(0, list.text.lastIndexOf(' +')) }}
    <Tooltip :text="list.full">
      <!-- Focusable, so the rest can be read from the keyboard too, not only
           by hovering. -->
      <span tabindex="0" :aria-label="list.full" class="cursor-default rounded-2 text-ink-gray-5 underline decoration-dotted underline-offset-2 focus-visible:focus-ring">+{{ list.more }}</span>
    </Tooltip>
  </span>
</template>
