<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Checkbox, Dialog, FormControl, MultiSelect, Radio, RadioGroup } from 'frappe-ui'
import { INDUSTRIES } from '../data/quiz'
import { useConnectStore } from '../stores/connect'

// The company questions, as a DIALOG over whatever the visitor was doing.
//
// ⚠️ Two shapes, one set of questions. This is the errand path — someone was
// booking a pack, saving a partner or contacting one when the gate stopped
// them, so the thing they were doing stays on screen behind the card and the
// questions read as one more step of it. `CompanyPage` is the same questions as
// a full screen, for the one path where signing up IS the errand (the top bar's
// own CTA). See `hasErrand` in the store.
//
// ⚠️ Mounted at the APP ROOT, not on a page. The gate fires from the listing,
// a profile, the pack catalogue and the confirm screen, so the dialog has to be
// able to sit over any of them.
//
// ⚠️ NOT dismissible, and no close button. Frappe assigns the partner off these
// answers — an account that skipped them is an account nothing can be matched
// for. The only way out is Confirm.
const store = useConnectStore()

// ── Step 1: who you are ──────────────────────────────────────────────────────

// ⚠️ PLACEHOLDER BANDS, invented — nothing in the repo defines sizes. The 50
// matters more than it looks: Starter Packs are scoped "for businesses running
// under 50 users", so this is the first answer that could tell someone the pack
// they picked doesn't fit them. Nothing acts on it yet.
const COMPANY_SIZES = ['1 to 10', '11 to 50', '51 to 200', '201 to 500', 'More than 500']

// Industry AND segment in one grouped control, the same shape as the listing's
// industry filter and for the same reason: partners are tagged at the SEGMENT
// level ("Textile Manufacturing"), so the industry is a heading and the segments
// are the options. Asking for the group alone records something `matches()`
// cannot filter on.
//
// ⚠️ `MultiSelect`, not `Select`: frappe-ui's `Select` renders no groups at all,
// so a grouped list needs this one. Multi is also the truer answer — a business
// spanning "Discrete Manufacturing" and "Logistics" can say so.
const SEGMENT_OPTIONS = INDUSTRIES.map((i) => ({
  group: i.label,
  key: i.value,
  options: i.segments.map((sg) => ({ label: sg, value: sg })),
}))

// What they are running today, by name. Optional, and the one question here
// whose answer a partner reads rather than a filter: "they are on Tally and
// three spreadsheets" is the sentence that starts a migration conversation.
//
// ⚠️ Invented, but not arbitrary — these are the systems an ERPNext migration
// actually comes from. "Spreadsheets only" is an answer, not an absence, which
// is why it is in the list rather than left to the empty state.
const APPS = [
  'Spreadsheets only',
  'Tally',
  'Zoho',
  'QuickBooks',
  'Busy',
  'SAP',
  'Microsoft Dynamics',
  'Odoo',
  'Salesforce',
  'An in-house system',
  'Something else',
].map((label) => ({ label, value: label }))

// ⚠️ The one option that asks a question back. "Something else" names a system
// without naming it, so choosing it reveals a field for the name — offered, not
// demanded: the field is optional, as the question it belongs to is.
const APPS_OTHER = 'Something else'

// ── Step 2: what you need ────────────────────────────────────────────────────

// ⚠️ A LADDER, not a list. The four rungs are meant to be mutually exclusive and
// in order of how much software is already in place, so a business can find
// itself in exactly one — which is what makes it single-select. The placeholder
// copy ("We manage everything on spreadsheets/paper") described tools; these
// describe a SITUATION, which is what a partner is actually scoping against.
const OPERATIONS = [
  { value: 'manual', label: 'Spreadsheets, email and paper' },
  { value: 'accounting', label: 'Accounting software, everything else by hand' },
  { value: 'disconnected', label: 'Several systems that do not talk to each other' },
  { value: 'outgrown', label: 'An ERP that no longer fits how we work' },
]

// ⚠️ MULTI-select, unlike the ladder above: a business wants integration AND a
// faster close AND stock it can trust, and forcing one answer throws away the
// other two. Phrased as symptoms the visitor would recognise in their own week
// rather than as categories ("Lack of digitalization of processes") — nobody
// describes their month that way.
const PROBLEMS = [
  { value: 'manual-work', label: 'Manual work that should be automated' },
  { value: 'integration', label: 'Systems that do not talk to each other' },
  { value: 'close', label: 'Month-end close and reporting take too long' },
  { value: 'visibility', label: 'No reliable view of stock and orders' },
  { value: 'fit', label: 'Our tools cannot handle how we actually work' },
  { value: 'scale', label: 'We are outgrowing what we have' },
]

const form = reactive({
  company: '',
  employees: '',
  segments: [],
  apps: [],
  appsOther: '',
  operations: '',
  problems: [],
})

const appsOtherPicked = computed(() => form.apps.includes(APPS_OTHER))

// ⚠️ Clear the text when the option is un-picked. Without this, typing a name,
// changing your mind and un-ticking "Something else" still saves the name — an
// answer to a question that is no longer being asked.
watch(appsOtherPicked, (picked) => {
  if (!picked) form.appsOther = ''
})

const stepNo = ref(1)

