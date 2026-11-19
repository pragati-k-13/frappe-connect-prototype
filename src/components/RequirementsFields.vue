<script setup>
import { computed, h, nextTick, onMounted, ref, watch } from 'vue'
import { Button, FormControl, MultiSelect, Textarea, Tooltip } from 'frappe-ui'
import AppsSelect from './AppsSelect.vue'
import FilterChip from './FilterChip.vue'
import { OPERATIONS } from '../data/company'
import { MAX_INDUSTRIES, countriesText, industryText } from '../data/format'
import { useConnectStore } from '../stores/connect'

// One section's fields in the requirements dialog, opened by its card's
// pencil and shown on their own, full width, in place of the cards. Every
// section edits the same draft (`useRequirementsDraft`), and nothing leaves
// until the dialog's one Save or Send.
//
//   ask      apps, budget and go-live, the partner wanted, what to fix
//   company  the company's industries and size (saved to Settings), then how
//            this project runs today and the tools it uses
//   scope    the description
const props = defineProps({
  draft: { type: Object, required: true },
  section: { type: String, required: true },
})

const store = useConnectStore()
const form = computed(() => props.draft.form)
const company = computed(() => props.draft.company)
// Name and country aren't edited here: country sets the budget bands and the
// location field. Shown, so it's clear where they went.
const fixedLine = computed(() => {
  const c = store.company ?? {}
  return [c.name || store.viewer?.company, countriesText(c.countries?.length ? c.countries : [c.country])].filter(Boolean).join(', ')
})
const errors = computed(() => props.draft.errors)
// To fix as tags: every offered problem in sight, one click to pick or drop.
// A check on the picked ones, since FilterChip's picked and unpicked states
// differ only by a faint fill, and a plus on the rest: same width either way,
// so a tag doesn't grow and push the row when it's toggled. Lucide classes,
// not imported icons.
const CheckIcon = () => h('span', { class: 'lucide-check', 'aria-hidden': 'true' })
const PlusIcon = () => h('span', { class: 'lucide-plus', 'aria-hidden': 'true' })
const toggleFix = (value) => {
  const list = form.value.problems
  form.value.problems = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

// What a picker's trigger reads: the picks by name, or its "any" answer.
const namesOf = (values, options, none) =>
  values.length ? options.filter((o) => values.includes(o.value)).map((o) => o.label).join(', ') : none

// ⚠️ THE DESCRIPTION GROWS WITH ITS TEXT, measured from its own scrollHeight
// on open and on every edit, so it never scrolls inside the dialog's scroll.
// It also fills the dialog's body, which holds the cards' height while a
// section is open: the room becomes room to type, not an empty band.
const descEl = ref(null)
const fit = () => {
  const ta = descEl.value?.querySelector?.('textarea')
  if (!ta) return
  ta.style.overflow = 'hidden'
  ta.style.resize = 'none'
  ta.style.height = 'auto'
  const viewport = descEl.value.closest('[data-slot=scroll-area-viewport]')
  const room = viewport ? viewport.clientHeight - (ta.getBoundingClientRect().top - viewport.getBoundingClientRect().top) : 0
  ta.style.height = `${Math.max(ta.scrollHeight, Math.floor(room))}px`
}
onMounted(fit)
watch(() => form.value.scope, () => nextTick(fit))
</script>

<template>
  <!-- What they want -->
  <!-- ⚠️ GROUPED BY SPACE, NOT HEADINGS: the work (apps, budget, go-live),
       the partner (tier, location), then what to fix. 16px inside a group,
       28px between groups; the questions name themselves. -->
  <div v-if="section === 'ask'" class="flex flex-col gap-7">
    <!-- ⚠️ THE SAME WORDS AS NEW PROJECT: each label is the question that
         first asked it (NewProjectDialog, CompanyQuestions), so an answer is
         edited under the words it was given under. -->
    <div class="flex flex-col gap-4">
    <AppsSelect v-model="form.projectApps" label="Which apps do you need?" placeholder="Select" required :error="errors.apps" />
    <div class="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
      <FormControl
        v-model="form.budget"
        type="select"
        label="Your budget"
        placeholder="Select a range"
        required
        :options="draft.bands"
        :error="errors.budget"
      />
      <FormControl v-model="form.timeline" type="select" label="When do you need it live?" placeholder="No preference" :options="draft.timelines" />
    </div>
    </div>
    <div class="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
      <MultiSelect v-model="form.tiers" label="Partner tier" :options="draft.tiers" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(form.tiers, draft.tiers, 'Any tier') }}</span>
        </template>
      </MultiSelect>
      <MultiSelect v-if="draft.showCity" v-model="form.cities" label="Partner location" :options="draft.cities" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(form.cities, draft.cities, draft.whereNone) }}</span>
        </template>
      </MultiSelect>
      <MultiSelect v-else v-model="draft.geoPick" label="Partner location" :options="draft.geoOptions" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(draft.geoPick, draft.geoOptions, draft.whereNone) }}</span>
        </template>
      </MultiSelect>
    </div>
    <!-- Tags, not a dropdown: seven options at most, all in sight, and the
         picks are the tags themselves rather than a "7 picked" summary
         repeated as badges below. The full sentence is each tag's tooltip. -->
    <fieldset>
      <legend class="mb-1.5 block text-sm leading-tighter text-ink-gray-6">What are you trying to fix?</legend>
      <div class="flex flex-wrap gap-2">
        <Tooltip v-for="p in draft.problems" :key="p.value" :text="p.full">
          <FilterChip
            :label="p.label"
            :selected="form.problems.includes(p.value)"
            :icon="form.problems.includes(p.value) ? CheckIcon : PlusIcon"
            @toggle="toggleFix(p.value)"
          />
        </Tooltip>
      </div>
    </fieldset>
  </div>

  <!-- ⚠️ TWO GROUPS, TWO SCOPES. The company's industries and size belong to
       the account and save to Settings; how this project runs today is the
       project's own. One note under both would leave which fields it covers
       unclear, so each group is headed and the note sits under the company. -->
  <!-- Spacing: heading 8px above what it heads, fields 16px apart, the note
       6px under the fields it's about, the two sections 32px apart. -->
  <div v-else-if="section === 'company'" class="flex flex-col gap-8">
    <section>
      <h4 class="text-base font-medium text-ink-gray-8">Your company</h4>
      <div class="mt-2 flex flex-col gap-4">
      <p v-if="fixedLine" class="flex items-start gap-2 text-p-base text-ink-gray-6">
        <span class="lucide-building-2 mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />{{ fixedLine }}
      </p>
      <div>
      <div class="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
        <MultiSelect
          v-model="company.segments"
          label="Your industries"
          placeholder="Select"
          required
          :options="draft.segmentOptions"
          :error="draft.errors.segments"
        >
          <!-- The picks by name, as the company card reads them, not "3 selected". -->
          <template #summary>
            <span v-if="company.segments.length" class="text-ink-gray-8">{{ industryText(company.segments).text }}</span>
            <span v-else class="text-ink-gray-4">Select</span>
          </template>
          <!-- As in Settings: no Select All (40-odd industries, a limit of
               3), and the count says how many are left. -->
          <template #footer="{ clear }">
            <div v-if="company.segments.length" class="flex items-center justify-between border-t border-outline-gray-1 px-2 py-1.5">
              <Button variant="ghost" size="sm" label="Clear All" @click="clear" />
              <span class="px-2 text-sm tabular-nums text-ink-gray-5">{{ company.segments.length }} of {{ MAX_INDUSTRIES }}</span>
            </div>
          </template>
        </MultiSelect>
        <FormControl
          v-model="company.employees"
          type="select"
          label="Number of employees"
          placeholder="Select"
          required
          :options="draft.sizes"
          :error="draft.errors.employees"
        />
      </div>
      <p class="mt-1.5 text-p-sm text-ink-gray-5">Also saved to Settings</p>
      </div>
      </div>
    </section>
    <section>
      <h4 class="text-base font-medium text-ink-gray-8">This project</h4>
      <div class="mt-2 flex flex-col gap-4">
      <!-- `fc-select-wrap`: the answers are sentences, and a long one was cut
           short in the trigger. -->
      <FormControl v-model="form.operations" class="fc-select-wrap" type="select" label="How would you describe your operations today?" placeholder="Select one" :options="OPERATIONS" />
      <MultiSelect v-if="draft.showTools" v-model="form.apps" class="fc-select-wrap" label="Which tools do you use today?" :options="draft.tools" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(form.apps, draft.tools, 'None') }}</span>
        </template>
      </MultiSelect>
      </div>
    </section>
  </div>

  <!-- The description -->
  <div v-else-if="section === 'scope'" ref="descEl">
    <Textarea v-model="form.scope" aria-label="What you want built" :rows="4" :maxlength="800" :error="errors.scope" />
  </div>
</template>
