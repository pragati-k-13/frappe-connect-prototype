<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Badge, Button, Dialog, Dropdown, FormControl, dialog, toast } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import CompanyInformationDialog from './CompanyInformationDialog.vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
} from '../lib/accordion'
import { SELECTABLE_COUNTRY } from '../data/company'
import { TIERS, longDate, standingFor } from '../data/partnership'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import dayjs from 'dayjs'
import meeraPhoto from '../assets/leads/meera-shah.jpg'
import arjunPhoto from '../assets/leads/arjun-kapoor.jpg'
import frappeCloudLogo from '../assets/frappe-cloud.png'
import lumenLogo from '../assets/lumen-digital.svg'
import northbeamLogo from '../assets/northbeam-systems.svg'

// A Beginner's Partnership page: the checklist to becoming a partner.
//
// ⚠️ COPIED FROM FRAPPE CLOUD (press, `dashboard/src/onboarding`,
// `PartnerOnboardingStepsAccordion.vue`): the same steps, accordion, copy and
// styling, so a firm that has met it there meets the same thing here. Press's
// right column (the firm card, Unregister, resources) is left out: the firm
// is in the sidebar header and Resources is in the sidebar.
//
// What differs from press: there is no "Register" step, because signing up for
// Connect already made the firm a Beginner. MRR is the firm's own Frappe Cloud
// billing, since a Beginner has no partner code to link customers with.
const store = useConnectStore()
const account = usePartnerAccountStore()

// Only the owner fills the checklist in; everyone else sees where it stands.
const canEdit = computed(() => store.partnerRole === 'owner' && !account.edits.submitted)

// ── What the steps read ─────────────────────────────────────────────────────
const standing = computed(() => standingFor('beginner'))
const profileDone = computed(() => Boolean(account.edits.firmProfile) || !account.edits.fresh)
// Started but not saved: the dialog has kept what was filled in.
const profileStarted = computed(() => !profileDone.value && Boolean(account.edits.firmProfileDraft))

// Only confirmed certificates count: one linked by ID or email waits for its
// holder to confirm by email first, as in press.
// Team members whose certificate still counts here.
const certifiedTeam = computed(() =>
  account.team.filter((p) => p.counts && !(account.edits.unlinkedCerts ?? []).includes(p.id)),
)
const certCount = computed(
  () => certifiedTeam.value.length + account.edits.linkedCerts.filter((c) => c.status === 'linked').length,
)
// Every certificate on the step, confirmed or waiting: the team's own, then
// the ones linked here. Listed in the step rather than behind press's "Check
// link status" dialog, so a pending one shows where the count is.
const certRows = computed(() => [
  ...certifiedTeam.value.map((p) => ({
    key: p.email,
    teamId: p.id,
    title: `${p.cert.name} certification`,
    type: p.cert.name,
    holder: p.name,
    who: p.email,
    status: 'linked',
  })),
  ...account.edits.linkedCerts.map((c, i) => ({
    key: `${c.ref}-${i}`,
    index: i,
    title: `${c.name} certification`,
    type: c.name,
    // Linked by ID or email with no name yet: the email stands in as the name.
    holder: c.holder ?? c.ref,
    who: c.holder ? c.ref : null,
    status: c.status,
  })),
])
function resend() {
  toast.success('Verification email sent')
}
// Resend for a pending one; Unlink last, red, in its own group.
function rowActions(row) {
  return [
    ...(row.status === 'pending' ? [{ label: 'Resend email', icon: 'lucide-mail', onClick: resend }] : []),
    { group: 'Remove', hideLabel: true, options: [{ label: 'Unlink', icon: 'lucide-unlink', theme: 'red', onClick: () => unlink(row) }] },
  ]
}
// frappe-ui's danger dialog gives Cancel an outline; actions make it subtle.
function unlink(row) {
  dialog.danger({
    title: `Unlink ${row.holder}’s certificate?`,
    message: 'It won’t count until you link it again.',
    actions: [
      { label: 'Cancel' },
      {
        label: 'Unlink',
        variant: 'solid',
        theme: 'red',
        onClick: () => {
          account.unlinkBeginnerCert(row)
          toast.success(`Unlinked ${row.holder}’s ${row.title}`)
        },
      },
    ],
  })
}
const certsDone = computed(() => certCount.value >= 2)

