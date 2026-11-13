<script setup>
// A stage's colored dot, sized as Frappe CRM's IndicatorIcon: an 8px dot in
// a 16px box, so it takes an icon's room beside the label wherever it sits
// (list cells, stage menus, the stage button). `color` is a bg-surface class.
defineProps({ color: { type: String, required: true } })
</script>

<template>
  <span class="grid size-4 shrink-0 place-items-center" aria-hidden="true">
    <span class="size-2 rounded-full" :class="color" />
  </span>
</template>
