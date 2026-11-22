<script setup>
import { computed, inject } from 'vue'
import { Button } from 'frappe-ui'

// The way back up, inside the page, in the website shell only (signed out):
// its nav has no page-title slot. One ghost button to the page above — "All
// partners" from a profile, the partner's name from its reviews — rather than
// a trail that repeats the heading under it. Signed in, the app's top bar
// carries the breadcrumb and this renders nothing. Reads what `ConnectShell`
// provides.
const crumbs = inject('fcCrumbs', null)

const back = computed(() => {
  const c = crumbs?.value
  if (!c?.show) return null
  const parent = c.trail.at(-1)
  if (parent) return { label: parent.label, to: parent.to }
  return { label: c.rootLabel === 'Partners' ? 'All partners' : c.rootLabel, to: c.rootTo }
})
</script>

<template>
  <!-- `-ml-2` lands the label, not the ghost button's padding, on the column
       edge, in line with what sits under it. A `route` renders a real link,
       so it opens in a new tab like any link would. -->
  <Button v-if="back" class="-ml-2" variant="ghost" :label="back.label" :route="back.to">
    <template #prefix><LucideArrowLeft class="size-4" aria-hidden="true" /></template>
  </Button>
</template>
