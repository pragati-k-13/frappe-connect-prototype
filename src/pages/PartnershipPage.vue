<script setup>
import { computed, ref, watch } from 'vue'
import { Avatar, Badge, Button, Dialog, FormControl, ScrollArea, Tooltip, toast } from 'frappe-ui'
import { NumberCard } from 'frappe-ui/charts'
import ConnectShell from '../components/ConnectShell.vue'
import TierIcon from '../components/TierIcon.vue'
import PageIntro from '../components/PageIntro.vue'
import EmptyState from '../components/EmptyState.vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import {
  TIERS,
  longDate,
  shortMoney,
  nextTier,
  shortDate,
  standingFor,
} from '../data/partnership'

// SCREEN — Partnership: where the firm stands with Frappe and what gets it up
// a tier. See PARTNER-VIEW-PLAN.md §1.
//
// One anchor per tier. A Beginner's is the milestone checklist; from Bronze up
// it is the next tier's criteria as tiles, the audit behind PMM's. Everything
// else on the page (certificates, the managers) supports that one block and sits lighter than it.

const store = useConnectStore()

const account = usePartnerAccountStore()
// The consultants count comes from Certificates below, so linking one moves it.
const s = computed(() => ({
  ...standingFor(store.partnerTier, store.partnershipState),
  consultants: account.team.filter((p) => p.counts).length,
}))
const beginner = computed(() => store.partnerTier === 'beginner')
// Bronze and up lead with the firm; the tier is the badge beside it. At Gold
// there is no next tier, so the name stands alone.
const title = computed(() => {
  if (beginner.value) return next.value ? `${tier.value.label} partner, working toward ${next.value.label}` : `${tier.value.label} partner`
  return next.value ? `${s.value.firm.name}, working toward ${next.value.label}` : s.value.firm.name
})
const tier = computed(() => TIERS[s.value.tier])
const next = computed(() => nextTier(s.value.tier))
const currency = computed(() => s.value.mrr.currency)

// Who can do what (see the roles table in the plan). Contributions is Frappe's
// view of the money, for the owner and finance; the audit is the owner's call.
const canSeeContributions = computed(() => ['owner', 'finance'].includes(store.partnerRole))
const canRequestAudit = computed(() => store.partnerRole === 'owner')

// ── Certificates ────────────────────────────────────────────────────────────
// The firm's people who hold a Frappe School certificate, which is what the
// consultants criterion counts. Anyone without one isn't listed; their
// certificate is linked from the section's own button, which asks who it's for.
// A person needn't have Connect access to be here. Employees take exams on
// Frappe School themselves; the owner only LINKS a certificate. See
// PARTNER-VIEW-PLAN.md §5.
const CERT_STATUS = {
  expiring: { label: 'Expiring', theme: 'amber' },
  expired: { label: 'Expired', theme: 'red' },
}
// Ones that need action lead: expired, then expiring, then the rest in team
// order (the sort is stable).
const NEEDS_ACTION = { expired: 0, expiring: 1 }
const certified = computed(() =>
  account.team.filter((p) => p.cert).sort((a, b) => (NEEDS_ACTION[a.status] ?? 2) - (NEEDS_ACTION[b.status] ?? 2)),
)
const certLine = (p) =>
  !p.cert.full
    ? `${p.cert.name} · Doesn’t count toward tier`
    : p.status === 'expired'
      ? `${p.cert.name} · Expired ${longDate(p.cert.expires)}`
      : `${p.cert.name} · Until ${longDate(p.cert.expires)}`

// Connect looks the certificate up and shows the match before saving. In this
// prototype the lookup is faked: an ID under 6 characters finds nothing, one
// starting with "SW" is already claimed by another partner, anything else
// matches the person.
const linking = ref(false)
// From a row the person is known; from the section's button they're picked.
const pickPerson = ref(false)
const personId = ref('')
const linkFor = computed(() => account.team.find((p) => p.id === personId.value) ?? null)
// Anyone whose certificate could be linked or renewed.
const personOptions = computed(() =>
  account.team.filter((p) => p.status !== 'certified').map((p) => ({ label: p.name, value: p.id })),
)
const certInput = ref('')
const certError = ref('')
const personError = ref('')
const found = ref(null)
// A new ID or person means a new lookup: drop the old match so it can't be
// linked by mistake.
watch([certInput, personId], () => {
  found.value = null
  certError.value = ''
  personError.value = ''
})
function startLink(p = null) {
  pickPerson.value = !p
  personId.value = p?.id ?? ''
  certInput.value = ''
  personError.value = ''
  certError.value = ''
  found.value = null
  linking.value = true
}
function lookUp() {
  const v = certInput.value.trim()
  found.value = null
  if (!linkFor.value) return (personError.value = 'Choose who the certificate is for')
  if (v.length < 6) return (certError.value = 'No certificate matches that ID or email')
  if (/^sw/i.test(v)) return (certError.value = 'Another partner already counts this certificate. Your partner managers can help.')
  certError.value = ''
  found.value = { name: 'ERPNext', full: true, holder: linkFor.value.name, issued: '2026-10-18', expires: '2028-10-18' }
}
function saveLink() {
  account.linkCertificate(linkFor.value.id, found.value)
  linking.value = false
  toast.success(`${linkFor.value.name} is certified`)
}

