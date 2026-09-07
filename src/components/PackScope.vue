<script setup>
import { computed } from 'vue'
import { PACK_SCOPE, priceFor, pricingFor } from '../data/packs'

// A Starter Pack's scope, rendered from the scope document in `data/packs.js`.
//
// ⚠️ Content, not container. It knows nothing about the dialog it's mounted in,
// which is what let it move to an inline panel and back without a line changing
// inside it. Keep it that way.
//
// ── The idea ────────────────────────────────────────────────────────────────
// A starter pack is defined as much by what it EXCLUDES as by what it includes.
// That's the whole reason it's cheap and quick, and the source document says so
// module by module — nearly every area carries an "Exclusions" row.
//
// So the exclusions get equal billing: every area is a ledger, in scope on the
// left, out of scope on the right, same size and same weight. What separates
// them is ground, not colour — `surface-gray-2` says "different territory"
// without saying "bad", which red would. Someone deciding between a pack and a
// custom implementation is deciding exactly this, and a page that whispers the
// carve-outs in a footnote is not helping them decide.
//
// ⚠️ What belongs here is what VARIES BY PACK: the hours, the price, and the
// module-by-module scope with its carve-outs. What ships with every pack, what
// never does, and the commercial terms are on the catalogue page instead —
// identical in all four, so four dialogs repeating them padded each one with
// the half that never changes and buried the half that does.
//
// ⚠️ Customer responsibilities are in neither. They're what you agree to once
// you've chosen, not what helps you choose — they belong in the booking flow.
const props = defineProps({
  pack: { type: Object, required: true },
  region: { type: String, required: true },
})

const pricing = computed(() => pricingFor(props.region))
const price = computed(() => priceFor(props.pack, props.region))

// One area becomes one ledger. `rows` arrive in the document's own order and
// split on the `excluded` flag the data already carries, so nothing here
// decides what's in or out — it only decides which column it lands in.
const areas = computed(() =>
  props.pack.areas.map((key) => {
    const area = PACK_SCOPE[key]
    return {
      key,
      label: area.label,
      included: area.rows.filter((r) => !r.excluded),
      excluded: area.rows.filter((r) => r.excluded).flatMap((r) => r.items),
    }
  }),
)
</script>

<template>
  <div>
    <!-- Hours first. The price is what you pay, but the pack IS a block of a
         partner's time against a fixed scope, and the validity is the clock
         that block runs against.
         ⚠️ `divide-x`, not a 1px gap over a coloured ground. The gap trick needs
         `bg-outline-gray-1` on the grid, and `outline-*` is frappe-ui's BORDER
         scale — as a background it compiles to nothing and the hairlines simply
         never draw. See FRAPPE-UI-NOTES.md. -->
    <dl
      class="grid grid-cols-3 divide-x divide-outline-gray-1 rounded-6 border border-outline-gray-1"
    >
      <div class="px-4 py-3">
        <dt class="text-xs text-ink-gray-5">Hours</dt>
        <dd class="mt-1 text-lg font-medium tabular-nums text-ink-gray-8">{{ pack.hours }}</dd>
      </div>
      <div class="px-4 py-3">
        <dt class="text-xs text-ink-gray-5">Use within</dt>
        <dd class="mt-1 text-lg font-medium text-ink-gray-8">{{ pack.validity }}</dd>
      </div>
      <div class="px-4 py-3">
        <dt class="text-xs text-ink-gray-5">Price</dt>
        <dd class="mt-1 text-lg font-medium tabular-nums text-ink-gray-8">{{ price }}</dd>
      </div>
    </dl>

    <p class="mt-2 text-p-sm text-ink-gray-5">
      Priced for {{ pricing.label }}, before {{ pricing.tax }}.
    </p>

    <!-- ── The ledger ──────────────────────────────────────────────────── -->
    <section class="mt-8">
      <h3 class="text-base font-medium text-ink-gray-8">What the partner sets up</h3>

      <div class="mt-4 space-y-5">
        <div v-for="area in areas" :key="area.key">
          <p class="text-xs font-semibold uppercase tracking-[0.06em] text-ink-gray-5">
            {{ area.label }}
          </p>

          <div class="mt-2 grid gap-3 sm:grid-cols-[1.6fr_1fr]">
            <div>
              <div v-for="row in area.included" :key="row.area" class="mt-3 first:mt-0">
                <p class="text-p-sm font-medium text-ink-gray-7">{{ row.area }}</p>
                <!-- A comma run, not bullets. These are lists of doctype names
                     six and seven long; as bullets each area became a column of
                     one-word lines and the ledger stopped being scannable. -->
                <p class="mt-0.5 text-p-base text-ink-gray-6">{{ row.items.join(', ') }}</p>
              </div>
            </div>

            <!-- `self-start`, or the grid stretches this to the height of the
                 in-scope column beside it and Accounting's four carve-outs sit
                 at the top of a tall empty block. -->
            <div class="self-start rounded-6 bg-surface-gray-2 px-3 py-2.5">
              <p class="text-p-sm font-medium text-ink-gray-6">Not in scope</p>
              <ul v-if="area.excluded.length" class="mt-1 space-y-0.5">
                <li v-for="item in area.excluded" :key="item" class="text-p-base text-ink-gray-5">
                  {{ item }}
                </li>
              </ul>
              <!-- An empty column reads as a bug. "No carve-outs" is a fact
                   about this module and worth stating — Inventory is the one
                   area the document excludes nothing from. -->
              <p v-else class="mt-1 text-p-base text-ink-gray-5">No carve-outs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
