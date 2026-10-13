<script setup>
import { Badge, Button } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import IconPrice from '~icons/lucide/circle-dollar-sign'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import IconHours from '~icons/lucide/clock'
import IconTag from '~icons/lucide/tag'
import IconModules from '~icons/lucide/boxes'
import IconAdded from '~icons/lucide/check'
import IconUpgrade from '~icons/lucide/arrow-up'
import { STARTER_PACKS, packModules, priceFor } from '../data/packs'
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

// ── The catalogue grid: a pack and the one that contains it share a card ───
// Manufacturing CONTAINS the core pack (`supersedes`), so the two are the two
// halves of one card, split by a divider and framed as either-or. The basket
// holds one or the other. Each half has its own Add, worded by what it would
// do to the basket — so choosing the other half is said out loud ("Upgrade",
// "Switch to this") rather than swapping silently. Packs that neither contain
// nor are contained by another (HR) keep a card of their own.
const containerOf = (pack) => STARTER_PACKS.find((p) => p.supersedes?.includes(pack.value))
const groups = STARTER_PACKS.filter((p) => !p.supersedes?.length).map((base) => ({
  base,
  addon: containerOf(base),
}))
const halves = (g) => [
  { key: 'base', pack: g.base, name: g.base.name },
  { key: 'addon', pack: g.addon, name: g.addon.name },
]
// What a half's button does, from the basket: 'added', 'upgrade' (core in,
// move to Manufacturing), 'switch' (Manufacturing in, drop back to the core),
// or 'add'.
const stateOf = (g, h) => {
  const hasBase = props.packs.includes(g.base.value)
  const hasAddon = props.packs.includes(g.addon.value)
  if (h.key === 'base') return hasAddon ? 'switch' : hasBase ? 'added' : 'add'
  return hasAddon ? 'added' : hasBase ? 'upgrade' : 'add'
}
// Every case is one toggle of the half's own pack: adding either takes the
// other out (`togglePack` and `packConflicts`); "Added" takes it out.
const actOn = (g, h) => emit('toggle', h.pack.value)
const LABELS = { add: 'Add to cart', added: 'In cart', upgrade: 'Upgrade', switch: 'Switch to this' }

// The card's third fact: the modules the pack sets up (`packModules`). Its
// line keeps two lines' height (`min-h-[2lh]`) so a one-line list doesn't drop
// its card's price below the others in the row.

const facts = (pack) => [
  { key: 'price', icon: IconPrice, text: priceFor(pack, props.region), strong: true },
  { key: 'effort', icon: IconEffort, text: `${pack.hours} hrs of effort` },
  { key: 'delivery', icon: IconDelivery, text: `${pack.validity} delivery time` },
]


</script>

