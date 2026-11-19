import { computed, reactive, ref } from 'vue'
import { TIERS, TIMELINES, asksCity, briefErrors, budgetBandsFor, partnerWhere } from '../data/custom'
import { APPS_OTHER, COMPANY_SIZES, CURRENT_APPS, appsInUse, asksApps, problemsFor, segmentOptionsFor } from '../data/company'
import { MAX_INDUSTRIES } from '../data/format'
import { INDIA_CITIES, PARTNERS } from '../data/partners'
import { GEO_CHOICES } from '../data/quiz'
import { useConnectStore } from '../stores/connect'

// The requirements being edited, card by card, in `BriefDetailsDialog`. One
// draft for the whole dialog: each card's pencil opens its fields onto it, and
// one Send in the footer sends every change at once, so partners get a single
// update however many cards were touched. See docs/edit-requirements.md.
//
// ⚠️ TWO KINDS OF CHANGE IN ONE DRAFT. The requirements (`form`) go to
// partners as an update. The company's industries and size (`company`) are
// saved to Settings and reach partners quietly, with no message — see
// `updateCompanyDetails`. Discard drops both; nothing saves before Save/Send.
//
// Made when the first pencil is pressed, dropped on Send or Discard.
export function useRequirementsDraft(projectId) {
  const store = useConnectStore()
  const project = computed(() => store.projects.find((p) => p.id === projectId) ?? null)
  const answers = computed(() => project.value?.answers ?? store.company)

  // Filled once. The project's own starting point when it has one; the
  // company's answers otherwise, which is what was sent.
  const initial = (() => {
    const b = JSON.parse(JSON.stringify(store.briefOf(projectId)))
    for (const k of ['cities', 'tiers', 'regions', 'countries', 'problems']) b[k] = b[k] ?? []
    b.operations = b.operations || answers.value.operations || ''
    if (!b.problems.length) b.problems = [...(answers.value.problems ?? [])]
    b.projectApps = [...(project.value?.apps ?? [])]
    // The tools they use: the project's own pick, else the company's answer.
    b.apps = [...(b.apps ?? appsInUse(answers.value))]
    return b
  })()
  const form = reactive(JSON.parse(JSON.stringify(initial)))
  const formDirty = computed(() => JSON.stringify(form) !== JSON.stringify(initial))
  // From Settings, where it saves: what the next send would carry.
  const companyInitial = { employees: store.company.employees ?? '', segments: [...(store.company.segments ?? [])] }
  const company = reactive(JSON.parse(JSON.stringify(companyInitial)))
  // What changed about the company, as the footer names it.
  const companyChanges = computed(() =>
    [
      JSON.stringify(company.segments) !== JSON.stringify(companyInitial.segments) && 'industries',
      company.employees !== companyInitial.employees && 'company size',
    ].filter(Boolean),
  )
  const companyDirty = computed(() => companyChanges.value.length > 0)
  const dirty = computed(() => formDirty.value || companyDirty.value)
  const showTools = computed(() => asksApps(form.operations))

  // The draft as a brief the reading view can draw: `base` is the version on
  // screen, so anything the draft doesn't hold (the company, the modules)
  // carries over. A setup that names no tools sends none.
  const asBrief = (base, source) => ({
    ...base,
    scope: source.scope,
    budget: source.budget,
    timeline: source.timeline,
    tiers: source.tiers,
    cities: source.cities,
    regions: source.regions,
    countries: source.countries,
    operations: source.operations,
    problems: source.problems,
    projectApps: source.projectApps,
    apps: asksApps(source.operations) ? source.apps : [],
  })

  const tried = ref(false)
  // Each part is checked only once it has changed: an old gap in what was
  // sent shouldn't block saving the company, nor the reverse.
  const check = () => ({
    ...(formDirty.value && {
      ...briefErrors({ scope: form.scope ?? '', budget: form.budget ?? '' }),
      ...(form.projectApps?.length ? {} : { apps: 'Pick at least one app' }),
    }),
    ...(companyDirty.value && {
      ...(company.segments.length ? {} : { segments: 'Pick at least one industry' }),
      ...(company.segments.length > MAX_INDUSTRIES && { segments: `Pick up to ${MAX_INDUSTRIES}` }),
      ...(company.employees ? {} : { employees: 'Pick a size' }),
    }),
  })
  const errors = computed(() => (tried.value ? check() : {}))

  const count = store.requirementsRecipients(projectId).length
  const requester = computed(() =>
    project.value?.hireRequest ? PARTNERS.find((p) => p.id === project.value.hireRequest) : null,
  )
  // Save when only the company changed: nothing goes to partners as a message,
  // so the button doesn't say it does.
  const sendLabel = computed(() => {
    if (!formDirty.value) return 'Save'
    return requester.value ? 'Decline request and send' : `Send to ${count} ${count === 1 ? 'partner' : 'partners'}`
  })

  // ── Options for the pickers ───────────────────────────────────────────────
  const bands = computed(() => budgetBandsFor(answers.value.country))
  // Timeline is optional, so "No preference" is its empty answer. Short
  // labels: the field already asks when it goes live.
  const timelines = [
    { label: 'No preference', value: '' },
    ...TIMELINES.map((t) => ({ label: t.label.replace(/^Live within/, 'Within'), value: t.value })),
  ]
  // The short names, as the reading view's badges: one answer, one set of
  // words in both modes. New project keeps the sentences, where it's asked.
  const problems = problemsFor().map((p) => ({ label: p.short, value: p.value }))
  const tiers = TIERS.map((t) => ({ label: t.label, value: t.value }))
  const cities = INDIA_CITIES.map((c) => ({ label: c, value: c }))
  // ⚠️ ONE LOCATION FIELD: cities for a business in India, where the city list
  // is real (see `asksCity`); India and the regions everywhere else.
  const showCity = computed(() => asksCity(answers.value.country))
  const geoOptions = GEO_CHOICES.map((c) => ({ label: c.label, value: c.country ? `country:${c.country}` : `region:${c.region}` }))
  const geoPick = computed({
    get: () => [...form.countries.map((c) => `country:${c}`), ...form.regions.map((r) => `region:${r}`)],
    set: (values) => {
      form.countries = values.filter((v) => v.startsWith('country:')).map((v) => v.slice(8))
      form.regions = values.filter((v) => v.startsWith('region:')).map((v) => v.slice(7))
    },
  })
  // The location field's empty answer, as the reading view says it.
  const whereNone = computed(() => {
    const t = partnerWhere({ country: answers.value.country }, { ...form, cities: [], regions: [], countries: [] })
    return t.charAt(0).toUpperCase() + t.slice(1)
  })
  const sizes = COMPANY_SIZES
  const segmentOptions = computed(() => segmentOptionsFor(company.segments))
  // Tools in use: the intake's list, plus any name typed under "Something else".
  const tools = computed(() => {
    const listed = CURRENT_APPS.filter((o) => o.value !== APPS_OTHER)
    const typed = form.apps.filter((a) => !listed.some((o) => o.value === a)).map((a) => ({ label: a, value: a }))
    return [...listed, ...typed]
  })

  // Returns `false` when a required field is missing and `errors` now says
  // which; otherwise `{ sent, messageId }` from the store once requirements
  // went out, and `company: true` when the company was saved. The company
  // saves first, so an update sent with it carries the new details.
  function submit() {
    tried.value = true
    if (Object.keys(check()).length) return false
    const savedCompany = companyDirty.value
    if (savedCompany) store.updateCompanyDetails({ employees: company.employees, segments: [...company.segments] })
    const sent = formDirty.value
      ? store.updateRequirements(projectId, { ...form, apps: showTools.value ? [...form.apps] : [] })
      : null
    return { ...(sent ?? {}), company: savedCompany }
  }

  return {
    form,
    initial,
    formDirty,
    company,
    companyChanges,
    dirty,
    errors,
    check,
    submit,
    asBrief,
    sendLabel,
    requester,
    answers,
    showTools,
    bands,
    timelines,
    problems,
    tiers,
    cities,
    showCity,
    geoOptions,
    geoPick,
    whereNone,
    tools,
    sizes,
    segmentOptions,
  }
}
