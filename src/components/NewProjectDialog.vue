<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, FormControl, Progress, TextInput } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { companyPayload, emptyCompanyForm, stepErrors } from '../data/company'
import { TIMELINES } from '../data/custom'
import { useConnectStore } from '../stores/connect'

// Starting a project: its name, when it needs to be live, and the two landing
// questions that belong to the project rather than the company.
//
// ⚠️ THE COMPANY IS NOT ASKED AGAIN. Where it is based, how big and what
// industry live in Settings, and a project reads them from there. They are
// asked here only when the account has never answered them — then once, and
// saved to Settings rather than to this project.
//
// ⚠️ HOW YOU RUN TODAY IS ASKED PER PROJECT, pre-filled from the last answer.
// It changes as projects land: a second project starts from whatever the first
// one left behind.
//
// ⚠️ THE SAME QUESTIONS AS THE HERO, THROUGH THE SAME COMPONENT. The project
// page recommends Starter Packs or custom work from these answers, with the
// engine the landing uses, so they have to be the same questions — and
// `CompanyQuestions` is what every other surface asking them renders.
//
// ⚠️ A DIALOG, NOT A PAGE. This is adding a project from the list of
// projects, and should come back to that list if abandoned.
//
// ⚠️ NO BUDGET OR DESCRIPTION HERE. They are only needed if the answer is
// custom work, and the draft asks for them there — on the recommendation's
// custom half, beside the partners they will be sent to. Asking them before
// the recommendation would make a Starter Pack buyer write a brief nobody reads.
// The timeline is the exception: it is one optional select, and a partner
// needs it whichever way the project goes.
//
// ⚠️ NO MODULES. The answers decide which packs fit — industry and problems are
// what the recommendation reads — and the description tells a partner what to
// build. A module checklist was a second, weaker answer to the same question.
const props = defineProps({
  open: { type: Boolean, default: false },
  // A draft to edit. The same questions, pre-filled with its own answers.
  draft: { type: Object, default: null },
})
const emit = defineEmits(['close', 'create'])

const store = useConnectStore()

const answers = reactive(emptyCompanyForm())
const name = ref('')
const timeline = ref('')
const step = ref(0)
// Errors show only once the step has been tried — a step that opens red is
// telling somebody off for not having started.
const tried = ref(false)

// Each step is `CompanyQuestions`' own step number, or 'project' for the name
// and timeline. The company step leads only when Settings has nothing yet.
const askCompany = ref(false)
const steps = computed(() => [...(askCompany.value ? [1] : []), 'project', 2, 3])
const current = computed(() => steps.value[step.value])
const last = computed(() => step.value === steps.value.length - 1)

// Reset on open, not on close: a dialog that empties while it fades out shows
// the reader their answers being wiped.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    const d = props.draft
    askCompany.value = !store.company.country
    Object.assign(
      answers,
      emptyCompanyForm(),
      JSON.parse(JSON.stringify(d?.answers ?? lastAnswers())),
      companyFacts(),
    )
    // What to fix is the reason for a new project, so it starts empty.
    if (!d) answers.problems = []
    name.value = d?.name ?? ''
    timeline.value = d?.brief?.timeline ?? ''
    step.value = 0
    tried.value = false
  },
)

// How the business runs today, as the newest project last described it — or
// the account's own answers when there is no project yet.
const lastAnswers = () =>
  [...store.projects].sort((a, b) => b.at - a.at).find((p) => p.answers)?.answers ??
  store.company

// Settings' answers, read fresh each time, so saving a draft picks up a change
// made there since.
const companyFacts = () => ({
  country: store.company.country,
  employees: store.company.employees,
  segments: [...(store.company.segments ?? [])],
})

const errorsFor = (s) =>
  s === 'project' ? (name.value.trim() ? {} : { name: 'Name the project' }) : stepErrors(answers, s)
const shown = computed(() => (tried.value ? errorsFor(current.value) : {}))

const next = () => {
  tried.value = true
  if (Object.keys(errorsFor(current.value)).length) return
  tried.value = false
  step.value += 1
}

const back = () => {
  tried.value = false
  step.value -= 1
}

const create = () => {
  tried.value = true
  if (Object.keys(errorsFor(current.value)).length) return
  const payload = companyPayload(answers)
  if (askCompany.value) {
    const { country, employees, segments } = payload
    store.saveCompany({ ...store.company, country, employees, segments })
  }
  emit('create', {
    name: name.value,
    apps: ['erpnext'],
    modules: {},
    brief: { timeline: timeline.value },
    answers: payload,
  })
}
</script>

<template>
  <!-- `md`, like the other dialogs that ask these questions: a column of
       single-line fields and short options. -->
  <Dialog
    :model-value="open"
    :title="draft ? 'Edit draft' : 'New project'"
    size="md"
    @update:model-value="!$event && emit('close')"
  >
    <template #default>
      <!-- Same stepper as the contact wizard and company sign-up, rounded the
           same way — `Progress` has no prop for segment shape. -->
      <Progress
        class="mb-6 [&_[role=progressbar]>div]:rounded-full"
        size="md"
        intervals
        :interval-count="steps.length"
        :value="((step + 1) / steps.length) * 100"
      />

      <!-- The submit handler follows the step: Return moves a step on, and
           only saves on the last one. -->
      <form novalidate @submit.prevent="last ? create() : next()">
        <div v-if="current === 'project'" class="space-y-4">
          <TextInput
            v-model="name"
            label="Project name"
            size="md"
            placeholder="ERP rollout"
            required
            :error="shown.name"
          />
          <FormControl
            v-model="timeline"
            type="select"
            label="When do you need it live?"
            placeholder="Select"
            :options="TIMELINES"
          />
        </div>
        <CompanyQuestions v-else :step="current" :form="answers" :errors="shown" />

        <div v-if="step === 0" class="mt-8">
          <Button class="w-full" variant="solid" size="sm" label="Continue" type="submit" />
        </div>
        <div v-else class="mt-8 flex items-center justify-end gap-2">
          <Button variant="subtle" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <Button
            variant="solid"
            size="sm"
            :label="last ? 'Save draft' : 'Continue'"
            type="submit"
          />
        </div>
      </form>
    </template>
  </Dialog>
</template>
