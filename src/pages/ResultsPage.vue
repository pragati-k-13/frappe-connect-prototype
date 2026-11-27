<script setup>
// The partners page.
//
//   landing   signed out, `/connect/partners`. "Work with certified Frappe
//             Partners" over a gray search bar: country and industry
//             dropdowns and a search button, two suggested searches under
//             it, then every partner. The bar is a DRAFT: it applies only on
//             search.
//   results   `/connect/partners/search?country=…&industry=…`, where search
//             lands. "Certified partners" and the count, then one row of
//             filters: the same two dropdowns, and Tier, App, Rating and
//             Reply time folded into one Filter (Helpdesk's pattern). Here
//             everything applies as you pick. Its own URL, so Back returns to
//             the search and a search can be shared. Unknown values in the
//             URL are dropped.
//   signed in the results view inside the app shell, opened pre-filled from
//             the company profile. A partner browsing gets nothing pre-filled.

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Badge, Button, MultiSelect, ScrollArea, Tooltip, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import BarField from '../components/BarField.vue'
import PartnerFilter from '../components/PartnerFilter.vue'
import PartnerList from '../components/PartnerList.vue'
import PartnerRow from '../components/PartnerRow.vue'
import { useConnectStore } from '../stores/connect'
import { APPS, PARTNERS } from '../data/partners'
import { INDUSTRIES, REGIONS } from '../data/quiz'

const store = useConnectStore()
const route = useRoute()
const router = useRouter()

const hasAccount = computed(() => store.signedIn || store.role === 'partner')
const isResults = computed(() => route.name === 'partner-search')
const isLanding = computed(() => !isResults.value && !hasAccount.value)

// ── What can be picked ──────────────────────────────────────────────────────
// Countries that have partners, for the signed-in pre-fill. Every country the
// directory lists is pickable, at 0 where nobody is, so the URL accepts them
// all.
const PARTNER_COUNTRIES = new Set(PARTNERS.flatMap((p) => p.countries))
const ALL_COUNTRIES = new Set(REGIONS.flatMap((r) => r.countries))
const SEGMENTS = new Set(INDUSTRIES.flatMap((i) => i.segments))
const TIERS = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'bronze', label: 'Bronze' },
]
const RATINGS = [
  { value: 4, label: '4.0 and up' },
  { value: 4.5, label: '4.5 and up' },
]
const REPLIES = [
  { value: 4, label: 'Within 4 hours' },
  { value: 6, label: 'Within 6 hours' },
]

// ── The URL ─────────────────────────────────────────────────────────────────
// Everything the results view shows comes from its query, so Back, reload and
// a shared link all land on the same list. Values the directory doesn't know
// are dropped rather than erroring.
const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v])
const fromQuery = (q) => {
  const num = (v, allowed) => (allowed.some((a) => a.value === Number(v)) ? Number(v) : null)
  return {
    countries: list(q.country).filter((c) => ALL_COUNTRIES.has(c)),
    segments: list(q.industry).filter((s) => SEGMENTS.has(s)),
    tier: TIERS.some((t) => t.value === q.tier) ? q.tier : null,
    apps: list(q.app).filter((v) => APPS.some((a) => a.value === v)),
    rating: num(q.rating, RATINGS),
    reply: num(q.reply, REPLIES),
  }
}
const toQuery = ({ countries, segments, tier, apps, rating, reply }) =>
  Object.fromEntries(
    Object.entries({ country: countries, industry: segments, tier, app: apps, rating, reply }).filter(
      ([, v]) => v != null && !(Array.isArray(v) && !v.length),
    ),
  )

// The Filter's values as the store holds them.
const tagValues = () => ({
  tier: store.filters.tier,
  apps: store.filters.apps,
  rating: store.filters.rating,
  reply: store.filters.reply,
})

