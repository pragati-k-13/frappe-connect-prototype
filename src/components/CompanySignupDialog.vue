<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Dialog, Progress } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { COMPANY_STEPS, companyErrors, companyPayload, emptyCompanyForm } from '../data/company'
import { useConnectStore } from '../stores/connect'

// The company questions, as a DIALOG over whatever the visitor was doing.
//
// ⚠️ Two shapes, one set of questions. This is the errand path — someone was
// booking a pack or saving a partner when the gate stopped them, so the thing
// they were doing stays on screen behind the card and the questions read as one
// more step of it. `CompanyPage` is the same questions as a full screen, for the
// one path where signing up IS the errand (the top bar's own CTA). See
// `hasErrand` in the store.
//
// ⚠️ CONTACT NO LONGER ARRIVES HERE, and that is this file's one recent change.
// Pressing Contact while signed out used to end with this dialog and the inquiry
// dialog both open, stacked, because `VerifyPage` runs the held action and then
// opens this one. Contact now asks the same questions itself, as the first two
// steps of its own wizard (`ContactPartnerDialog`), and `openCompanyPrompt`
// declines to open this over it. The fields are shared rather than copied — see
// `CompanyQuestions`.
//
// ⚠️ Mounted at the APP ROOT, not on a page. The gate fires from the listing,
// a profile, the pack catalogue and the confirm screen, so the dialog has to be
// able to sit over any of them.
//
// ⚠️ NOT dismissible, and no close button. Frappe assigns the partner off these
// answers — an account that skipped them is an account nothing can be matched
// for. The only way out is Confirm.
const store = useConnectStore()

const form = reactive(emptyCompanyForm())
const stepNo = ref(1)

// ⚠️ Errors stay quiet until the first press, then update live — the same rule
// the auth screens before this use. A disabled button leaves someone hunting for
// which field is stopping them with nothing to click and nothing to read;
// pressing it and being shown the messages answers that in one gesture.
const tried = ref(false)
const errors = computed(() => (tried.value ? companyErrors(form) : {}))

// ⚠️ EVERYTHING IN HERE OUTLIVES ONE SIGN-UP. This component is mounted at the
// app root and never unmounts — only `:open` flips — so the step, the answers
// and whether Continue has been pressed all survive from one sign-up to the next
// in the same page session. Without this reset, signing up a second time
// reopened the dialog on whatever step the last one ended on, with the previous
// company's answers still in the fields.
//
// Reset on OPEN rather than on close, the same call `ContactPartnerDialog`
// makes: a dialog that empties itself while it is animating out shows the reader
// their answers being wiped.
//
// ⚠️ `CompanyPage` needs none of this — it is a routed component, so leaving the
// route unmounts it and the next visit builds a fresh one.
watch(
  () => store.companyPrompt,
  (isOpen) => {
    if (!isOpen) return
    Object.assign(form, emptyCompanyForm())
    stepNo.value = 1
    tried.value = false
  },
)

// Forward. Only step 1 has rules — see `companyErrors` — so this validates there
// and walks on everywhere else.
const next = () => {
  tried.value = true
  if (Object.keys(errors.value).length) return
  stepNo.value += 1
}

const back = () => {
  stepNo.value -= 1
}

const confirm = () => {
  store.saveCompany(companyPayload(form))
  store.closeCompanyPrompt()
}
</script>

<template>
  <!-- ⚠️ `md` (448px), a step down from the `lg` the app's other dialogs use.
       This one is a column of single-line fields and a list of short options —
       at 512px the radio and checkbox labels sat in a lot of empty space to
       their right, which reads as a wide box holding narrow content. The
       estimate dialog stays `xl` because it holds a table; this holds a form. -->
  <Dialog :open="store.companyPrompt" :dismissible="false" :show-close-button="false" size="md">
    <!-- ⚠️ `#title` and the default slot, NOT v0's `#body-title` / `#body-content`
         — this version of `Dialog` ships only `title`, `default` and `actions`.
         The footer buttons live inside the forms rather than in `#actions`, so
         Return submits the step it belongs to. -->
    <!-- ⚠️ The subtitle answers "why am I being asked this", not "what am I
         buying". The version it replaces named the pack, which the screen behind
         the card already says; this one gives the reason the questions exist at
         all — every answer here is something Frappe matches on.
         It sits in `#title`, so it shows on EVERY step without being repeated:
         the reason holds for the basic details and the intent questions alike. -->
    <template #title>
      <div>
        <h3 class="text-2xl font-semibold text-ink-gray-9">Tell us more about your company</h3>
        <!-- ⚠️ Short enough to hold ONE line at the dialog's 448px. The longer
             version ("…with Partners who are right for your business") wrapped,
             and a two-line subtitle under a one-line heading reads as a
             paragraph rather than as a caption. No `whitespace-nowrap` to
             enforce it — that would overflow instead of wrapping on a narrow
             phone; the length is what keeps it on one line. -->
        <p class="mt-1 text-p-base text-ink-gray-5">
          We use this to match you with the right Partner
        </p>
      </div>
    </template>

    <template #default>
      <!-- ⚠️ A stepper EARNS its place at three steps, where it didn't at two.
           With two, the buttons said where you were — Continue, then Back and
           Confirm — and a bar over two segments was chrome describing itself.
           With three, "how much more of this is there" is a real question in a
           dialog that cannot be dismissed, and the buttons can't answer it. The
           contact wizard made the same call for the same reason; this is the
           same bar, one segment shorter, because its own last step is the
           requirements.
           `md` is a 4px rule — `sm`'s 2px read as a hairline rather than as a
           thing with three parts, and the segment you have filled is the whole
           point. -->
      <Progress
        class="mb-6"
        size="md"
        intervals
        :interval-count="COMPANY_STEPS"
        :value="(stepNo / COMPANY_STEPS) * 100"
      />

      <!-- ⚠️ The submit handler follows the STEP, as it does in the contact
           wizard: Return on a company name must move the step on, not save an
           account. -->
      <form novalidate @submit.prevent="stepNo === COMPANY_STEPS ? confirm() : next()">
        <CompanyQuestions :step="stepNo" :form="form" :errors="errors" />

        <!-- ⚠️ The footer sits OUTSIDE the fields' `space-y`, not inside it.
             `space-y-*` puts its margin on every child after the first, and its
             `& > * + *` selector outranks a plain `mt-8` — so the only way the
             buttons get the modal's 32px footer gap rather than the 16px/20px
             rhythm between fields is to take them out of that flow. -->
        <!-- One action on the first step, so it takes the full width; every step
             after it has a Back, and the pair sits on one line at the right. -->
        <div v-if="stepNo === 1" class="mt-8">
          <!-- Submit type so Return moves the step on, not just the button. -->
          <Button class="w-full" variant="solid" size="sm" label="Continue" type="submit" />
        </div>

        <div v-else class="mt-8 flex items-center justify-end gap-2">
          <Button variant="subtle" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <Button
            variant="solid"
            size="sm"
            :label="stepNo === COMPANY_STEPS ? 'Confirm' : 'Continue'"
            type="submit"
          />
        </div>
      </form>
    </template>
  </Dialog>
</template>
