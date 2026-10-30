<script setup>
import { computed } from 'vue'
import { Avatar, Badge, Button, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import TierIcon from '../components/TierIcon.vue'
import PartnerCode from '../components/PartnerCode.vue'
import { useConnectStore } from '../stores/connect'
import {
  TIERS,
  longDate,
  money,
  nextTier,
  shortDate,
  standingFor,
} from '../data/partnership'

// SCREEN — Partnership: where the firm stands with Frappe and what gets it up
// a tier. See PARTNER-VIEW-PLAN.md §1.
//
// One anchor per tier. A Beginner's is the milestone checklist; from Bronze up
// it is the next tier's criteria. Everything else on the page (the audit, the
// code, the history) supports that one block and sits lighter than it.

const store = useConnectStore()

const s = computed(() => standingFor(store.partnerTier, store.partnershipState))
const beginner = computed(() => store.partnerTier === 'beginner')
const tier = computed(() => TIERS[s.value.tier])
const next = computed(() => nextTier(s.value.tier))
const currency = computed(() => s.value.mrr.currency)

// Who can do what (see the roles table in the plan). Contributions is Frappe's
// view of the money, for the owner and finance; the audit is the owner's call.
const canSeeContributions = computed(() => store.partnerRole !== 'sales')
const canRequestAudit = computed(() => store.partnerRole === 'owner')

// ── Bronze and up: the next tier's criteria ─────────────────────────────────
const criteria = computed(() => {
  if (beginner.value || !next.value) return []
  const n = next.value
  const mrrGap = n.mrr - s.value.mrr.current
  const risk = s.value.risk
  return [
    {
      key: 'mrr',
      label: 'Frappe Cloud MRR',
      value: `${money(s.value.mrr.current)} of ${money(n.mrr)}`,
      met: mrrGap <= 0,
      meta: [
        mrrGap > 0 ? `${money(mrrGap)} to go` : null,
        `Last month ${money(s.value.mrr.lastMonth)}`,
        `Updated ${s.value.mrr.updated}`,
      ].filter(Boolean),
      to: canSeeContributions.value ? '/connect/partnership/contributions' : null,
    },
    {
      key: 'consultants',
      label: 'Certified consultants',
      value: `${s.value.consultants} of ${n.consultants}`,
      met: s.value.consultants >= n.consultants,
      warn: risk?.criterion === 'Certified consultants',
      meta: [risk?.criterion === 'Certified consultants' ? risk.detail : 'From Frappe School certificates'],
    },
    {
      key: 'pmm',
      label: 'PMM level',
      value: `${s.value.pmm} of ${n.pmm}`,
      met: s.value.pmm >= n.pmm,
      meta: [],
    },
    {
      key: 'eligibility',
      label: 'Registered company and Frappe Cloud account',
      value: 'Met',
      met: true,
      meta: [],
    },
  ]
})

// Ready for an audit: every criterion but PMM is met.
const readyForAudit = computed(
  () => criteria.value.length > 0 && criteria.value.filter((c) => c.key !== 'pmm').every((c) => c.met),
)

// ── Beginner: the milestones ────────────────────────────────────────────────
const milestones = computed(() => {
  if (!beginner.value) return []
  const firstOpen = s.value.milestones.findIndex((m) => !m.done)
  return s.value.milestones.map((m, i) => ({
    ...m,
    next: i === firstOpen,
    route: m.to === 'contributions' && canSeeContributions.value ? '/connect/partnership/contributions' : null,
  }))
})

// ── The audit ───────────────────────────────────────────────────────────────
// Always shown, so nobody learns about the wait at the last step. Its tier is
// the next one; at Gold it would be the re-audit to keep Gold.
const auditTier = computed(() => next.value ?? tier.value)
const audit = computed(() => s.value.audit ?? { status: 'none' })

function requestAudit() {
  store.setPartnershipState('requested')
  toast.success('Audit requested')
}

</script>

<template>
  <ConnectShell root-label="Partnership">
    <div class="fc-page-wide py-8">
      <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div class="min-w-0 space-y-10">
          <!-- ── The anchor ───────────────────────────────────────────── -->
          <section>
            <div class="flex items-center gap-2">
              <TierIcon v-if="!beginner" :tier="s.tier" />
              <h1 class="text-2xl-semibold text-ink-gray-9">{{ tier.label }}</h1>
            </div>
            <p class="mt-1.5 text-p-sm text-ink-gray-5">
              <template v-if="beginner">{{ tier.listing }}</template>
              <template v-else>{{ tier.discount }}% off Frappe Cloud · {{ tier.listing }}</template>
            </p>

            <!-- Beginner: the five milestones Frappe tracks, in order. -->
            <template v-if="beginner">
              <h2 class="mt-8 text-lg-semibold text-ink-gray-8">Your way to Bronze</h2>
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

            <!-- Bronze and up: the next tier's criteria. -->
            <template v-else-if="next">
              <h2 class="mt-8 text-lg-semibold text-ink-gray-8">{{ next.label }} needs</h2>
              <ul class="mt-3 divide-y divide-outline-gray-1">
                <li v-for="c in criteria" :key="c.key">
                  <component
                    :is="c.to ? 'RouterLink' : 'div'"
                    :to="c.to ?? undefined"
                    class="-mx-2 flex items-start gap-3 rounded-4 px-2 py-3"
                    :class="c.to && 'transition-colors hover:bg-surface-gray-2'"
                  >
                    <span
                      :class="c.warn ? 'lucide-circle-alert' : c.met ? 'lucide-circle-check' : 'lucide-circle'"
                      class="mt-0.5 size-4 shrink-0 text-ink-gray-5"
                      aria-hidden="true"
                    />
                    <span class="min-w-0 flex-1">
                      <span class="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                        <span class="text-base text-ink-gray-8">{{ c.label }}</span>
                        <span class="shrink-0 text-base tabular-nums text-ink-gray-9">{{ c.value }}</span>
                      </span>
                      <span v-if="c.meta.length" class="mt-1.5 block text-sm text-ink-gray-5">
                        {{ c.meta.join(' · ') }}
                      </span>
                    </span>
                    <span
                      v-if="c.to"
                      class="lucide-chevron-right mt-0.5 size-4 shrink-0 text-ink-gray-5"
                      aria-hidden="true"
                    />
                  </component>
                </li>
              </ul>
            </template>
          </section>

          <!-- ── Partner code ─────────────────────────────────────────────
               Right under a Beginner's milestones, since linking a first
               customer is how MRR starts. -->
          <section v-if="beginner">
            <h2 class="text-lg-semibold text-ink-gray-8">Partner code</h2>
            <PartnerCode class="mt-3" :code="s.firm.code" :firm="s.firm.name" />
          </section>

          <!-- ── The audit ───────────────────────────────────────────────── -->
          <section>
            <h2 class="text-lg-semibold text-ink-gray-8">Audit</h2>
            <p class="mt-3 text-p-base text-ink-gray-7">
              {{ auditTier.label }} needs PMM {{ auditTier.pmm }}. Request the audit at least
              {{ auditTier.leadDays }} days before you expect to move up.
            </p>

            <div class="mt-3 text-p-sm text-ink-gray-5">
              <template v-if="audit.status === 'requested'">
                Requested {{ shortDate(audit.requested) }}. Waiting for Frappe to schedule it.
              </template>
              <template v-else-if="audit.status === 'scheduled'">
                Scheduled for {{ longDate(audit.date) }} with {{ audit.auditor }}.
              </template>
              <template v-else-if="readyForAudit">Everything but PMM is met.</template>
              <template v-else>Not requested.</template>
            </div>

            <div v-if="readyForAudit && audit.status === 'none'" class="mt-4">
              <Button
                v-if="canRequestAudit"
                variant="solid"
                label="Request audit"
                @click="requestAudit"
              />
              <p v-else class="text-p-sm text-ink-gray-5">Your firm’s owner can request it.</p>
            </div>
          </section>

          <!-- ── Audit history ───────────────────────────────────────────── -->
          <!-- Absent until there is one: the audit section above already says
               the first is needed for Bronze. -->
          <section v-if="s.audits.length">
            <h2 class="text-lg-semibold text-ink-gray-8">Audit history</h2>
            <ul class="mt-3 divide-y divide-outline-gray-1">
              <li
                v-for="a in s.audits"
                :key="a.date"
                class="flex items-baseline justify-between gap-3 py-3"
              >
                <span class="min-w-0">
                  <span class="text-base text-ink-gray-8">PMM {{ a.pmm }}, {{ a.tier }}</span>
                  <span class="mt-1.5 block text-sm text-ink-gray-5">{{ a.auditor }}</span>
                </span>
                <span class="shrink-0 text-sm text-ink-gray-5">{{ longDate(a.date) }}</span>
              </li>
            </ul>
          </section>

          <!-- Bronze and up: the code sits last. They know where it is. -->
          <section v-if="!beginner">
            <h2 class="text-lg-semibold text-ink-gray-8">Partner code</h2>
            <PartnerCode class="mt-3" :code="s.firm.code" :firm="s.firm.name" />
          </section>
        </div>

        <!-- ── Partner managers ─────────────────────────────────────────── -->
        <aside class="min-w-0">
          <h2 class="text-sm text-ink-gray-5">Partner managers</h2>
          <ul class="mt-3 space-y-4">
            <li v-for="m in s.managers" :key="m.email" class="flex items-center gap-3">
              <Avatar :label="m.name" size="lg" />
              <span class="min-w-0">
                <span class="block truncate text-base text-ink-gray-8">{{ m.name }}</span>
                <a
                  :href="`mailto:${m.email}`"
                  class="mt-0.5 block truncate text-sm text-ink-blue-link hover:underline"
                >
                  {{ m.email }}
                </a>
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  </ConnectShell>
</template>
