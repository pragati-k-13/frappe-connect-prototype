<script setup>
import { computed, reactive, watch } from 'vue'
import { PACK_SCOPE } from '../data/packs'
// ⚠️ Shared with the booking panel, which labels the same modules. See
// `src/scopeIcons.js` — one mapping, so one module can't become two glyphs.
import { SCOPE_ICONS } from '../scopeIcons'
import IconX from '~icons/lucide/x'
import IconChevronDown from '~icons/lucide/chevron-down'
import IconChevronUp from '~icons/lucide/chevron-up'

// A Starter Pack's scope, rendered from the scope document in `data/packs.js`.
//
// ── The idea ────────────────────────────────────────────────────────────────
// A starter pack is defined as much by what it EXCLUDES as by what it includes.
// That's the whole reason it's cheap and quick, and the source document says so
// module by module — nearly every area carries an "Exclusions" row. So every
// module ends with its own carve-outs rather than hiding them in a footnote, on
// the same footing as everything it does cover.
//
// ⚠️ ONE SUB-SECTION OPEN AT A TIME per module. This was printed in full, and
// before that every row was a `<details>`. Printed, the biggest pack was
// ~1,100px of doctype names at one weight — complete, but nothing for a
// first-time reader to land on. Now a module reads as its name, its sentence,
// and a short list of sub-section titles, one module to a row.
//
// ⚠️ "Not included" is the last openable row, like any other. Its items keep
// their × so they never rest on colour alone.
// ⚠️ Hours, price and validity are NOT here — they are the page's own header,
// and repeating them would say the same thing twice within a screen.
const props = defineProps({
  pack: { type: Object, required: true },
})

// ⚠️ A pack of ONE module doesn't name it. Three of the four packs are a single
// module and are NAMED after it, so the page's own heading already says
// "Manufacturing" — a module heading repeating it labels the only thing on
// screen with the title of the screen.
const single = computed(() => props.pack.areas.length === 1)

// One area becomes one block. Rows arrive in the document's own order and split
// on the `excluded` flag the data already carries, so nothing here decides
// what's in or out — only how it reads.
//
// ⚠️ The carve-outs collapse into ONE row per module, labelled "Not included".
// The document spreads them across differently-named rows ("Exclusions", "Not
// included") and a spec sheet whose negative line changes its name module to
// module makes the reader check whether it means something different. It
// doesn't.
const areas = computed(() =>
  props.pack.areas.map((key) => {
    const area = PACK_SCOPE[key]
    const excluded = area.rows.filter((r) => r.excluded).flatMap((r) => r.items)
    return {
      key,
      label: area.label,
      summary: area.summary,
      icon: SCOPE_ICONS[key],
      rows: [
        ...area.rows
          .filter((r) => !r.excluded)
          .map((r) => ({ key: r.area, label: r.area, items: r.items })),
        ...(excluded.length
          ? [
              {
                key: 'not-included',
                label: 'Not included',
                items: excluded,
                excluded: true,
              },
            ]
          : []),
      ],
    }
  }),
)

// The open sub-section, per module — each module's list is its own accordion.
// ⚠️ ALL CLOSED to start: a first-time reader sees each module as its name, its
// sentence and its row titles, and opens what they came to check. Clicking the
// open row closes it again — the chevron promises that.
const open = reactive({})
const openKey = (area) => open[area.key] ?? null
const toggle = (area, row) => (open[area.key] = openKey(area) === row.key ? null : row.key)
const id = (area, row) => `scope-${area.key}-${row.key.toLowerCase().replace(/\W+/g, '-')}`

// Moving between pack pages keeps this component and swaps its modules, so the
// open rows reset with the pack.
watch(
  () => props.pack,
  () => {
    for (const key of Object.keys(open)) delete open[key]
  },
)
</script>

<template>
  <div>
    <div class="fc-scope-grid">
      <section v-for="area in areas" :key="area.key">
        <h3 v-if="!single" class="flex items-center gap-2 text-lg font-semibold text-ink-gray-8">
          <component :is="area.icon" class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
          {{ area.label }}
        </h3>

        <!-- The module in one sentence, for the reader who is skimming. -->
        <p class="text-p-base text-ink-gray-7" :class="!single && 'mt-1.5'">
          {{ area.summary }}
        </p>

        <ul class="mt-6">
          <li v-for="row in area.rows" :key="row.key">
            <!-- Rules go BETWEEN rows, so the first has none — the module's
                 sentence above already ends the head.
                 ⚠️ Every rule is outline-gray-1 and every title gray-7, open
                 row included: the titles are the module's table of contents,
                 not disabled options. The open row is marked by its chevron
                 and its contents. -->
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 border-t border-outline-gray-1 py-3 [li:first-child>&]:border-t-0 text-left text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3 motion-reduce:transition-none text-ink-gray-7"
              :aria-expanded="openKey(area) === row.key"
              :aria-controls="id(area, row)"
              @click="toggle(area, row)"
            >
              {{ row.label }}
              <component
                :is="openKey(area) === row.key ? IconChevronUp : IconChevronDown"
                class="size-4 shrink-0 text-ink-gray-5"
                aria-hidden="true"
              />
            </button>

            <!-- Height eases open from 0fr to 1fr, which is the open row
                 showing where its contents came from; closed panels are
                 `inert` so they are out of the tab order and the a11y tree. -->
            <div
              :id="id(area, row)"
              class="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
              :class="openKey(area) === row.key ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
              :inert="openKey(area) !== row.key"
            >
              <div class="overflow-hidden">
                <ul
                  class="space-y-1 pb-5 text-p-base"
                  :class="row.excluded ? 'text-ink-gray-5' : 'text-ink-gray-6'"
                >
                  <li v-for="item in row.items" :key="item" class="flex gap-1.5">
                    <IconX
                      v-if="row.excluded"
                      class="mt-[3px] size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
