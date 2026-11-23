<script setup>
import { computed, watch } from 'vue'
import { Checkbox, FormControl, MultiSelect, Radio, RadioGroup } from 'frappe-ui'
import {
  APPS_OTHER,
  COMPANY_SIZES,
  COUNTRY_OPTIONS_INDIA_ONLY,
  CURRENT_APPS,
  OPERATIONS,
  problemsFor,
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
  // Off where the page asks where PARTNERS are instead (the contact quiz's
  // region chips); the country is then kept from the account or inferred.
  askCountry: { type: Boolean, default: true },
  form: { type: Object, required: true },
  // Already gated on "have they pressed the button yet" by the parent, which
  // owns that decision because it owns the button.
  errors: { type: Object, default: () => ({}) },
  // The apps the project needs, so "What are you trying to fix?" offers only
  // what applies to them. Empty shows every option.
  projectApps: { type: Array, default: () => [] },
})

const problems = computed(() => problemsFor(props.projectApps))
// An answer whose option is no longer offered (the apps changed) is dropped,
// so nothing is saved that isn't on screen.
watch(
  problems,
  (list) => {
    if (!props.projectApps.length) return
    const shown = list.map((p) => p.value)
    const kept = props.form.problems.filter((v) => shown.includes(v))
    if (kept.length !== props.form.problems.length) props.form.problems = kept
  },
  { immediate: true },
)

// The country answer, kept in step with its first pick. A form that only ever
// had `country` (an older draft) reads as that one country.
const countries = computed({
  get: () => props.form.countries ?? [props.form.country].filter(Boolean),
  set: (value) => {
    props.form.countries = value
    props.form.country = value[0] ?? ''
  },
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
    <!-- ⚠️ Not `Select`: this is 43 countries under five region headings,
         and frappe-ui's `Select` renders neither a group nor a search box.

         ⚠️ SEVERAL COUNTRIES, as `MultiSelect` (Combobox takes one). A
         business can be based in more than one. The first pick stays the home
         market in `form.country`, which decides the currency — see
         `emptyCompanyForm`. -->
    <MultiSelect
      v-if="askCountry"
      v-model="countries"
      label="Where is your business based?"
      placeholder="Select countries"
      required
      :options="COUNTRY_OPTIONS_INDIA_ONLY"
      :error="errors.country"
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
      :error="errors.operations"
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
    <!-- ⚠️ REVEALED, NOT SWAPPED IN. A `v-if` dropped 70px into a centred
         dialog in one frame, so the whole card jumped. It now stays mounted and
         opens by height (the grid-rows trick, so no measuring), with the content
         fading in and settling 4px. Enter 250ms on a strong ease-out; exit
         faster, 150ms, because the reader has already moved on. `inert` keeps
         the closed one out of the tab order. See `.fc-reveal` below. -->
    <div
      class="fc-reveal !mt-0"
      :data-open="showApps || undefined"
      :inert="!showApps"
      :aria-hidden="!showApps"
    >
      <!-- `-m-1 p-1` gives the select's focus ring room inside the clip. -->
      <div class="-m-1 min-h-0 overflow-hidden p-1">
      <div class="fc-reveal-body space-y-3 pt-5">
      <MultiSelect
        v-model="form.apps"
        label="Which tools do you use today?"
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
    <!-- Options at 14px, matching the radio options on the step before:
         frappe-ui's Checkbox sets its label at 13px whatever the size. -->
    <fieldset>
      <legend class="block text-sm text-ink-gray-7">What are you trying to fix?</legend>
      <div class="-ml-3 mt-1.5 flex flex-col">
        <Checkbox
          v-for="p in problems"
          :key="p.value"
          :model-value="form.problems.includes(p.value)"
          :label="p.label"
          padded
          size="md"
          class="[&_[data-slot=label]]:text-base"
          @update:model-value="toggleProblem(p.value, $event)"
        />
      </div>
      <!-- ⚠️ Hand-rolled for the same reason the legend is: with no
           `CheckboxGroup` there is no `InputError` to inherit, so the message
           reproduces what one emits. Only reachable once Continue has been
           pressed on an empty list — the parent owns that gate. -->
      <p v-if="errors.problems" class="mt-1.5 text-sm text-ink-red-3">{{ errors.problems }}</p>
    </fieldset>
  </div>
</template>

<style scoped>
/* The systems question's reveal — see the note on it in the template.
   Height by `grid-template-rows: 0fr → 1fr`; the body fades and settles. */
.fc-reveal {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 150ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 100ms ease-out;
}
.fc-reveal[data-open] {
  grid-template-rows: 1fr;
  opacity: 1;
  transition:
    grid-template-rows 250ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 200ms ease-out 50ms;
}
.fc-reveal-body {
  transform: translateY(-4px);
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fc-reveal[data-open] .fc-reveal-body {
  transform: translateY(0);
  transition-duration: 250ms;
}
/* Reduced motion: no height or movement, just the fade. */
@media (prefers-reduced-motion: reduce) {
  .fc-reveal,
  .fc-reveal[data-open] {
    transition: opacity 150ms ease-out;
  }
  .fc-reveal-body {
    transform: none;
    transition: none;
  }
}
</style>
