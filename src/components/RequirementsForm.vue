<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { FormControl, MultiSelect, Textarea } from 'frappe-ui'
import AppsSelect from './AppsSelect.vue'
import { TIERS, TIMELINES, asksCity, briefErrors, budgetBandsFor } from '../data/custom'
import { OPERATIONS, problemsFor } from '../data/company'
import { INDIA_CITIES, PARTNERS } from '../data/partners'
import { useConnectStore } from '../stores/connect'

// Requirements already sent, as fields — the editing state of the one
// requirements dialog (`BriefDetailsDialog`). See docs/edit-requirements.md.
//
// ⚠️ THE READING VIEW'S ORDER: the short answers first, the description last.
// The description is the one field that can run to pages, so at the end it
// grows with its text and the dialog keeps a single scroll — in the middle it
// had to be capped and scroll inside itself, inside a dialog that scrolled too.
//
// ⚠️ SELECTS, NOT CHIP ROWS, wherever the options are long or many. Seven
// sentence-long problems and nine cities as chips made this form about 1,090px
// tall; editing usually changes one thing, and every row had to be scrolled
// past to reach Send. The company line is left out: it isn't editable here,
// and the reading view already shows it.
const props = defineProps({
  projectId: { type: String, required: true },
})

const store = useConnectStore()
const project = computed(() => store.projects.find((p) => p.id === props.projectId) ?? null)
const answers = computed(() => project.value?.answers ?? store.company)
const bands = computed(() => budgetBandsFor(answers.value.country))

// Filled once, when the editor opens. The project's own starting point when it
// has one; the company's answers otherwise, which is what was sent.
const initial = (() => {
  const b = JSON.parse(JSON.stringify(store.briefOf(props.projectId)))
  for (const k of ['cities', 'tiers', 'regions', 'countries', 'problems']) b[k] = b[k] ?? []
  b.operations = b.operations || answers.value.operations || ''
  if (!b.problems.length) b.problems = [...(answers.value.problems ?? [])]
  b.projectApps = [...(project.value?.apps ?? [])]
  return b
})()
const form = reactive(JSON.parse(JSON.stringify(initial)))
const dirty = computed(() => JSON.stringify(form) !== JSON.stringify(initial))

const tried = ref(false)
const check = () => ({
  ...briefErrors({ scope: form.scope ?? '', budget: form.budget ?? '' }),
  ...(form.projectApps?.length ? {} : { apps: 'Pick at least one app' }),
})
const errors = computed(() => (tried.value ? check() : {}))

const count = store.requirementsRecipients(props.projectId).length
const requester = computed(() =>
  project.value?.hireRequest ? PARTNERS.find((p) => p.id === project.value.hireRequest) : null,
)
const sendLabel = computed(() =>
  requester.value ? 'Decline request and send' : `Send to ${count} ${count === 1 ? 'partner' : 'partners'}`,
)

// Options for the pickers. Timeline is optional, so "No preference" is its
// empty answer rather than a blank field.
// Short labels: the field already asks when it goes live, and at half width
// "Live within three months" was cut to "Live within three mont…".
const timelines = [
  { label: 'No preference', value: '' },
  ...TIMELINES.map((t) => ({ label: t.label.replace(/^Live within/, 'Within'), value: t.value })),
]
const problems = problemsFor().map((p) => ({ label: p.label, value: p.value }))
const cities = INDIA_CITIES.map((c) => ({ label: c, value: c }))
const tiers = TIERS.map((t) => ({ label: t.label, value: t.value }))
const showCity = computed(() => asksCity(answers.value.country))

// What a picker's trigger reads: the picks by name, or its "any" answer — a
// real choice, so it's drawn as text, not as a placeholder.
const namesOf = (values, options, none) =>
  values.length ? options.filter((o) => values.includes(o.value)).map((o) => o.label).join(', ') : none
// What you want fixed: sentence-long options, so two names don't fit the
// trigger. One reads in full; more read as a count, and the list says which.
const fixedSummary = computed(() =>
  form.problems.length > 1 ? `${form.problems.length} picked` : namesOf(form.problems, problems, 'Nothing picked'),
)

// ⚠️ THE DESCRIPTION GROWS WITH ITS TEXT, measured, not estimated. A row count
// guessed from characters per line came up short wherever the field was
// narrower than the guess (a phone), and the field scrolled inside the
// dialog's scroll. Sized to its own scrollHeight on open and on every edit.
const descEl = ref(null)
const fit = () => {
  const ta = descEl.value?.$el?.querySelector?.('textarea') ?? descEl.value?.querySelector?.('textarea')
  if (!ta) return
  ta.style.overflow = 'hidden'
  ta.style.resize = 'none'
  ta.style.height = 'auto'
  ta.style.height = `${ta.scrollHeight}px`
}
onMounted(fit)
watch(() => form.scope, () => nextTick(fit))

// Returns the store's result (null when nothing changed), or `false` when a
// required field is missing and the form now shows why.
function submit() {
  tried.value = true
  if (Object.keys(check()).length) return false
  return store.updateRequirements(props.projectId, { ...form })
}

defineExpose({ submit, dirty, sendLabel, requester })
</script>

<template>
  <form novalidate class="space-y-4" @submit.prevent>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormControl
        v-model="form.budget"
        type="select"
        label="Your budget"
        placeholder="Select a range"
        required
        :options="bands"
        :error="errors.budget"
      />
      <FormControl
        v-model="form.timeline"
        type="select"
        label="When do you need it live?"
        placeholder="No preference"
        :options="timelines"
      />
    </div>

    <AppsSelect v-model="form.projectApps" label="Apps" placeholder="Select" required :error="errors.apps" />

    <FormControl
      v-model="form.operations"
      type="select"
      label="How you handle this today"
      placeholder="Select one"
      :options="OPERATIONS"
    />

    <MultiSelect v-model="form.problems" label="What you want fixed" :options="problems" hide-search>
      <template #footer />
      <template #summary>
        <span class="text-ink-gray-8">{{ fixedSummary }}</span>
      </template>
    </MultiSelect>

    <!-- "Partner" in both labels: on their own, City and Tier read as yours. -->
    <div class="grid grid-cols-1 gap-4" :class="showCity ? 'sm:grid-cols-2' : ''">
      <MultiSelect v-if="showCity" v-model="form.cities" label="Partner city" :options="cities" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(form.cities, cities, 'Any city') }}</span>
        </template>
      </MultiSelect>
      <MultiSelect v-model="form.tiers" label="Partner tier" :options="tiers" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(form.tiers, tiers, 'Any tier') }}</span>
        </template>
      </MultiSelect>
    </div>

    <div ref="descEl">
      <Textarea v-model="form.scope" label="Description" :rows="4" required :error="errors.scope" />
    </div>
  </form>
</template>
