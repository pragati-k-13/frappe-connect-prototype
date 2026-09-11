<script setup>
import { computed } from 'vue'
import { PACK_SCOPE } from '../data/packs'
// ⚠️ Shared with the booking panel, which labels the same modules. See
// `src/scopeIcons.js` — one mapping, so one module can't become two glyphs.
import { SCOPE_ICONS } from '../scopeIcons'

// A Starter Pack's scope, rendered from the scope document in `data/packs.js`.
//
// ⚠️ Content, not container. It knows nothing about where it's mounted — it has
// been a dialog body and is now a side panel, and moved between them without a
// line changing inside it. Keep it that way.
//
// ── The idea ────────────────────────────────────────────────────────────────
// A starter pack is defined as much by what it EXCLUDES as by what it includes.
// That's the whole reason it's cheap and quick, and the source document says so
// module by module — nearly every area carries an "Exclusions" row.
//
// So every module ends with its own carve-outs rather than hiding them in a
// footnote, on the same footing as everything it does cover.
//
// EVERYTHING is collapsed by default — the masters, the transactions, the
// reports, the settings and the carve-outs alike. Open, this is a ~2000px
// document in a 420px column and nobody scrolls it; closed, a pack is seven
// named modules with five labelled rows each, which is a shape you can take in
// at a glance and then open the two you care about.
//
// ⚠️ Hours, price and validity are NOT here — they're on the catalogue row this
// panel opens from, and repeating them at the top of the panel said the same
// thing twice within 400px.
const props = defineProps({
  pack: { type: Object, required: true },
})

// Presentation, so it lives here rather than in `data/packs.js` — the scope
// document has no icons in it.
// The carve-outs as a single row's worth of items, or nothing at all where a
// module excludes nothing — Inventory is the one the document carves nothing
// out of, and an empty disclosure there would read as a broken control.
const excludedRows = (area) => {
  const items = area.rows.filter((r) => r.excluded).flatMap((r) => r.items)
  return items.length ? [items] : []
}

// One area becomes one section. Rows arrive in the document's own order and
// split on the `excluded` flag the data already carries, so nothing here
// decides what's in or out — only how it reads once open.
const areas = computed(() =>
  props.pack.areas.map((key) => {
    const area = PACK_SCOPE[key]
    return {
      key,
      label: area.label,
      icon: SCOPE_ICONS[key],
      // One list, so the carve-outs are a row of the module like any other
      // rather than a differently-shaped thing bolted underneath it. `excluded`
      // only changes how the open contents read, not the row.
      rows: [
        ...area.rows
          .filter((r) => !r.excluded)
          .map((r) => ({ key: r.area, label: r.area, items: r.items, excluded: false })),
        ...excludedRows(area).map((items) => ({
          key: 'not-in-scope',
          label: `Not in scope (${items.length})`,
          items,
          excluded: true,
        })),
      ],
    }
  }),
)
</script>

<template>
  <div>
    <!-- Rules between MODULES, and nowhere else: they separate the seven
         things the pack is made of. Inside a module the rows are one module's
         contents and don't need dividing from each other.
         No heading above this — the panel's own header already says which pack
         you're reading, and "What this pack includes" was a label on the only
         thing in the panel. -->
    <div class="divide-y divide-outline-gray-1">
      <section v-for="area in areas" :key="area.key" class="py-5 first:pt-0 last:pb-0">
        <!-- A section title, not an eyebrow: these are the seven things the
             pack is made of, and setting them as small grey capitals filed
             them as labels on the content rather than as its structure. -->
        <h4 class="flex items-center gap-2 text-base font-medium text-ink-gray-8">
          <component :is="area.icon" class="size-4 shrink-0 text-ink-gray-6" />
          {{ area.label }}
        </h4>

        <div class="mt-3">
          <!-- ⚠️ `<details>`, not a hand-rolled toggle: this version of
               frappe-ui ships no accordion, and the native element brings the
               open state, the keyboard behaviour and the semantics for free. -->
          <details v-for="row in area.rows" :key="row.key" class="group">
            <summary
              class="flex cursor-pointer list-none items-center gap-1.5 py-1 text-p-sm font-medium text-ink-gray-7 [&::-webkit-details-marker]:hidden"
              :class="row.excluded && 'text-ink-gray-6'"
            >
              <LucideChevronRight
                class="size-3.5 shrink-0 text-ink-gray-5 motion-safe:transition-transform group-open:rotate-90"
              />
              {{ row.label }}
            </summary>

            <!-- A comma run for what's covered: these are lists of doctype
                 names six and seven long, and as bullets each row became a
                 column of one-word lines. The carve-outs stay a list — they're
                 read one at a time, to check for a specific thing. -->
            <p v-if="!row.excluded" class="pb-3 pl-5 text-p-base text-ink-gray-6">
              {{ row.items.join(', ') }}
            </p>
            <ul v-else class="space-y-0.5 pb-3 pl-5">
              <li v-for="item in row.items" :key="item" class="text-p-base text-ink-gray-5">
                {{ item }}
              </li>
            </ul>
          </details>
        </div>
      </section>
    </div>
  </div>
</template>
