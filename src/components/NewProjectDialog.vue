<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, FormControl, Progress, ScrollArea, Textarea } from 'frappe-ui'
import AppsSelect from './AppsSelect.vue'
import { vAutogrow } from '../lib/autogrow'
import CompanyQuestions from './CompanyQuestions.vue'
import { companyPayload, emptyCompanyForm, stepErrors, syncCountries } from '../data/company'
import { TIMELINES, demoScopeFor, isDemoScope, briefErrors, budgetBandsFor, scopeHint } from '../data/custom'
import { PROJECT_APPS } from '../data/partners'
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
// The budget and description come last: the budget narrows who matches, so
// the draft's partner list is the real one before anything is sent.
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
// Which apps the work is in. Required: it goes to partners with the
// requirements, and later under the business's review. Corrected afterwards
// in Edit requirements, or by the partner once hired.
const apps = ref([])
const step = ref(0)
// Errors show only once the step has been tried — a step that opens red is
// telling somebody off for not having started.
const tried = ref(false)

// Each step is `CompanyQuestions`' own step number, 'project' for the apps
// with how you run today, or the last step: 'budget' for a draft, 'brief' for
// Contact.
//
// ⚠️ ONE ORDER FOR BOTH. Who you are (only if Settings is missing it), what
// you need and what you run today, what to fix, then the budget, timeline and
// description. Apps come first so the fix options can follow them.
//
// ⚠️ THE COMPANY STEP STANDS IN FOR ONBOARDING: asked in either dialog only
// while Settings lacks an answer, then saved there. Sign-up asks the country,
// so the size and industry are checked too, not just the country.
const askCompany = ref(false)
const companyIncomplete = () =>
  !store.company.country || !store.company.employees || !store.company.segments?.length
const steps = computed(() => [
  ...(askCompany.value ? [1] : []),
  'project',
  3,
  props.partner ? 'brief' : 'budget',
])
const current = computed(() => steps.value[step.value])

// The description is filled in for the demo on reaching the last step, to
// match the apps picked. A description the person wrote is left alone.
watch(current, (c) => {
  if ((c === 'budget' || c === 'brief') && (!brief.scope.trim() || isDemoScope(brief.scope))) {
    brief.scope = demoScopeFor(apps.value)
  }
})
const last = computed(() => step.value === steps.value.length - 1)

// Reset on open, not on close: a dialog that empties while it fades out shows
// the reader their answers being wiped.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    const d = props.draft
    askCompany.value = companyIncomplete()
    Object.assign(
      answers,
      emptyCompanyForm(),
      JSON.parse(JSON.stringify(d?.answers ?? lastAnswers())),
      // A draft keeps its own answers; only a new project starts from the
      // account's facts.
      d ? {} : companyFacts(),
    )
    syncCountries(answers)
    // What to fix is the reason for a new project, so it starts empty. So
    // does how you run today: a pre-picked answer reads as already answered,
    // and Continue passed without anyone choosing.
    if (!d) {
      answers.problems = []
      answers.operations = ''
      answers.apps = []
      answers.appsOther = ''
    }
    name.value = d?.name ?? ''
    timeline.value = d?.brief?.timeline ?? ''
    // A draft keeps its apps; Contact from the estimate starts with the apps of
    // the modules ticked there.
    apps.value = d?.apps?.length
      ? [...d.apps]
      : [...new Set((store.inquiryPrefill?.modules ?? []).map((m) => m.split(':')[0]))]
    Object.assign(brief, { budget: d?.brief?.budget ?? '', scope: d?.brief?.scope ?? '' })
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
//
// The country comes from sign-up, which asks it. An account with none yet
// keeps the form's default rather than being blanked by an empty answer.
const companyFacts = () => ({
  ...(store.company.country && {
    country: store.company.country,
    countries: store.company.countries?.length ? [...store.company.countries] : [store.company.country],
  }),
  employees: store.company.employees,
  segments: [...(store.company.segments ?? [])],
})

