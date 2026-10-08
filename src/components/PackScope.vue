<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { PACK_SCOPE } from '../data/packs'
// ⚠️ Shared with the booking panel, which labels the same modules. See
// `src/scopeIcons.js` — one mapping, so one module can't become two glyphs.
import { SCOPE_ICONS } from '../scopeIcons'
import IconX from '~icons/lucide/x'
import IconChevronDown from '~icons/lucide/chevron-down'
import IconChevronUp from '~icons/lucide/chevron-up'
import ScopeShot from './PackScopeShot.vue'

// A Starter Pack's scope, rendered from the scope document in `data/packs.js`.
//
// ── The idea ────────────────────────────────────────────────────────────────
// A starter pack is defined as much by what it EXCLUDES as by what it includes.
// That's the whole reason it's cheap and quick, and the source document says so
// module by module — nearly every area carries an "Exclusions" row. So every
// module ends with its own carve-outs rather than hiding them in a footnote, on
// the same footing as everything it does cover.
//
// ⚠️ ONE SUB-SECTION OPEN AT A TIME, each with a screenshot beside it. This
// was printed in full, and before that every row was a `<details>`. Printed,
// the biggest pack was ~1,100px of doctype names at one weight — complete, but
// nothing for a first-time reader to land on. Now a module reads as its name,
// its sentence, and a short list of sub-section titles; open one and the right
// column shows what it looks like in the product.
//
// ⚠️ "Not included" is the last openable row, like any other, frame and all —
// an empty column read as broken. Its items keep their × so they never rest
// on colour alone.
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
          .map((r) => ({ key: r.area, label: r.area, items: r.items, screenshot: r.screenshot })),
        ...(excluded.length
          ? [
              {
                key: 'not-included',
                label: 'Not included',
                items: excluded,
                excluded: true,
                screenshot: area.rows.find((r) => r.excluded && r.screenshot)?.screenshot,
              },
            ]
          : []),
      ],
    }
  }),
)

// The open sub-section, per module — each module's list is its own accordion.
// ⚠️ ALL CLOSED to start: a first-time reader sees each module as its name, its
// sentence and its row titles, and opens what they came to check. With nothing
// open the screenshot column shows the module itself (`row` is undefined).
// Clicking the open row closes it again — the chevron promises that.
const open = reactive({})
const openKey = (area) => open[area.key] ?? null
const toggle = (area, row) => (open[area.key] = openKey(area) === row.key ? null : row.key)
const openRow = (area) => area.rows.find((r) => r.key === openKey(area))
const id = (area, row) => `scope-${area.key}-${row.key.toLowerCase().replace(/\W+/g, '-')}`

// ⚠️ A MODULE'S HEIGHT IS SET ONCE AND NEVER MOVES when a row opens: a row
// that pushed the module (and the screenshot frame beside it) taller on open
// made the page jump. So every module is held at the larger of two heights:
//   – its standard: `STANDARD_HEIGHT`, or `SHORT_HEIGHT` for a module of three
//     rows or fewer (HRMS, Payroll), which at the standard sat on 200px of
//     nothing; and
//   – what it needs with its LONGEST row open — the head, every row's button
//     and the largest panel, measured by `scrollHeight`, which reports a
//     panel's content even while it is collapsed.
// Most modules take the standard; one with a very long row (Accounting's
// Reports, Buying's Transactions) is simply taller, all the time.
//
// Only while the screenshot sits beside the list. Stacked, the shot is inside
// the open row and a fixed height would leave a gap under a short one.
const STANDARD_HEIGHT = 436
const SHORT_HEIGHT = 380
const columns = ref([])
const fit = () => {
  for (const col of columns.value) {
    col.style.minHeight = ''
    const aside = col.parentElement.querySelector('.fc-scope-aside')
    if (!aside || getComputedStyle(aside).display === 'none') continue
    const list = col.querySelector(':scope > ul')
    const rows = [...list.children]
    const head = list.getBoundingClientRect().top - col.getBoundingClientRect().top
    const buttons = rows.reduce((h, li) => h + li.querySelector('button').offsetHeight, 0)
    const panel = Math.max(...rows.map((li) => li.querySelector('.overflow-hidden').scrollHeight))
    const base = rows.length <= 3 ? SHORT_HEIGHT : STANDARD_HEIGHT
    col.style.minHeight = `${Math.max(base, Math.ceil(head + buttons + panel))}px`
  }
}
// ⚠️ Re-fit when the PACK changes, not just on mount: moving between pack
// pages keeps this component and swaps its modules, and the new columns came
// up unsized and unobserved.
let observer
const observe = () => {
  observer?.disconnect()
  observer = new ResizeObserver(() => requestAnimationFrame(fit))
  for (const col of columns.value) observer.observe(col.parentElement)
  fit()
}
onMounted(() => {
  observe()
  document.fonts?.ready.then(fit)
})
watch(
  () => props.pack,
  () => {
    for (const key of Object.keys(open)) delete open[key]
    nextTick(observe)
  },
)
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <!-- Modules are separated by space and their heading; rules are the
       sub-section list's own device, and a rule between modules read as one
       more row. -->
  <div :class="!single && 'space-y-36'">
    <!-- ⚠️ Two columns by the COMPONENT's width, not the window's: this also
         renders in the scope dialog, which is narrow on a wide screen. See
         `.fc-scope` in index.css. Stacked, the screenshot moves inside the
         open row instead of beside the list.
         ⚠️ The module's name and sentence are IN the left column, not above
         both: the screenshot belongs to the whole module, so it runs the
         module's full height, heading included. -->
    <!-- Every other module mirrors (`fc-scope-flip`): screenshot left, list
         right. Source order is unchanged, so a screen reader and the stacked
         phone layout still read the module's text first. -->
    <section
      v-for="(area, i) in areas"
      :key="area.key"
      class="fc-scope"
      :class="i % 2 === 1 && 'fc-scope-flip'"
    >
      <div class="fc-scope-grid">
        <!-- A column: the module's head, then its rows straight under it.
             Rows were pinned to the bottom once, level with the screenshot's
             foot; on any module shorter than its height that opened a hole
             between the sentence and the list, so the spare space now falls
             below the rows instead. -->
        <div ref="columns">
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
                  <div class="fc-scope-inline pb-5">
                    <div class="aspect-[16/10]"><ScopeShot :area="area" :row="row" /></div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- ⚠️ KEYED BY THE IMAGE, not the row. Keyed by row, every click
             faded the frame out and back in — a visible blink between two
             identical placeholders. Now the frame only changes when the
             picture does, and the two shots CROSSFADE: the outgoing one is
             lifted out of flow (`absolute inset-0`) so there is never an
             empty frame between them. -->
        <div class="fc-scope-aside relative">
          <Transition
            enter-active-class="transition-opacity duration-200 motion-reduce:transition-none"
            leave-active-class="absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <ScopeShot
              :key="openRow(area)?.screenshot ?? 'placeholder'"
              :area="area"
              :row="openRow(area)"
            />
          </Transition>
        </div>
      </div>
    </section>
  </div>
</template>
