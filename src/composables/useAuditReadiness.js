import { computed } from 'vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { TIERS, nextTier, shortMoney, standingFor } from '../data/partnership'

// Whether the firm can ask for a PMM audit yet: every criterion of the next
// tier but PMM is met. Partnership's badge and the Request audit dialog both
// read it, so the two can't disagree. `missing` names the first criterion
// still short, in one line; null when the firm is ready.
export function useAuditReadiness() {
  const store = useConnectStore()
  const account = usePartnerAccountStore()

  // The consultants count comes from Certificates, so linking one moves it.
  const standing = computed(() => ({
    ...standingFor(store.partnerTier, store.partnershipState),
    consultants: account.team.filter((p) => p.counts).length,
  }))
  const beginner = computed(() => store.partnerTier === 'beginner')
  const next = computed(() => nextTier(standing.value.tier))

  const ready = computed(
    () =>
      !beginner.value &&
      Boolean(next.value) &&
      standing.value.mrr.current >= next.value.mrr &&
      standing.value.consultants >= next.value.consultants,
  )

  const missing = computed(() => {
    if (ready.value) return null
    const s = standing.value
    if (beginner.value) {
      // Certifications tick from the Certificates count, as on Partnership.
      const step = s.milestones.find(
        (m) => !m.done && m.key !== 'bronze' && !(m.key === 'cert-2' && s.consultants >= 2),
      )
      return step ? `You need ${step.todo} before a ${TIERS.bronze.label} audit.` : null
    }
    const n = next.value
    if (!n) return null
    const currency = s.mrr.currency
    if (s.mrr.current < n.mrr)
      return `Frappe Cloud MRR is ${shortMoney(s.mrr.current, currency)} of the ${shortMoney(n.mrr, currency)} ${n.label} needs.`
    return `${s.consultants} of the ${n.consultants} certified consultants ${n.label} needs.`
  })

  return { ready, missing, next }
}
