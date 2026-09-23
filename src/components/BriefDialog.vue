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
import FilterChip from './FilterChip.vue'
import {
  WORK_STYLES,
  asksCity,
  briefErrors,
  budgetBandsFor,
  emptyBrief,
  matchingPartners,
} from '../data/custom'
import { INDIA_CITIES } from '../data/partners'
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
const brief = reactive(emptyBrief())

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
    // ⚠️ THE WHOLE BRIEF IN, THE WHOLE BRIEF OUT — see the note on `send`.
    // Naming the fields one by one here is what let a field be forgotten there,
    // so both ends copy everything and the arrays are cloned so the draft
    // cannot mutate the store before Send.
    Object.assign(brief, emptyBrief(), store.brief, {
      cities: [...(store.brief.cities ?? [])],
      tiers: [...(store.brief.tiers ?? [])],
    })
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
// ⚠️ FOUR STEPS, AND THE FOURTH IS ABOUT THE PARTNER RATHER THAN THE WORK.
// `data/custom.js` already draws that line — scope and budget are what a
// partner needs in order to reply, the filters are what the business wants in a
// partner — and putting them on one screen made a step with two questions look
// like a step with six. It also puts Send on the step whose subject is the
// AUDIENCE, which is where a count of who it reaches belongs.
const STEPS = [
  { n: 1, title: 'Your business', company: [1] },
  { n: 2, title: 'How you work now', company: [2, 3] },
  { n: 3, title: 'What you need built', company: [] },
  { n: 4, title: 'Who should build it', company: [] },
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

// ⚠️ THE CITY LIST IS A MULTI-SELECT and the work style is not, which is the
// same pairing `PartnerFiltersDialog` uses — two cities is a wider net, two
// answers to "will they come to us" is a contradiction. Re-pressing the
// selected style clears it, because "no preference" is the ABSENCE of an
// answer rather than a third chip.
const toggleCity = (city) =>
  (brief.cities = brief.cities.includes(city)
    ? brief.cities.filter((c) => c !== city)
    : [...brief.cities, city])

const toggleStyle = (value) => (brief.workStyle = brief.workStyle === value ? '' : value)

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
  // ⚠️ THE WHOLE DRAFT, NOT A NAMED PAIR. This read
  // `{ scope: brief.scope, budget: brief.budget }`, so the moment the dialog
  // grew a field the field was dropped on the way out — and the two dropped
  // first were the CONSTRAINTS. `broadcastBrief` re-runs `matchingPartners`
  // against the store, so the dialog counted 1 partner, saved no city and no
  // work style, and sent to 6. That is the exact failure the count's own
  // comment calls the worst bug this flow could have, introduced by the commit
  // that added the constraints.
  //
  // Spreading cannot drift the same way: a field added to the brief is carried
  // without this line being touched.
  store.saveBrief({ ...brief, cities: [...brief.cities], tiers: [...brief.tiers] })
  const result = store.broadcastBrief(props.project?.id)
  emit('update:open', false)
  // ⚠️ Pluralised. It read "Sent to 1 partners" — the one line in the flow
  // whose whole job is to confirm what just happened, and narrowing to a single
  // firm is now an ordinary outcome rather than an edge case.
  const sent = result?.sent ?? 0
  toast.success(`Sent to ${sent} ${sent === 1 ? 'partner' : 'partners'}`, {
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

        <!-- ── What you need built ────────────────────────────────────
             Three questions where there was one. See the note on `emptyBrief`
             for what the single box was getting and why these two are the ones
             missing rather than any other two. -->
        <template v-if="step === 3">
          <!-- ⚠️ THE PLACEHOLDER NAMES A SITUATION, not three nouns.
               "Processes, integrations, and anything you have already tried"
               reads as a list to fill in, and a list gets list-length answers. -->
          <Textarea
            v-model="brief.scope"
            label="What do you need built?"
            placeholder="What you make or sell, how it runs today, and what keeps going wrong."
            :rows="5"
            required
            :error="problems.scope"
          />
          <!-- ⚠️ OPTIONAL, AND SHORTER. Three required boxes is a form somebody
               abandons; two optional ones are two prompts somebody answers if
               they have an answer. `rows` is 3 rather than 5 for the same
               reason — the size of a field is a claim about how much is
               wanted. -->
          <Textarea
            v-model="brief.customers"
            label="Who do you sell to, and what do they require of you?"
            placeholder="Sectors and customers, and any standards or audits you have to pass."
            :rows="3"
          />
          <Textarea
            v-model="brief.mustSatisfy"
            label="What must it connect to, or be able to prove?"
            placeholder="Existing systems, e-invoicing, audit trails, traceability."
            :rows="3"
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
        </template>

        <!-- ── Who should build it ────────────────────────────────────── -->
        <template v-if="step === 4">
          <!-- ⚠️ THESE TWO ALREADY NARROWED THE BROADCAST AND NOBODY WAS ASKED
               THEM HERE. `matchingPartners` has honoured `cities` and
               `workStyle` all along, but the only place that set them was the
               filters dialog on the recommendation screen — so somebody who
               reached this flow through a project stated no constraint at all.
               That is the gap a real enquiry fell straight down: two hundred
               words insisting on a partner with an office in one city, in a
               product whose matcher could have answered it and was never
               asked.

               ⚠️ NOT A REQUIREMENT, AND NOT PROSE. Left alone they constrain
               nothing and the count stays as wide as it started; pressed, they
               move the number in the same breath, which is the whole reason
               this belongs in a field rather than in a paragraph a matcher
               cannot read. -->
          <div>
            <p class="text-p-sm font-medium text-ink-gray-7">How you want to work</p>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <FilterChip
                v-for="w in WORK_STYLES"
                :key="w.value"
                :label="w.label"
                :selected="brief.workStyle === w.value"
                @toggle="toggleStyle(w.value)"
              />
            </div>
          </div>

          <!-- ⚠️ INDIA ONLY — see `asksCity`. Outside India the directory's
               biggest city holds one firm, so every option would return one
               result or none. -->
          <div v-if="asksCity(form.country)">
            <p class="text-p-sm font-medium text-ink-gray-7">Where they should be</p>
            <div class="mt-1.5 flex flex-wrap gap-2">
              <FilterChip
                v-for="city in INDIA_CITIES"
                :key="city"
                :label="city"
                :selected="brief.cities.includes(city)"
                @toggle="toggleCity(city)"
              />
            </div>
          </div>

          <!-- ⚠️ WHO THIS REACHES, stated before the button rather than after
               it. The count comes from the same function the send uses, because
               a broadcast that reaches one more firm than the number shown is
               the worst bug this flow could have. -->
          <div class="border-t border-outline-gray-2 pt-4">
            <p v-if="matches.length" class="text-p-base leading-relaxed text-ink-gray-6">
              This goes to {{ matches.length }} certified
              {{ matches.length === 1 ? 'partner' : 'partners' }}. They see the requirements and
              the budget, not your company name — that is shared when you shortlist a reply.
            </p>
            <p v-else class="text-p-base leading-relaxed text-ink-gray-7">
              No partner matches all of this. Loosen something above.
            </p>
            <!-- ⚠️ THE CONSEQUENCE OF A THIN BRIEF, and it is the only argument
                 that gets anybody to write four more sentences. Not a word
                 count and not a scold: the thing that actually happens, which
                 this prototype's own seeded replies already say out loud —
                 "we would start with a two-day process workshop before quoting
                 the build properly". A brief a partner can price comes back
                 with a price. A thin one comes back with a meeting. -->
            <p class="mt-2 text-p-sm leading-relaxed text-ink-gray-5">
              The more of the above you answer, the more of them can quote a figure. Partners who
              cannot price what they have read will offer a workshop first instead.
            </p>
          </div>
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
