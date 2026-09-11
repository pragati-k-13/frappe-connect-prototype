<script setup>
import { computed } from 'vue'
import { Avatar, Badge } from 'frappe-ui'
import IconPack from '~icons/lucide/layers'
import IconPrice from '~icons/lucide/circle-dollar-sign'
import IconEffort from '~icons/lucide/hourglass'
import IconDelivery from '~icons/lucide/calendar'
import IconChevron from '~icons/lucide/chevron-right'
import {
  CUSTOMER_RESPONSIBILITIES,
  PACK_SCOPE,
  STRICTLY_EXCLUDED,
  asExclusion,
  commercialTermsFor,
  priceFor,
} from '../data/packs'

// The pack you are buying, as a PERMANENT panel rather than a card in the page.
// It stands on both screens of the booking flow, and it is the same panel on
// each: what the thing is, what it costs, what it covers, and the terms.
//
// ⚠️ Body only. The pages wrap it — as a bordered column beside the content on
// wide screens, and stacked under the content below `lg`, where a 320px column
// beside anything is not a layout. One component, two frames, no duplicated
// content.
const props = defineProps({
  pack: { type: Object, required: true },
  region: { type: String, required: true },
  // "Selected" while you are deciding, "Booked" once you have. The panel is the
  // same object in both places and only its tense changes.
  heading: { type: String, default: 'Selected service' },
})

const facts = computed(() => [
  { icon: IconPrice, text: priceFor(props.pack, props.region) },
  { icon: IconEffort, text: `${props.pack.hours} hrs of effort` },
  { icon: IconDelivery, text: `${props.pack.validity} delivery time` },
])

// One row per module the pack is made of, straight out of the scope document,
// and one row per THING INSIDE each module. Same shape `PackScope` builds for
// the catalogue's panel, so the two renderings of one document can't drift.
//
// ⚠️ Each module carries its own carve-outs (`excluded`), and they stay INSIDE
// the module they belong to: "not in scope" only means anything next to the
// thing it is being excluded from. They sort last, after what IS covered.
const modules = computed(() =>
  props.pack.areas.map((key) => {
    const area = PACK_SCOPE[key]
    const excluded = area.rows.filter((r) => r.excluded).flatMap((r) => r.items)
    return {
      key,
      label: area.label,
      rows: [
        ...area.rows
          .filter((r) => !r.excluded)
          .map((r) => ({ key: r.area, label: r.area, items: r.items, excluded: false })),
        ...(excluded.length
          ? [
              {
                key: 'not-in-scope',
                label: `Not in scope (${excluded.length})`,
                items: excluded,
                excluded: true,
              },
            ]
          : []),
      ],
    }
  }),
)

// The pack-level exclusions, which are the reason a pack is cheap and fast.
// A row of their own after the modules rather than a footnote under them.
const notInScope = STRICTLY_EXCLUDED.map(asExclusion)

// ⚠️ Region aware: the commercial terms name a tax and an hourly rate, and
// quoting a German buyer in rupees is the bug this function exists to prevent.
const terms = computed(() => [
  { key: 'commercial', label: 'Commercial terms', lines: commercialTermsFor(props.region) },
  { key: 'responsibilities', label: 'What we need from you', lines: CUSTOMER_RESPONSIBILITIES },
])
</script>