// Press's targets: ₹10,000 in India, $100 elsewhere. A firm that has just
// signed up has no billing yet.
const country = computed(
  () =>
    account.edits.firmProfile?.country ??
    (account.edits.fresh ? (account.edits.country ?? SELECTABLE_COUNTRY) : null),
)
const currency = computed(() => (country.value === 'India' ? 'INR' : standing.value.mrr.currency))
const mrrTarget = computed(() => (currency.value === 'INR' ? 10_000 : 100))
const mrrCurrent = computed(() => (account.edits.fresh ? 0 : standing.value.mrr.current))
const fmt = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.value, maximumFractionDigits: 0 }).format(amount)
const fcTeam = computed(() => account.edits.frappeCloudTeam)
// Nothing counts until a team is connected.
const mrrDone = computed(() => Boolean(fcTeam.value) && mrrCurrent.value >= mrrTarget.value)
// The demo's stand-in for the team picked on Frappe Cloud: the firm's name,
// or before the profile has one, the work email's domain (ravi@brightpath.example
// → Brightpath), as a team is named after the company, not the person.
const fromDomain = (email) => {
  const d = email?.split('@')[1]?.split('.')[0]
  return d ? d.charAt(0).toUpperCase() + d.slice(1) : null
}
function connectFrappeCloud() {
  account.connectFrappeCloud(account.firmName ?? fromDomain(account.edits.email) ?? 'Your firm')
  toast.success('Frappe Cloud connected')
}

