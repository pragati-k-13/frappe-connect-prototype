<script setup>
import { Badge, Tooltip } from 'frappe-ui'

// A shortened list ("ERPNext, CRM +3") from `appsText` / `industryText` in
// `data/format.js`. The count shows the rest on hover; the full list is also
// on the screen it opens (the requirements), so the hover only saves a click.
//
// `badge`: the count as a grey Badge rather than dotted text, for the
// requirements dialog's rows, where dotted gray-5 text read lighter than the
// names it continues.
defineProps({
  list: { type: Object, required: true },
  badge: { type: Boolean, default: false },
})
// "ERPNext, Frappe HR +3" → "ERPNext, " and "Frappe HR".
const shown = (list) => list.text.slice(0, list.text.lastIndexOf(' +'))
const lead = (list) => shown(list).slice(0, shown(list).lastIndexOf(', ') + 2 || 0)
const last = (list) => shown(list).slice(lead(list).length)
</script>

<template>
  <span v-if="!list.more">{{ list.text }}</span>
  <!-- The badge version keeps the last name and its count on one line, so the
       count never wraps onto a line of its own. -->
  <!-- One line on purpose: any whitespace inside the Tooltip renders as a
       space before whatever follows ("+2 , not connected"). -->
  <span v-else-if="badge">{{ lead(list) }}<span class="whitespace-nowrap">{{ last(list) }}<Tooltip :text="list.full"><span tabindex="0" :aria-label="list.full" class="ml-1 inline-flex cursor-default rounded-full align-[1px] focus-visible:focus-ring"><Badge :label="`+${list.more}`" theme="gray" variant="subtle" size="sm" class="dark:bg-surface-gray-3" /></span></Tooltip></span></span>
  <span v-else>
    {{ list.text.slice(0, list.text.lastIndexOf(' +')) }}
    <Tooltip :text="list.full">
      <!-- Focusable, so the rest can be read from the keyboard too, not only
           by hovering. -->
      <span tabindex="0" :aria-label="list.full" class="cursor-default rounded-2 text-ink-gray-5 underline decoration-dotted underline-offset-2 focus-visible:focus-ring">+{{ list.more }}</span>
    </Tooltip>
  </span>
</template>
