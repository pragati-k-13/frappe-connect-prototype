<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Badge, FormControl, MultiSelect, Textarea } from 'frappe-ui'
import AppsSelect from './AppsSelect.vue'
import { OPERATIONS } from '../data/company'
import { fixShort } from '../data/format'

// One card's fields in the requirements dialog, opened by its pencil. Every
// card edits the same draft (`useRequirementsDraft`), and nothing goes to
// partners until the dialog's one Send.
//
//   ask     apps, budget and go-live, the partner wanted, what to fix
//   today   how this project runs today and the tools it uses
//   scope   the description
//
// ⚠️ THE PENCIL STAYS IN ITS CORNER. Where a card opens on a field, that
// field's label is drawn here, with the pencil (`#pencil`) at its right end,
// so the pencil sits on the label line and takes no column of its own.
const props = defineProps({
  draft: { type: Object, required: true },
  section: { type: String, required: true },
})

const form = computed(() => props.draft.form)
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
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <span class="text-xs text-ink-gray-5">Apps <span class="text-ink-red-4">*</span></span>
        <slot name="pencil" />
      </div>
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

  <!-- How this project runs today. `fc-select-wrap`: the answers are
       sentences, and at a third of the dialog they were cut short. -->
  <div v-else-if="section === 'today'" class="flex flex-col gap-3">
    <FormControl v-model="form.operations" class="fc-select-wrap" type="select" label="Today" placeholder="Select one" :options="OPERATIONS" />
    <MultiSelect v-if="draft.showTools" v-model="form.apps" class="fc-select-wrap" label="Tools you use" :options="draft.tools" hide-search>
      <template #footer />
      <template #summary>
        <span class="text-ink-gray-8">{{ namesOf(form.apps, draft.tools, 'None') }}</span>
      </template>
    </MultiSelect>
  </div>

  <!-- The description -->
  <div v-else-if="section === 'scope'" ref="descEl">
    <div class="mb-1.5 flex items-center justify-between gap-2">
      <span class="text-xs text-ink-gray-5">What you want built <span class="text-ink-red-4">*</span></span>
      <slot name="pencil" />
    </div>
    <Textarea v-model="form.scope" aria-label="What you want built" :rows="4" :maxlength="800" :error="errors.scope" />
  </div>
</template>
