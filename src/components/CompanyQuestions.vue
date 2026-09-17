<script setup>
import { computed, watch } from 'vue'
import { Checkbox, FormControl, MultiSelect, Radio, RadioGroup } from 'frappe-ui'
import {
  APPS_OTHER,
  COMPANY_SIZES,
  CURRENT_APPS,
  OPERATIONS,
  PROBLEMS,
  SEGMENT_OPTIONS,
  asksApps,
} from '../data/company'

// The company questions as FIELDS, for whichever dialog is asking them.
//
// Two surfaces ask: `CompanySignupDialog`, which is where someone who saved a
// partner or booked a pack meets them after signing up, and the contact
// wizard's first two steps. They were one dialog's private markup until the
// second surface arrived; copying it would have left two forms free to disagree
// about what "company details" means, which is the failure this component
// exists to make impossible.
//
// ⚠️ The parent owns the state. `form` is a reactive object this mutates in
// place rather than a `v-model` per field — there are seven of them, and seven
// models threaded through two dialogs is how one of them gets forgotten. The
// shape is `emptyCompanyForm()`; the rules are `companyErrors()`.
const props = defineProps({
  // 1 — who you are: the three answers the matcher actually reads, and the only
  //     ones anything insists on.
  // 2 — what you run today: the ladder, and the systems it asks about.
  // 3 — what you want fixed.
  //
  // ⚠️ THREE, not the two this started with. Step 1 was carrying the identity
  // fields AND the ladder AND the systems follow-up, which is two different
  // kinds of question in one column — and in a 448px dialog it ran to the
  // bottom of the viewport. `COMPANY_STEPS` is the count; the callers read it
  // rather than hard-coding 3.
  step: { type: Number, required: true },
  form: { type: Object, required: true },
  // Already gated on "have they pressed the button yet" by the parent, which
  // owns that decision because it owns the button.
  errors: { type: Object, default: () => ({}) },
})

// The systems question is a follow-up to the ladder, shown on the three rungs
// that say something is running — see `asksApps`.
const showApps = computed(() => asksApps(props.form.operations))
const appsOtherPicked = computed(() => props.form.apps.includes(APPS_OTHER))

// ⚠️ UN-ASKING A QUESTION DROPS ITS ANSWER. Naming Tally and then moving down to
// the rung that says nothing is running would otherwise still save Tally; and
// typing a name against "Something else" and then un-ticking it would still save
// the name. Both are answers to a question no longer on screen.
watch(showApps, (shown) => {
  if (!shown) props.form.apps = []
})
watch(appsOtherPicked, (picked) => {
  if (!picked) props.form.appsOther = ''
})

// A checkbox list over an array. `Checkbox` is a boolean control, so the array
// membership is the model and this is the adapter.
const toggleProblem = (value, on) => {
  props.form.problems = on
    ? [...props.form.problems, value]
    : props.form.problems.filter((v) => v !== value)
}
</script>

<template>
  <!-- ── Step 1: who you are ──────────────────────────────────────────────── -->
  <div v-if="step === 1" class="space-y-4">
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
  </div>

  <!-- ── Step 2: what you run today ───────────────────────────────────────── -->
  <div v-else-if="step === 2" class="space-y-5">
    <!-- ⚠️ The pull-left goes on the OPTIONS, not on the group. `padded` insets
         each row by 12px so it has a hover surface, which pushes the radio
         circles in from the form's left edge; cancelling it on the group took
         the LABEL 12px left with them, so the heading hung out past the controls
         it names. `[&>[role=radiogroup]]` is the options list alone — the label
         and the error message keep the form's own edge, and only the rows
         move. -->
    <RadioGroup
      v-model="form.operations"
      class="[&>[role=radiogroup]]:-ml-3"
      label="How would you describe your operations today?"
      padded
      size="md"
    >
      <Radio v-for="o in OPERATIONS" :key="o.value" :value="o.value" :label="o.label" />
    </RadioGroup>

    <!-- Conditional on the ladder — see `showApps` — but drawn as a plain second
         question, not as something hanging off the first. It had an indent and a
         left rule to tie it to the rung above; the rule was the only vertical
         line on the card and it read as a quote block. The question can carry
         the connection on its own, which is why the label names what it is
         asking about rather than saying "which ones?" and relying on the answer
         above to finish the sentence. -->
    <div v-if="showApps" class="space-y-3">
      <MultiSelect
        v-model="form.apps"
        label="Which systems do you use?"
        placeholder="Select"
        :options="CURRENT_APPS"
      />
      <!-- Appears only when "Something else" is picked — see `APPS_OTHER`.
           ⚠️ The label has to name WHICH answer it is following up. "Which one?"
           read as "which of the ones you just picked", which is the wrong
           question when the select above says "4 selected" — the other three are
           named already. "What else" points at the one option that didn't name
           itself.
           Optional, like the question it hangs off, and closer to it than the
           questions are to each other — 12px rather than 20px is what says this
           belongs to the select above. -->
      <FormControl
        v-if="appsOtherPicked"
        v-model="form.appsOther"
        type="text"
        label="What else do you use?"
        placeholder="e.g. a custom system built in-house"
      />
    </div>
  </div>

  <!-- ── Step 3: what you want fixed ──────────────────────────────────────── -->
  <div v-else>
    <!-- ⚠️ A hand-rolled fieldset because frappe-ui ships no `CheckboxGroup` —
         `Checkbox` is a single control, and `RadioGroup` has no checkbox twin.
         So the legend has to reproduce what `InputLabel` would emit rather than
         inherit it.
         `block text-sm text-ink-gray-7` is exactly that: `InputLabel` fixes
         label type at 13px `text-sm` whatever the control's size, and `gray-7`
         is the shade every TOGGLE control asks it for — `Checkbox`, `RadioGroup`
         and `Switch` all pass `color="gray-7"`, against the `gray-6` default the
         text inputs on step 1 use. This is a toggle group, so it takes the
         darker one and its heading matches the ladder's on the step before. -->
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
</template>
