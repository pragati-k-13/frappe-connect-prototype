<script setup>
import { Button } from 'frappe-ui'

// A selectable tag — the region chips in the quiz and the app chips mid-results.
// frappe-ui has no dedicated toggle-chip, so the pressable surface is a `Button`
// (which carries the focus ring, sizing and disabled states) flipping
// `outline` → `subtle` on selection.
//
// Subtle rather than solid: a near-black chip (`solid` gray is
// `bg-surface-gray-10`) reads as a primary action sitting in a row of options,
// which is louder than an answer to a question needs to be. `subtle` marks the
// answer with a filled surface while keeping the row at one weight.
//
// The trade-off is a narrower gap between states — `subtle` is
// `bg-surface-gray-2` against `outline`'s `bg-surface-base`, so selection is a
// faint fill plus the loss of the border, not a reversal. That reads at a
// glance in a short row like this one; if these ever grow into a long
// multi-select list, revisit it.
//
// The count is plain text inheriting `currentColor` at 60% rather than a nested
// `Badge`: one rule that works on both states and keeps the chip the same size
// whether selected or not.
defineProps({
  label: { type: String, required: true },
  // Optional leading glyph, passed as a component rather than a name so the
  // caller keeps the `~icons/lucide/*` import and this file needs no icon
  // vocabulary of its own. Used by the review summary chips, where the icon
  // carries the sentiment (a check or an info mark).
  icon: { type: [Object, Function], default: null },
  // Optional trailing count.
  count: { type: [Number, String], default: null },
  selected: { type: Boolean, default: false },
  // Passed straight to Button: 'sm' for the quiz's region chips (a question
  // being asked), 'xs' for the mid-list app chips (a refinement offered).
  size: { type: String, default: 'sm' },
})
defineEmits(['toggle'])
</script>

<template>
  <Button
    :variant="selected ? 'subtle' : 'outline'"
    :size="size"
    :aria-pressed="selected"
    @click="$emit('toggle')"
  >
    <template v-if="icon" #prefix>
      <component :is="icon" class="size-3.5" />
    </template>

    {{ label }}

    <template v-if="count != null" #suffix>
      <span class="tabular-nums opacity-60">{{ count }}</span>
    </template>
  </Button>
</template>
