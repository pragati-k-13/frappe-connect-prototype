<script setup>
import { ref } from 'vue'
import { Badge, Button } from 'frappe-ui'

// A profile section the partner can't edit, folded to one row on their own
// page in edit mode: the section's title and count, one line on what clients
// see, and its actions on the right. With a `full` slot, View opens the full
// section right under the row, without leaving edit mode. Used for Featured by Frappe, Success stories and
// Marketplace contributions; Reviews stays in full, because replying happens
// there.
defineProps({
  title: { type: String, required: true },
  // Hidden when null; 0 shows no badge either.
  count: { type: Number, default: null },
  description: { type: String, default: '' },
})
const open = ref(false)
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-3">
      <h2 class="flex min-w-0 items-center gap-2 whitespace-nowrap text-base font-semibold text-ink-gray-8">
        {{ title }}
        <Badge v-if="count" :label="String(count)" />
      </h2>
      <div v-if="$slots.default || $slots.full" class="flex shrink-0 items-center gap-2">
        <slot />
        <Button v-if="$slots.full" :label="open ? 'Hide' : 'View'" :aria-expanded="open" @click="open = !open" />
      </div>
    </div>
    <p v-if="description" class="mt-1 text-p-base text-ink-gray-6">{{ description }}</p>
    <!-- Opens with a 200ms fade and a 4px rise; closes faster, fade only.
         Reduced motion keeps the fade and drops the rise. -->
    <Transition
      enter-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="opacity-0 -translate-y-1 motion-reduce:translate-y-0"
      leave-active-class="transition-opacity duration-100 ease-out"
      leave-to-class="opacity-0"
    >
      <div v-if="open && $slots.full" class="mt-6"><slot name="full" /></div>
    </Transition>
  </section>
</template>
