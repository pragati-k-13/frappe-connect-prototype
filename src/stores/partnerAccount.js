import { defineStore } from 'pinia'
import { useConnectStore } from './connect'
import {
  customersFor,
  linkRequestsFor,
  teamFor,
} from '../data/partnerAccount'
import { activitySeed, customerFacts, followUpsSeed } from '../data/records'

// What the partner changes in the demo: customers added and approved, link
// requests handled, billing switches, notes, the team, the CRM connection.
// Seeds come from `data/partnerAccount.js`; this holds only the changes, kept
// per demo tier so switching tier shows each firm as it was left.
//
// Separate from `stores/connect.js` because none of it touches the business
// side, and that store is already the whole business demo.

const blank = () => ({
  added: [],
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
  // Profile: plain fields that publish at once, media added, and client logos
  // waiting on Frappe's review (`{ logos, at }`, or `{ rejected }`).
  profile: {},
  media: [],
  logoReview: null,
  // The signed-in person's name, once they change it in their settings.
  me: null,
  // Per lead or customer id: follow-ups logged, activity recorded here.
  followUps: {},
  activity: {},
})

export const usePartnerAccountStore = defineStore('partnerAccount', {
  state: () => ({ byTier: { beginner: blank(), 'bronze-up': blank() } }),

  getters: {
    tier: () => useConnectStore().partnerTier,
    edits(state) {
      return state.byTier[this.tier]
    },

    customers() {
      const connect = useConnectStore()
      const approved = linkRequestsFor(this.tier).filter((r) => this.edits.handled[r.id] === 'approved')
      const seeded = customersFor(this.tier, connect.partnershipState).map((c) => {
        const req = approved.find((r) => r.matches === c.id)
        return req ? { ...c, codeShared: null, linked: '2026-10-30', linkedSites: req.sites } : c
      })
      // An approved request with no hand-added match becomes a new customer.
      const fromRequests = approved
        .filter((r) => !r.matches)
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
      return [...seeded, ...fromRequests, ...this.edits.added]
        .filter((c) => !this.edits.removedCustomers.includes(c.id))
        .map((c) => ({
        ...c,
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
    addCustomer({ name, contact, email }) {
      const id = `added-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      this.edits.added.push({
        id,
        name,
        contact,
        email,
        source: 'own',
        billing: 'customer',
        stage: 'onboarding',
        codeShared: null,
        mrr: 0,
        sites: [],
      })
      return id
    },
    markCodeShared(id) {
      const c = this.edits.added.find((x) => x.id === id)
      if (c) c.codeShared = '2026-10-30'
    },
    editCustomer(id, patch) {
      this.edits.customerEdits[id] = { ...(this.edits.customerEdits[id] ?? {}), ...patch }
    },
    removeCustomer(id) {
      this.edits.removedCustomers.push(id)
    },
    restoreCustomer(id) {
      this.edits.removedCustomers = this.edits.removedCustomers.filter((x) => x !== id)
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
    addMedia(item) {
      this.edits.media.push(item)
    },
    submitLogos(logos) {
      this.edits.logoReview = { logos, at: '2026-10-30' }
    },
  },
})
