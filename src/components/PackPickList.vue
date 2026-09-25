<script setup>
import { Badge, Button, Checkbox } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconPrice from '~icons/lucide/circle-dollar-sign'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import { STARTER_PACKS, priceFor } from '../data/packs'

// The Starter Packs, as a list to tick — the one list the catalogue, the
// recommendation screen and a draft project all draw.
//
// ⚠️ A LIST, NOT CARDS, AND STATIC. frappe-ui's `List` with full-width rules,
// and no hover state: the row itself does nothing — the checkbox ticks and the
// button opens the scope — so a hover fill would promise a click that isn't
// there.
//
// ⚠️ ONE LINE OF FACTS, NO DESCRIPTION. Price, effort and delivery sit on the
// line under the name, so three packs read as three comparable rows. Why a pack
// is recommended is argued on the page, under "Why we think this is the best
// choice for you" — not in a tooltip nobody finds on the badge.
const props = defineProps({
  // Pack values ticked.
  packs: { type: Array, required: true },
  region: { type: String, required: true },
  // `{ [packValue]: reason }` from the recommendation. Packs with a reason get
  // the Recommended badge; without `reasons` there is no badge at all.
  reasons: { type: Object, default: null },
})

const emit = defineEmits(['toggle', 'scope'])

const facts = (pack) => [
  { key: 'price', icon: IconPrice, text: priceFor(pack, props.region), strong: true },
  { key: 'effort', icon: IconEffort, text: `${pack.hours} hrs of effort` },
  { key: 'delivery', icon: IconDelivery, text: `${pack.validity} delivery time` },
]
</script>

<template>
  <List divider="full" class="[--list-gap:1rem]" :columns="['auto', 'minmax(0,1fr)', 'auto']">
    <ListRow v-for="pack in STARTER_PACKS" :key="pack.value" class="py-5">
      <!-- The checkbox sits on the name's line, not the row's middle. -->
      <ListCell class="self-start pt-0.5">
        <Checkbox
          size="md"
          :model-value="packs.includes(pack.value)"
          :aria-label="pack.name"
          @update:model-value="emit('toggle', pack.value)"
        />
      </ListCell>

      <ListCell>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-base font-medium text-ink-gray-7">{{ pack.name }}</h3>
            <Badge
              v-if="reasons?.[pack.value]"
              variant="subtle"
              theme="gray"
              size="sm"
              label="Recommended"
            />
          </div>
          <ul class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <li
              v-for="fact in facts(pack)"
              :key="fact.key"
              class="flex items-center gap-1.5 text-sm"
              :class="fact.strong ? 'font-medium text-ink-gray-7' : 'text-ink-gray-6'"
            >
              <component :is="fact.icon" class="size-3.5 shrink-0 text-ink-gray-5" />
              <span class="tabular-nums">{{ fact.text }}</span>
            </li>
          </ul>
        </div>
      </ListCell>

      <ListCell class="justify-end">
        <Button variant="subtle" label="View details" @click="emit('scope', pack)" />
      </ListCell>
    </ListRow>
  </List>
</template>
