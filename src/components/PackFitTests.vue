<script setup>
import IconInfo from '~icons/lucide/circle-alert'
import { PACK_FIT_TESTS } from '../data/packs'

// The line between the two services, read from whichever side the reader is
// on: from packs it argues for custom work, from custom it argues for a pack.
// One list, two readings — see `PACK_FIT_TESTS`. The switch to the other
// service goes in the slot, under the lines that are its reason.
defineProps({
  side: { type: String, default: 'packs' },
  // A card's title rather than a section's: smaller, and an h3 under the
  // section heading that holds the card.
  card: { type: Boolean, default: false },
})
</script>

<template>
  <section>
    <component
      :is="card ? 'h3' : 'h2'"
      :class="card ? 'text-base font-semibold text-ink-gray-9' : 'text-lg font-semibold text-ink-gray-8'"
    >
      {{ side === 'packs' ? 'Consider a custom implementation if' : 'Consider a Starter Pack if' }}
    </component>
    <ul class="mt-3 max-w-[62ch] space-y-2.5">
      <li v-for="item in PACK_FIT_TESTS" :key="item.label" class="flex gap-2.5">
        <IconInfo class="mt-1 size-4 shrink-0 text-ink-gray-5" />
        <!-- No tooltip: what the contract's hint says is in the sentence. -->
        <span class="text-p-base leading-relaxed text-ink-gray-7">
          {{ side === 'packs' ? item.need : item.fits }}
        </span>
      </li>
    </ul>
    <slot />
  </section>
</template>
