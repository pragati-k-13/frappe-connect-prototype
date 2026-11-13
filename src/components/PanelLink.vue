<script setup>
import { Avatar } from 'frappe-ui'

// A side-panel value that opens something: another record (`to`) or a dialog
// (a click). Plain text like every other value, led by what it opens: a
// record's avatar, or a 16px icon. No chevron, so it can't be mistaken for a
// dropdown, whose chevron sits at the edge. Hover fills only the value.
//
// `avatar` for a record with a name (a customer); `icon` (a lucide class) or
// the #icon slot otherwise.
defineProps({
  label: { type: String, required: true },
  to: { type: String, default: '' },
  // Somewhere outside Connect, opened in a new tab.
  href: { type: String, default: '' },
  avatar: { type: String, default: '' },
  icon: { type: String, default: '' },
})
defineEmits(['click'])
</script>

<template>
  <div class="min-w-0">
    <component
      :is="to ? 'RouterLink' : href ? 'a' : 'button'"
      :to="to || undefined"
      :href="href || undefined"
      :target="href ? '_blank' : undefined"
      :rel="href ? 'noopener' : undefined"
      :type="to || href ? undefined : 'button'"
      class="inline-flex h-7 max-w-full items-center gap-1.5 rounded-4 px-2 text-left text-base text-ink-gray-8 transition-colors hover:bg-surface-gray-2 focus-visible:ring-0 focus-visible:focus-ring"
      @click="!to && !href && $emit('click')"
    >
      <Avatar v-if="avatar" :label="avatar" size="xs" shape="square" class="shrink-0" />
      <span v-else-if="icon" :class="icon" class="size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
      <span v-else-if="$slots.icon" class="grid size-4 shrink-0 place-items-center text-ink-gray-5" aria-hidden="true"><slot name="icon" /></span>
      <span class="truncate">{{ label }}</span>
      <span v-if="href" class="lucide-arrow-up-right size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
    </component>
  </div>
</template>
