<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Combobox, Dialog, FormControl, toast } from 'frappe-ui'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '../lib/accordion'
import { COUNTRY_OPTIONS_INDIA_ONLY, SELECTABLE_COUNTRY } from '../data/company'
import { longDate, standingFor } from '../data/partnership'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'

// A Beginner's Partnership page: the checklist to becoming a partner.
//
// ⚠️ COPIED FROM FRAPPE CLOUD (press, `dashboard/src/onboarding`,
// `PartnerOnboardingStepsAccordion.vue`): the same steps, accordion, copy and
// styling, so a firm that has met it there meets the same thing here. Press's
// right column (the firm card, Unregister, resources) is left out: the firm
// is in the sidebar header and Resources is in the sidebar.
//
// What differs from press: there is no "Register" step, because signing up for
// Connect already made the firm a Beginner. The company profile is two fields
// rather than press's three-screen form. MRR is the firm's own Frappe Cloud
// billing, since a Beginner has no partner code to link customers with.
const store = useConnectStore()
const account = usePartnerAccountStore()

// Only the owner fills the checklist in; everyone else sees where it stands.
const canEdit = computed(() => store.partnerRole === 'owner' && !account.edits.submitted)

// ── What the steps read ─────────────────────────────────────────────────────
const standing = computed(() => standingFor('beginner'))
const profileDone = computed(() => Boolean(account.edits.firmProfile) || !account.edits.fresh)

const certCount = computed(
  () => account.team.filter((p) => p.counts).length + account.edits.linkedCerts.length,
)
const certsDone = computed(() => certCount.value >= 2)

// Press's targets: ₹10,000 in India, $100 elsewhere. A firm that has just
// signed up has no billing yet.
const country = computed(
  () => account.edits.firmProfile?.country ?? (account.edits.fresh ? SELECTABLE_COUNTRY : null),
)
const currency = computed(() => (country.value === 'India' ? 'INR' : standing.value.mrr.currency))
const mrrTarget = computed(() => (currency.value === 'INR' ? 10_000 : 100))
const mrrCurrent = computed(() => (account.edits.fresh ? 0 : standing.value.mrr.current))
const fmt = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.value, maximumFractionDigits: 0 }).format(amount)
const mrrProgress = computed(() => Math.min(100, Math.round((mrrCurrent.value / mrrTarget.value) * 100)))
const mrrDone = computed(() => mrrCurrent.value >= mrrTarget.value)

const steps = computed(() => [
  {
    value: 'step-profile',
    title: 'Complete your company profile',
    completed: profileDone.value,
    description:
      'Before you continue, we need to know more about your company to understand how your company can benefit from becoming a Frappe Partner.',
    actionLabel: canEdit.value ? 'Fill out company information' : null,
    onClick: openProfile,
  },
  {
    value: 'step-certificates',
    title: 'Link at least two Frappe School certificates',
    completed: certsDone.value,
    description:
      'Link two Framework or ERPNext certificates from Frappe School. We will send a verification email to each certificate holder to confirm the link.',
    linkPrefix: 'Don’t have certification?',
    link: { text: 'Browse upcoming batches', url: 'https://school.frappe.io/lms/batches' },
    summaryRight: certsDone.value ? null : `${Math.min(certCount.value, 2)} / 2 linked`,
    actionLabel: canEdit.value ? 'Link certificate' : null,
    onClick: openLink,
  },
  {
    value: 'step-mrr',
    title: `Reach ${fmt(mrrTarget.value)} MRR on Frappe Cloud`,
    completed: mrrDone.value,
    description:
      'We track this automatically from your firm’s own Frappe Cloud invoices. No manual update is needed.',
    summaryRight: mrrDone.value ? null : `${fmt(mrrCurrent.value)} / ${fmt(mrrTarget.value)}`,
    mrr: true,
  },
])

// The next step still to do opens on its own, as in press.
const openStep = ref('')
// A click anywhere on the row opens or closes it; the chevron button handles
// its own.
function toggle(value, e) {
  if (e.target.closest('button')) return
  openStep.value = openStep.value === value ? '' : value
}
const nextPending = computed(() => steps.value.find((s) => !s.completed)?.value ?? '')
watch(nextPending, (v) => (openStep.value = v), { immediate: true })

// ── Submit ──────────────────────────────────────────────────────────────────
const canSubmit = computed(
  () => store.partnerRole === 'owner' && !account.edits.submitted && steps.value.every((s) => s.completed),
)
function submit() {
  account.submitForApproval()
  toast.success('Details submitted for approval')
}

// ── Company information ─────────────────────────────────────────────────────
const profileOpen = ref(false)
const profileSubmitted = ref(false)
const profile = ref({ name: '', country: SELECTABLE_COUNTRY })
const profileError = computed(() =>
  profileSubmitted.value && !profile.value.name.trim() ? 'Enter your company name' : undefined,
)
function openProfile() {
  profile.value = { name: account.firmName ?? '', country: SELECTABLE_COUNTRY }
  profileSubmitted.value = false
  profileOpen.value = true
}
function saveProfile() {
  profileSubmitted.value = true
  if (profileError.value) return
  account.saveFirmProfile({ name: profile.value.name.trim(), country: profile.value.country })
  profileOpen.value = false
  toast.success('Company information saved')
}