const steps = computed(() => [
  {
    value: 'step-profile',
    title: 'Complete your company profile',
    completed: profileDone.value,
    // One line for every state, saying what to have ready before starting:
    // the documents are what send people off to look. The button carries
    // the progress. (Press: "Before you continue, we need to know more…")
    description: 'Your company’s details, logo and certificate of incorporation.',
    actionLabel: canEdit.value
      ? profileDone.value
        ? 'Edit company profile'
        : profileStarted.value
          ? 'Finish company profile'
          : 'Fill out company profile'
      : null,
    onClick: openProfile,
  },
  {
    value: 'step-certificates',
    title: 'Link at least two Frappe School certificates',
    completed: certsDone.value,
    description: 'Link two Framework or ERPNext certificates from Frappe School. Each holder confirms by email.',
    certs: true,
    link: { text: 'Browse batches', url: 'https://school.frappe.io/lms/batches' },
    summaryRight: certsDone.value ? null : `${Math.min(certCount.value, 2)} / 2`,
    actionLabel: canEdit.value ? 'Link certificate' : null,
    onClick: openLink,
  },
  // Connecting Frappe Cloud is part of this step, not one of its own: it
  // exists only so MRR can be tracked. Until then there's no count, rather
  // than a "$0" that reads as billing nothing.
  fcTeam.value
    ? {
        value: 'step-mrr',
        title: `Reach ${fmt(mrrTarget.value)} MRR on Frappe Cloud`,
        completed: mrrDone.value,
        description: `Tracked from the ${fcTeam.value} team’s Frappe Cloud invoices.`,
        // The count stays once the target is met: MRR keeps moving, unlike a
        // linked certificate.
        summaryRight: `${fmt(mrrCurrent.value)} / ${fmt(mrrTarget.value)}`,
      }
    : {
        value: 'step-mrr',
        title: `Reach ${fmt(mrrTarget.value)} MRR on Frappe Cloud`,
        completed: false,
        description: 'Connect your Frappe Cloud team to track this.',
        actionLabel: canEdit.value ? 'Connect Frappe Cloud' : null,
        onClick: connectFrappeCloud,
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

// ── What approval brings ────────────────────────────────────────────────────
// Bronze's perks from the rubric. ⚠️ Whether approval means Bronze is still
// open: Bronze's own bar in `TIERS` is far above this checklist's.
const perks = [
  { key: 'leads', title: 'Leads from businesses', body: 'Sent to you on Connect.' },
  { key: 'listing', title: 'Listed partner profile', body: 'Shown in the partner directory.' },
  { key: 'discount', title: `${TIERS.bronze.discount}% off Frappe Cloud`, body: 'On your firm’s invoices.' },
]
// The pictures are slices of the real product with real assets, so they read
// as the thing itself: invented leads with Unsplash portraits
// (`assets/leads/README.md`), the firm's row in the directory, and a Frappe
// Cloud invoice. Real client logos stay out: a
// real company shown as a lead would be a false claim about it.
const leads = [
  {
    name: 'Meera Shah',
    photo: meeraPhoto,
    unread: true,
    preview: 'We run two plants in Pune and need help moving production planning onto ERPNext.',
  },
  {
    name: 'Arjun Kapoor',
    photo: arjunPhoto,
    preview: 'Our stores are on Tally and we want to switch before the next financial year.',
  },
]
// A fixed illustration of a listing, whoever is signed in: the demo firm with
// its made-up logo. Built from the signed-in firm, it would pair Lumen's logo
// with another firm's name, and change as the profile filled in.
const listing = { name: 'Lumen Digital', city: 'Pune, India' }
// A made-up neighbor, not a real partner: a real firm faded under ours would
// read as a ranking.
const neighbor = { name: 'Northbeam Systems', city: 'Bengaluru, India', logo: northbeamLogo }
const invoiceMonth = dayjs().format('MMMM YYYY')

// ── Submit ──────────────────────────────────────────────────────────────────
const canSubmit = computed(
  () => store.partnerRole === 'owner' && !account.edits.submitted && steps.value.every((s) => s.completed),
)
function submit() {
  account.submitForApproval()
  toast.success('Details submitted for approval')
}

// ── Company information ─────────────────────────────────────────────────────
// Press's three-step form: `CompanyInformationDialog`.
const profileOpen = ref(false)
function openProfile() {
  profileOpen.value = true
}

// ── Link a certificate ──────────────────────────────────────────────────────
// By ID or the holder's email, as in press. The lookup is faked: under 6
// characters finds nothing, "SW…" is already claimed by another partner,
// anything else matches an ERPNext certificate. DEMO_CERT_ID, the field's
// placeholder, finds a named holder so the demo can be tried end to end.
const DEMO_CERT_ID = 'FS-ERP-20481'
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
  if (v.toUpperCase() === DEMO_CERT_ID)
    return (found.value = { name: 'ERPNext', full: true, holder: 'Kavya Rao', ref: 'kavya@lumen.example', issued: '2026-10-18', expires: '2028-10-18' })
  found.value = { name: 'ERPNext', full: true, ref: v, issued: '2026-10-18', expires: '2028-10-18' }
}
function saveLink() {
  account.linkBeginnerCert(found.value)
  linkOpen.value = false
  toast.success('Verification email sent')
}
</script>

<template>
  <div class="fc-page-list py-8">
    <div class="flex flex-col gap-6">
      <!-- The headline and what approval brings, as one section before the
           steps that get it. Cards are static: no hover, no link. Icons match
           the sidebar items they open. -->
      <section class="space-y-4">
        <h1 class="text-xl font-semibold text-ink-gray-9">Get approved for leads and a listing</h1>
        <ul class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!-- Title and one line, then the picture. Each is a small, cropped
               piece of the product the perk lives in, with real words only on
               the one line it's about. Decorative for screen readers: the
               title carries it. The mock's shadow is the "Beautiful md" preset
               (MengTo/Skills beautiful-shadows), off frappe-ui's scale: layered,
               softer and wider than shadow-sm. Its 1px ring is the mock's edge,
               so it has no border. -->
          <li v-for="perk in perks" :key="perk.key" class="h-52 overflow-hidden rounded-6 border border-outline-gray-1 bg-surface-gray-1 p-5">
            <p class="text-base-medium text-ink-gray-7">{{ perk.title }}</p>
            <p class="text-pretty text-p-sm text-ink-gray-6">{{ perk.body }}</p>
            <div
              class="-mr-4 mt-6 h-36 rounded-4 bg-surface-base p-3 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] lg:-mr-10"
              aria-hidden="true"
            >
              <!-- Leads in Messages: a photo, the name, a preview. The newest is
                   unread; the one below fades. -->
              <div v-if="perk.key === 'leads'">
                <div
                  v-for="(lead, i) in leads"
                  :key="lead.name"
                  class="flex items-center gap-2.5 py-2.5 first:pt-0"
                >
                  <img :src="lead.photo" alt="" class="size-7 shrink-0 rounded-full object-cover" :class="i > 0 && 'opacity-50'" />
                  <span class="min-w-0 flex-1" :class="i > 0 && 'opacity-50'">
                    <span class="flex items-center gap-2.5">
                      <span class="min-w-0 flex-1 truncate text-sm font-medium text-ink-gray-8">{{ lead.name }}</span>
                      <!-- One slot for the dot on every row, so the rows line up. -->
                      <span class="mr-6 size-1.5 shrink-0 rounded-full bg-surface-blue-7" :class="!lead.unread && 'invisible'" />
                    </span>
                    <!-- The first line of their message, fading out toward the
                         crop rather than ending in an ellipsis. -->
                    <span class="block overflow-hidden whitespace-nowrap text-xs text-ink-gray-5 [mask-image:linear-gradient(to_right,black_55%,transparent)]">{{ lead.preview }}</span>
                  </span>
                </div>
              </div>

              <!-- The firm's row in the directory: a made-up neighbor below,
                   then a skeleton row where the crop cuts, so no real content
                   is cut in half. -->
              <div v-else-if="perk.key === 'listing'" class="-m-3">
                <div class="flex items-center gap-2.5 px-3 py-2.5">
                  <img :src="lumenLogo" alt="" class="size-7 shrink-0 rounded-3" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-ink-gray-8">{{ listing.name }}</span>
                    <span v-if="listing.city" class="block truncate text-xs text-ink-gray-5">{{ listing.city }}</span>
                  </span>
                </div>
                <div class="flex items-center gap-2.5 px-3 py-2.5">
                  <img :src="neighbor.logo" alt="" class="size-7 shrink-0 rounded-3 opacity-50" />
                  <span class="min-w-0 flex-1 opacity-50">
                    <span class="block truncate text-sm font-medium text-ink-gray-8">{{ neighbor.name }}</span>
                    <span class="block truncate text-xs text-ink-gray-5">{{ neighbor.city }}</span>
                  </span>
                </div>
                <div class="flex items-center gap-2.5 px-3 py-2.5">
                  <span class="size-7 shrink-0 rounded-3 bg-surface-gray-2" />
                  <span class="flex-1 space-y-1.5">
                    <span class="block h-2 w-1/2 rounded-full bg-surface-gray-2" />
                    <span class="block h-2 w-1/3 rounded-full bg-surface-gray-2" />
                  </span>
                </div>
              </div>

              <!-- A Frappe Cloud invoice: the discount as a percentage, so
                   nothing reads as a quoted price. -->
              <div v-else>
                <div class="flex items-center gap-2.5 border-b border-outline-gray-1 pb-2.5">
                  <img :src="frappeCloudLogo" alt="" class="size-7 shrink-0 rounded-3 object-contain" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-ink-gray-8">Frappe Cloud invoice</span>
                    <span class="block truncate text-xs text-ink-gray-5">{{ invoiceMonth }}</span>
                  </span>
                </div>
                <div class="mr-6 flex items-center justify-between pt-2.5 text-sm">
                  <span class="text-ink-gray-6">Tier discount</span>
                  <span class="text-ink-green-5">−{{ TIERS.bronze.discount }}%</span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <!-- The steps and the submit that closes them, as one section. The rows
           carry their own top padding, so the title sits closer than the
           page's section gap. -->
      <section aria-labelledby="steps-title" class="mt-10 flex flex-col gap-6">
        <div>
          <h2 id="steps-title" class="mb-2 text-base-semibold text-ink-gray-8">Your steps to approval</h2>
          <AccordionRoot v-model="openStep" type="single" collapsible class="w-full">
            <AccordionItem
              v-for="step in steps"
              :key="step.value"
              :value="step.value"
              class="border-b border-outline-gray-1 last:border-b-0"
            >
              <!-- The row toggles too, but the chevron is the control: a real
                   button, and the one stop for the keyboard. -->
              <AccordionHeader
                class="m-0 flex cursor-pointer items-center gap-3 py-5 text-left data-[state=open]:pb-1 text-base font-medium text-ink-gray-8"
                @click="toggle(step.value, $event)"
              >
                <!-- Done: a filled green circle with a white check. -->
                <span
                  v-if="step.completed"
                  class="flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-green-7"
                  aria-hidden="true"
                >
                  <span class="lucide-check size-2.5 text-ink-base" />
                </span>
                <span v-else class="lucide-circle-dashed size-4 shrink-0 text-ink-gray-5" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <span
                    class="text-base font-medium text-ink-gray-7"
                    :class="step.completed && 'line-through'"
                  >
                    {{ step.title }}<span class="text-ink-red-5"> *</span>
                  </span>
                </span>
                <!-- The count, gray in every state: the check already says done. -->
                <Badge v-if="step.summaryRight" :label="step.summaryRight" class="shrink-0" />
                <!-- Not reka's AccordionTrigger: that puts `data-state="open"` on it,
                     and frappe-ui's Button reads that as pressed (it's how a
                     Dropdown trigger stays filled while its menu is open). -->
                <Button
                  variant="ghost"
                  :aria-expanded="openStep === step.value"
                  :aria-label="openStep === step.value ? `Collapse ${step.title}` : `Expand ${step.title}`"
                  @click="openStep = openStep === step.value ? '' : step.value"
                >
                  <template #icon>
                    <span
                      class="lucide-chevron-down size-4 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                      :class="openStep === step.value && 'rotate-180'"
                      aria-hidden="true"
                    />
                  </template>
                </Button>
              </AccordionHeader>

              <AccordionContent class="fc-accordion-content overflow-hidden text-pretty text-sm leading-relaxed text-ink-gray-6">
                <div class="pb-6 pl-7 pr-1 pt-0">
                  <div class="max-w-prose text-p-base font-normal leading-5 text-ink-gray-6" :class="(step.actionLabel || step.link) && 'mb-4'">
                    <p>{{ step.description }}</p>
                  </div>
                  <!-- The certificates on this step and where each stands: status
                       beside the name, actions on the right. The list runs to
                       the step's right edge, under the chevron. -->
                  <div v-if="step.certs && certRows.length" class="-mr-1 mb-4">
                    <!-- One row per holder, person first: the avatar is who the row is
                         about, and who Resend and Unlink act on.
                         Gameplan's People list: the avatar in its own 2.5rem track so
                         the inset divider starts at the text. 72px rows, the
                         list note's height for two lines. -->
                    <List class="list-gap-3" :columns="['2.5rem', 'minmax(0,1fr)', 'auto']" :row-height="72" divider="inset">
                      <ListRow v-for="item in certRows" :key="item.key" :value="item.key">
                        <ListCell>
                          <Avatar :label="item.holder" size="2xl" />
                        </ListCell>
                        <ListCell>
                          <div class="flex min-w-0 flex-col gap-1">
                            <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <span class="min-w-0 truncate text-base-medium text-ink-gray-8">{{ item.holder }}</span>
                              <Badge v-if="item.status === 'pending'" theme="amber" size="sm" label="Pending" class="shrink-0" />
                              <Badge v-else size="sm" label="Linked" class="shrink-0" />
                            </div>
                            <p class="truncate text-p-sm text-ink-gray-6">{{ [item.type, item.who].filter(Boolean).join(' · ') }}</p>
                          </div>
                        </ListCell>
                        <ListCell class="justify-end">
                          <Dropdown
                            v-if="canEdit"
                            :options="rowActions(item)"
                            :button="{ icon: 'lucide-more-horizontal', variant: 'ghost', 'aria-label': `More for ${item.holder}` }"
                            align="end"
                          />
                        </ListCell>
                      </ListRow>
                    </List>
                  </div>
                  <div v-if="step.actionLabel || step.link" class="flex flex-wrap items-center gap-2">
                    <Button v-if="step.actionLabel" variant="solid" :label="step.actionLabel" @click="step.onClick" />
                    <Button v-if="step.link" :label="step.link.text" :href="step.link.url" icon-right="lucide-arrow-up-right" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </AccordionRoot>
        </div>

        <div class="flex justify-start">
          <Button
            variant="solid"
            size="md"
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
      </section>
    </div>

    <CompanyInformationDialog v-model:open="profileOpen" />

    <!-- ── Link a certificate ──────────────────────────────────────────── -->
    <Dialog v-model:open="linkOpen" size="md" title="Link a certificate">
      <form class="space-y-4" novalidate @submit.prevent="found ? saveLink() : lookUp()">
        <FormControl
          v-model="certInput"
          label="Certificate ID, or the email they took the exam with"
          :placeholder="DEMO_CERT_ID"
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
