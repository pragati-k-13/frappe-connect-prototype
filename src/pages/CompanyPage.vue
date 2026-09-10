<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Badge, Button, FormControl, toast } from 'frappe-ui'
import AuthShell from '../components/AuthShell.vue'
import IconHandshake from '~icons/lucide/handshake'
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

// The four groups from the directory's own taxonomy, not invented ones.
//
// ⚠️ Answering this does NOT narrow the partner list. Partners are tagged at
// the SEGMENT level ("Textile Manufacturing"), and the store filters on
// `answers.segments`; `answers.industry` is the group above that and filters
// nothing. So this question currently records an answer that matching can't
// use. Either the segment question comes back, or `matches()` learns to widen
// a group into its segments.
const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({ label: i.label, value: i.value }))

const form = reactive({
  company: '',
  employees: '',
  industry: '',
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
  if (!form.industry) e.industry = 'Select an industry'
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
    industry: form.industry,
    operations: form.operations.trim(),
    problems: form.problems.trim(),
  })
  toast.success('Account created', { id: 'auth' })
  store.completeLogin()
  router.replace(next.value).then(() => store.runPending())
}

useAuthExit()
</script>

<template>
  <AuthShell title="Tell us more about your company">
    <template #mark>
      <!-- `Avatar` at `xl` — 32px, `rounded-[6px]`, a 16px icon well — rather
           than a hand-rolled box, so the mark maps to a component and a size
           token instead of three guessed values.

           ⚠️ Two things this gives up against the design. `theme="violet"` is
           the component's own pairing, `bg-surface-violet-2` with
           `text-ink-violet-7`: a pale tile with a violet icon, not the design's
           saturated fill with a white one. Avatar has no saturated theme, and
           overriding it means a descendant rule fighting the component's inner
           div, which isn't worth it for a decorative mark.

           ⚠️ It is also still NOT Frappe Connect's own mark — that's a grey
           square with `LucideBlocks`, in the sidebar two clicks from here. Two
           marks for one product, worth resolving before handoff. -->
      <Avatar class="mb-5" size="xl" shape="square" theme="violet" aria-hidden="true">
        <IconHandshake class="size-full" />
      </Avatar>
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
          v-model="form.industry"
          type="select"
          size="sm"
          label="Relevant industry"
          placeholder="Select"
          :options="INDUSTRY_OPTIONS"
          required
          :error="errors.industry"
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