// The results view writes its query into the store, which is what `results`
// and the suggestion groups read. The landing clears country and industry:
// its bar is a draft, so the list under it is every partner.
watch(
  () => [route.name, route.query, hasAccount.value],
  () => {
    if (route.name === 'results') {
      if (hasAccount.value) return openSignedIn()
      store.filters.countries = []
      store.answers.region = []
      store.answers.segments = []
      return
    }
    if (!isResults.value) return
    const q = fromQuery(route.query)
    store.filters.countries = q.countries
    store.answers.region = []
    store.answers.segments = q.segments
    Object.assign(store.filters, { tier: q.tier, apps: q.apps, rating: q.rating, reply: q.reply })
  },
  { immediate: true },
)

// Signed in there is no landing: the page opens as the results view, filled
// from the company profile. A partner browsing the directory has no profile
// to fill it from, so gets nothing pre-filled.
function openSignedIn() {
  const c = store.role === 'partner' ? {} : store.company
  router.replace({
    name: 'partner-search',
    query: toQuery({
      countries: PARTNER_COUNTRIES.has(c.country) ? [c.country] : [],
      segments: (c.segments ?? []).filter((s) => SEGMENTS.has(s)),
    }),
  })
}

// ── Country and industry ────────────────────────────────────────────────────
// On the landing they edit a draft; in the results view, the URL.
const draft = ref({ countries: [], segments: [] })
const applied = computed(() => ({
  countries: store.filters.countries,
  segments: store.answers.segments,
}))
const picked = computed(() => (isResults.value ? applied.value : draft.value))

const search = (patch, how = 'push') =>
  router[how]({
    name: 'partner-search',
    query: toQuery({ ...applied.value, ...tagValues(), ...patch }),
  })

// Search runs as a view transition: the page changes, not its controls. The
// landing fades out quickly, the results fade in with an 8px lift, the top
// bar holds still (the unscoped styles). Landing to results only: filter
// changes on the results view never animate. Without View Transitions it's
// the plain switch.
const find = () => {
  const go = () => search({ ...draft.value })
  if (isResults.value || !document.startViewTransition) return go()
  document.startViewTransition(async () => {
    await go()
    await nextTick()
  })
}

