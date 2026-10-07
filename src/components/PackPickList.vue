<script setup>
import { Badge, Button } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconPrice from '~icons/lucide/circle-dollar-sign'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import IconAdd from '~icons/lucide/plus'
import IconHours from '~icons/lucide/clock'
import IconAdded from '~icons/lucide/check'
import { STARTER_PACKS, priceFor } from '../data/packs'
import { appLogo } from '../data/apps'

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


</script>

<template>
  <!-- ── Pack cards, one row ──────────────────────────────────────────────────
       Name and who it's for, what
       it takes, then the price and the button. The card opens the pack's scope;
       the button adds it, and "Added" is the only selected state. -->
  <ul v-if="layout === 'grid'" class="grid gap-3 md:grid-cols-3">
    <li
      v-for="pack in STARTER_PACKS"
      :key="pack.value"
      class="flex cursor-pointer flex-col rounded-6 border border-outline-gray-1 p-5 transition-colors hover:border-outline-gray-2 hover:bg-surface-gray-1"
      @click="emit('scope', pack)"
    >
      <!-- The app the pack sets up: ERPNext, or Frappe HR. -->
      <img :src="appLogo(pack.apps[0])" alt="" class="mb-3 size-6 object-contain" />
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="text-base font-semibold text-ink-gray-9">{{ pack.name }}</h3>
        <Badge
          v-if="reasons?.[pack.value]"
          variant="subtle"
          theme="gray"
          size="sm"
          label="Recommended"
        />
      </div>
      <p class="mt-1 text-p-base text-ink-gray-6">{{ pack.tagline }}</p>

      <!-- `mt-auto` keeps the hours, prices and buttons level across the row.
           ⚠️ The hours are IN this block, not under the tagline: there they
           sat wherever the title and tagline happened to end, at a different
           height on every card. -->
      <div class="mt-auto pt-6">
        <p class="flex items-center gap-2 text-p-base text-ink-gray-7">
          <IconHours class="size-4 shrink-0 text-ink-gray-6" />
          {{ pack.hours }} hrs of effort
        </p>
        <p class="mt-6 text-2xl font-semibold tabular-nums text-ink-gray-9">
          {{ priceFor(pack, region) }}
        </p>
        <Button
          class="mt-3 w-full"
          variant="subtle"
          :label="packs.includes(pack.value) ? 'Added' : 'Add'"
          @click.stop="emit('toggle', pack.value)"
        >
          <template #prefix>
            <IconAdded v-if="packs.includes(pack.value)" class="size-4" />
            <IconAdd v-else class="size-4" />
          </template>
        </Button>
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
