// A pack's scope as rows, in the scope document's order — ONE definition, read
// by the pack page ("What the sessions cover") and the scope dialog, so the two
// can't describe the same pack differently.
//
// Setup, each module as the business runs it (sell, buy, stock, books, then
// make), Data and users. Setup and Data and users are the ERPNext document's,
// so the HR pack has its two modules only.
import IconSetup from '~icons/lucide/settings-2'
import IconData from '~icons/lucide/database'
import IconTrade from '~icons/lucide/arrow-right-left'
import { PACK_SCOPE, ERPNEXT_SETUP, ERPNEXT_DATA } from './data/packs'
import { SCOPE_ICONS } from './scopeIcons'

const SCOPE_ORDER = ['selling', 'buying', 'inventory', 'accounting', 'manufacturing', 'hrms', 'payroll']

// ⚠️ BUYING AND SELLING ARE ONE ROW: mirror flows, each orders to payment.
// Inside, each flow keeps its own line, so the two "payment"s don't run
// together as one list.
export const scopeRows = (pack) => {
  let modules = [...(pack?.areas ?? [])]
    .sort((x, y) => SCOPE_ORDER.indexOf(x) - SCOPE_ORDER.indexOf(y))
    .map((key) => ({ key, icon: SCOPE_ICONS[key], ...PACK_SCOPE[key] }))
  const selling = modules.find((m) => m.key === 'selling')
  const buying = modules.find((m) => m.key === 'buying')
  if (selling && buying) {
    modules = [
      { key: 'trade', icon: IconTrade, label: 'Buying and selling', lines: [buying.flow, selling.flow] },
      ...modules.filter((m) => m !== selling && m !== buying),
    ]
  }
  if (!pack?.apps.includes('erpnext')) return modules
  return [
    { key: 'setup', icon: IconSetup, ...ERPNEXT_SETUP },
    ...modules,
    { key: 'data', icon: IconData, ...ERPNEXT_DATA },
  ]
}

// A row's points run as one line of names joined by commas, in order, reports
// included. Names after the first lose their capital unless they're an
// acronym. Long points stay one per line. Setup and Data and users are written
// as a sentence (`sentence`).
export const pointsOf = (m) => [...(m.flow ?? m.items), ...(m.reports ?? [])]
export const isProse = (points) => points.every((p) => p.length <= 32)
export const commas = (points) =>
  points.map((p, i) => (i && /^[A-Z][a-z]/.test(p) ? p[0].toLowerCase() + p.slice(1) : p)).join(', ')
