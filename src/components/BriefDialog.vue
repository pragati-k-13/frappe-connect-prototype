<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, FormControl, Textarea, toast } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import {
  companyErrors,
  companyPayload,
  emptyCompanyForm,
  stepErrors,
} from '../data/company'
import { briefErrors, budgetBandsFor, matchingPartners } from '../data/custom'
import { useConnectStore } from '../stores/connect'

// Writing the requirements, from inside the project that wants them.
//
// ⚠️ THE BUTTON USED TO LEAVE. "Describe what you need built" pushed
// `/connect/recommendation`, which recomputes a verdict from the answers on
// file — so somebody on a CUSTOM project pressed a task about their
// requirements and arrived at the starter pack catalogue, because their answers
// happened to point that way. The destination was wrong in the ordinary case
// and absurd in this one: the project already IS custom work; the recommending
// is over.
//
// ⚠️ THREE STEPS, AND `EditAnswersDialog` DELIBERATELY HAS NONE. That dialog is
// a CORRECTION — you know which answer is wrong and a wizard to reach it is a
// wall around one field. This is a first encounter with nine questions, which
// is the case stepping exists for, and it is the same shape as the intake on
// the landing page for the same reason.
//
// ⚠️ IT ASKS THE INTAKE'S QUESTIONS TOO, not only the brief. Partners match on
// region, industry and headcount — `matchingPartners` reads `company`, not
// `brief` — so a project whose owner never went through the landing intake has
// nothing to broadcast against. Collecting the scope alone would produce a
// brief that goes to everybody or to nobody.
//
// ⚠️ THE SAME FIELDS COMPONENT THE INTAKE USES, rendered per step rather than
// copied. Two surfaces asking the same questions from two blocks of markup is
// how one of them comes to ask for a segment while the other asks for an
// industry.
const props = defineProps({
  open: { type: Boolean, default: false },
  // The project the brief belongs to, so the broadcast lands on it.
  project: { type: Object, default: null },
})

const emit = defineEmits(['update:open'])

const store = useConnectStore()

// ⚠️ A LOCAL DRAFT, not the store. Cancel has to leave the answers alone, and a
// dialog bound straight to `store.company` would have edited them on the way
// past. Saved in one gesture at the end — see `send`.
const form = reactive(emptyCompanyForm())
const brief = reactive({ scope: '', budget: '' })

const step = ref(1)
const tried = ref(false)

// ⚠️ RE-SEEDED ON EVERY OPEN, and reset to step 1. A draft that survived a
// cancel would hand the next open whatever was abandoned last time.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, emptyCompanyForm(), {
      country: store.company.country,
      employees: store.company.employees,
      segments: [...(store.company.segments ?? [])],
      apps: [...(store.company.apps ?? [])],
      appsOther: store.company.appsOther ?? '',
      operations: store.company.operations ?? '',
      problems: [...(store.company.problems ?? [])],
    })
    Object.assign(brief, { scope: store.brief.scope ?? '', budget: store.brief.budget ?? '' })
    step.value = 1
    tried.value = false
  },
  { immediate: true },
)

const bands = computed(() => budgetBandsFor(form.country))

// ⚠️ STEP 2 HOLDS TWO OF THE INTAKE'S THREE. The landing page splits them
// because it is a cold first screen and one question at a time is what gets
// started; here the reader has a project open and is already committed, so the
// two shortest steps travel together and the brief gets a step of its own.
const STEPS = [
  { n: 1, title: 'Your business', company: [1] },
  { n: 2, title: 'How you work now', company: [2, 3] },
  { n: 3, title: 'What you need built', company: [] },
]

const current = computed(() => STEPS.find((s) => s.n === step.value) ?? STEPS[0])

// Errors for the step on screen, and only that step. A dialog that reports a
// problem on a step you have not reached yet is reporting on a question it has
// not asked.
const problems = computed(() => {
  if (!tried.value) return {}
  if (step.value === 3) return briefErrors(brief)
  return current.value.company.reduce((all, s) => ({ ...all, ...stepErrors(form, s) }), {})
})

const matches = computed(() => matchingPartners(companyPayload(form), brief))

const next = () => {
  tried.value = true
  if (Object.keys(problems.value).length) return
  tried.value = false
  step.value += 1
}

const back = () => {
  tried.value = false
  step.value -= 1
}

// ⚠️ EVERYTHING IS SAVED IN ONE GESTURE, at the end, and the company answers go
// first because `broadcastBrief` reads them off the store to decide who
// matches. Saving them per step would have left a cancelled dialog having
// rewritten the project's answers on its way out.
const send = () => {
  tried.value = true
  if (Object.keys(companyErrors(form)).length || Object.keys(briefErrors(brief)).length) return
  store.saveCompany(companyPayload(form))
  store.saveBrief({ scope: brief.scope, budget: brief.budget })
  const result = store.broadcastBrief(props.project?.id)
  emit('update:open', false)
  toast.success(`Sent to ${result?.sent ?? 0} partners`, {
    description: 'Their replies come back as quotes you can shortlist or pass on.',
  })
}
</script>

<template>
  <Dialog
    :model-value="open"
    :title="current.title"
    size="lg"
    @update:model-value="emit('update:open', $event)"
  >
    <!-- Default slot, not `#body-content` — the older name fails silently; see
         the note in `NewProjectDialog`. -->
    <template #default>
      <!-- ⚠️ THE COUNT SITS ON ITS OWN LINE UNDER THE TITLE, not beside it in
           the heading. "Your business (1 of 3)" makes the step's name a label
           for a number; the two are different facts and the number is the
           quieter one. -->
      <p class="text-p-sm tabular-nums text-ink-gray-5">Step {{ step }} of {{ STEPS.length }}</p>

      <div class="mt-4 space-y-6">
        <CompanyQuestions
          v-for="s in current.company"
          :key="s"
          :step="s"
          :form="form"
          :errors="problems"
        />

        <template v-if="step === 3">
          <Textarea
            v-model="brief.scope"
            label="What do you need built?"
            placeholder="Processes, integrations, and anything you have already tried."
            :rows="5"
            required
            :error="problems.scope"
          />
          <!-- ⚠️ A BAND, NOT A FIGURE. See the note in `data/custom.js` — a free
               number invites a placeholder, and partners price against
               placeholders. -->
          <FormControl
            v-model="brief.budget"
            type="select"
            label="What can you spend?"
            placeholder="Select a range"
            required
            :options="bands"
            :error="problems.budget"
          />
          <!-- ⚠️ WHO THIS REACHES, stated before the button rather than after
               it. The count comes from the same function the send uses, because
               a broadcast that reaches one more firm than the number shown is
               the worst bug this flow could have. -->
          <p class="text-p-base leading-relaxed text-ink-gray-6">
            This goes to {{ matches.length }} certified
            {{ matches.length === 1 ? 'partner' : 'partners' }}. They see the requirements and the
            budget, not your company name — that is shared when you shortlist a reply.
          </p>
        </template>
      </div>

      <div class="mt-6 flex items-center gap-2">
        <Button v-if="step > 1" variant="subtle" label="Back" @click="back" />
        <Button v-if="step < STEPS.length" variant="solid" label="Continue" @click="next" />
        <Button
          v-else
          variant="solid"
          :label="`Send requirements to ${matches.length} ${matches.length === 1 ? 'partner' : 'partners'}`"
          @click="send"
        />
        <Button variant="ghost" label="Cancel" @click="emit('update:open', false)" />
      </div>
    </template>
  </Dialog>
</template>