// ⚠️ ALL the validation in this dialog is step 1's. Step 2 asks two questions
// and requires neither: they sharpen the match, they do not gate it, and a
// blocking dialog that also refuses to close until you have opinions about your
// month-end close is a wall rather than a form.
//
// So Confirm always goes through. What "cannot proceed without answering"
// protects is step 1 — the company, its size and its industry, which are what
// the matcher actually reads.
//
// ⚠️ Errors stay quiet until the first press, then update live — the same rule
// the auth screens before this use. A disabled button leaves someone hunting for
// which field is stopping them with nothing to click and nothing to read;
// pressing it and being shown the messages answers that in one gesture.
const tried = ref(false)

const errors = computed(() => {
  if (!tried.value) return {}
  const e = {}
  if (!form.company.trim()) e.company = 'Enter your company name'
  if (!form.employees) e.employees = 'Select a size'
  if (!form.segments.length) e.segments = 'Select an industry'
  return e
})

const toStep2 = () => {
  tried.value = true
  if (Object.keys(errors.value).length) return
  stepNo.value = 2
}

const back = () => {
  stepNo.value = 1
}

// A checkbox list over an array. `Checkbox` is a boolean control, so the array
// membership is the model and this is the adapter.
const toggleProblem = (value, on) => {
  form.problems = on ? [...form.problems, value] : form.problems.filter((v) => v !== value)
}

const confirm = () => {
  store.saveCompany({
    name: form.company.trim(),
    employees: form.employees,
    segments: form.segments,
    apps: form.apps,
    // Kept beside `apps` rather than folded into it: "Something else" is the
    // answer they gave, and this is what they meant by it. Merging the two
    // would read as a tenth option in the list nobody chose from.
    appsOther: form.appsOther.trim(),
    operations: form.operations,
    problems: form.problems,
  })
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
           A progress bar over two dots is chrome describing itself. -->
      <form v-if="stepNo === 1" novalidate @submit.prevent="toStep2">
        <div class="space-y-4">
          <FormControl
            v-model="form.company"
            type="text"
            label="Company name"
            placeholder="Company name"
            required
            :error="errors.company"
          />
          <FormControl
            v-model="form.employees"
            type="select"
            label="Number of employees"
            placeholder="Select"
            required
            :options="COMPANY_SIZES"
            :error="errors.employees"
          />
          <MultiSelect
            v-model="form.segments"
            label="Relevant industry"
            placeholder="Select"
            required
            :options="SEGMENT_OPTIONS"
            :error="errors.segments"
          />
          <MultiSelect
            v-model="form.apps"
            label="Which apps do you currently use?"
            placeholder="Select"
            :options="APPS"
          />
          <!-- Appears only when "Something else" is picked — see `APPS_OTHER`.
             ⚠️ The label has to name WHICH answer it is following up. "Which
             one?" read as "which of the ones you just picked", which is the
             wrong question when the select above says "4 selected" — the other
             three are named already. "What else" points at the one option that
             didn't name itself.
             Optional, like the question it hangs off: someone who picks
             Something else and moves on has still told us more than someone who
             skipped the question. -->
          <FormControl
            v-if="appsOtherPicked"
            v-model="form.appsOther"
            type="text"
            label="What else do you use?"
            placeholder="e.g. a custom system built in-house"
          />
        </div>

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
        <div class="space-y-5">
          <!-- ⚠️ The pull-left goes on the OPTIONS, not on the group.
             `padded` insets each row by 12px so it has a hover surface, which
             pushes the radio circles in from the form's left edge; cancelling it
             on the group took the LABEL 12px left with them, so the heading hung
             out past the controls it names. `[&>[role=radiogroup]]` is the
             options list alone — the label and the error message keep the form's
             own edge, and only the rows move. -->
          <RadioGroup
            v-model="form.operations"
            class="[&>[role=radiogroup]]:-ml-3"
            label="How would you describe your operations today?"
            padded
            size="md"
          >
            <Radio v-for="o in OPERATIONS" :key="o.value" :value="o.value" :label="o.label" />
          </RadioGroup>

          <!-- ⚠️ A hand-rolled fieldset because frappe-ui ships no `CheckboxGroup`
             — `Checkbox` is a single control, and `RadioGroup` has no checkbox
             twin. So the legend has to reproduce what `InputLabel` would emit
             rather than inherit it.
             `block text-sm text-ink-gray-7` is exactly that: `InputLabel` fixes
             label type at 13px `text-sm` whatever the control's size, and
             `gray-7` is the shade every TOGGLE control asks it for — `Checkbox`,
             `RadioGroup` and `Switch` all pass `color="gray-7"`, against the
             `gray-6` default the text inputs on step 1 use. This is a toggle
             group sitting directly under a radio group, so it takes the darker
             one and the two headings match. -->
          <fieldset>
            <legend class="block text-sm text-ink-gray-7">What are you trying to fix?</legend>
            <div class="-ml-3 mt-1.5 flex flex-col">
              <Checkbox
                v-for="p in PROBLEMS"
                :key="p.value"
                :model-value="form.problems.includes(p.value)"
                :label="p.label"
                padded
                size="md"
                @update:model-value="toggleProblem(p.value, $event)"
              />
            </div>
          </fieldset>
        </div>

        <!-- ⚠️ The footer sits OUTSIDE the fields' `space-y`, not inside it.
             `space-y-*` puts its margin on every child after the first, and its
             `& > * + *` selector outranks a plain `mt-8` — so the only way the
             buttons get the modal's 32px footer gap rather than the 16px/20px
             rhythm between fields is to take them out of that flow. -->
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
