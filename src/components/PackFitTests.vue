<script setup>
import { Tooltip } from 'frappe-ui'
import IconInfo from '~icons/lucide/circle-alert'
import IconHelp from '~icons/lucide/circle-help'
import { PACK_FIT_TESTS } from '../data/packs'

// The line between the two services, read from whichever side the reader is
// on: from packs it argues for custom work, from custom it argues for a pack.
// One list, two readings — see `PACK_FIT_TESTS`. The switch to the other
// service goes in the slot, under the lines that are its reason.
defineProps({
  side: { type: String, default: 'packs' },
})
</script>

<template>
  <section>
    <h2 class="text-lg font-semibold text-ink-gray-8">
      {{ side === 'packs' ? 'Consider a custom implementation if' : 'Consider a Starter Pack if' }}
    </h2>
    <ul class="mt-3 max-w-[62ch] space-y-2.5">
      <li v-for="item in PACK_FIT_TESTS" :key="item.label" class="flex gap-2.5">
        <IconInfo class="mt-1 size-4 shrink-0 text-ink-gray-5" />
        <!-- ⚠️ THE ICON IS THE AFFORDANCE, and without one a tooltip is a
             fact nobody finds. Only on the rows that have something to say. -->
        <Tooltip v-if="item.hint" :text="item.hint">
          <span class="text-p-base leading-relaxed text-ink-gray-7">
            {{ side === 'packs' ? item.need : item.fits }}
            <IconHelp class="ml-1 inline size-3.5 shrink-0 align-[-0.1em] text-ink-gray-4" />
          </span>
        </Tooltip>
        <span v-else class="text-p-base leading-relaxed text-ink-gray-7">
          {{ side === 'packs' ? item.need : item.fits }}
        </span>
      </li>
    </ul>
    <slot />
  </section>
</template>
