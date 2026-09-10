<script setup>
import { computed } from 'vue'
import { Badge, Button } from 'frappe-ui'
import IconModules from '~icons/lucide/package'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import IconExternal from '~icons/lucide/arrow-up-right'
import { priceFor } from '../data/packs'

// What you are buying, carried across the last two screens of the flow.
//
// A card here and a list row on the catalogue, deliberately: there the packs
// are being compared, so a frame around each would be four frames; here it is
// the one thing carried across from that choice, and the border is what says it
// belongs to the decision rather than to the steps beside it.
const props = defineProps({
  pack: { type: Object, required: true },
  region: { type: String, required: true },
})

const details = computed(() => [
  { icon: IconModules, text: props.pack.moduleList },
  { icon: IconEffort, text: `${props.pack.hours} hrs of effort` },
  { icon: IconDelivery, text: `${props.pack.validity} delivery time` },
])
</script>

<template>
  <aside class="rounded-6 border border-outline-gray-1 p-5">
    <h2 class="text-base font-medium text-ink-gray-8">Selected service</h2>

    <!-- ⚠️ Placeholder. The illustrations land later — same grey box the
         catalogue rows use. -->
    <div class="mt-4 aspect-[16/10] w-full rounded-6 bg-surface-gray-2" aria-hidden="true" />

    <div class="mt-4 flex items-center gap-2">
      <span class="min-w-0 truncate text-lg font-medium text-ink-gray-8">{{ pack.name }}</span>
      <Badge variant="subtle" theme="gray" size="sm" label="Starter Pack" />
    </div>
    <p class="mt-1 text-p-base text-ink-gray-6">{{ pack.tagline }}</p>

    <p class="mt-4 text-lg font-semibold text-ink-gray-7">{{ priceFor(pack, region) }}</p>

    <ul class="mt-4 space-y-1">
      <li
        v-for="d in details"
        :key="d.text"
        class="flex items-start gap-2 text-p-base text-ink-gray-6"
      >
        <component :is="d.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
        <span class="min-w-0">{{ d.text }}</span>
      </li>
    </ul>

    <!-- ⚠️ Inert, and the arrow says why: it opens the Starter Pack scope
         document, which lives outside the app. Same treatment as "Read full
         scope" on the catalogue — a suffix arrow rather than a prefix icon,
         because the mark is about where the click GOES, and that belongs at the
         end of the label rather than in front of it. -->
    <Button class="mt-5" variant="subtle" size="sm" label="View full scope">
      <template #suffix><IconExternal class="size-4" /></template>
    </Button>
  </aside>
</template>
