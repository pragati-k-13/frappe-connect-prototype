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
import { COMPANY_SIZES, COUNTRY_OPTIONS, SEGMENT_OPTIONS } from '../../data/company'
import { useConnectStore } from '../../stores/connect'

// ⚠️ THE COMPANY, ASKED ONCE. Where it is based, how big and what industry
// used to open every New project dialog, pre-filled and asked again. They are
// facts about the business, so they live here and a new project reads them.
// How the business runs today is NOT here: it changes as projects land, so
// each project asks it — see `NewProjectDialog`.
const store = useConnectStore()

const saved = () => ({
  name: store.company.name || store.viewer.company,
  country: store.company.country,
  employees: store.company.employees,
  segments: [...(store.company.segments ?? [])],
})
const form = reactive(saved())
const dirty = computed(() => JSON.stringify(form) !== JSON.stringify(saved()))
const valid = computed(
  () => form.name.trim() && form.country && form.employees && form.segments.length,
)

const save = () => {
  const { name, country, employees, segments } = form
  store.saveCompany({ ...store.company, country, employees, segments })
  store.saveAccount({ name: store.viewer.name, company: name })
  toast.success('Company saved')
}
</script>

<template>
  <SettingsHeader title="Company">
    <template #actions>
      <Button variant="solid" label="Save" :disabled="!dirty || !valid" @click="save" />
    </template>
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
        :options="COUNTRY_OPTIONS"
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
        label="Industry"
        placeholder="Select"
        required
        :options="SEGMENT_OPTIONS"
      />
    </div>
  </SettingsBody>
</template>