<template>
  <div>
    <!-- ── The panel's own header ───────────────────────────────────────
         A strip, not a line of text above the content: it names the whole
         panel, so it belongs to the frame rather than to the first section.
         `min-h-12` is `PageHeader`'s own height, so it sits at the same rhythm
         as the bar above it, and it sticks while the scope scrolls under it —
         a panel whose modules are open is long enough to lose its title. -->
    <header
      class="sticky top-0 z-10 flex min-h-12 items-center border-b border-outline-gray-1 bg-surface-base px-4"
    >
      <h2 class="text-base font-medium text-ink-gray-8">{{ heading }}</h2>
    </header>

    <!-- ── What you are buying ──────────────────────────────────────────── -->
    <section class="px-4 py-4">
      <div class="flex items-start gap-3">
        <!-- Placeholder for the pack illustration, same tile the catalogue's
             rows will take. ⚠️ `layers`, not `package`: package is already a
             fact icon in this panel, and one card should not print the same
             glyph for two things. -->
        <Avatar size="3xl" shape="square" aria-hidden="true">
          <IconPack class="size-full" />
        </Avatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="min-w-0 truncate text-lg font-medium text-ink-gray-8">
              {{ pack.name }}
            </span>
            <Badge variant="subtle" theme="gray" size="sm" label="Starter Pack" />
          </div>
          <!-- ⚠️ `pitch`, not `tagline`. The tagline describes what is in the
               pack, and "Modules covered" lists exactly that a few lines down;
               this line is the only place in the panel that says what the pack
               is FOR. -->
          <p class="mt-1 text-p-base text-ink-gray-6">{{ pack.pitch }}</p>
        </div>
      </div>

      <ul class="mt-4 space-y-1.5">
        <li
          v-for="f in facts"
          :key="f.text"
          class="flex items-start gap-2 text-p-base text-ink-gray-7"
        >
          <component :is="f.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
          <span class="min-w-0">{{ f.text }}</span>
        </li>
      </ul>
    </section>

    <!-- ── What it covers ───────────────────────────────────────────────── -->
    <!-- ⚠️ `<details>`, not a hand-rolled toggle: this version of frappe-ui
         ships no accordion, and the native element brings the open state, the
         keyboard behaviour and the semantics for free. Same device as
         `PackScope`, which renders the same document in the catalogue. -->
    <section class="border-t border-outline-gray-1 px-4 py-4">
      <h3 class="text-base font-medium text-ink-gray-8">Modules covered</h3>

      <div class="mt-2">
        <details v-for="m in modules" :key="m.key" class="group">
          <summary
            class="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-p-base text-ink-gray-7 [&::-webkit-details-marker]:hidden"
          >
            <IconChevron
              class="size-3.5 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open:rotate-90"
            />
            {{ m.label }}
          </summary>

          <!-- ⚠️ Nested accordions, the same device one level down: a module
               opens to WHAT IT IS MADE OF (Masters, Transactions, Reports,
               Settings), and each of those opens to its doctypes. Printed flat
               they were four paragraphs of comma-separated names in a 320px
               column, which is the scope document as a wall rather than as
               something you can look one thing up in. -->
          <div class="pb-1 pl-5">
            <details v-for="row in m.rows" :key="row.key" class="group/row">
              <summary
                class="flex cursor-pointer list-none items-center gap-1.5 py-1 text-p-sm font-medium text-ink-gray-7 [&::-webkit-details-marker]:hidden"
                :class="row.excluded && 'font-normal text-ink-gray-5'"
              >
                <IconChevron
                  class="size-3 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open/row:rotate-90"
                />
                {{ row.label }}
              </summary>

              <!-- A comma run for what's covered: these are doctype names six
                   and seven to a row, and as bullets each becomes a column of
                   one-word lines. The carve-outs stay a list — they are read
                   one at a time, to check for a specific thing. -->
              <p v-if="!row.excluded" class="pb-2 pl-[18px] text-p-sm text-ink-gray-6">
                {{ row.items.join(', ') }}
              </p>
              <ul v-else class="space-y-0.5 pb-2 pl-[18px]">
                <li v-for="item in row.items" :key="item" class="text-p-sm text-ink-gray-5">
                  {{ item }}
                </li>
              </ul>
            </details>
          </div>
        </details>

        <details class="group">
          <summary
            class="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-p-base text-ink-gray-7 [&::-webkit-details-marker]:hidden"
          >
            <IconChevron
              class="size-3.5 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open:rotate-90"
            />
            Not in scope ({{ notInScope.length }})
          </summary>
          <!-- These stay a LIST: they are read one at a time, to check for a
               specific thing you were hoping was included. -->
          <ul class="space-y-1 pb-2 pl-5 pt-1">
            <li v-for="item in notInScope" :key="item.label" class="text-p-sm text-ink-gray-5">
              {{ item.label }}
              <span v-if="item.hint" class="text-ink-gray-4">{{ item.hint }}</span>
            </li>
          </ul>
        </details>
      </div>
    </section>

    <!-- ── What you are agreeing to ─────────────────────────────────────── -->
    <section class="border-t border-outline-gray-1 px-4 py-4">
      <h3 class="text-base font-medium text-ink-gray-8">Terms and conditions</h3>

      <div class="mt-2">
        <details v-for="t in terms" :key="t.key" class="group">
          <summary
            class="flex cursor-pointer list-none items-center gap-1.5 py-1.5 text-p-base text-ink-gray-7 [&::-webkit-details-marker]:hidden"
          >
            <IconChevron
              class="size-3.5 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open:rotate-90"
            />
            {{ t.label }}
          </summary>
          <ul class="space-y-1 pb-2 pl-5 pt-1">
            <li v-for="line in t.lines" :key="line" class="text-p-sm text-ink-gray-6">
              {{ line }}
            </li>
          </ul>
        </details>
      </div>
    </section>
  </div>
</template>