// ── Link a certificate ──────────────────────────────────────────────────────
// By ID or the holder's email, as in press. The lookup is faked: under 6
// characters finds nothing, "SW…" is already claimed by another partner,
// anything else matches an ERPNext certificate.
const linkOpen = ref(false)
const certInput = ref('')
const certError = ref('')
const found = ref(null)
watch(certInput, () => {
  found.value = null
  certError.value = ''
})
function openLink() {
  certInput.value = ''
  certError.value = ''
  found.value = null
  linkOpen.value = true
}
function lookUp() {
  const v = certInput.value.trim()
  if (v.length < 6) return (certError.value = 'No certificate matches that ID or email')
  if (/^sw/i.test(v)) return (certError.value = 'Another partner already counts this certificate. Your partner managers can help.')
  found.value = { name: 'ERPNext', full: true, ref: v, issued: '2026-10-18', expires: '2028-10-18' }
}
function saveLink() {
  account.linkBeginnerCert(found.value)
  linkOpen.value = false
  toast.success('Certificate linked')
}
</script>

<template>
  <div class="fc-page-list py-8">
    <div class="flex flex-col gap-6">
      <h1 class="text-xl font-semibold text-ink-gray-9">Your journey to becoming a Frappe partner</h1>

      <AccordionRoot v-model="openStep" type="single" collapsible class="w-full">
        <AccordionItem
          v-for="step in steps"
          :key="step.value"
          :value="step.value"
          class="border-b border-outline-gray-1 last:border-b-0"
        >
          <!-- The row toggles too, but the chevron is the trigger: a real
               button, and the one stop for the keyboard. -->
          <AccordionHeader
            class="m-0 flex cursor-pointer items-center gap-3 py-4 text-left data-[state=open]:pb-1 text-base font-medium text-ink-gray-8"
            @click="toggle(step.value, $event)"
          >
            <span
              :class="step.completed ? 'lucide-circle-check text-ink-green-4' : 'lucide-circle-dashed text-ink-gray-5'"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1">
              <span
                class="text-base font-medium text-ink-gray-8"
                :class="step.completed && 'line-through'"
              >
                {{ step.title }}<span class="text-ink-red-4"> *</span>
              </span>
            </span>
            <span v-if="step.summaryRight" class="shrink-0 whitespace-nowrap text-sm font-normal text-ink-gray-6">
              {{ step.summaryRight }}
            </span>
            <AccordionTrigger as-child>
              <Button variant="ghost" :aria-label="openStep === step.value ? `Collapse ${step.title}` : `Expand ${step.title}`">
                <template #icon>
                  <span
                    class="lucide-chevron-down size-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                    :class="openStep === step.value && 'rotate-180'"
                    aria-hidden="true"
                  />
                </template>
              </Button>
            </AccordionTrigger>
          </AccordionHeader>

          <AccordionContent class="fc-accordion-content overflow-hidden text-pretty text-sm leading-relaxed text-ink-gray-6">
            <div class="pb-4 pl-7 pr-1 pt-0">
              <div class="mb-4 max-w-prose text-p-base font-normal leading-5 text-ink-gray-6">
                <p>{{ step.description }}</p>
                <p v-if="step.link" class="mt-2">
                  {{ step.linkPrefix }}
                  <a :href="step.link.url" target="_blank" rel="noopener noreferrer" class="underline">
                    {{ step.link.text }}
                  </a>
                </p>
              </div>
              <div v-if="step.mrr" class="mb-4 flex max-w-prose flex-col gap-2">
                <div class="h-2 overflow-hidden rounded-full bg-surface-gray-2">
                  <div class="h-full rounded-full bg-surface-gray-7 transition-all" :style="{ width: `${mrrProgress}%` }" />
                </div>
                <div class="flex items-center justify-between text-p-base text-ink-gray-6">
                  <span>{{ fmt(mrrCurrent) }} current MRR</span>
                  <span>{{ fmt(mrrTarget) }} target</span>
                </div>
              </div>
              <Button v-if="step.actionLabel" variant="solid" :label="step.actionLabel" @click="step.onClick" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>

      <div class="flex justify-start">
        <Button
          variant="solid"
          class="w-full sm:w-auto"
          :disabled="!canSubmit"
          :label="account.edits.submitted ? 'Submitted for approval' : 'Submit for approval'"
          @click="submit"
        >
          <template #prefix>
            <span class="lucide-lock -mr-0.5 size-3.5" aria-hidden="true" />
          </template>
        </Button>
      </div>
    </div>

    <!-- ── Company information ─────────────────────────────────────────── -->
    <Dialog v-model:open="profileOpen" size="md" title="Company information">
      <form class="space-y-4" novalidate @submit.prevent="saveProfile">
        <FormControl v-model="profile.name" label="Company name" autofocus :error="profileError" />
        <!-- India only for now, as on every form that asks: see
             `COUNTRY_OPTIONS_INDIA_ONLY`. -->
        <Combobox
          v-model="profile.country"
          label="Country"
          placeholder="Select a country"
          trigger="button"
          :options="COUNTRY_OPTIONS_INDIA_ONLY"
        />
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="profileOpen = false" />
          <Button type="submit" variant="solid" label="Save" />
        </div>
      </form>
    </Dialog>

    <!-- ── Link a certificate ──────────────────────────────────────────── -->
    <Dialog v-model:open="linkOpen" size="md" title="Link a certificate">
      <form class="space-y-4" novalidate @submit.prevent="found ? saveLink() : lookUp()">
        <FormControl
          v-model="certInput"
          label="Certificate ID, or the email they took the exam with"
          autofocus
          :error="certError"
        />
        <div v-if="found" class="rounded-6 border border-outline-gray-1 p-3">
          <p class="text-base text-ink-gray-8">{{ found.name }} certification</p>
          <p class="mt-1 text-sm text-ink-gray-5">
            {{ found.ref }} · Issued {{ longDate(found.issued) }} · Until {{ longDate(found.expires) }}
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="linkOpen = false" />
          <Button type="submit" variant="solid" :label="found ? 'Link certificate' : 'Look up'" />
        </div>
      </form>
    </Dialog>
  </div>
</template>
