import { computed, ref } from 'vue'
import { useConnectStore } from '../stores/connect'
import { usePartnerAccountStore } from '../stores/partnerAccount'
import { beginnerThreads, crmLeads, partnerThreads } from '../data/partnerView'
import { CRMS } from '../data/partnerAccount'
import { updateMessage } from '../data/messages'

// The partner's leads, shared by the list and the lead page, so a reply sent
// on the page shows on the list when you go back. One copy per demo tier,
// since each tier is a different firm; it resets on reload like the rest of
// the demo.
//
// Two sources (PARTNER-VIEW-PLAN.md, "Lead to customer"):
//   Connect brief  its thread, stage, owner and probability
//   CRM            only while CRM sync is on; no thread, stage set in the CRM
// Nobody adds a lead by hand in Connect: that belongs in the CRM.

const byTier = {
  beginner: { threads: ref(beginnerThreads()), crm: ref(crmLeads('beginner')) },
  'bronze-up': { threads: ref(partnerThreads()), crm: ref(crmLeads('bronze-up')) },
}

export const CLOSED = ['Won', 'Lost', 'Junk', 'Closed']
export const isClosed = (t) => CLOSED.includes(t.stage)
export const isCrm = (t) => t.source === 'crm'
export const needsReply = (t) => !isClosed(t) && t.messages?.at(-1)?.from === 'them'
export const lastAt = (t) => t.messages?.at(-1)?.at ?? t.at ?? 0
// Who the other side is, as far as this partner knows. Until shortlisting the
// honest answer is nobody in particular.
export const companyName = (t) => t.company?.name ?? 'Anonymous company'
// The stage, with colour only where it says the lead is finished.
export const stageTheme = (stage) => ({ Won: 'green', Lost: 'red', Junk: 'gray', Closed: 'gray' })[stage] ?? 'blue'

export const useLeads = () => {
  const store = useConnectStore()
  const account = usePartnerAccountStore()
  return computed(() => {
    const tier = byTier[store.partnerTier] ?? byTier['bronze-up']
    return account.edits.crm ? [...tier.threads.value, ...tier.crm.value] : tier.threads.value
  })
}

// Who the demo's signed-in person is, as a Team id: the firm's owner, or its
// salesperson when the demo role is Sales.
export const meFor = (store) =>
  store.partnerTier === 'beginner'
    ? store.partnerRole === 'sales' ? 'yusuf-karim' : 'sana-malik'
    : store.partnerRole === 'sales' ? 'rahul-verma' : 'farhan-qureshi'

// ── Lead to customer ────────────────────────────────────────────────────────
const domain = (email) => email?.split('@')[1]?.toLowerCase() ?? ''

// The customer this lead's company already is, once the company is known.
//   auto     same Connect account, or the CRM's organization: no question
//   suggest  one the firm linked itself, guessed from the email domain
export function matchFor(lead, customers) {
  if (!lead.company) return null
  if (lead.customerId) {
    const c = customers.find((x) => x.id === lead.customerId)
    return c ? { customer: c, auto: true } : null
  }
  if (isCrm(lead) && lead.organization) {
    const c = customers.find((x) => x.name === lead.organization)
    if (c) return { customer: c, auto: true }
  }
  const sameAccount = customers.find((x) => x.source === 'connect' && x.name === lead.company.name)
  if (sameAccount) return { customer: sameAccount, auto: true }
  const d = domain(lead.company.email)
  const byDomain = d && customers.find((x) => x.source === 'own' && domain(x.email) === d)
  return byDomain ? { customer: byDomain, auto: false } : null
}

// Won: by the business hiring in Connect, or by the CRM. Adds the project to
// the matched customer, or makes a new one as Onboarding, not linked yet.
// ── Hire request ────────────────────────────────────────────────────────────
// A Connect lead turns Won only when the business hires in Connect, since the
// hire is where they agree to the terms. Picking Won asks them to: the stage
// stays put until they accept. A line in the thread marks each step.
const event = (lead, kind) => lead.messages.push({ id: `${kind}-${Date.now()}`, from: 'you', kind, at: Date.now() })
export function sendHireRequest(lead, account, by) {
  lead.hireRequest = { at: Date.now() }
  event(lead, 'hire-sent')
  account.log(lead.id, { by, kind: 'note', text: `asked ${lead.company.name} to confirm the hire` })
}
export function withdrawHireRequest(lead, account, by) {
  if (!lead.hireRequest) return
  lead.hireRequest = null
  event(lead, 'hire-withdrawn')
  account.log(lead.id, { by, kind: 'note', text: 'withdrew the hire request' })
}
export function declineHireRequest(lead, account) {
  lead.hireRequest = null
  lead.messages.push({ id: `hire-declined-${Date.now()}`, from: 'them', kind: 'hire-declined', at: Date.now() })
  account.log(lead.id, { by: lead.company.contact, kind: 'note', text: 'declined the hire request' })
}

// The business hired another partner: the lead is Lost to a competitor, any
// request is closed, and the thread ends there.
export function hiredElsewhere(lead, account) {
  const by = lead.company?.contact ?? 'The business'
  account.log(lead.id, { by, kind: 'change', field: 'Stage', from: lead.stage, to: 'Lost' })
  lead.messages.push({ id: `hired-other-${Date.now()}`, from: 'them', kind: 'hired-other', request: Boolean(lead.hireRequest), at: Date.now() })
  lead.stage = 'Lost'
  lead.closed = { stage: 'Lost', reason: 'Lost to competitor' }
  lead.hireRequest = null
}

