<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, Progress, TextInput } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { COMPANY_STEPS, companyPayload, emptyCompanyForm, stepErrors } from '../data/company'
import { useConnectStore } from '../stores/connect'

// Starting a project: its name, and the landing's three questions.
//
// ⚠️ THE SAME QUESTIONS AS THE HERO, THROUGH THE SAME COMPONENT. The project
// page recommends Starter Packs or custom work from these answers, with the
// engine the landing uses, so they have to be the same questions — and
// `CompanyQuestions` is what every other surface asking them renders. The
// answers are pre-filled from the account's own, because most of them (where,
// how big, what industry) are about the company rather than the project; what
// is under way and what needs fixing can differ project to project, so they are
// here to change.
//
// ⚠️ A DIALOG, NOT A PAGE. Three other dialogs already walk these questions
// with this stepper (contact a partner, company sign-up, edit answers), and each
// step is one to three fields. A page is what the landing is: the first visit,
// with nothing behind it. This is adding a project from the list of projects,
// and should come back to that list if abandoned.
//
// ⚠️ NO BUDGET OR DESCRIPTION HERE. They are only needed if the answer is
// custom work, and the draft asks for them there — on the recommendation's
// custom half, beside the partners they will be sent to. Asking them before
// the recommendation would make a Starter Pack buyer write a brief nobody reads.
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

// ⚠️ THREE STEPS, the landing's three. The project's name opens the first,
// because it is what the dialog is making; the rest are the questions.
const STEPS = COMPANY_STEPS

const answers = reactive(emptyCompanyForm())
const name = ref('')
const step = ref(1)
// Errors show only once the step has been tried — a step that opens red is
// telling somebody off for not having started.
const tried = ref(false)

// Reset on open, not on close: a dialog that empties while it fades out shows
// the reader their answers being wiped.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    const d = props.draft
    Object.assign(
      answers,
      emptyCompanyForm(),
      JSON.parse(JSON.stringify(d?.answers ?? store.company)),
    )
    name.value = d?.name ?? ''
    step.value = 1
    tried.value = false
  },
)

const nameError = computed(() => (name.value.trim() ? {} : { name: 'Name the project' }))

const errorsFor = (n) => ({ ...(n === 1 ? nameError.value : {}), ...stepErrors(answers, n) })
const shown = computed(() => (tried.value ? errorsFor(step.value) : {}))

const next = () => {
  tried.value = true
  if (Object.keys(errorsFor(step.value)).length) return
  tried.value = false
  step.value += 1
}

const back = () => {
  tried.value = false
  step.value -= 1
}

const create = () => {
  tried.value = true
  if (Object.keys(errorsFor(STEPS)).length) return
  emit('create', {
    name: name.value,
    apps: ['erpnext'],
    modules: {},
    answers: companyPayload(answers),
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
        :interval-count="STEPS"
        :value="(step / STEPS) * 100"
      />

      <!-- The submit handler follows the step: Return moves a step on, and
           only saves on the last one. -->
      <form novalidate @submit.prevent="step === STEPS ? create() : next()">
        <!-- Same 16px rhythm as the questions under it. -->
        <TextInput
          v-if="step === 1"
          v-model="name"
          class="mb-4"
          label="Project name"
          size="md"
          placeholder="ERP rollout"
          required
          :error="shown.name"
        />
        <CompanyQuestions :step="step" :form="answers" :errors="shown" />

        <div v-if="step === 1" class="mt-8">
          <Button class="w-full" variant="solid" size="sm" label="Continue" type="submit" />
        </div>
        <div v-else class="mt-8 flex items-center justify-end gap-2">
          <Button variant="subtle" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <Button
            variant="solid"
            size="sm"
            :label="step === STEPS ? 'Save draft' : 'Continue'"
            type="submit"
          />
        </div>
      </form>
    </template>
  </Dialog>
</template>
