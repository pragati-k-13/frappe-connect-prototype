<script setup>
import { computed } from 'vue'
import { Dialog } from 'frappe-ui'
import { budgetLabel, criteriaLines } from '../data/custom'
import { scopeSentence } from '../data/modules'
import { answerRows } from '../data/company'

// Everything on a brief that is not the first thing you need from it.
//
// ⚠️ THE CARD WAS PRINTING ALL OF IT, and a requirement now carries the scope,
// the modules, a budget, an industry, a headcount and
// five criteria. A partner scanning an inbox reads a card to decide whether to
// read the brief; a card that is already the brief has nothing left to open and
// buries the three facts that decision is made on.
//
// So the card keeps what it is, what they want built and what they will pay,
// and this holds the rest.
//
// ⚠️ THE CRITERIA COME FROM `criteriaLines`, the same function that draws them
// on the recommendation screen before the brief is sent. A partner reading a
// different list from the one the customer was shown is the one drift this
// pair cannot afford.
const props = defineProps({
  open: { type: Boolean, default: false },
  brief: { type: Object, default: null },
  // The business reading its own requirements, rather than a partner reading
  // them. Only the wording changes: "you", not "they".
  own: { type: Boolean, default: false },
})

defineEmits(['update:open'])

// ⚠️ BUILT FROM THE SNAPSHOT, not from the store. The brief on the message is
// what was sent; the account's answers have kept moving since. Passing the
// snapshot's own fields as the "company" is what keeps this dialog showing the
// requirement as it went out.
const criteria = computed(() =>
  criteriaLines(
    { country: props.brief?.country, segments: props.brief?.segments },
    props.brief ?? {},
  ),
)

const rows = computed(() => {
  const b = props.brief ?? {}
  return [
    { label: 'Modules', value: scopeSentence(b.modules) },
    { label: 'Budget', value: budgetLabel(b.budget) },
    { label: 'Industry', value: b.segments?.[0] ?? '' },
    { label: 'Size', value: b.employees ? `${b.employees} people` : '' },
  ].filter((r) => r.value).concat(answerRows(b))
})
</script>

<template>
  <Dialog
    :model-value="open"
:title="own ? 'Your requirements' : 'Requirement details'"
    size="lg"
    @update:model-value="$emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <div v-if="brief" class="space-y-5">
        <div>
          <p class="text-p-sm text-ink-gray-5">{{ own ? 'What you need built' : 'What they need built' }}</p>
          <p class="mt-1 whitespace-pre-line text-p-base leading-relaxed text-ink-gray-8">
            {{ brief.scope }}
          </p>
        </div>

        <dl v-if="rows.length" class="space-y-1.5 border-t border-outline-gray-2 pt-4">
          <div v-for="row in rows" :key="row.label" class="flex gap-6 text-p-base">
            <dt class="w-36 shrink-0 text-ink-gray-5">{{ row.label }}</dt>
            <dd class="text-ink-gray-8">{{ row.value }}</dd>
          </div>
        </dl>

        <div class="border-t border-outline-gray-2 pt-4">
          <p class="text-p-sm text-ink-gray-5">{{ own ? 'Who you asked for' : 'Who they asked for' }}</p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="line in criteria" :key="line.text" class="text-p-base text-ink-gray-7">
              {{ line.text }}
            </li>
          </ul>
        </div>
      </div>
    </template>
  </Dialog>
</template>
