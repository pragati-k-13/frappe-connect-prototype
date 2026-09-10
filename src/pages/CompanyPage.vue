<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, FormControl, toast } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import ConnectMark from '../components/ConnectMark.vue'
import { INDUSTRIES } from '../data/quiz'
import { STARTER_PACKS } from '../data/packs'
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
const store = useConnectStore()
const route = useRoute()
const router = useRouter()

// The pack they pressed Get started on, if they came that way. Read from the
// store rather than the URL because the gate fires BEFORE the panel opens, so
// there is no `?pack=` to carry — see `selectPack` in the store.
//
// Nothing when they arrived by another door (saving a partner, the top-bar
// CTA). The strip then doesn't render at all, rather than showing a pack they
// never chose.
const pack = computed(() => STARTER_PACKS.find((p) => p.value === store.pack) ?? null)

// ⚠️ PLACEHOLDER, invented. Nothing in the repo defines size bands, and these
// are the conventional ones. The 50 matters more than it looks: the Starter
// Packs are scoped "for businesses running under 50 users", so this answer is
// the first thing that could tell someone the pack they picked doesn't fit
// them. Nothing acts on it yet.
const COMPANY_SIZES = ['1 to 10', '11 to 50', '51 to 200', '201 to 500', 'More than 500']

// Industry AND segment in one control, grouped — the same shape as the partner
// listing's industry filter, and for the same reason: partners are tagged at the
// SEGMENT level ("Textile Manufacturing"), so the industry is a heading and the
// segments are the options. Nothing is selectable at the group level because
// nothing in the data is tagged there.
//
// This is what makes the answer usable. Asking for the group alone recorded
// something `matches()` can't filter on — it reads `answers.segments`, and the
// group above it narrows nothing.
//
// ⚠️ `multiselect`, not `select`: frappe-ui's `Select` has no grouping at all
// ("Select renders no group / group-label", per its own source), so a grouped
// list needs `MultiSelect` or `Combobox`. Multi is also the truer answer — a
// business spanning "Discrete Manufacturing" and "Logistics" can say so, which
// as a single choice it couldn't.
const SEGMENT_OPTIONS = INDUSTRIES.map((i) => ({
  group: i.label,
  key: i.value,
  options: i.segments.map((sg) => ({ label: sg, value: sg })),
}))

const form = reactive({
  company: '',
  employees: '',
  // An array, because the control is a grouped multi-select — see above.
  segments: [],
  operations: '',
  problems: '',
})

// ⚠️ The button is never disabled. A disabled Continue leaves someone hunting
// for which field is stopping them with nothing to click and nothing to read;
// pressing it and being shown the three messages answers that in one gesture.
// So the errors stay quiet until the first press, then update live — the same
// rule as the three screens before this one.
const submitted = ref(false)

const errors = computed(() => {
  if (!submitted.value) return {}
  const e = {}
  if (!form.company.trim()) e.company = 'Enter your company name'
  if (!form.employees) e.employees = 'Select a size'
  if (!form.segments.length) e.segments = 'Select an industry'
  return e
})

const next = computed(() => nextFrom(route))

const submit = () => {
  submitted.value = true
  if (Object.keys(errors.value).length) return
  // Before `completeLogin`, so the account is fully formed the moment it
  // exists; and before the held action, whose own toast should read second.
  store.saveCompany({
    name: form.company.trim(),
    employees: form.employees,
    segments: form.segments,
    operations: form.operations.trim(),
    problems: form.problems.trim(),
  })
  toast.success('Account created', { id: 'auth' })
  store.completeLogin()
  // A pack in hand means they came here to buy one, so onboarding hands off to
  // the confirmation screen rather than dropping them back where the gate
  // caught them. Without one — they were saving a partner, or just signing up —
  // `next` is still the right answer and the held action still runs.
  if (store.pack) return void router.replace({ name: 'confirm', query: { pack: store.pack } })
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

    <p class="mt-1 text-p-base text-ink-gray-5">
      This will connect you with the ideal Partner for your needs.
    </p>

    <!-- The pack carried across from the catalogue. It is context, not a
         control: nothing here changes it, and it's the reason these questions
         are being asked at all. -->
    <div
      v-if="pack"
      class="mt-6 flex items-center gap-2 rounded-4 border border-outline-gray-2 px-3 py-2.5"
    >
      <span class="min-w-0 truncate text-base font-medium text-ink-gray-8">{{ pack.name }}</span>
      <Badge variant="subtle" theme="gray" size="sm" label="Selected Starter Pack" />
    </div>

    <form class="mt-6 space-y-4" novalidate @submit.prevent="submit">
      <FormControl
        v-model="form.company"
        size="sm"
        label="Company name"
        placeholder="Company name"
        autocomplete="organization"
        autofocus
        required
        :error="errors.company"
      />

      <!-- Two across because they're both one-word answers about the same
           thing, and stacking them pushed the free-text questions below the
           fold on a laptop. -->
      <div class="grid grid-cols-2 gap-3">
        <FormControl
          v-model="form.employees"
          type="select"
          size="sm"
          label="Number of employees"
          placeholder="Select"
          :options="COMPANY_SIZES"
          required
          :error="errors.employees"
        />
        <FormControl
          v-model="form.segments"
          type="multiselect"
          size="sm"
          label="Relevant industry"
          placeholder="Select"
          :options="SEGMENT_OPTIONS"
          required
          :error="errors.segments"
        />
      </div>

      <!-- Optional, and deliberately so. These two are what a partner actually
           reads before the first call, but demanding prose to finish signing up
           is how you get "asdf" in both boxes. -->
      <FormControl
        v-model="form.operations"
        type="textarea"
        size="sm"
        :rows="3"
        label="Describe your current operations"
        placeholder="e.g. Orders come in over email and WhatsApp, we track stock in spreadsheets, and invoicing runs through Tally."
      />
      <FormControl
        v-model="form.problems"
        type="textarea"
        size="sm"
        :rows="3"
        label="What problems are you looking to solve?"
        placeholder="e.g. Our spreadsheets and Tally don't talk to each other, so month-end reconciliation takes days and stock counts are often wrong."
      />

      <!-- Full width, like the three screens before it. It was auto-width to
           start with — the design draws it that way, and the argument was that a
           full-width bar under two textareas reads as a fifth field. But it made
           this the one control in the whole flow with a different width, which
           is what you notice flicking between the steps. -->
      <Button type="submit" variant="solid" size="md" class="w-full" label="Continue" />
    </form>
  </AuthShell>
</template>