export function winLead(lead, account) {
  const by = isCrm(lead) ? crmLabel(account) : lead.company.contact
  const match = matchFor(lead, account.customers)
  const target = match && (match.auto || lead.customerMatch === 'yes') ? match.customer : null
  account.log(lead.id, { by, kind: 'change', field: 'Stage', from: lead.stage, to: 'Won' })
  lead.stage = 'Won'
  lead.closed = { stage: 'Won' }
  lead.hireRequest = null
  if (!isCrm(lead)) lead.messages.push({ id: `hired-${Date.now()}`, from: 'them', kind: 'hired', at: Date.now() })
  if (target) {
    account.attachLead(target.id, lead.id)
    lead.customerId = target.id
    lead.createdCustomer = false
    account.log(target.id, { by, kind: 'note', text: `${isCrm(lead) ? 'won' : 'hired you for'} ${lead.project}` })
  } else {
    lead.customerId = account.addWonCustomer(lead)
    lead.createdCustomer = true
  }
}

// Moved back out of Won in the CRM: a live lead again. The customer the win
// made goes too, unless it has sites or other projects by now.
export function reopenLead(lead, stage, account) {
  const by = crmLabel(account)
  account.log(lead.id, { by, kind: 'change', field: 'Stage', from: 'Won', to: stage })
  const c = account.customers.find((x) => x.id === lead.customerId)
  lead.stage = stage
  lead.closed = null
  if (!c) return
  const others = c.leadIds.filter((id) => id !== lead.id)
  const hasSites = c.sites.length || c.linkedSites?.length || c.linked
  if (lead.createdCustomer && !others.length && !hasSites) {
    account.dropWonCustomer(c.id)
    account.log(lead.id, { by, kind: 'note', text: `${c.name} removed from Customers` })
  } else {
    account.detachLead(c.id, lead.id)
    account.log(c.id, { by, kind: 'note', text: `${lead.project} reopened as a lead` })
  }
  lead.customerId = null
  lead.createdCustomer = false
}

export const crmLabel = (account) => CRMS[account.edits.crm?.crm]?.label ?? 'Your CRM'

// A Connect customer's thread: the won lead's, which carries on after the
// hire, or for a customer whose bid isn't in this demo, what was said since.
export function threadFor(c, leads, account) {
  const lead = [...c.leadIds].reverse().map((id) => leads.find((l) => l.id === id)).find((l) => l && !isCrm(l))
  if (lead) return { lead, messages: lead.messages, project: lead.project, company: lead.company, brief: lead.brief }
  if (c.source !== 'connect') return null
  return {
    lead: null,
    messages: account.edits.threads[c.id] ?? [],
    project: c.project,
    company: { name: c.name, contact: c.contact },
    brief: null,
  }
}
export const customerNeedsReply = (c, leads, account) => threadFor(c, leads, account)?.messages.at(-1)?.from === 'them' &&
  threadFor(c, leads, account).messages.at(-1).kind === 'text'

// ── Requirements updates (docs/edit-requirements.md) ────────────────────────
// The business edits in Connect, so the partner product has no button for it;
// the demo plays that side. The new version arrives as an update message with
// the old one beside it, and the lead is marked until the partner answers.
//
// ⚠️ THE EARLIER MESSAGES KEEP THEIR VERSION. A seeded requirements message
// reads `lead.brief`, which now changes, so it is pinned to the old copy first.
const NEXT_BAND = { 'inr-1': 'inr-2', 'inr-2': 'inr-3', 'inr-3': 'inr-4', 'usd-1': 'usd-2', 'usd-2': 'usd-3', 'usd-3': 'usd-4' }
const LATER = { now: 'quarter', quarter: 'half', half: 'none', none: 'half' }
export function businessUpdatesRequirements(lead) {
  const prev = JSON.parse(JSON.stringify(lead.brief))
  for (const m of lead.messages) if (m.kind === 'brief' && !m.brief) m.brief = prev
  const extra = ' We have also added two depots in Goa, which need the same tracking from day one.'
  const next = {
    ...prev,
    // A second run changes the wording rather than adding the same sentence.
    scope: prev.scope.includes(extra.trim())
      ? prev.scope.replace('two depots in Goa', 'three depots in Goa and Belgaum')
      : `${prev.scope.trim()}${extra}`,
    budget: NEXT_BAND[prev.budget] ?? prev.budget,
    timeline: LATER[prev.timeline] ?? 'half',
  }
  lead.brief = next
  lead.messages.push(updateMessage('them', prev, next))
  lead.requirementsUpdated = true
}

// "Quote still stands": confirms the figure against the newest version.
export function confirmQuote(lead) {
  lead.messages.push({ id: `confirmed-${Date.now()}`, from: 'you', kind: 'confirmed', at: Date.now() })
  lead.requirementsUpdated = false
}

// A new quote. The old card reads "Replaced" from here on.
export function sendQuote(lead, bid) {
  lead.messages.push({ id: `bid-${Date.now()}`, from: 'you', kind: 'bid', at: Date.now(), bid })
  lead.requirementsUpdated = false
}
