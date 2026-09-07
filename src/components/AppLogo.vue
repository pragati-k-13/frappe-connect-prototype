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
//
// `muted` is for a row that has been ticked out of the estimate. Its text drops
// from ink-7 to ink-4; a saturated 16px mark left at full strength beside that
// is then the loudest thing in the row, which is precisely backwards — the row
// is the one that no longer counts.
//
// ⚠️ The treatment goes ON the Avatar, not on a wrapper, and that is a
// stacking-context problem rather than a styling preference. `filter` makes an
// element a stacking context painted as if `z-index: 0`, so a filtered wrapper
// would trap the mark's `z-10` inside it and hand the row back to the stretched
// `after` overlay — the tooltip would stop opening on exactly the unchecked
// rows. On the Avatar itself the filter's context sits at z-10 and clears the
// overlay as before.
const props = defineProps({
  app: { type: String, required: true },
  label: { type: String, required: true },
  muted: { type: Boolean, default: false },
})

const image = computed(() => appLogo(props.app))
</script>

<template>
  <Tooltip :text="label">
    <!-- Grayscale AND opacity, because they answer different halves of the
         problem: the filter takes the colour out, so the mark stops being the
         one saturated thing in a row of grey; the opacity takes the contrast
         down, so what's left sits at about the weight of the ink-4 text beside
         it. Either alone leaves it loud — a faded blue, or a solid grey block.
         `transition` (not `transition-colors`, which doesn't cover filter or
         opacity) so it fades with the text rather than snapping. -->
    <Avatar
      class="relative z-10 transition"
      :class="muted ? 'opacity-45 grayscale' : ''"
      size="xs"
      shape="square"
      :image="image ?? undefined"
      :label="label"
    />
  </Tooltip>
</template>