<template>
  <!-- ⚠️ LAID OUT BY THE COLUMN, NOT THE WINDOW: `.fc-packs` and friends in
       index.css are container queries on the shell's content region, which
       narrows when the cart drawer opens without the window changing. Keyed to
       the window, three cards stayed three across in a 624px column and
       cut their labels off. Three across, or all stacked — no in-between.
  ── Pack cards, one row ──────────────────────────────────────────────────
       Name and who it's for, what
       it takes, then the price and the button. The card links to the pack's
       page; the button adds it, and "Added" is the only selected state. -->
  <ul v-if="layout === 'grid'" class="fc-packs">
    <template v-for="g in groups" :key="g.base.value">
      <!-- ── A base pack and its add-on: one card, two halves ─────────────
           A divider between the halves, in the card's own border colour,
           so the join reads as deliberate. Stacked below `sm`. -->
      <li
        v-if="g.addon"
        class="fc-packs-pair rounded-6 border border-outline-gray-2"
      >
        <div
          v-for="(h, i) in halves(g)"
          :key="h.key"
          class="flex flex-col px-5 pb-5 pt-4"
          :class="i && 'relative'"
        >
          <!-- "or" on the divider: the two are a choice of one, and both are
               packs people come for, so neither half is framed as the upsell.
               Stacked, it sits on the horizontal rule between the halves. Side
               by side it's the one below, in the facts block. -->
          <Badge
            v-if="i"
            variant="outline"
            theme="gray"
            size="lg"
            label="or"
            class="fc-or-stacked absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-surface-base font-medium text-ink-gray-8"
          />
          <img :src="appLogo(g.base.apps[0])" alt="" class="mb-3 size-5 object-contain" />
          <h3 class="text-lg font-semibold text-ink-gray-7">{{ h.name }}</h3>
          <p class="mt-1 text-pretty text-p-sm text-ink-gray-6">{{ h.pack.tagline }}</p>
          <div class="relative mt-auto pt-6">
            <!-- Side by side: on the vertical rule (the half's px-5 to its
                 left), centred in the blank band between the taglines and the
                 prices — the middle of this block's pt-6, so 12px above the
                 price row, which sits at one height in both halves. -->
            <Badge
              v-if="i"
              variant="outline"
              theme="gray"
              size="lg"
              label="or"
              class="fc-or-side absolute -left-5 top-3 -translate-x-1/2 -translate-y-1/2 bg-surface-base font-medium text-ink-gray-8"
            />
            <p class="flex items-center gap-2 text-p-sm font-semibold tabular-nums text-ink-gray-6">
              <IconTag class="size-4 shrink-0 text-ink-gray-6" />
              {{ priceFor(h.pack, region) }}
            </p>
            <p class="mt-1 flex items-center gap-2 text-p-sm text-ink-gray-6">
              <IconHours class="size-4 shrink-0 text-ink-gray-6" />
              {{ h.pack.hours }} hrs of effort
            </p>
            <p class="mt-1 flex min-h-[2lh] items-start gap-2 text-p-sm text-ink-gray-6">
              <IconModules class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
              {{ packModules(h.pack) }}
            </p>
            <!-- Stacked: the act, then the way to the scope. Solid only for
                 Add and Upgrade; Added and Switch to this stay quiet.
                 "Choose", not "Add to cart": three identical Add buttons
                 read as three things to add. HR's card, which is additive,
                 keeps "Add to cart". Just "Choose" — the pack's name is right
                 above it, and "Choose Core + Manufacturing" was the one label
                 that forced the row to break when the cart drawer narrowed it. -->
            <div class="mt-7 flex flex-col gap-2">
              <Button
                :variant="['add', 'upgrade'].includes(stateOf(g, h)) ? 'solid' : 'subtle'"
                :label="stateOf(g, h) === 'add' ? 'Choose' : LABELS[stateOf(g, h)]"
                @click="actOn(g, h)"
              >
                <!-- No icon on "Add to cart": the words say it. The check marks
                     a state and the arrow a change, so those keep theirs. -->
                <template v-if="['added', 'upgrade'].includes(stateOf(g, h))" #prefix>
                  <IconAdded v-if="stateOf(g, h) === 'added'" class="size-4" />
                  <IconUpgrade v-else class="size-4" />
                </template>
              </Button>
              <Button
                variant="subtle"
                label="What’s included"
                :route="{ name: 'pack', params: { id: h.pack.value } }"
              />
            </div>
          </div>
        </div>
      </li>

      <!-- ── A pack on its own ────────────────────────────────────────────
           Static, like the halves beside it: no hover and no whole-card link.
           "What's included" is the way to the pack's page. -->
      <li
        v-else
        class="flex flex-col rounded-6 border border-outline-gray-2 px-5 pb-5 pt-4"
      >
        <img :src="appLogo(g.base.apps[0])" alt="" class="mb-3 size-5 object-contain" />
        <h3 class="text-lg font-semibold text-ink-gray-7">{{ g.base.name }}</h3>
        <p class="mt-1 text-pretty text-p-sm text-ink-gray-6">{{ g.base.tagline }}</p>
        <div class="mt-auto pt-6">
          <p class="flex items-center gap-2 text-p-sm font-semibold tabular-nums text-ink-gray-6">
            <IconTag class="size-4 shrink-0 text-ink-gray-6" />
            {{ priceFor(g.base, region) }}
          </p>
          <p class="mt-1 flex items-center gap-2 text-p-sm text-ink-gray-6">
            <IconHours class="size-4 shrink-0 text-ink-gray-6" />
            {{ g.base.hours }} hrs of effort
          </p>
          <p class="mt-1 flex min-h-[2lh] items-start gap-2 text-p-sm text-ink-gray-6">
            <IconModules class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
            {{ packModules(g.base) }}
          </p>
          <div class="mt-7 flex flex-col gap-2">
            <Button
              :variant="packs.includes(g.base.value) ? 'subtle' : 'solid'"
              :label="packs.includes(g.base.value) ? 'In cart' : 'Add to cart'"
              @click="emit('toggle', g.base.value)"
            >
              <template v-if="packs.includes(g.base.value)" #prefix>
                <IconAdded class="size-4" />
              </template>
            </Button>
            <Button
              variant="subtle"
              label="What’s included"
              :route="{ name: 'pack', params: { id: g.base.value } }"
            />
          </div>
        </div>
      </li>
    </template>
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
