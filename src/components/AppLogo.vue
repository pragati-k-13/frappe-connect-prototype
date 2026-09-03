<script setup>
import { computed } from 'vue'
import { Avatar, Tooltip } from 'frappe-ui'
import { appLogo } from '../data/apps'

// The small square mark that says which app a module belongs to.
//
// frappe-ui's `Avatar` at `size="xs"` (16px, 4px radius) rather than a
// hand-rolled box — including its fallback, so an app with no artwork yet gets
// the component's own initial-on-a-surface treatment instead of a second,
// invented visual language.
//
// The name is carried two ways, because a 16px mark on its own names nothing:
// a tooltip for the cursor, and `Avatar`'s own `alt`/initial for a screen
// reader.
//
// ⚠️ `relative z-10` is load-bearing in the estimate table. Those rows are made
// clickable by a stretched `after:absolute after:inset-0` on the module button,
// which otherwise covers the mark completely — the cursor never reaches it and
// the tooltip never opens. Raising the mark costs it its share of the row's
// click target, which is the right trade: the mark is a label with a tooltip,
// and the module name beside it is the thing to click.
//
// Being a positioned, stacked element is also why the table's sticky header
// carries `z-20` — see `EstimateQuoteDialog.vue`.
const props = defineProps({
  app: { type: String, required: true },
  label: { type: String, required: true },
})

const image = computed(() => appLogo(props.app))
</script>

<template>
  <Tooltip :text="label">
    <Avatar
      class="relative z-10"
      size="xs"
      shape="square"
      :image="image ?? undefined"
      :label="label"
    />
  </Tooltip>
</template>
