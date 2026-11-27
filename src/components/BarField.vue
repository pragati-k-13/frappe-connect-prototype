<script setup>
// ⚠️ TEMPORARY (2026-11-26), the "Gray search bar" hero: one of the two
// fields in the gray box, the trigger of a frappe-ui MultiSelect passed
// through its `#trigger` slot. The popover, options and keyboard are
// MultiSelect's; this is only the look.
//
// frappe-ui's subtle field steps without its focus border (option A):
//   rest   no fill: the box's gray-2 shows through
//   hover  gray-3, the subtle field's own hover
//   open   white with `shadow-sm`, lifted out of the box. frappe-ui's focus
//          state is white with an outline-gray-4 border; the border is what
//          read as harsh, so the shadow carries the edge instead.
//   keyboard focus  a gray-3 ring, `focus-visible` only, never on click.
//
// frappe-ui's `md` input: 32px, 14px text, 10px side padding, `rounded-4`.
// In the box's 4px padding its 8px corner nests exactly in the box's 12px.
defineProps({
  label: { type: String, required: true },
  open: { type: Boolean, default: false },
  icon: { type: String, required: true },
  tint: { type: String, required: true },
  // A suggestion just filled this field: the new value fades in (150ms,
  // strong ease-out) so the click shows what it set before the page moves
  // on. Off for picks from the dropdown, which you already watched happen.
  fade: { type: Boolean, default: false },
})
</script>

<template>
  <button
    type="button"
    class="fc-bar-field flex h-8 w-full min-w-0 items-center gap-2 rounded-4 px-2.5 text-left text-base text-ink-gray-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
    :data-open="open || undefined"
  >
    <span :class="[icon, tint]" class="size-5 shrink-0" aria-hidden="true" />
    <!-- The fade mounts only with `fade`, the same tick the suggestion sets
         the value, so `appear` plays it once. Otherwise a plain label: no
         Transition to stall a dropdown pick. -->
    <span class="grid min-w-0 flex-1">
      <span v-if="!fade" class="truncate">{{ label }}</span>
      <Transition
        v-else
        appear
        appear-from-class="opacity-0"
        appear-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      >
        <span class="truncate">{{ label }}</span>
      </Transition>
    </span>
    <!-- Turns when open, as frappe-ui's MultiSelect chevron does: the same
         200ms and curve, so the two read as one component. -->
    <span
      class="lucide-chevron-down size-4 shrink-0 text-ink-gray-5 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="open && 'rotate-180'"
      aria-hidden="true"
    />
  </button>
</template>

<style scoped>
/* Press: a slight give, `scale(0.98)` in 160ms on the strong ease-out, so
   the field confirms the click before its menu opens. Not on hover, and
   no bounce: you open these several times a search. */
.fc-bar-field {
  transition:
    background-color 150ms ease,
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fc-bar-field:active {
  transform: scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .fc-bar-field:active {
    transform: none;
  }
}
.fc-bar-field:hover {
  background: var(--surface-gray-3);
}
.fc-bar-field[data-open] {
  background: var(--surface-base);
  box-shadow: var(--elevation-sm);
}
</style>