// ── Bronze and up: the next tier's criteria ─────────────────────────────────
// frappe-ui NumberCards, each reading against its target. MRR is the one that
// moves month to month, so it is the wide card with the year's trend under it;
// consultants and PMM are counts, and the number says it all. The value is a
// preformatted string so MRR reads in lakh (₹5.05L), which `compact` can't do.
const mrrCard = computed(() => {
  if (beginner.value || !next.value) return null
  return {
    value: shortMoney(s.value.mrr.current, currency.value),
    target: shortMoney(next.value.mrr, currency.value),
    history: s.value.mrr.history,
  }
})
const counts = computed(() => {
  if (beginner.value || !next.value) return []
  const n = next.value
  const risk = s.value.risk
  return [
    {
      key: 'consultants',
      label: 'Certified consultants',
      value: s.value.consultants,
      target: n.consultants,
      // Losing a certificate can cost the tier the firm already has.
      risk: risk?.criterion === 'Certified consultants' ? risk : null,
    },
    // PMM only moves through an audit, so the card opens the audit.
    {
      key: 'pmm',
      label: 'PMM level',
      value: s.value.pmm,
      target: n.pmm,
      badge: auditBadge.value,
      opens: true,
    },
  ]
})

// Ready for an audit: every criterion but PMM is met.
const readyForAudit = computed(
  () =>
    !beginner.value &&
    Boolean(next.value) &&
    s.value.mrr.current >= next.value.mrr &&
    s.value.consultants >= next.value.consultants,
)

// ── Beginner: the milestones ────────────────────────────────────────────────
const milestones = computed(() => {
  if (!beginner.value) return []
  // Certifications tick from the Certificates count.
  const list = s.value.milestones.map((m) =>
    m.key === 'cert-2' && s.value.consultants >= 2 ? { ...m, done: '2026-10-30' } : m,
  )
  const firstOpen = list.findIndex((m) => !m.done)
  return list.map((m, i) => ({
    ...m,
    // The audit's lead time sits on the milestone that needs it.
    todo: m.key === 'bronze' ? `PMM ${TIERS.bronze.pmm} audit, requested ${TIERS.bronze.leadDays} days ahead` : m.todo,
    next: i === firstOpen,
    route:
      m.to === 'contributions' && canSeeContributions.value
        ? '/connect/customers?sort=mrr'
        : m.to === 'team'
          ? '/connect/partnership#certificates'
          : null,
  }))
})

// ── The audit ───────────────────────────────────────────────────────────────
// In the panel the PMM card opens, with the past audits. The card's badge says when there
// is something to act on or wait for, so nobody has to open it to find out.
// Its tier is the next one; at Gold it would be the re-audit to keep Gold.
const auditTier = computed(() => next.value ?? tier.value)
const audit = computed(() => s.value.audit ?? { status: 'none' })
const auditOpen = ref(false)

const auditBadge = computed(() => {
  const a = audit.value
  if (a.status === 'requested') return 'Audit requested'
  if (a.status === 'scheduled') return `Audit ${shortDate(a.date)}`
  if (readyForAudit.value) return 'Ready for audit'
  return null
})

const auditLine = computed(() => {
  const a = audit.value
  if (a.status === 'requested') return `Requested ${shortDate(a.requested)}. Frappe will schedule it.`
  if (a.status === 'scheduled') return `On ${longDate(a.date)} with ${a.auditor}.`
  if (readyForAudit.value) return `Request it ${auditTier.value.leadDays} days ahead.`
  return `Request it ${auditTier.value.leadDays} days ahead, once the other ${auditTier.value.label} criteria are met.`
})

function requestAudit() {
  store.setPartnershipState('requested')
  toast.success('Audit requested')
}

</script>

