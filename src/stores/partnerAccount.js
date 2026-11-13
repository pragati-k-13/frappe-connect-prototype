import { defineStore } from 'pinia'
import { setTakingWork } from '../data/takingWork'
import { useConnectStore } from './connect'
import {
  customersFor,
  linkRequestsFor,
  teamFor,
} from '../data/partnerAccount'
import { activitySeed, customerFacts, followUpsSeed } from '../data/records'
import { auditsSeed, todayIso } from '../data/audits'
import { firmFor } from '../data/partnership'

// What the partner changes in the demo: customers approved, link
// requests handled, billing switches, notes, the team, the CRM connection.
// Seeds come from `data/partnerAccount.js`; this holds only the changes, kept
// per demo tier so switching tier shows each firm as it was left.
//
// Separate from `stores/connect.js` because none of it touches the business
// side, and that store is already the whole business demo.

const blank = () => ({
  // Edits to a customer's details, and customers unlinked or deleted.
  customerEdits: {},
  removedCustomers: [],
  handled: {},
  billing: {},
  notes: {},
  invited: [],
  certs: {},
  roles: {},
  removed: [],
  crm: null,
  // Profile: the published fields, media list and client logos, each set by
  // the profile page's Publish.
  profile: {},
  media: null,
  logos: null,
  // Per review id: the partner's public reply, and a report waiting on Frappe
  // (`{ reason }`). A reported review stays up until Frappe decides.
  reviewReplies: {},
  reviewReports: {},
  // The signed-in person's name, once they change it in their settings.
  me: null,
  // Per lead or customer id: follow-ups logged, activity recorded here.
  followUps: {},
  activity: {},
  // Lead to customer: customers made by a win, leads added to a customer that
  // already existed, and messages on a Connect customer that has no lead here.
  won: [],
  projects: {},
  threads: {},
  // PMM audits, newest first. Seeded for Bronze and up; a Beginner has none.
  audits: [],
})

