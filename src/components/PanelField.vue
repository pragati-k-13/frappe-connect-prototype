<script setup>
// One field in a record's side panel, as Frappe CRM lays them out: a label
// taking about a third of the row in small grey, the value beside it at least
// 28px tall. The value is the slot: a ghost input, a ghost select, or text.
defineProps({ label: { type: String, required: true } })
</script>

<template>
  <!-- Top-aligned, so a value that wraps keeps its label on its first line;
       the label wraps too rather than cutting off ("Current operations"). -->
  <div class="flex items-start gap-2 px-3 leading-5">
    <div class="flex min-h-7 w-1/3 min-w-20 shrink-0 items-center break-words text-sm text-ink-gray-5">{{ label }}</div>
    <div class="grid min-h-7 min-w-0 flex-1 items-center text-base text-ink-gray-8">
      <slot />
    </div>
  </div>
</template>
