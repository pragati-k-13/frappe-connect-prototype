<script setup>
import { computed, reactive, ref } from 'vue'
import { Button, Dialog } from 'frappe-ui'
import CompanyQuestions from './CompanyQuestions.vue'
import { companyErrors, companyPayload, emptyCompanyForm } from '../data/company'
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

const toStep2 = () => {
  tried.value = true
  if (Object.keys(errors.value).length) return
  stepNo.value = 2
}

const back = () => {
  stepNo.value = 1
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
         It sits in `#title`, so it shows on BOTH steps without being repeated:
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
      <!-- ⚠️ No stepper. Two steps, both short, and the buttons already say
           where you are: Continue on the first, Back and Confirm on the second.
           A progress bar over two dots is chrome describing itself.
           The contact wizard DOES carry one, and the difference is the count:
           three steps with a send at the end is a journey, two is a form. -->
      <form v-if="stepNo === 1" novalidate @submit.prevent="toStep2">
        <CompanyQuestions :step="1" :form="form" :errors="errors" />

        <!-- ⚠️ The footer sits OUTSIDE the fields' `space-y`, not inside it.
             `space-y-*` puts its margin on every child after the first, and its
             `& > * + *` selector outranks a plain `mt-8` — so the only way the
             buttons get the modal's 32px footer gap rather than the 16px/20px
             rhythm between fields is to take them out of that flow. -->
        <div class="mt-8">
          <!-- Submit type so Return moves the step on, not just the button. -->
          <Button class="w-full" variant="solid" size="sm" label="Continue" type="submit" />
        </div>
      </form>

      <form v-else novalidate @submit.prevent="confirm">
        <CompanyQuestions :step="2" :form="form" />

        <div class="mt-8 flex items-center justify-end gap-2">
          <Button variant="subtle" size="sm" label="Back" @click="back">
            <template #prefix><LucideChevronLeft class="size-4" /></template>
          </Button>
          <Button variant="solid" size="sm" label="Confirm" type="submit" />
        </div>
      </form>
    </template>
  </Dialog>
</template>