// The two dropdowns, in the hero and as the first chips of the results
// view's filter row: every country under its region and every segment under
// its industry, each row with the partners picking it would add, each
// heading with its group's total.
const barCountries = computed({
  get: () => picked.value.countries,
  set: (v) => {
    const value = v ?? []
    if (isResults.value) search({ countries: value })
    else draft.value = { ...draft.value, countries: value }
  },
})
const barSegments = computed({
  get: () => picked.value.segments,
  set: (v) => {
    const value = v ?? []
    if (isResults.value) search({ segments: value })
    else draft.value = { ...draft.value, segments: value }
  },
})
// Most partners first, alphabetical among equals. Ticking a country moves no
// count in its own list (the counts skip the location), so it never reshuffles
// while open.
const geoOptions = computed(() =>
  REGIONS.map((r) => ({
    key: r.value,
    group: r.label,
    options: r.countries
      .map((c) => ({ label: c, value: c, count: store.countryCounts[c] ?? 0 }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  })),
)
const groupTotal = (group) => group.options.reduce((n, o) => n + o.count, 0)
const segmentOptions = computed(() =>
  INDUSTRIES.map((i) => ({
    key: i.value,
    group: i.label,
    options: i.segments.map((s) => ({ label: s, value: s, count: store.segmentCounts[s] ?? 0 })),
  })),
)
// What a field says. A whole region ticked is its name, not "12 countries";
// a whole industry likewise. "Any …" is a real answer, so it reads in the
// label's ink, not the placeholder gray.
const geoSummary = computed(() => {
  const chosen = picked.value.countries
  if (!chosen.length) return null
  const whole = REGIONS.filter((r) => r.countries.every((c) => chosen.includes(c)))
  const covered = new Set(whole.flatMap((r) => r.countries))
  const loose = chosen.filter((c) => !covered.has(c))
  if (!whole.length) return loose.length === 1 ? loose[0] : `${loose.length} countries`
  const named = whole.map((r) => r.label).join(', ')
  return loose.length ? `${named} +${loose.length}` : named
})
const segmentSummary = computed(() => {
  const chosen = picked.value.segments
  if (!chosen.length) return null
  if (chosen.length === 1) return chosen[0]
  const whole = INDUSTRIES.find(
    (i) => i.segments.length === chosen.length && i.segments.every((s) => chosen.includes(s)),
  )
  return whole ? whole.label : `${chosen.length} industries`
})

// Suggested searches: two, in different industries, so neither repeats the
// other. The directory's biggest pairs: Retail in India (7 partners) and
// Discrete Manufacturing in India (4). A click fades the values into the
// fields (`fade` on BarField), and 200ms later the search runs.
const SUGGESTIONS = [
  { label: 'Retail in India', countries: ['India'], segments: ['Retail'] },
  { label: 'Discrete Manufacturing in India', countries: ['India'], segments: ['Discrete Manufacturing'] },
]
const barFade = ref(false)
const useSuggestion = (s) => {
  barFade.value = true
  draft.value = { countries: s.countries, segments: s.segments }
  setTimeout(() => {
    find()
    barFade.value = false
  }, 200)
}

// Whether the gray bar has scrolled up under the 48px top bar, which is when
// the top bar takes its fill and rule (ConnectShell `heroPassed`). Until
// then it stays clear over the hero.
const barEl = ref(null)
const barPassed = ref(false)
let barObserver = null
watch(barEl, (el) => {
  barObserver?.disconnect()
  barPassed.value = false
  if (!el) return
  barObserver = new IntersectionObserver(
    ([e]) => (barPassed.value = !e.isIntersecting && e.boundingClientRect.top < 48),
    { rootMargin: '-48px 0px 0px 0px' },
  )
  barObserver.observe(el)
})
onBeforeUnmount(() => barObserver?.disconnect())

// ── The Filter ──────────────────────────────────────────────────────────────
// Tier, App, Rating and Reply time in one Filter (PartnerFilter, Helpdesk's
// pattern), so the row always fits on one line. App takes several values;
// the rest one each.
const APP_OPTIONS = APPS.map((a) => ({ label: a.label, value: a.value }))
const FILTER_FIELDS = [
  { key: 'tier', icon: 'lucide-award', label: 'Tier', options: TIERS, multiple: false },
  { key: 'apps', icon: 'lucide-layout-grid', label: 'App', options: APP_OPTIONS, multiple: true },
  { key: 'rating', icon: 'lucide-star', label: 'Rating', options: RATINGS, multiple: false },
  { key: 'reply', icon: 'lucide-clock', label: 'Reply time', options: REPLIES, multiple: false },
]
const setFilter = (key, value) => search({ [key]: value }, 'replace')
const clearTags = () => search({ tier: null, apps: [], rating: null, reply: null }, 'replace')

// ── The list ────────────────────────────────────────────────────────────────
const results = computed(() => store.results)
// Partners one lifted filter away, as one list in the store's group order.
// Each row's city and industries already show what differs, so no group
// titles. A partner misses exactly one filter, so no one appears twice.
const suggestions = computed(() => (isResults.value ? store.suggestions.flatMap((g) => g.partners) : []))
// Nothing matched and nothing is one step away: the empty state.
const emptied = computed(() => !results.value.length && !suggestions.value.length)

// ⚠️ Inert. There is no feedback form, and a text field in a toast isn't one.
const feedbackToast = () =>
  toast.info('The feedback form is not built yet', {
    description: 'It would ask about the search you just ran.',
  })
</script>

<template>
  <ConnectShell :hero="!hasAccount" :hero-passed="isLanding ? barPassed : null" saved>
    <!-- ── The hero (landing only) ──────────────────────────────────────
         A headline over a gray box holding two dropdown fields, location and
         industry, and the search button. The fields are BarField
         (frappe-ui's subtle field states minus the focus border) over
         MultiSelect. Below `md` they stack in the box and the button takes
         its label. -->
    <section v-if="isLanding">
      <div class="fc-page-list relative pb-12 pt-8 md:pb-16 md:pt-16">
        <h1 class="text-6xl font-semibold text-ink-gray-9">Work with certified Frappe Partners</h1>
        <!-- 576px (`max-w-xl`), not the column's 800: a shorter shape under the
             headline and above the full-width list, so the page doesn't read
             as one block. Each field still fits "United Arab Emirates". -->
        <!-- One row from `sm` (640px): at 576px the bar fits any tablet or
             narrow window. Below that the two fields stack in the box with a
             rule between them, and the labeled button sits under the box,
             not in it. -->
        <div ref="barEl" class="fc-bar mt-4 flex flex-col rounded-6 bg-surface-gray-2 p-1 sm:max-w-xl sm:flex-row sm:items-center">
          <!-- frappe-ui puts no class on MultiSelect's root when a #trigger is
               passed, so this wrapper takes the flex share. -->
          <div class="fc-bar-slot min-w-0 sm:flex-1">
            <MultiSelect v-model="barCountries" :options="geoOptions" placeholder="Search countries" aria-label="Countries">
              <template #trigger="{ open }">
                <BarField :label="geoSummary ?? 'Any country'" :open="open" :fade="barFade" icon="sentence-icon-globe" tint="text-ink-blue-6" />
              </template>
              <template #item-suffix="{ item }">
                <span class="tabular-nums text-ink-gray-5">{{ item.count }}</span>
              </template>
              <template #group-label="{ group }">
                <span class="min-w-0 flex-1 truncate">{{ group.group }}</span>
                <span class="tabular-nums">{{ groupTotal(group) }}</span>
              </template>
              <!-- frappe-ui's footer minus Select All: every country is "Any
                   country". Clear all shows once something is ticked. -->
              <template #footer="{ selectedOptions, clear }">
                <div v-if="selectedOptions.length" class="flex border-t border-outline-gray-1 px-2 py-1.5">
                  <Button variant="ghost" size="sm" label="Clear all" @click="clear" />
                </div>
              </template>
            </MultiSelect>
          </div>
          <div class="fc-bar-sep mx-2.5 shrink-0 border-t border-outline-gray-3 sm:mx-0 sm:h-4 sm:border-l sm:border-t-0" aria-hidden="true" />
          <div class="fc-bar-slot min-w-0 sm:flex-1">
            <MultiSelect v-model="barSegments" :options="segmentOptions" placeholder="Search industries" aria-label="Industries">
              <template #trigger="{ open }">
                <BarField :label="segmentSummary ?? 'Any industry'" :open="open" :fade="barFade" icon="sentence-icon-briefcase" tint="text-ink-amber-6" />
              </template>
              <template #item-suffix="{ item }">
                <span class="tabular-nums text-ink-gray-5">{{ item.count }}</span>
              </template>
              <template #group-label="{ group }">
                <span class="min-w-0 flex-1 truncate">{{ group.group }}</span>
                <span class="tabular-nums">{{ store.industryCounts[group.key] ?? 0 }}</span>
              </template>
              <!-- frappe-ui's footer minus Select All: every industry is "Any
                   industry". Clear all shows once something is ticked. -->
              <template #footer="{ selectedOptions, clear }">
                <div v-if="selectedOptions.length" class="flex border-t border-outline-gray-1 px-2 py-1.5">
                  <Button variant="ghost" size="sm" label="Clear all" @click="clear" />
                </div>
              </template>
            </MultiSelect>
          </div>
          <!-- frappe-ui's `md` icon Button, 32px like the fields, 4px in from
               the box's edge like them. Named in a tooltip. -->
          <Tooltip text="Find partners">
            <Button variant="solid" size="md" aria-label="Find partners" class="ml-1 shrink-0 max-sm:hidden" @click="find">
              <template #icon><span class="lucide-search size-4" aria-hidden="true" /></template>
            </Button>
          </Tooltip>
        </div>
        <Button variant="solid" size="md" label="Find partners" class="mt-2 w-full sm:hidden" @click="find" />
        <!-- Suggested searches, the directory's biggest pairs. Outline, not
             the page's usual subtle: gray right under the gray box read as
             a second row of fields. `trending-up`: these are what people
             search for, not ideas. -->
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            v-for="s in SUGGESTIONS"
            :key="s.label"
            variant="outline"
            size="sm"
            icon-left="lucide-trending-up"
            :label="s.label"
            @click="useSuggestion(s)"
          />
        </div>
      </div>
    </section>

    <div class="fc-page-list pb-10" :class="isLanding ? 'pt-12' : hasAccount ? 'pt-5' : 'pt-6'">
      <!-- The list's title with its count. One title that never changes:
           the results view's chips already say where and what. "Certified"
           carries the hero's promise onto the list it leads to. -->
      <!-- Signed out, the title anchors the page (the website bar has no page
           title): a page title, then the filters under it. Signed in, the
           app's top bar names the page, so it reads as an app list: the
           filters lead as a toolbar, then the matches get a section title the
           size of "More partners to consider", so the two lists are siblings. -->
      <div class="flex flex-col" :class="hasAccount ? 'gap-8' : 'gap-4'">
        <div class="flex min-w-0 shrink-0 items-center gap-2">
          <h1 v-if="isResults" class="truncate font-semibold text-ink-gray-9" :class="hasAccount ? 'text-lg' : 'text-2xl'">Certified partners</h1>
          <h2 v-else class="text-lg font-semibold text-ink-gray-9">All partners</h2>
          <Badge :label="results.length" />
        </div>

        <!-- ── The filter row (results view) ────────────────────────────────
             Part of the page, not sticky. Location and industry lead, subtle
             (gray fill), because they always hold an answer, even "Any …",
             capped at 180px so a long pick truncates instead of pushing the
             row. The Filter follows after a rule: all three narrow the same
             list, so they sit together, and the rule keeps it from reading as a
             third question. On phones it leads the row, so it's never scrolled
             off-screen behind them. -->
        <ScrollArea v-if="isResults" orientation="horizontal" class="-mx-5 min-w-0 md:mx-0" :class="hasAccount && 'order-first'" viewport-class="px-5 md:px-0">
          <div class="flex items-center gap-1.5">
              <div class="min-w-0 shrink-0">
                <MultiSelect v-model="barCountries" :options="geoOptions" placeholder="Search countries" aria-label="Filter by country" variant="subtle" size="sm" class="max-w-[11.25rem]">
                  <template #prefix>
                    <span class="sentence-icon-globe size-4 shrink-0 text-ink-blue-6" aria-hidden="true" />
                  </template>
                  <template #summary>
                    <span class="text-ink-gray-8">{{ geoSummary ?? 'Any country' }}</span>
                  </template>
                  <template #item-suffix="{ item }">
                    <span class="tabular-nums text-ink-gray-5">{{ item.count }}</span>
                  </template>
                  <template #group-label="{ group }">
                    <span class="min-w-0 flex-1 truncate">{{ group.group }}</span>
                    <span class="tabular-nums">{{ groupTotal(group) }}</span>
                  </template>
                  <!-- No Clear All / Select All, as on the page's other pickers:
                       untick to clear. "Select All" countries is no answer. -->
                  <template #footer />
                </MultiSelect>
              </div>
              <div class="min-w-0 shrink-0">
                <MultiSelect v-model="barSegments" :options="segmentOptions" placeholder="Search industries" aria-label="Filter by industry" variant="subtle" size="sm" class="max-w-[11.25rem]">
                  <template #prefix>
                    <span class="sentence-icon-briefcase size-4 shrink-0 text-ink-amber-6" aria-hidden="true" />
                  </template>
                  <template #summary>
                    <span class="text-ink-gray-8">{{ segmentSummary ?? 'Any industry' }}</span>
                  </template>
                  <template #item-suffix="{ item }">
                    <span class="tabular-nums text-ink-gray-5">{{ item.count }}</span>
                  </template>
                  <template #group-label="{ group }">
                    <span class="min-w-0 flex-1 truncate">{{ group.group }}</span>
                    <span class="tabular-nums">{{ store.industryCounts[group.key] ?? 0 }}</span>
                  </template>
                  <!-- No Clear All / Select All, as on the page's other pickers:
                       untick to clear. "Select All" countries is no answer. -->
                  <template #footer />
                </MultiSelect>
              </div>
            <div class="mx-1 h-4 shrink-0 border-l border-outline-gray-3 max-md:hidden" aria-hidden="true" />
            <div class="shrink-0 max-md:order-first">
              <PartnerFilter :fields="FILTER_FIELDS" :values="tagValues()" @set="setFilter" @clear="clearTags" />
            </div>
          </div>
        </ScrollArea>
      </div>

      <PartnerList v-if="results.length" :class="isLanding || hasAccount ? 'mt-2' : 'mt-4'">
        <PartnerRow v-for="p in results" :key="p.id" :partner="p" :city-only="isResults && applied.countries.length === 1" />
      </PartnerList>

      <!-- Nothing matched and nothing is one step away either. -->
      <div v-else-if="emptied" class="flex flex-col items-center py-16 text-center">
        <div class="rounded-full bg-surface-gray-2 p-3 text-ink-gray-5">
          <span class="lucide-building-2 size-6" aria-hidden="true" />
        </div>
        <p class="mt-3 text-base text-ink-gray-7">No partners match</p>
        <Button variant="subtle" label="Talk to us" class="mt-5" @click="router.push('/contact')" />
      </div>

      <!-- Partners one lifted filter away, when the list has narrowed to two
           or fewer, closest first. -->
      <div v-if="suggestions.length" :class="results.length ? 'mt-9' : 'mt-12'">
        <!-- A rule between the matches and the suggestions: past it, the
             list no longer answers the search. 36px above it plus the last
             row's own padding is about 64px of air, matching the 64px below. -->
        <hr v-if="results.length" class="mb-16 border-outline-gray-2" />
        <h2 class="text-lg font-semibold text-ink-gray-9">More partners to consider</h2>
        <PartnerList class="mt-2">
          <PartnerRow v-for="p in suggestions" :key="p.id" :partner="p" />
        </PartnerList>
      </div>

      <!-- Feedback, where the search ended. Visitors only: signed in, the
           help menu has Give feedback. -->
      <div v-if="!hasAccount" class="mt-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 pt-6">
        <p class="text-p-base text-ink-gray-7">
          Help us improve by providing feedback on your search experience
        </p>
        <Button variant="subtle" label="Share feedback" @click="feedbackToast" />
      </div>
    </div>
  </ConnectShell>
</template>

<style scoped>
/* MultiSelect's root is a block `div` sized by its flex slot, and its
   trigger fills it. The rule between the fields steps aside when either
   neighbour is hovered or open, so a lifted field never has a line cutting
   into its edge. */
.fc-bar-slot :deep(> *) {
  width: 100%;
}
.fc-bar:has(.fc-bar-field:hover, .fc-bar-field[data-open]) .fc-bar-sep {
  opacity: 0;
}
</style>

<style>
/* ⚠️ Not scoped: MultiSelect portals its popover to the body. Pinned widths,
   so a popover never resizes as the search filters its rows or a pick
   changes. frappe-ui only sets a MINIMUM (the trigger's width) and lets the
   longest visible row widen it. The hero's popovers match their field;
   the results view's chips get 320px, the room "United Arab Emirates", its
   checkbox and its count need. Rows truncate inside. */
[data-slot='content']:is([aria-label='Countries'], [aria-label='Industries']) {
  width: var(--reka-combobox-trigger-width);
}
[data-slot='content']:is([aria-label='Filter by country'], [aria-label='Filter by industry']) {
  width: 320px;
}

/* The search → results view transition (see `find`). The page
   changes, not its controls: the landing leaves in 120ms, the results come
   in over 200ms with an 8px lift, both on the strong ease-out. The top bar
   has its own name and no animation, so the logo and Log in stay put.
   Reduced motion: a 150ms fade, no lift. Only this transition exists in
   the app. */
::view-transition-old(root) {
  animation: fc-vt-out 120ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
::view-transition-new(root) {
  animation: fc-vt-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both;
}
::view-transition-group(fc-top),
::view-transition-new(fc-top) {
  animation: none;
}
::view-transition-old(fc-top) {
  display: none;
}
@keyframes fc-vt-out {
  to {
    opacity: 0;
  }
}
@keyframes fc-vt-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-new(root) {
    animation: fc-vt-fade 150ms ease-out both;
  }
  @keyframes fc-vt-fade {
    from {
      opacity: 0;
    }
  }
}
</style>
