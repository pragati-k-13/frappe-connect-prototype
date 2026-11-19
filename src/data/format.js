import { PROJECT_APPS } from './partners'
import { OPERATIONS, PROBLEMS } from './company'

// ⚠️ ONE WAY TO SHOW EACH ANSWER. Every screen that shows a business's
// industries or a project's apps goes through these, never its own `join` or
// `[0]`. Screens that each decided for themselves are how the requirements
// showed one industry while the project page showed three.

// "A, B +3": the first `n`, then a count. The full list is `full`, for a
// tooltip or a screen with room.
export const shortList = (items, n) => {
  const list = (items ?? []).filter(Boolean)
  const full = list.join(', ')
  const text = list.length > n ? `${list.slice(0, n).join(', ')} +${list.length - n}` : full
  return { text, full, more: Math.max(list.length - n, 0) }
}

export const appLabels = (values) =>
  (values ?? []).map((v) => PROJECT_APPS.find((a) => a.value === v)?.label ?? v)

// Apps: two names, then a count.
export const appsText = (values) => shortList(appLabels(values), 2)

// An industry as screens show it: "Textile Manufacturing" → "Textile Mfg".
// Pickers keep the full names; anything that reads them back uses this.
export const industryShort = (segment) => (segment ?? '').replace(/ Manufacturing$/, ' Mfg')

// Industries: the main one (the first picked), then a count.
export const industryText = (segments) => shortList((segments ?? []).map(industryShort), 1)

// Countries, short: "India", "India and UAE", "India +2". The long names are
// cut to the ones people say.
const COUNTRY_SHORT = { 'United Arab Emirates': 'UAE', 'United States': 'US', 'United Kingdom': 'UK' }
export const countriesText = (countries) => {
  const list = (countries ?? []).filter(Boolean).map((c) => COUNTRY_SHORT[c] ?? c)
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return list.length > 2 ? `${list[0]} +${list.length - 1}` : list[0] ?? ''
}

// Up to three industries: enough for a business across domains, few enough
// that nobody ticks everything.
export const MAX_INDUSTRIES = 3

// A project named from its apps: "CRM", "ERPNext and CRM",
// "ERPNext, CRM and 3 more".
export const appsName = (values) => {
  const labels = appLabels(values)
  if (labels.length <= 1) return labels[0] ?? ''
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`
  return `${labels[0]}, ${labels[1]} and ${labels.length - 2} more`
}

// What they want fixed, as short names: "Lost leads", "Slow reports". Answers
// that match no option are dropped, as `problemLabels` drops them.
export const fixShort = (values) =>
  (values ?? []).map((v) => PROBLEMS.find((p) => p.value === v)?.short).filter(Boolean)

// How they run today, as the company card says it: "Tools that don't connect".
export const setupShort = (value) => OPERATIONS.find((o) => o.value === value)?.short ?? ''

// Company size, short: "500+", "51–200".
export const sizeShort = (employees) =>
  (employees ?? '').replace(/^More than (\d+)$/, '$1+').replace(/^(\d+) to (\d+)$/, '$1–$2')

// Size and where they are, as one line: "500+ people, India and UAE".
export const peopleLine = (employees, countries) =>
  [employees && `${sizeShort(employees)} people`, countriesText(countries)].filter(Boolean).join(', ')

// How they run today: the tools they named ("Tally, Zoho, Freshdesk"), or, with
// none named, the setup ("Tools that don't connect"). Inside the line every
// tool is mid-sentence, so a leading article is lowercased ("An in-house
// system" → "an in-house system").
export const setupLine = (operations, tools) => {
  const names = (tools ?? []).map((a) => a.replace(/^(An?) (?=[a-z])/, (m) => m.toLowerCase()))
  return names.length ? names.join(', ') : setupShort(operations)
}
