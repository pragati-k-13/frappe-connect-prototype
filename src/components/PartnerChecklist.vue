<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Alert, Avatar, Badge, Button, Dialog, Dropdown, FormControl, dialog, toast } from 'frappe-ui'
import { List, ListCell, ListRow } from 'frappe-ui/list'
import CompanyInformationDialog from './CompanyInformationDialog.vue'
import TierIcon from './TierIcon.vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
} from '../lib/accordion'
import { SELECTABLE_COUNTRY } from '../data/company'
import { isEmail } from '../utils/auth'
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
const router = useRouter()

// Only the owner fills the checklist in, and only while it isn't submitted;
// everyone else sees where it stands. A done step stays editable, but
// Frappe reviews what was sent, so a submission pauses every step until the
// owner withdraws it.
const isOwner = computed(() => store.partnerRole === 'owner')
const rejected = computed(() => account.edits.review?.status === 'rejected')
const approved = computed(() => account.edits.review?.status === 'approved')
// Sent back by Frappe: everything reopens at once to fix and resubmit.
const canEdit = computed(() => isOwner.value && !account.edits.submitted && !approved.value)
// Press's last step: the owner chooses when to move on to the partner view.
// The demo's Bronze view is its own seeded firm.
function becomeActivePartner() {
  store.setPartnerTier('bronze-up')
  router.push(store.partnerHome)
}

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
    // As press: the holder's name only once they confirm. Until then the
    // request is just an email, and the name isn't shown to the partner.
    holder: c.status === 'linked' ? (c.holder ?? c.ref) : c.ref,
    who: c.status === 'linked' && c.holder ? c.ref : null,
    status: c.status,
  })),
])
// The holder's email: `who`, or the name itself when linked by email alone.
function resend(row) {
  toast.success(`Verification email sent to ${row.who ?? row.holder}`)
}
// Resend for a pending one; Unlink last, red, in its own group.
function rowActions(row) {
  return [
    ...(row.status === 'pending' ? [{ label: 'Resend email', icon: 'lucide-mail', onClick: () => resend(row) }] : []),
    { group: 'Remove', hideLabel: true, options: [{ label: 'Unlink', icon: 'lucide-unlink', theme: 'red', onClick: () => unlink(row) }] },
  ]
}
// frappe-ui's danger dialog gives Cancel an outline; actions make it subtle.
function unlink(row) {
  dialog.danger({
    // Short enough for one line: the certificate goes in the message.
    title: `Unlink ${row.holder}?`,
    message: `Their ${row.type} certificate won’t count until you link it again.`,
    actions: [
      { label: 'Cancel' },
      {
        label: 'Unlink',
        variant: 'solid',
        theme: 'red',
        onClick: () => {
          account.unlinkBeginnerCert(row)
          toast.success(`Unlinked the ${row.type} certificate for ${row.holder}`)
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
// The demo's "MRR reaches" event sets it to the target.
const mrrCurrent = computed(() =>
  account.edits.mrrReached ? mrrTarget.value : account.edits.fresh ? 0 : standing.value.mrr.current,
)
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

const baseSteps = computed(() => [
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
    description: 'Link two Framework or ERPNext certificates. Each holder confirms by email.',
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
// Sent back: a flagged step reopens with the reviewer's comment in place of
// its description, and a badge for where it stands. It counts as not done
// until something in it changes, so Resubmit stays locked until then.
// "Updated" is gray: changed, not judged — only a reviewer can say it's right.
const flags = computed(() => (rejected.value ? (account.edits.review.flags ?? {}) : {}))
const steps = computed(() =>
  baseSteps.value.map((s) => {
    const flag = flags.value[s.value]
    if (!flag) return s
    const changed = account.stepSnapshots[s.value] !== flag.snapshot
    return {
      ...s,
      completed: s.completed && changed,
      description: flag.comment,
      flag: changed ? { label: 'Updated', theme: 'gray' } : { label: 'Changes requested', theme: 'amber' },
    }
  }),
)
const flaggedCount = computed(() => Object.keys(flags.value).length)

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
  () => canEdit.value && steps.value.every((s) => s.completed),
)
function submit() {
  const again = rejected.value
  sendForApproval(again)
}
function sendForApproval(again) {
  account.submitForApproval()
  toast.success(again ? 'Resubmitted for approval' : 'Details submitted for approval')
}

// ── Approved ────────────────────────────────────────────────────────────────
// Once, the first time the owner sees the page after approval: what they've
// earned, and the way on. Review takes days, so this greets them on return;
// the notification tells them before.
const approvalOpen = ref(false)
watch(
  () => approved.value && !account.edits.review?.seen,
  (show) => {
    if (show) {
      approvalOpen.value = true
      account.markApprovalSeen()
    }
  },
  { immediate: true },
)
// Reversible (submit again), so a neutral confirm, not a red one. Cancel is
// subtle, as everywhere else here, hence `actions`.
function withdraw() {
  dialog.confirm({
    title: 'Withdraw your submission?',
    message: 'Frappe stops reviewing it until you submit again.',
    actions: [
      { label: 'Cancel' },
      {
        label: 'Withdraw',
        variant: 'solid',
        onClick: () => {
          account.withdrawSubmission()
          toast.success('Submission withdrawn')
        },
      },
    ],
  })
}

// ── Company information ─────────────────────────────────────────────────────
// Press's three-step form: `CompanyInformationDialog`.
const profileOpen = ref(false)
function openProfile() {
  profileOpen.value = true
}

// ── Link a certificate ──────────────────────────────────────────────────────
// Press's inputs, in onboarding and the partner dashboard alike: the
// certificate type and the holder's email. As the partner dashboard does, it
// checks the email as it's typed and says only how many certificates match,
// never the holder's name. Faked here: "sw…" is already counted by another
// partner; any other address finds one. Opens filled in for the demo.
const certTypes = [
  { label: 'ERPNext', value: 'ERPNext' },
  { label: 'Frappe Framework', value: 'Framework' },
]
const linkOpen = ref(false)
const certType = ref('ERPNext')
const certEmail = ref('')
const domain = computed(() => account.edits.email?.split('@')[1] ?? 'lumen.example')
// The demo's holders, revealed only when they confirm.
const DEMO_HOLDERS = { kavya: 'Kavya Rao', arvind: 'Arvind Menon', nisha: 'Nisha Pillai', rohan: 'Rohan Desai', farah: 'Farah Khan' }
const holderFor = (email) => {
  const local = email.split('@')[0]
  return DEMO_HOLDERS[local] ?? local.charAt(0).toUpperCase() + local.slice(1)
}
// Set on send, so the check doesn't re-run against the certificate it just
// linked and flash "already linked" while the dialog closes.
const sent = ref(false)
const certCheck = computed(() => {
  if (sent.value) return { found: 1 }
  const email = certEmail.value.trim()
  if (!isEmail(email)) return null
  if (/^sw/i.test(email)) return { error: 'Another partner already counts this certificate. Your partner managers can help.' }
  if (account.edits.linkedCerts.some((c) => c.ref === email && c.name === certType.value))
    return { error: `${email} is already linked here for ${certTypeLabel.value}.` }
  return { found: 1 }
})
const certTypeLabel = computed(() => certTypes.find((t) => t.value === certType.value)?.label)
function openLink() {
  sent.value = false
  certType.value = 'ERPNext'
  // The first demo holder not already linked, so the demo never opens on an
  // "already linked" error.
  const taken = new Set(account.edits.linkedCerts.map((c) => c.ref))
  const local = Object.keys(DEMO_HOLDERS).find((l) => !taken.has(`${l}@${domain.value}`)) ?? 'kavya'
  certEmail.value = `${local}@${domain.value}`
  linkOpen.value = true
}
function saveLink() {
  if (!certCheck.value?.found) return
  const email = certEmail.value.trim()
  sent.value = true
  account.linkBeginnerCert({ name: certType.value, full: true, ref: email, holder: holderFor(email) })
  linkOpen.value = false
  toast.success(`Verification email sent to ${email}`)
}
</script>

<template>
  <div class="fc-page-list py-8">
    <div class="flex flex-col gap-6">
      <!-- The headline and what approval brings, as one section before the
           steps that get it. Cards are static: no hover, no link. Icons match
           the sidebar items they open. -->
      <section class="space-y-4">
        <h1 class="text-xl font-semibold text-ink-gray-9">{{ approved ? "You’re a Bronze partner" : "Get approved for leads and a listing" }}</h1>
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
                <Badge v-if="step.flag" :theme="step.flag.theme" :label="step.flag.label" class="shrink-0" />
                <Badge v-else-if="step.summaryRight" :label="step.summaryRight" class="shrink-0" />
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
                              <Badge v-if="item.status === 'pending'" theme="amber" size="sm" label="Email sent" class="shrink-0" />
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

        <!-- The one button keeps its place: Submit, then Withdraw in the same
             slot and size once submitted, with why the steps are paused
             beside it. -->
        <!-- Sent back: the reviewer's comment stays above the button until the
             owner resubmits. Unlike press there's no "Start new application":
             the steps reopen at once and nothing is lost, so the fix is the
             next thing to do, then Resubmit. -->
        <Alert
          v-if="rejected"
          theme="red"
          title="Frappe sent your application back"
          :description="flaggedCount > 1 ? `Make the changes on ${flaggedCount} steps, then resubmit.` : 'Make the requested changes, then resubmit.'"
        />
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <template v-if="approved">
            <!-- The headline says approved; the button is the way on. -->
            <Button variant="solid" size="md" class="w-full sm:w-auto" :disabled="!isOwner" label="Start using Connect" @click="becomeActivePartner">
              <template #prefix><span class="lucide-circle-check size-4" aria-hidden="true" /></template>
            </Button>
          </template>
          <template v-else-if="account.edits.submitted">
            <Button v-if="isOwner" size="md" label="Withdraw" @click="withdraw" />
            <!-- Quiet: the hidden step buttons and Withdraw already say the rest. -->
            <p class="min-w-0 text-p-sm text-ink-gray-5" role="status">
              Under review since {{ longDate(account.edits.submitted) }}
            </p>
          </template>
          <Button
            v-else
            variant="solid"
            size="md"
            class="w-full sm:w-auto"
            :disabled="!canSubmit"
            :label="rejected ? 'Resubmit for approval' : 'Submit for approval'"
            @click="submit"
          >
            <!-- Locked until every step is done; the lock opens when it is.
                 Both icons share one slot and cross-fade, the closed one
                 shrinking and blurring out as the open one settles in. -->
            <template #prefix>
              <span class="fc-lock relative size-4" :data-open="canSubmit" aria-hidden="true">
                <span class="fc-lock-closed lucide-lock absolute inset-0 size-4" />
                <span class="fc-lock-open lucide-lock-open absolute inset-0 size-4" />
              </span>
            </template>
          </Button>
        </div>
      </section>
    </div>

    <CompanyInformationDialog v-model:open="profileOpen" />

    <!-- ── Approved, once ────────────────────────────────────────────── -->
    <!-- The approval, once: Frappe's bronze seal, centred, with the perks
         now on and the way on stacked under them. -->
    <Dialog v-model:open="approvalOpen" size="md" bare>
      <!-- No ×: "Later" closes it, as do Esc and a click outside. -->
      <div class="flex flex-col items-center px-6 pb-6 pt-8 text-center">
        <TierIcon tier="bronze" size="xl" celebrate />
        <h2 class="mt-5 text-xl font-semibold text-ink-gray-8">You’re a Frappe Bronze partner!</h2>
        <!-- Centred as a block, read down the left: one line of checks. -->
        <ul class="mt-2.5 flex flex-col items-start gap-2 text-left">
          <li v-for="p in perks" :key="p.key" class="flex items-center gap-2 text-base text-ink-gray-8">
            <span class="lucide-check size-4 shrink-0 text-ink-green-7" aria-hidden="true" />
            {{ p.title }}
          </li>
        </ul>
        <div class="mt-10 flex w-full flex-col gap-2">
          <Button variant="solid" size="md" class="w-full" label="Start using Connect" @click="becomeActivePartner" />
          <Button size="md" class="w-full" label="Later" @click="approvalOpen = false" />
        </div>
      </div>
    </Dialog>

    <!-- ── Link a certificate ──────────────────────────────────────────── -->
    <Dialog v-model:open="linkOpen" size="md" title="Link a certificate">
      <form class="space-y-4" novalidate @submit.prevent="saveLink">
        <FormControl v-model="certType" type="select" label="Certificate type" :options="certTypes" />
        <div class="space-y-1.5">
          <FormControl
            v-model="certEmail"
            type="email"
            label="Holder’s email"
            placeholder="name@company.com"
            autofocus
            :error="certCheck?.error"
          />
          <!-- What press's check says: a count, not who. -->
          <p v-if="certCheck?.found" class="flex items-center gap-1.5 text-p-sm text-ink-gray-6">
            <span class="lucide-circle-check size-4 shrink-0 text-ink-green-5" aria-hidden="true" />
            Found {{ certCheck.found }} {{ certTypeLabel }} certificate for {{ certEmail.trim() }}
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="linkOpen = false" />
          <Button type="submit" variant="solid" :disabled="!certCheck?.found" label="Send verification email" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
/* The Submit lock: a state change seen once or twice, so it can carry a
   little delight. 220ms strong ease-out; scale from 0.8, never 0; a 2px blur
   bridges the two icons so it reads as one lock opening. */
.fc-lock > span {
  transition:
    opacity 220ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1),
    filter 220ms cubic-bezier(0.23, 1, 0.32, 1);
}
.fc-lock-open,
.fc-lock[data-open='true'] .fc-lock-closed {
  opacity: 0;
  transform: scale(0.8);
  filter: blur(2px);
}
.fc-lock[data-open='true'] .fc-lock-open {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}
@media (prefers-reduced-motion: reduce) {
  .fc-lock > span {
    transition: opacity 150ms ease;
    transform: none !important;
    filter: none !important;
  }
}
</style>
