<script setup>
import { Badge, Button, Checkbox } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconPrice from '~icons/lucide/circle-dollar-sign'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import { STARTER_PACKS, priceFor } from '../data/packs'
import { SCOPE_ICONS } from '../scopeIcons'

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
  // 'grid' is the catalogue's 2×2 of cards; 'list' the rows everywhere else.
  layout: { type: String, default: 'list' },
})

const emit = defineEmits(['toggle', 'scope'])

// The List reports the whole new selection; the callers keep one `toggle`, so
// this reports the one pack whose membership changed.
const onSelection = (next) => {
  const changed =
    next.find((v) => !props.packs.includes(v)) ?? props.packs.find((v) => !next.includes(v))
  if (changed) emit('toggle', changed)
}

const facts = (pack) => [
  { key: 'price', icon: IconPrice, text: priceFor(pack, props.region), strong: true },
  { key: 'effort', icon: IconEffort, text: `${pack.hours} hrs of effort` },
  { key: 'delivery', icon: IconDelivery, text: `${pack.validity} delivery time` },
]


// The card's facts, shortened to fit a half-width card on one line: the
// hourglass carries "effort", and delivery keeps its word because it is the
// fact that differs between packs.
const cardFacts = (pack) => [
  { key: 'price', icon: IconPrice, text: priceFor(pack, props.region), strong: true },
  { key: 'effort', icon: IconEffort, text: `${pack.hours} hrs` },
  { key: 'delivery', icon: IconDelivery, text: `${pack.validityDays}-day delivery` },
]

// A pack's first area's icon — the same mark its scope uses.
const iconFor = (pack) => SCOPE_ICONS[pack.areas[0]]
</script>

<template>
  <!-- ⚠️ THE CHECKBOX IS THE ONLY SELECTED STATE — no fill, no border
       change. The cards are multi-select, and a ticked card that looked
       different would make half the grid shout. The whole card toggles;
       "View details" stops its click. -->
  <ul v-if="layout === 'grid'" class="grid gap-4 sm:grid-cols-2">
    <li
      v-for="pack in STARTER_PACKS"
      :key="pack.value"
      class="flex cursor-pointer flex-col rounded-6 border border-outline-gray-1 p-5"
      @click="emit('toggle', pack.value)"
    >
      <!-- The tile and the checkbox share one row, top-aligned. The
           checkbox sits in a wrapper that stops its click, so a tick is not
           counted twice by the card's own handler. -->
      <div class="flex items-start justify-between">
        <div class="grid size-10 place-items-center rounded-4 bg-surface-gray-2">
          <component :is="iconFor(pack)" class="size-5 text-ink-gray-7" />
        </div>
        <div class="flex" @click.stop>
          <Checkbox
            :model-value="packs.includes(pack.value)"
            :aria-label="pack.name"
            @update:model-value="emit('toggle', pack.value)"
          />
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <h3 class="text-lg font-medium text-ink-gray-8">{{ pack.name }}</h3>
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
          v-for="fact in cardFacts(pack)"
          :key="fact.key"
          class="flex items-center gap-1.5 text-sm"
          :class="fact.strong ? 'font-medium text-ink-gray-7' : 'text-ink-gray-6'"
        >
          <component :is="fact.icon" class="size-3.5 shrink-0 text-ink-gray-5" />
          <span class="tabular-nums">{{ fact.text }}</span>
        </li>
      </ul>
      <!-- `mt-auto` keeps the buttons level across a row. -->
      <div class="mt-auto pt-4">
        <Button variant="subtle" label="View details" @click.stop="emit('scope', pack)" />
      </div>
    </li>
  </ul>

  <!-- ⚠️ frappe-ui's OWN SELECTION, not a checkbox of ours in a cell. With
       `selectable` the List draws the checkbox column and a click anywhere on
       the row toggles it, so the whole row is the target rather than a 16px
       box — a row with a price on it is where people click. The row also gets
       List's interactive inset and hover, hence `-mx-3`: the fill bleeds past
       the column and the content stays on the column's edge.
       "View scope" stops its click, so it opens the scope and never ticks. -->
  <List
    v-else
    selectable
    :selection="packs"
    divider="full"
    class="-mx-3 [--list-gap:1rem]"
    :columns="['minmax(0,1fr)', 'auto']"
    @update:selection="onSelection"
  >
    <ListRow
      v-for="pack in STARTER_PACKS"
      :key="pack.value"
      :value="pack.value"
      class="fc-pack-row py-5"
    >
      <ListCell>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-medium text-ink-gray-8">{{ pack.name }}</h3>
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
        <!-- Ghost: the row is the primary action, this is the aside. -->
        <Button variant="ghost" label="View scope" @click.stop="emit('scope', pack)" />
      </ListCell>
    </ListRow>
  </List>
</template>
