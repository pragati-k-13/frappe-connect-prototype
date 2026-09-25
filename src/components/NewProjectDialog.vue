<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, FormControl, Progress, Textarea, TextInput } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { companyPayload, emptyCompanyForm, stepErrors } from '../data/company'
import { TIMELINES, briefErrors, budgetBandsFor, scopeHint } from '../data/custom'
import { projectName } from '../data/project'
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
  // Contact, for an account with no project yet. The same questions, then one
  // more step — what you want built and what you will spend, no note — and the last
  // button sends it to this partner instead of saving a draft.
  //
  // ⚠️ ONE DIALOG, NOT TWO. This used to hand over to `ContactPartnerDialog`
  // after the project was made, which opened a second dialog that read back the
  // name just typed and only then asked the question the partner needs. The
  // brief is a step of the same flow.
  partner: { type: Object, default: null },
})
const emit = defineEmits(['close', 'create'])

const store = useConnectStore()

const answers = reactive(emptyCompanyForm())
const name = ref('')
const timeline = ref('')
const brief = reactive({ budget: '', scope: '' })
const step = ref(0)
// Errors show only once the step has been tried — a step that opens red is
// telling somebody off for not having started.
const tried = ref(false)

// Each step is `CompanyQuestions`' own step number, or 'project' for the name
// and timeline. The company step leads only when Settings has nothing yet.
const askCompany = ref(false)
// ⚠️ CONTACT HAS NO PROJECT STEP, and always opens on the company. Someone
// pressing Contact came to reach a firm, not to name a project, so the name is
// assigned and the timeline is not asked. The company step is shown
// even when Settings has answers, pre-filled: it is what the partner will read
// as "who is asking", so it is confirmed where it is sent.
const steps = computed(() =>
  props.partner
    ? [1, 2, 3, 'brief']
    : [...(askCompany.value ? [1] : []), 'project', 2, 3],
)
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
    Object.assign(brief, { budget: '', scope: '' })
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
  s === 'project'
    ? name.value.trim()
      ? {}
      : { name: 'Name the project' }
    : s === 'brief'
      ? briefErrors(brief)
      : stepErrors(answers, s)
const shown = computed(() => (tried.value ? errorsFor(current.value) : {}))

// The brief step's budget ladder follows the country answered above it, and its
// live hint is the recommendation screen's — the same field, read the same way.
const bands = computed(() => budgetBandsFor(answers.country || store.company.country))
const hint = computed(() => scopeHint(brief.scope))

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
  // Contact always saves the company step (it is always shown there), but
  // without narrowing the partner listing behind the dialog — see
  // `saveCompany`.
  if (askCompany.value || props.partner) {
    const { country, employees, segments } = payload
    store.saveCompany(
      { ...store.company, country, employees, segments },
      { narrow: !props.partner },
    )
  }
  emit('create', {
    name: props.partner ? projectName([], store.company.name || store.viewer.company) : name.value,
    apps: ['erpnext'],
    modules: {},
    brief: props.partner
      ? { timeline: timeline.value, budget: brief.budget, scope: brief.scope.trim() }
      : { timeline: timeline.value },
    answers: payload,
  })
}
</script>

<template>
  <!-- `md`, like the other dialogs that ask these questions: a column of
       single-line fields and short options. -->
  <Dialog
    :model-value="open"
    :title="partner ? `Contact ${partner.name}` : draft ? 'Edit draft' : 'New project'"
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
        <!-- The brief, when this is Contact. The same fields, labels and hint
             as the recommendation's custom half, so a brief written here and
             one written there are the same brief. -->
        <div v-else-if="current === 'brief'" class="space-y-4">
          <FormControl
            v-model="brief.budget"
            type="select"
            label="Your budget"
            placeholder="Select a range"
            required
            :options="bands"
            :error="shown.budget"
          />
          <div>
            <Textarea
              v-model="brief.scope"
              label="What do you want built?"
              placeholder="What do you make or sell, who are your customers, how does it run today, what keeps going wrong, and what must it connect to or prove?"
              :rows="5"
              required
              :error="shown.scope"
            />
            <p
              class="mt-1.5 text-p-sm leading-relaxed"
              :class="{
                'text-ink-gray-5': hint.tone === 'neutral',
                'text-ink-amber-7': hint.tone === 'warn',
                'text-ink-green-7': hint.tone === 'good',
              }"
            >
              {{ hint.text }}
            </p>
          </div>
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
            :label="last ? (partner ? 'Send requirements' : 'Save draft') : 'Continue'"
            type="submit"
          >
            <template v-if="last && partner" #prefix><LucideSend class="size-4" /></template>
          </Button>
        </div>
      </form>
    </template>
  </Dialog>
</template>
