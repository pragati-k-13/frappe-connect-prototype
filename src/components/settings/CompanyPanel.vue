<script setup>
import { computed, reactive } from 'vue'
import {
  Button,
  Combobox,
  FormControl,
  MultiSelect,
  SettingsBody,
  SettingsHeader,
  toast,
} from 'frappe-ui'
import {
  COMPANY_SIZES,
  COUNTRY_OPTIONS_INDIA_ONLY,
  SEGMENT_OPTIONS,
  segmentOptionsFor,
  SELECTABLE_COUNTRY,
} from '../../data/company'
import { useConnectStore } from '../../stores/connect'
import { MAX_INDUSTRIES } from '../../data/format'

// ⚠️ THE COMPANY, ASKED ONCE. Where it is based, how big and what industry
// used to open every New project dialog, pre-filled and asked again. They are
// facts about the business, so they live here and a new project reads them.
// How the business runs today is NOT here: it changes as projects land, so
// each project asks it — see `NewProjectDialog`.
const store = useConnectStore()

const saved = () => ({
  name: store.company.name || store.viewer.company,
  // India only for now — see `COUNTRY_OPTIONS_INDIA_ONLY`.
  country: SELECTABLE_COUNTRY,
  employees: store.company.employees,
  segments: [...(store.company.segments ?? [])],
})
const form = reactive(saved())
const dirty = computed(() => JSON.stringify(form) !== JSON.stringify(saved()))
const valid = computed(
  () => form.name.trim() && form.country && form.employees && form.segments.length && form.segments.length <= MAX_INDUSTRIES,
)

const save = () => {
  const { name, country, employees, segments } = form
  store.saveCompany({ ...store.company, country, employees, segments }, { narrow: false })
  store.saveAccount({ name: store.viewer.name, company: name })
  toast.success('Company saved')
}
</script>

<template>
  <!-- Own header row, as in frappe-ui's Users story: the title prop aligns the title to the button's top -->
  <SettingsHeader>
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-ink-gray-8">Company</h2>
      <Button variant="solid" label="Save" :disabled="!dirty || !valid" @click="save" />
    </div>
  </SettingsHeader>
  <SettingsBody>
    <div class="flex flex-col gap-6">
      <FormControl v-model="form.name" label="Company name" required />
      <!-- `Combobox` for the same reason the intake uses one: 43 countries
           under region headings, which `Select` can neither group nor search. -->
      <Combobox
        v-model="form.country"
        label="Country"
        placeholder="Select a country"
        trigger="button"
        required
        :options="COUNTRY_OPTIONS_INDIA_ONLY"
      />
      <FormControl
        v-model="form.employees"
        type="select"
        label="Employees"
        placeholder="Select"
        required
        :options="COMPANY_SIZES"
      />
      <MultiSelect
        v-model="form.segments"
        label="Your industries"
        :error="form.segments.length > MAX_INDUSTRIES ? `Pick up to ${MAX_INDUSTRIES}` : ''"
        placeholder="Select"
        required
        :options="segmentOptionsFor(form.segments)"
      >
        <!-- No Select All: there are 40-odd industries and the limit is 3. The
             count shows how many are left. -->
        <template #footer="{ clear }">
          <div v-if="form.segments.length" class="flex items-center justify-between border-t border-outline-gray-1 px-2 py-1.5">
            <Button variant="ghost" size="sm" label="Clear All" @click="clear" />
            <span class="px-2 text-sm tabular-nums text-ink-gray-5">{{ form.segments.length }} of {{ MAX_INDUSTRIES }}</span>
          </div>
        </template>
      </MultiSelect>
    </div>
  </SettingsBody>
</template>
