<script setup>
import { computed } from 'vue'
import { PACK_SCOPE } from '../data/packs'
// ⚠️ Shared with the booking panel, which labels the same modules. See
// `src/scopeIcons.js` — one mapping, so one module can't become two glyphs.
import { SCOPE_ICONS } from '../scopeIcons'

// A Starter Pack's scope, rendered from the scope document in `data/packs.js`.
//
// ── The idea ────────────────────────────────────────────────────────────────
// A starter pack is defined as much by what it EXCLUDES as by what it includes.
// That's the whole reason it's cheap and quick, and the source document says so
// module by module — nearly every area carries an "Exclusions" row. So every
// module ends with its own carve-outs rather than hiding them in a footnote, on
// the same footing as everything it does cover.
//
// ⚠️ IT IS PRINTED NOW, NOT COLLAPSED, and that is this file's one real change.
// Every row used to be a `<details>`: the masters, the transactions, the
// reports, the settings and the carve-outs alike. The argument was sound where
// it was written — open, this is a ~2000px document in a 420px panel, and
// nobody scrolls that. The panel is gone. This renders on the pack's own page
// at an 800px measure, where the same document is a spec sheet, and where the
// reader's actual question is "is payment reconciliation in this or not". They
// were being asked to open nineteen triangles to find out, on the page where
// they decide whether to spend the money.
//
// So: a label column and a run of what is in it, module by module. The biggest
// pack runs about 1,100px of it. That length is the product — a fixed scope is
// the contract, and printing the contract is the point of the page.
//
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
      icon: SCOPE_ICONS[key],
      rows: [
        ...area.rows
          .filter((r) => !r.excluded)
          .map((r) => ({ key: r.area, label: r.area, items: r.items, excluded: false })),
        ...(excluded.length
          ? [{ key: 'not-included', label: 'Not included', items: excluded, excluded: true }]
          : []),
      ],
    }
  }),
)
</script>

<template>
  <!-- Rules between MODULES, and nowhere else: they separate the things the
       pack is made of, which is structure rather than decoration. Inside a
       module the rows are one module's contents and don't need dividing from
       each other. A one-module pack gets neither — see `single`. -->
  <div :class="!single && 'divide-y divide-outline-gray-1'">
    <section
      v-for="area in areas"
      :key="area.key"
      :class="!single && 'py-6 first:pt-0 last:pb-0'"
    >
      <h3
        v-if="!single"
        class="flex items-center gap-2 text-lg font-semibold text-ink-gray-8"
      >
        <component :is="area.icon" class="size-4 shrink-0 text-ink-gray-6" aria-hidden="true" />
        {{ area.label }}
      </h3>

      <!-- ⚠️ A GRID, not a flex row per line: the label column has to be one
           width down the whole module — and down every module, since they sit
           in one stack — or the runs start at a different place on each line
           and the eye loses the column it is scanning.
           `sm:` because at phone width 136px of label beside a run leaves the
           run about 180px wide, which sets six doctype names as six lines. Below
           that the label sits above its run instead. -->
      <dl
        class="gap-x-6 gap-y-2.5 sm:grid sm:grid-cols-[136px_minmax(0,1fr)]"
        :class="!single && 'mt-3'"
      >
        <template v-for="row in area.rows" :key="row.key">
          <!-- ⚠️ `sm:contents`, not `contents`, and the wrapper carries its own
               top margin below that. At `sm` and up the wrapper dissolves so
               each pair's `dt` and `dd` land in the grid's own columns, and the
               grid's `gap-y` does the spacing. Below `sm` there is no grid —
               so `gap-y` applies to nothing, and without this margin a run and
               the next label ran straight into each other on a phone. -->
          <div class="mt-4 first:mt-0 sm:contents">
            <!-- ⚠️ LABELS QUIET, CONTENTS DARK. The doctype names are what is
                 read; the label only says which kind they are. It was the
                 other way round, medium labels over gray-6 runs, which put the
                 weight on "Masters" and left the scope itself the faintest
                 text in the dialog.
                 The carve-out label matches every other label, so "Not
                 included" reads as another row of the specification rather
                 than a caption on the one above; its RUN is what goes light. -->
            <dt class="text-p-base text-ink-gray-6">
              {{ row.label }}
            </dt>
            <!-- A comma run, not a list: these are six and seven doctype names
                 to a row, and as bullets each becomes a column of one-word
                 lines. The carve-outs take the same shape as everything else —
                 what marks them is the label and the colour, not a different
                 structure, because they are part of the same specification. -->
            <dd
              class="mt-0.5 text-p-base sm:mt-0"
              :class="row.excluded ? 'text-ink-gray-5' : 'text-ink-gray-8'"
            >
              {{ row.items.join(', ') }}
            </dd>
          </div>
        </template>
      </dl>
    </section>
  </div>
</template>