<template>
  <ConnectShell root-label="Partnership">
    <div class="fc-page-list py-8">
      <div>
        <div class="min-w-0 space-y-16">
          <!-- ── The anchor ───────────────────────────────────────────── -->
          <section>
            <PageIntro
              class="!pb-5"
              :title="title"
              :description="beginner ? tier.listing : ''"
            >
              <!-- Bronze and up: the tier as a labelled badge closing the
                   line, so the title never says it twice. -->
              <template v-if="!beginner" #suffix><TierIcon :tier="s.tier" labelled size="lg" /></template>
            </PageIntro>

            <!-- Beginner: the five milestones Frappe tracks, in order. -->
            <template v-if="beginner">
              <h2 class="text-lg-semibold text-ink-gray-8">Your way to Bronze</h2>
              <ol class="mt-3 divide-y divide-outline-gray-1">
                <li v-for="m in milestones" :key="m.key">
                  <component
                    :is="m.route ? 'RouterLink' : 'div'"
                    :to="m.route ?? undefined"
                    class="-mx-2 flex items-center gap-3 rounded-4 px-2 py-3"
                    :class="m.route && 'transition-colors hover:bg-surface-gray-2'"
                  >
                    <span
                      :class="m.done ? 'lucide-circle-check' : 'lucide-circle'"
                      class="size-4 shrink-0 text-ink-gray-5"
                      aria-hidden="true"
                    />
                    <span
                      class="min-w-0 flex-1 text-base"
                      :class="m.next ? 'font-medium text-ink-gray-9' : 'text-ink-gray-8'"
                    >
                      {{ m.label }}
                    </span>
                    <Badge v-if="m.next" theme="blue" variant="subtle" size="sm" label="Next" />
                    <span class="shrink-0 text-sm text-ink-gray-5">
                      {{ m.done ? `Done ${shortDate(m.done)}` : m.todo }}
                    </span>
                    <span
                      v-if="m.route"
                      class="lucide-chevron-right size-4 shrink-0 text-ink-gray-5"
                      aria-hidden="true"
                    />
                  </component>
                </li>
              </ol>
            </template>

            <!-- Bronze and up: the next tier's criteria, one tile each. No
                 heading: the title above already names the tier. Only PMM
                 opens anything; the others have nowhere useful to go. -->
            <template v-else-if="next">
              <h2 class="sr-only">{{ next.label }} needs</h2>
              <!-- MRR wide on the left, the two counts stacked beside it; the
                   MRR card stretches to their height. -->
              <div class="grid gap-3 sm:grid-cols-3">
                <NumberCard
                  class="h-full sm:col-span-2"
                  title="Frappe Cloud MRR"
                  :value="mrrCard.value"
                  :target="mrrCard.target"
                  :sparkline="{ data: mrrCard.history }"
                />
                <div class="grid gap-3">
                  <!-- The card that opens gets a button laid over it: the
                       card renders block elements, which a <button> can't
                       hold. -->
                  <div v-for="c in counts" :key="c.key" class="group relative">
                    <NumberCard
                      class="h-full"
                      :class="
                        c.opens && [
                          'transition-colors group-has-[button:focus-visible]:focus-ring',
                          auditOpen ? '!bg-surface-gray-2' : 'group-hover:!bg-surface-gray-1',
                        ]
                      "
                      :title="c.label"
                      :value="c.value"
                      :target="c.target"
                    >
                      <template #actions>
                        <span class="flex items-center gap-1.5 text-ink-gray-5">
                          <Tooltip v-if="c.risk" :text="c.risk.detail">
                            <Badge theme="red" variant="subtle" size="sm" :label="`${c.risk.tier} at risk`" />
                          </Tooltip>
                          <Badge v-if="c.badge" size="sm" :label="c.badge" />
                          <span v-if="c.opens" class="lucide-chevron-right size-4" aria-hidden="true" />
                        </span>
                      </template>
                    </NumberCard>
                    <button
                      v-if="c.opens"
                      type="button"
                      class="absolute inset-0 rounded-4 outline-none"
                      :aria-label="`${c.label}: ${c.value} of ${c.target}. PMM audit`"
                      :aria-expanded="auditOpen"
                      @click="auditOpen = !auditOpen"
                    />
                  </div>
                </div>
              </div>
            </template>
          </section>

          <!-- ── Certificates ───────────────────────────────────────────────
               What the consultants criterion counts, right under it. -->
          <section id="certificates" class="scroll-mt-6">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg-semibold text-ink-gray-8">Your certified consultants</h2>
              <Button v-if="canRequestAudit" icon-left="lucide-link" label="Link certificate" @click="startLink()" />
            </div>
            <EmptyState v-if="!certified.length" icon="lucide-award" title="No certificates yet" />
            <ul v-else class="mt-3 divide-y divide-outline-gray-1">
              <li v-for="p in certified" :key="p.id" class="flex items-center gap-3 py-3">
                <Avatar :label="p.name" size="xl" class="shrink-0" />
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2">
                    <span class="truncate text-base text-ink-gray-8">{{ p.name }}</span>
                    <Badge v-if="CERT_STATUS[p.status]" :theme="CERT_STATUS[p.status].theme" variant="subtle" :label="CERT_STATUS[p.status].label" />
                  </span>
                  <span class="mt-1 block text-sm text-ink-gray-5">{{ certLine(p) }}</span>
                </span>
                <Button
                  v-if="canRequestAudit && p.status !== 'certified'"
                  icon="lucide-link"
                  :tooltip="`Link a certificate for ${p.name}`"
                  :aria-label="`Link a certificate for ${p.name}`"
                  @click="startLink(p)"
                />
              </li>
            </ul>
          </section>

          <!-- ── Partner managers ────────────────────────────────────────
               A line, not a column: they're who to write to, not something
               to read every visit. Also in the account menu. -->
          <section>
            <h2 class="text-lg-semibold text-ink-gray-8">Partner managers</h2>
            <ul class="mt-3 flex flex-wrap gap-x-8 gap-y-3">
              <li v-for="m in s.managers" :key="m.email" class="flex items-center gap-2.5">
                <Avatar :label="m.name" size="xl" />
                <span class="text-base text-ink-gray-8">{{ m.name }}</span>
                <a :href="`mailto:${m.email}`" :aria-label="`Email ${m.name}`" class="text-sm text-ink-blue-link hover:underline">Email</a>
              </li>
            </ul>
          </section>
        </div>

      </div>
    </div>
    <!-- ── PMM audit, docked ────────────────────────────────────────────────
         The shell's panel, as Invoices and Customers open theirs: it pushes
         the page aside rather than covering it. Where the audit stands, the
         request when it's open, and the past audits. Requesting keeps the
         panel open on its new state. -->
    <template v-if="auditOpen && next" #panel>
      <div class="flex items-center justify-between gap-3 border-b border-outline-gray-1 p-4">
        <span class="truncate text-base-semibold text-ink-gray-9">PMM audit</span>
        <Button variant="ghost" icon="lucide-x" aria-label="Close" @click="auditOpen = false" />
      </div>
      <ScrollArea class="min-h-0 flex-1" viewport-class="p-4 pb-10">
        <div class="space-y-6">
          <div class="space-y-3">
            <p class="text-p-base text-ink-gray-7">{{ auditLine }}</p>
            <template v-if="readyForAudit && audit.status === 'none'">
              <Button v-if="canRequestAudit" variant="solid" label="Request audit" @click="requestAudit" />
              <p v-else class="text-sm text-ink-gray-5">Your firm’s owner can request it</p>
            </template>
          </div>
          <div v-if="s.audits.length">
            <h3 class="text-sm text-ink-gray-5">Past audits</h3>
            <ul class="mt-1 divide-y divide-outline-gray-1">
              <li v-for="a in s.audits" :key="a.date" class="flex items-baseline justify-between gap-3 py-2.5">
                <span class="min-w-0">
                  <span class="text-base text-ink-gray-8">PMM {{ a.pmm }}, {{ a.tier }}</span>
                  <span class="mt-1 block text-sm text-ink-gray-5">{{ a.auditor }}</span>
                </span>
                <span class="shrink-0 text-sm text-ink-gray-5">{{ longDate(a.date) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </ScrollArea>
    </template>

    <!-- ── Link a certificate ───────────────────────────────────────────── -->
    <Dialog
      v-model:open="linking"
      :title="pickPerson ? 'Link a certificate' : `Link a certificate for ${linkFor?.name ?? ''}`"
    >
      <div class="space-y-4">
        <FormControl
          v-if="pickPerson"
          v-model="personId"
          type="select"
          label="Who it’s for"
          :error="personError"
          placeholder="Choose a person"
          :options="personOptions"
        />
        <FormControl
          v-model="certInput"
          label="Certificate ID, or the email they took the exam with"
          :error="certError"
          @keydown.enter.prevent="lookUp"
        />
        <div v-if="found" class="rounded-6 border border-outline-gray-1 p-3">
          <p class="text-base text-ink-gray-8">{{ found.name }} certification</p>
          <p class="mt-1 text-sm text-ink-gray-5">
            {{ found.holder }} · Issued {{ longDate(found.issued) }} · Until {{ longDate(found.expires) }}
          </p>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button label="Cancel" @click="linking = false" />
          <Button v-if="!found" variant="solid" label="Look up" @click="lookUp" />
          <Button v-else variant="solid" label="Link certificate" @click="saveLink" />
        </div>
      </div>
    </Dialog>
  </ConnectShell>
</template>