export const usePartnerAccountStore = defineStore('partnerAccount', {
  state: () => ({ byTier: { beginner: blank(), 'bronze-up': { ...blank(), audits: auditsSeed() } } }),

  getters: {
    tier: () => useConnectStore().partnerTier,
    edits(state) {
      // A tier the demo doesn't know falls back to Bronze and up, rather than
      // leaving every page reading `edits` from undefined.
      return state.byTier[this.tier] ?? state.byTier['bronze-up']
    },

    customers() {
      const connect = useConnectStore()
      const approved = linkRequestsFor(this.tier).filter((r) => this.edits.handled[r.id] === 'approved')
      const seeded = customersFor(this.tier, connect.partnershipState)
      // An approved request becomes a customer.
      const fromRequests = approved
        .map((r) => ({
          id: r.id.replace('req-', ''),
          name: r.company,
          contact: r.contact,
          email: r.email,
          source: 'own',
          billing: 'customer',
          stage: 'onboarding',
          linked: '2026-10-30',
          region: r.sites[0]?.region,
          mrr: 0,
          sites: [],
          linkedSites: r.sites,
        }))
      return [...seeded, ...fromRequests, ...this.edits.won]
        .filter((c) => !this.edits.removedCustomers.includes(c.id))
        .map((c) => ({
        ...c,
        leadIds: [...(c.leadIds ?? []), ...(this.edits.projects[c.id] ?? [])],
        ...customerFacts(c.id),
        ...(this.edits.customerEdits[c.id] ?? {}),
        billingSwitch: this.edits.billing[c.id] ?? null,
        notes: this.edits.notes[c.id] ?? '',
      }))
    },

    // Newest first, seeds and what was added here together.
    followUpsOf() {
      return (id) => [...(this.edits.followUps[id] ?? []), ...followUpsSeed(id)].sort((a, b) => b.at - a.at)
    },
    // Oldest first, as a timeline reads.
    activityOf() {
      return (id) => [...activitySeed(id), ...(this.edits.activity[id] ?? [])].sort((a, b) => a.at - b.at)
    },

    audits() {
      return this.edits.audits
    },

    requests() {
      return linkRequestsFor(this.tier).filter((r) => !this.edits.handled[r.id])
    },

    team() {
      const connect = useConnectStore()
      return [...teamFor(this.tier, connect.partnershipState), ...this.edits.invited]
        .filter((p) => !this.edits.removed.includes(p.id))
        .map((p) => {
          const cert = this.edits.certs[p.id]
          const roles = this.edits.roles[p.id] ?? p.roles
          return cert ? { ...p, roles, cert, status: 'certified', counts: cert.full } : { ...p, roles }
        })
    },
  },

  actions: {
    handleRequest(id, outcome) {
      this.edits.handled[id] = outcome
    },
    undoRequest(id) {
      delete this.edits.handled[id]
    },
    // A lead won with no customer to add it to. Onboarding and not on Frappe
    // Cloud yet; the partner code is the next step.
    addWonCustomer(lead) {
      const id = `won-${lead.id}`
      this.edits.won.push({
        id,
        name: lead.company.name,
        contact: lead.company.contact,
        email: lead.company.email,
        phone: lead.company.phone,
        industry: lead.brief?.segments?.[0] ?? '',
        country: lead.brief?.country ?? '',
        source: lead.source === 'crm' ? 'crm' : 'connect',
        billing: 'customer',
        stage: 'onboarding',
        owner: lead.owner,
        mrr: 0,
        sites: [],
        project: lead.project,
        leadIds: [lead.id],
        hired: Date.now(),
      })
      return id
    },
    dropWonCustomer(id) {
      this.edits.won = this.edits.won.filter((c) => c.id !== id)
    },
    attachLead(id, leadId) {
      ;(this.edits.projects[id] ??= []).push(leadId)
    },
    detachLead(id, leadId) {
      this.edits.projects[id] = (this.edits.projects[id] ?? []).filter((x) => x !== leadId)
    },
    // Messages on a Connect customer whose bid isn't in this demo's leads.
    postToCustomer(id, message) {
      ;(this.edits.threads[id] ??= []).push(message)
    },
    editCustomer(id, patch) {
      this.edits.customerEdits[id] = { ...(this.edits.customerEdits[id] ?? {}), ...patch }
    },
    removeCustomer(id) {
      this.edits.removedCustomers.push(id)
    },
    requestPartnerPays(id) {
      this.edits.billing[id] = { to: 'partner', from: '2026-11-01' }
    },
    cancelBillingSwitch(id) {
      delete this.edits.billing[id]
    },
    addFollowUp(id, f) {
      ;(this.edits.followUps[id] ??= []).unshift({ id: `f-${Date.now()}`, ...f })
    },
    log(id, entry) {
      ;(this.edits.activity[id] ??= []).push({ id: `a-${Date.now()}-${Math.random()}`, at: Date.now(), ...entry })
    },
    setNotes(id, text) {
      this.edits.notes[id] = text
    },
    invite({ name, email, roles }) {
      const id = `inv-${email.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      this.edits.invited.push({ id, name, email, roles, cert: null, status: 'none', counts: false, invited: true })
      return id
    },
    linkCertificate(id, cert) {
      this.edits.certs[id] = cert
    },
    setRoles(id, roles) {
      this.edits.roles[id] = roles
    },
    removePerson(id) {
      this.edits.removed.push(id)
    },
    connectCrm(crm) {
      this.edits.crm = crm
    },
    disconnectCrm() {
      this.edits.crm = null
    },
    setProfile(patch) {
      Object.assign(this.edits.profile, patch)
    },
    // Firm settings › Leads. `id` is the firm's directory id: the answer also
    // reaches the client's lists through `data/takingWork`.
    setTaking(on, id) {
      this.edits.profile.taking = on
      setTakingWork(id, on)
    },
    setMedia(list) {
      this.edits.media = list
    },
    setLogos(list) {
      this.edits.logos = list
    },
    replyToReview(id, text) {
      this.edits.reviewReplies[id] = text
    },
    // A new request goes to the top. Frappe assigns the auditor and the date.
    requestAudit({ type, dates }) {
      const id = `AUD-${Date.now()}`
      this.edits.audits.unshift({ id, type, status: 'Requested', auditor: null, requested: todayIso(), date: null, dates, ncs: [] })
      return id
    },
    closeNonConformance(auditId, ncId, measuresTaken) {
      const nc = this.edits.audits.find((a) => a.id === auditId)?.ncs.find((n) => n.id === ncId)
      if (!nc) return
      // The signed-in person, as the account menu names them.
      const me = this.edits.me ?? firmFor(this.tier).person
      Object.assign(nc, { status: 'Closed', measuresTaken, closedBy: me, closedOn: todayIso() })
    },
    reportReview(id, reason) {
      if (reason) this.edits.reviewReports[id] = { reason }
      else delete this.edits.reviewReports[id]
    },
  },
})
