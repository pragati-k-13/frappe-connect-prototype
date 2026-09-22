<script setup>
import { computed } from 'vue'
import { checkoutFor } from '../data/packs'
import { serviceOf } from '../data/project'
import { modulesFor } from '../data/modules'

// What this project IS, as facts, at the top of the rail.
//
// ⚠️ THE RAIL IS REFERENCE AND THIS IS THE REST OF IT. The rail already held
// the partner, the pack document and the help links — everything about a
// project except the project. The scope in particular was stranded at the very
// foot of the main column, under the advance button, where it was the last
// thing on a page whose last thing should be the next action.
//
// ⚠️ LABEL AND VALUE, NOT PROSE. This is the one block on the page that is a
// lookup — "what did we buy", "how much was it", "when did this start" — and
// each answer is read on its own rather than in sequence. Everything else on
// this screen is a sentence for exactly the opposite reason.
//
// ⚠️ ROWS APPEAR ONLY WHEN THEY HAVE AN ANSWER. An undecided project has no
// service and no cost; a custom project has no packs; a pack project carries no
// module list because the packs ARE its scope, in full, in the panel underneath
// this one. A fixed set of rows with three of them reading "—" is a form, not a
// summary.
const props = defineProps({
  project: { type: Object, required: true },
  packs: { type: Array, default: () => [] },
  region: { type: String, default: null },
})

// "Finance, Sales, Purchase, Inventory, Manufacturing and HR." The same module
// catalogue the estimate modal prices, so the two agree on what "Finance"
// contains.
//
// ⚠️ A SENTENCE, not a row of pills. The pills were the only fully-round shape
// in the app and they appeared exactly here, which made them an orphan
// vocabulary rather than a device — a border and a radius wrapped around six
// single words. Naming six modules is what a comma is for.
const scopeLine = computed(() => {
  const names = Object.entries(props.project?.modules ?? {})
    .flatMap(([app, keys]) => modulesFor(app, keys))
    .map((m) => m.label)
  if (!names.length) return ''
  if (names.length === 1) return `${names[0]}.`
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}.`
})

// ⚠️ THE BASKET'S TOTAL, not one pack's price. Two packs bought together are
// one payment, and `checkoutFor` is the same function the checkout charged
// against — a figure computed a second way here is a figure that can disagree
// with the receipt.
//
// Custom work has no cost until a partner has been hired and quoted; the row is
// absent rather than guessing, because the one number a business must not read
// wrong on its own project page is what it is paying.
const cost = computed(() => {
  if (props.packs.length) return checkoutFor(props.packs, props.region ?? undefined).total
  const hired = (props.project?.bids ?? []).find((b) => b.partnerId === props.project?.partnerId)
  return hired?.price ?? ''
})

const started = computed(() =>
  props.project?.at
    ? new Date(props.project.at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '',
)

const rows = computed(() =>
  [
    { label: 'Service', value: serviceOf(props.project?.service)?.label ?? '' },
    {
      label: props.packs.length === 1 ? 'Pack' : 'Packs',
      value: props.packs.map((p) => p.name).join(', '),
    },
    { label: 'Scope', value: scopeLine.value },
    { label: 'Cost', value: cost.value },
    { label: 'Started', value: started.value },
  ].filter((r) => r.value),
)
</script>

<template>
  <div>
    <!-- Same strip as `PackPanel`'s and `ProjectPartnerPanel`'s: `min-h-12` is
         `PageHeader`'s height, so the panels and the top bar sit on one
         rhythm. -->
    <header
      class="sticky top-0 z-10 flex min-h-12 items-center border-b border-outline-gray-1 bg-surface-base px-4"
    >
      <h2 class="text-base font-medium text-ink-gray-8">Project</h2>
    </header>

    <!-- ⚠️ A `dl`, and the labels are a fixed column. The values are the
         column people read down; a label that shifts with its value's length
         makes them hunt for the start of each one. -->
    <dl v-if="rows.length" class="space-y-2.5 px-4 py-4">
      <div v-for="row in rows" :key="row.label" class="flex gap-3 text-p-base">
        <dt class="w-[72px] shrink-0 text-ink-gray-5">{{ row.label }}</dt>
        <dd class="min-w-0 flex-1 text-ink-gray-8">{{ row.value }}</dd>
      </div>
    </dl>
  </div>
</template>