const appsError = () => (apps.value.length ? {} : { apps: 'Pick at least one app' })
const errorsFor = (s) =>
  s === 'project'
    ? { ...appsError(), ...stepErrors(answers, 2) }
    : s === 'budget'
      ? brief.budget ? {} : { budget: 'Pick a range' }
    : s === 'brief'
      ? { ...briefErrors(brief), ...appsError() }
      : stepErrors(answers, s)
const shown = computed(() => (tried.value ? errorsFor(current.value) : {}))

// The brief step's budget ladder follows the country answered above it, and its
// live hint is the recommendation screen's — the same field, read the same way.
const bands = computed(() => budgetBandsFor(answers.country || store.company.country))
const hint = computed(() => scopeHint(brief.scope))
// ⚠️ A CEILING ON THE DESCRIPTION: a paragraph is what partners read, and the
// box grows with its text. The demo briefs are about 350 characters.
const SCOPE_MAX = 800
const scopeLeft = computed(() => SCOPE_MAX - brief.scope.length)

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

// ⚠️ NO NAME QUESTION. A new project is named from what it is for — the apps
// and the company — so the first thing asked is what they need, not what to
// call it. A draft being edited keeps the name it already has.
const namedFor = (values, company) => {
  const labels = values.map((v) => PROJECT_APPS.find((a) => a.value === v)?.label ?? v)
  const what =
    labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}` : labels[0] ?? 'New project'
  return company ? `${what} for ${company}` : what
}

const create = () => {
  tried.value = true
  if (Object.keys(errorsFor(current.value)).length) return
  const payload = companyPayload(answers)
  // Contact always saves the company step (it is always shown there), but
  // without narrowing the partner listing behind the dialog — see
  // `saveCompany`.
  if (askCompany.value || props.partner) {
    const { country, countries, employees, segments } = payload
    store.saveCompany(
      { ...store.company, country, countries, employees, segments },
      { narrow: !props.partner },
    )
  }
  emit('create', {
    name: props.partner
      ? projectName([], store.company.name || store.viewer.company)
      : name.value || namedFor(apps.value, store.company.name || store.viewer.company),
    apps: [...apps.value],
    modules: {},
    brief: props.partner
      ? { timeline: timeline.value, budget: brief.budget, scope: brief.scope.trim() }
      : { timeline: timeline.value, budget: brief.budget, scope: brief.scope.trim() },
    answers: payload,
  })
}
</script>

<template>
  <!-- `md`, like the other dialogs that ask these questions: a column of
       single-line fields and short options. -->
  <Dialog
    :model-value="open"
    :title="partner ? `Contact ${partner.name}` : draft ? 'Edit project' : 'New project'"
    size="md"
    @update:model-value="!$event && emit('close')"
  >
    <template #default>
      <!-- Same stepper as the contact wizard and company sign-up, rounded the
           same way — `Progress` has no prop for segment shape. -->
      <Progress
        class="mb-6 [&_[role=progressbar]>div]:rounded-full"
        size="md"
        :intervals="steps.length"
        :value="((step + 1) / steps.length) * 100"
      />

      <!-- The submit handler follows the step: Return moves a step on, and
           only saves on the last one. -->
      <!-- ⚠️ ONE HEIGHT FOR EVERY STEP (`h-80`, the tallest step's), so the
           title, progress bar and buttons stay put as the steps change; a
           shorter step leaves room above the buttons. A short window shrinks
           it (`min-height: 0`). -->
      <!-- On a short window the fields scroll in frappe-ui's ScrollArea (the
           `fc-scroll-dialog` pattern in index.css), with the title, progress
           and buttons kept in view. -->
      <form class="fc-scroll-dialog" novalidate @submit.prevent="last ? create() : next()">
        <!-- Out to both edges, so the option rows' hover fills (pulled 12px left)
             and focus rings are not clipped. -->
        <!-- `pb-1` holds the 4px the tools reveal's focus-ring room (`-m-1 p-1`)
             hangs below it, which otherwise scrolled at every height. The
             buttons' gap gives those 4px back. -->
        <ScrollArea class="-mx-4 h-80 min-h-0 sm:-mx-6" viewport-class="px-4 pb-1 sm:px-6">
        <div v-if="current === 'project'" class="space-y-5">
          <AppsSelect
            v-model="apps"
            label="Which apps do you need?"
            placeholder="Select"
            required
            :error="shown.apps"
          />
          <!-- What you need, then what you run today: the two sit together. -->
          <CompanyQuestions :step="2" :form="answers" :errors="shown" />
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
          <FormControl
            v-model="timeline"
            type="select"
            label="When do you need it live?"
            placeholder="Select"
            :options="TIMELINES"
          />
          <div>
            <Textarea
              v-autogrow
              v-model="brief.scope"
              label="What do you want built?"
              placeholder="What do you make or sell, what should it do, and what must it connect to?"
              :rows="5"
              :maxlength="SCOPE_MAX"
              required
              :error="shown.scope"
            />
            <div class="mt-1.5 flex items-start justify-between gap-3 text-p-sm leading-relaxed">
              <p
                :class="{
                  'text-ink-gray-5': hint.tone === 'neutral',
                  'text-ink-amber-7': hint.tone === 'warn',
                  'text-ink-green-7': hint.tone === 'good',
                }"
              >
                {{ hint.text }}
              </p>
              <!-- Only near the limit, so most people never see it. -->
              <p v-if="scopeLeft <= 100" class="shrink-0 tabular-nums text-ink-gray-5">
                {{ scopeLeft }} left
              </p>
            </div>
          </div>
        </div>
        <!-- The budget (required: it decides who matches) and the description
             (optional here; Share asks for it if it's still empty). -->
        <div v-else-if="current === 'budget'" class="space-y-4">
          <FormControl
            v-model="brief.budget"
            type="select"
            label="Your budget"
            placeholder="Select a range"
            required
            :options="bands"
            :error="shown.budget"
          />
          <FormControl
            v-model="timeline"
            type="select"
            label="When do you need it live?"
            placeholder="Select"
            :options="TIMELINES"
          />
          <div>
            <Textarea
              v-autogrow
              v-model="brief.scope"
              label="What do you want built?"
              placeholder="What do you make or sell, what should it do, and what must it connect to?"
              :rows="5"
              :maxlength="SCOPE_MAX"
            />
            <!-- Live, as on Contact and the broadcast page — see `scopeHint`. -->
            <div class="mt-1.5 flex items-start justify-between gap-3 text-p-sm leading-relaxed">
              <p
                :class="{
                  'text-ink-gray-5': hint.tone === 'neutral',
                  'text-ink-amber-7': hint.tone === 'warn',
                  'text-ink-green-7': hint.tone === 'good',
                }"
              >
                {{ hint.text }}
              </p>
              <!-- Only near the limit, so most people never see it. -->
              <p v-if="scopeLeft <= 100" class="shrink-0 tabular-nums text-ink-gray-5">
                {{ scopeLeft }} left
              </p>
            </div>
          </div>
        </div>
        <CompanyQuestions v-else :step="current" :form="answers" :errors="shown" :project-apps="apps" />
        </ScrollArea>

        <div v-if="step === 0" class="mt-7 shrink-0">
          <Button class="w-full" variant="solid" size="sm" label="Continue" type="submit" />
        </div>
        <div v-else class="mt-7 flex shrink-0 items-center justify-end gap-2">
          <Button variant="subtle" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <Button
            variant="solid"
            size="sm"
            :label="last ? (partner ? 'Send requirements' : draft ? 'Save' : 'Create project') : 'Continue'"
            type="submit"
          >
            <template v-if="last && partner" #prefix><LucideSend class="size-4" /></template>
          </Button>
        </div>
      </form>
    </template>
  </Dialog>
</template>
