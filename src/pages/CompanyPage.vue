<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Progress, toast } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import CompanyQuestions from '../components/CompanyQuestions.vue'
import ConnectMark from '../components/ConnectMark.vue'
import { COMPANY_STEPS, companyErrors, companyPayload, emptyCompanyForm } from '../data/company'
import { nextFrom, useAuthExit } from '../utils/auth'
import { useConnectStore } from '../stores/connect'

// SCREEN — tell us about your company. The last step of signing up, and the
// one the whole model rests on: Frappe assigns the partner here, so this is
// where it learns enough to assign a good one.
//
// ⚠️ This is the END of the flow, not the middle. `completeLogin` fires here
// rather than on the verify screen, so "signed in" means "finished onboarding"
// everywhere in the app. Verify hands off; this screen lands the account, runs
// whatever the gate was holding, and returns the visitor to `next`.
//
// ⚠️ Sign-up only. A returning customer answered these once, so `login-verify`
// goes straight to `next` and never comes here.
//
// ⚠️ THE THIRD SURFACE asking these questions, and it asks them from the same
// `CompanyQuestions` as the other two. It used to own a free-text version —
// "describe your current operations" in a textarea — which meant two sign-ups
// through two doors recorded two different things.
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const form = reactive(emptyCompanyForm())

// ⚠️ The step is in the URL, not in a ref. This is a full screen with an
// address, so Back is the browser's Back — a visitor who presses it on step 2
// means "take me back a question", and a ref would take them out to the verify
// screen instead. The two dialogs can keep a ref precisely because they have no
// URL of their own.
//
// Anything that isn't a step reads as step 1 rather than as an error: a URL is
// something people edit, and the answer to `?step=9` is the first question.
//
// `?next=` rides along, since it is what the whole flow is carrying home.
const stepNo = computed(() => {
  const n = Number(route.query.step)
  return Number.isInteger(n) && n >= 1 && n <= COMPANY_STEPS ? n : 1
})

// ⚠️ The button is never disabled. A disabled Continue leaves someone hunting
// for which field is stopping them with nothing to click and nothing to read;
// pressing it and being shown the messages answers that in one gesture. So the
// errors stay quiet until the first press, then update live — the same rule as
// the three screens before this one.
const submitted = ref(false)

// Only step 1 has rules, and they live with the questions (`companyErrors`) so
// this screen and the two dialogs cannot disagree about what a valid answer is.
const errors = computed(() => (submitted.value ? companyErrors(form) : {}))

const stepOneDone = computed(() => Object.keys(companyErrors(form)).length === 0)

const next = computed(() => nextFrom(route))

// ⚠️ The form is in memory, like everything else in this prototype. So a reload
// on `?step=2` — or a pasted link to it — arrives partway through a form whose
// first answers are blank and cannot be seen. Send it back to step 1 rather
// than letting someone finish with an empty company.
//
// `replace`, not `push`: that step was never a place they had been, and leaving
// it in history would make Back bounce straight into this check again.
onMounted(() => {
  if (stepNo.value === 1 || stepOneDone.value) return
  const { step, ...rest } = route.query
  router.replace({ query: rest })
})

const go = (n) => router.push({ query: { ...route.query, step: String(n) } })

const forward = () => {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  go(stepNo.value + 1)
}

// The browser's own Back, so the in-form button and the browser button do the
// same thing rather than stacking two entries for one step.
const back = () => router.back()

const submit = () => {
  // Before `completeLogin`, so the account is fully formed the moment it
  // exists; and before the held action, whose own toast should read second.
  store.saveCompany(companyPayload(form))
  toast.success('Account created', { id: 'auth' })
  store.completeLogin()
  // A pack in hand means they came here to buy one, so onboarding hands off to
  // the checkout rather than dropping them back where the gate caught them —
  // and it arrives with step 1 already answered, since these are the same
  // questions. Without a pack — they were saving a partner, or just signing up
  // — `next` is still the right answer and the held action still runs.
  if (store.pack) return void router.replace({ name: 'checkout', query: { pack: store.pack } })
  router.replace(next.value).then(() => store.runPending())
}

useAuthExit()
</script>

<template>
  <AuthShell title="Tell us more about your company">
    <template #mark>
      <!-- The app's own mark, and now the only one — see `ConnectMark`. It used
           to be a hand-rolled violet box here and a grey `LucideBlocks` square
           in the sidebar, which is two identities for one product two clicks
           apart. -->
      <ConnectMark class="mb-5" size="xl" />
    </template>

    <!-- The same bar, and the same argument, as the two dialogs: at two steps
         the buttons said where you were and a stepper was chrome describing
         itself; at three, "how much more of this is there" is a real question
         they can't answer. `md` is a 4px rule — `sm`'s 2px read as a hairline
         rather than as a thing with three parts.
         ⚠️ The segments are rounded HERE because `Progress` has no prop for it.
           `intervals` renders each segment as a bare `h-full w-full` div, and the
           only radius in the component is `rounded-7` on the track with
           `overflow-hidden` — which rounds the outer two corners of the whole bar
           and leaves every segment edge inside it square. Checked against
           beta.63's `ProgressProps` and the live docs playground: value, label,
           size, intervals, hint, and nothing for shape.
           `rounded-full` on a 4px-tall segment is a 2px radius, so each one
           reads as its own capsule rather than a slice of a cut-up bar. -->
    <Progress
      class="mt-5 [&_[role=progressbar]>div]:rounded-full"
      size="md"
      intervals
      :interval-count="COMPANY_STEPS"
      :value="(stepNo / COMPANY_STEPS) * 100"
    />

    <!-- ⚠️ The submit handler follows the STEP, as it does in both dialogs:
         Return on a company name must move the step on, not create an account. -->
    <form class="mt-6" novalidate @submit.prevent="stepNo === COMPANY_STEPS ? submit() : forward()">
      <CompanyQuestions :step="stepNo" :form="form" :errors="errors" />

      <!-- One action on the first step, so it keeps the full-width bar the three
           screens before this one use; every step after it has a Back, and the
           pair sits on one line at the right — the same shape as the dialogs'
           footers. A Back stacked under a full-width primary read as a third
           thing to do rather than as the way out of the step. -->
      <div v-if="stepNo === 1" class="mt-6">
        <Button type="submit" variant="solid" size="md" class="w-full" label="Continue" />
      </div>

      <div v-else class="mt-8 flex items-center justify-end gap-2">
        <Button variant="subtle" size="md" label="Back" @click="back">
          <template #prefix><LucideChevronLeft class="size-4" /></template>
        </Button>
        <Button
          type="submit"
          variant="solid"
          size="md"
          :label="stepNo === COMPANY_STEPS ? 'Create account' : 'Continue'"
        />
      </div>
    </form>
  </AuthShell>
</template>
