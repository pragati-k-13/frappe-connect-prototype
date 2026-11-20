<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Badge, Button, FormControl, MultiSelect, Textarea } from 'frappe-ui'
import AppsSelect from './AppsSelect.vue'
import { OPERATIONS } from '../data/company'
import { MAX_INDUSTRIES, fixShort, industryText } from '../data/format'
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
const fixedLine = computed(() => [store.company?.name || store.viewer?.company, store.company?.country].filter(Boolean).join(', '))
const errors = computed(() => props.draft.errors)
const fixes = computed(() => fixShort(form.value.problems))

// What a picker's trigger reads: the picks by name, or its "any" answer.
const namesOf = (values, options, none) =>
  values.length ? options.filter((o) => values.includes(o.value)).map((o) => o.label).join(', ') : none
const fixedSummary = computed(() =>
  form.value.problems.length > 1
    ? `${form.value.problems.length} picked`
    : namesOf(form.value.problems, props.draft.problems, 'Nothing picked'),
)

// ⚠️ THE DESCRIPTION GROWS WITH ITS TEXT, measured from its own scrollHeight
// on open and on every edit, so it never scrolls inside the dialog's scroll.
const descEl = ref(null)
const fit = () => {
  const ta = descEl.value?.querySelector?.('textarea')
  if (!ta) return
  ta.style.overflow = 'hidden'
  ta.style.resize = 'none'
  ta.style.height = 'auto'
  ta.style.height = `${ta.scrollHeight}px`
}
onMounted(fit)
watch(() => form.value.scope, () => nextTick(fit))
</script>

<template>
  <!-- What they want -->
  <div v-if="section === 'ask'" class="flex flex-col gap-3">
    <div>
      <p class="mb-1.5 text-xs text-ink-gray-5">Apps <span class="text-ink-red-4">*</span></p>
      <AppsSelect v-model="form.projectApps" aria-label="Apps" placeholder="Select" :error="errors.apps" />
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormControl
        v-model="form.budget"
        type="select"
        label="Budget"
        placeholder="Select a range"
        required
        :options="draft.bands"
        :error="errors.budget"
      />
      <FormControl v-model="form.timeline" type="select" label="Live" placeholder="No preference" :options="draft.timelines" />
    </div>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
    <div>
      <MultiSelect v-model="form.problems" label="To fix" :options="draft.problems" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ fixedSummary }}</span>
        </template>
      </MultiSelect>
      <!-- The picks stay in sight: "7 picked" alone says how many, not which. -->
      <div v-if="fixes.length" class="mt-2 flex flex-wrap gap-1">
        <Badge v-for="f in fixes" :key="f" :label="f" theme="gray" variant="subtle" size="lg" class="dark:bg-surface-gray-3" />
      </div>
    </div>
  </div>

  <!-- ⚠️ TWO GROUPS, TWO SCOPES. The company's industries and size belong to
       the account and save to Settings; how this project runs today is the
       project's own. One note under both would leave which fields it covers
       unclear, so each group is headed and the note sits under the company. -->
  <div v-else-if="section === 'company'" class="flex flex-col gap-6">
    <section class="flex flex-col gap-3">
      <h4 class="text-base font-medium text-ink-gray-8">Your company</h4>
      <p v-if="fixedLine" class="flex items-start gap-2 text-p-base text-ink-gray-6">
        <span class="lucide-building-2 mt-0.5 size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />{{ fixedLine }}
      </p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MultiSelect
          v-model="company.segments"
          label="Industries"
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
          label="Employees"
          placeholder="Select"
          required
          :options="draft.sizes"
          :error="draft.errors.employees"
        />
      </div>
      <p class="text-p-sm text-ink-gray-5">Also saved to Settings</p>
    </section>
    <section class="flex flex-col gap-3">
      <h4 class="text-base font-medium text-ink-gray-8">This project</h4>
      <!-- `fc-select-wrap`: the answers are sentences, and a long one was cut
           short in the trigger. -->
      <FormControl v-model="form.operations" class="fc-select-wrap" type="select" label="Today" placeholder="Select one" :options="OPERATIONS" />
      <MultiSelect v-if="draft.showTools" v-model="form.apps" class="fc-select-wrap" label="Tools you use" :options="draft.tools" hide-search>
        <template #footer />
        <template #summary>
          <span class="text-ink-gray-8">{{ namesOf(form.apps, draft.tools, 'None') }}</span>
        </template>
      </MultiSelect>
    </section>
  </div>

  <!-- The description -->
  <div v-else-if="section === 'scope'" ref="descEl">
    <Textarea v-model="form.scope" aria-label="What you want built" :rows="4" :maxlength="800" :error="errors.scope" />
  </div>
</template>
