import { reactive } from 'vue'

// What the Notifications panel lists, per side. Seeded, like the rest of the
// demo: each item is something that happened, and opens where it happened.
// Shape is the panel's (frappe-patterns NotificationsPanel):
// { id, from: { name, image? }, action, target, time, read, route }.
//
// Read state lives here for the session; no storage.
const minutesAgo = (m) => Date.now() - m * 60_000

const PARTNER = () => [
  { id: 'pn1', from: { name: 'Halcyon Retail' }, action: 'updated the requirements on', target: 'Payroll for three new stores', time: minutesAgo(20), read: false, route: '/connect/leads/pv-halcyon' },
  { id: 'pn2', from: { name: 'Anonymous company' }, action: 'sent you a new lead,', target: 'Stock and expiry for a pharma distributor', time: minutesAgo(95), read: false, route: '/connect/leads/pv-pharma' },
  { id: 'pn3', from: { name: 'Frappe' }, action: 'scheduled your', target: 'Online audit for November 24', time: minutesAgo(60 * 26), read: false, route: '/connect/audits' },
  { id: 'pn4', from: { name: 'Northwind' }, action: 'is interested in your quote for', target: 'Warehouse barcode workflow', time: minutesAgo(60 * 30), read: true, route: '/connect/leads/pv-northwind' },
  { id: 'pn5', from: { name: 'Frappe School' }, action: 'says a certificate expires soon:', target: 'Reeta Naryal, ERPNext', time: minutesAgo(60 * 72), read: true, route: '/connect/partnership' },
]

const BUSINESS = () => [
  { id: 'bn1', from: { name: 'Promantia' }, action: 'quoted on', target: 'Warehouse barcode workflow', time: minutesAgo(30), read: false, route: '/connect/messages?thread=promantia' },
  { id: 'bn2', from: { name: 'Tridots Tech' }, action: 'replied in', target: 'Warehouse barcode workflow', time: minutesAgo(120), read: false, route: '/connect/messages?thread=tridots-tech' },
  { id: 'bn3', from: { name: 'Frappe' }, action: 'moved', target: 'ERPNext implementation for Northwind to the next stage', time: minutesAgo(60 * 20), read: false, route: '/connect/projects' },
]

export const notifications = reactive({ partner: PARTNER(), business: BUSINESS() })

export const resetNotifications = () => {
  notifications.partner = PARTNER()
  notifications.business = BUSINESS()
}
