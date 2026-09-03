<script setup>
// SCREEN 5 — the partner listing.
//
// What the quiz buys you. The answers arrive as the initial filter state and
// stay visible and editable in the filter bar — someone who over-narrowed can
// widen without redoing the questions, and someone who skipped a question sees
// an unset filter rather than a silent constraint.

import { computed } from 'vue'
import { Button, MultiSelect, Select, TextInput } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PartnerRow from '../components/PartnerRow.vue'
import FilterChip from '../components/FilterChip.vue'
import { useConnectStore } from '../stores/connect'
import { APPS } from '../data/partners'
import { IMPLEMENTATION_TYPES, INDUSTRIES, REGIONS } from '../data/quiz'

const store = useConnectStore()

const results = computed(() => store.results)

// `undefined` clears a Select; the store wants `null` for "no constraint".
const setFilter = (key, value) => {
  store.filters[key] = value ?? null
}
const setAnswer = (key, value) => {
  store.answer(key, value ?? null)
}
// Region and segments take several answers, so their empty state is an empty
// array rather than `null` — see the store.
const setRegions = (value) => {
  store.answer('region', value ?? [])
}
const setSegments = (value) => {
  store.answers.segments = value ?? []
}

const regionOptions = computed(() =>
  REGIONS.map((r) => ({ label: r.label, value: r.value })),
)
// ONE control for the industry dimension, not two. Industry and segment used to
// be separate Selects — pick a group, then a second control appears to narrow
// inside it — which meant two controls for one question, an option list you
// could only reach by first picking its parent, and no way to say "Discrete
// Manufacturing or Logistics". frappe-ui's MultiSelect takes grouped options
// natively, so the industry becomes the group label and the segments are the
// options. Nothing is selectable at the group level, because nothing in the
// data is tagged there: partners carry segment names.
const segmentOptions = computed(() =>
  INDUSTRIES.map((i) => ({ group: i.label, key: i.value, options: i.segments.map((s) => ({ label: s, value: s })) })),
)

// What the trigger says. MultiSelect's default is the label when one is picked
// and "N selected" past that, which loses the useful case: every segment in one
// group is exactly "Manufacturing", and saying "12 selected" instead would hide
// a plain answer behind a number.
const segmentSummary = computed(() => {
  const picked = store.answers.segments
  if (picked.length < 2) return null // 0 and 1 — MultiSelect's own default is right
  const whole = INDUSTRIES.find(
    (i) => i.segments.length === picked.length && i.segments.every((s) => picked.includes(s)),
  )
  return whole ? whole.label : `${picked.length} segments`
})

// Q3's answer used to filter invisibly — no control in the bar, no entry in the
// count — so the third control is the implementation question. The starter-pack
// picker that used to sit here is gone: it asked about something the quiz never
// raised, and a pack is a thing you choose on a partner's profile, not a way to
// narrow the list of partners.
const implementationOptions = computed(() =>
  IMPLEMENTATION_TYPES.map((i) => ({ label: i.short, value: i.value })),
)

// Filters with no control of their own in the bar — just the app, which is set
// from the chips mid-list. The controls beside this button speak for themselves,
// so counting them here would report the same constraint twice.
const extraFilterCount = computed(() => (store.filters.app ? 1 : 0))

// Clearing wipes everything, so the button stays live whenever anything is set,
// not only when there's a number to show.
const anyFilterActive = computed(() => {
  const { segments, region, implementation } = store.answers
  const { search, app } = store.filters
  return Boolean(segments.length || region.length || implementation || app || search.trim())
})

const clearTooltip = computed(() => {
  if (!anyFilterActive.value) return 'No filters active'
  if (extraFilterCount.value) {
    return `${extraFilterCount.value} more filter${extraFilterCount.value === 1 ? '' : 's'} — clear all`
  }
  return 'Clear all filters'
})
</script>

<template>
  <ConnectShell>
    <div class="mx-auto w-full max-w-[800px] px-5 py-8 lg:px-10">
      <h1 class="text-xl font-semibold text-ink-gray-9">
        Work with certified partners with vast expertise
      </h1>

      <!-- Filter bar. Seeded from the quiz, editable from here on.
           Every control is a fixed 160px, search included. frappe-ui's Select
           trigger is `inline-flex`, so left alone it sizes to its value and the
           row reflows every time you pick something — "Trading and Distribution"
           was 201px against "All regions"' 111px. The trigger already truncates
           internally, so a fixed width shortens the label instead of moving its
           neighbours, and a uniform width means any wrap is an even one. -->
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <TextInput
          :model-value="store.filters.search"
          class="w-40"
          placeholder="Search"
          @update:model-value="setFilter('search', $event)"
        >
          <template #prefix>
            <LucideSearch class="size-4 text-ink-gray-6" />
          </template>
        </TextInput>

        <!-- MultiSelect, not Select: the quiz asks region as a multi-answer
             question, so the filter that mirrors it has to hold more than one
             too — otherwise arriving here would silently drop all but one of
             the regions you just picked. -->
        <MultiSelect
          class="w-40"
          :model-value="store.answers.region"
          :options="regionOptions"
          placeholder="All regions"
          @update:model-value="setRegions"
        />
        <!-- Industry AND segment, in one control. The group label is the
             industry and the options are its segments — nothing is selectable
             at the group level, because nothing in the data is tagged there.
             Multi-select, so "Discrete Manufacturing or Logistics" is sayable;
             as two chained Selects it wasn't. -->
        <MultiSelect
          class="w-40"
          :model-value="store.answers.segments"
          :options="segmentOptions"
          placeholder="All industries"
          @update:model-value="setSegments"
        >
          <template v-if="segmentSummary" #summary>{{ segmentSummary }}</template>
        </MultiSelect>
        <!-- Q3. Was missing entirely, so the answer filtered silently. -->
        <Select
          class="w-40"
          :model-value="store.answers.implementation ?? undefined"
          :options="implementationOptions"
          placeholder="Implementation"
          @update:model-value="setAnswer('implementation', $event)"
        />
        <!-- The count is only for filters with no control of their own in this
             bar — currently the mid-list app chip. The Selects beside it already
             show their own state, so counting them here would double-report.
             Clearing still clears everything, so the button stays live whenever
             any filter is set. -->
        <Button
          variant="subtle"
          :label="extraFilterCount ? String(extraFilterCount) : undefined"
          :tooltip="clearTooltip"
          :disabled="!anyFilterActive"
          @click="store.reset()"
        >
          <!-- `#icon` when there's no count, `#prefix` when there is. With
               `#prefix` and no label frappe-ui's Button still renders its
               (empty) label span and the `gap-2` before it, so the button came
               out 40px wide with 8px of dead space beside the icon. `#icon`
               makes it a real icon button — 28px, square. -->
          <template v-if="extraFilterCount" #prefix>
            <LucideListFilter class="size-4" />
          </template>
          <template v-else #icon>
            <LucideListFilter class="size-4" />
          </template>
        </Button>
      </div>

      <!-- The heading and the filter bar are one group — a title and the
           controls that belong to it — so they sit close (`mt-3`), and the gap
           that matters is this one, between that group and the results it
           produced. The count belongs to the list, not the bar: it's the list's
           label, so it takes the space with it. -->
      <p class="mt-9 text-p-base text-ink-gray-6">
        {{ results.length }} {{ results.length === 1 ? 'partner' : 'partners' }}
      </p>

      <!-- First page of results -->
      <div class="mt-1">
        <PartnerRow v-for="p in results.slice(0, 5)" :key="p.id" :partner="p" />
      </div>

      <!-- Interstitial refinement. Sits mid-list on purpose: it's the question
           worth asking once someone has seen enough rows to know the list is
           too broad, and it costs nothing to ignore. -->
      <div v-if="results.length > 5" class="py-6">
        <p class="text-p-base font-medium text-ink-gray-8">Which app are you looking to implement?</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <!-- Smaller than the quiz's region chips: this is a secondary
               refinement offered mid-list, not a question being asked. -->
          <FilterChip
            v-for="a in APPS"
            :key="a.value"
            :label="a.label"
            size="xs"
            :count="a.count"
            :selected="store.filters.app === a.value"
            @toggle="setFilter('app', store.filters.app === a.value ? null : a.value)"
          />
        </div>
      </div>

      <!-- Remaining results -->
      <div>
        <PartnerRow v-for="p in results.slice(5)" :key="p.id" :partner="p" />
      </div>

      <!-- Empty state: over-filtering is easy here, so the way out is a button,
           not a suggestion. -->
      <div v-if="!results.length" class="py-14 text-center">
        <p class="text-p-lg font-medium text-ink-gray-8">No partners match every filter</p>
        <p class="mx-auto mt-1.5 max-w-sm text-p-base text-ink-gray-6">
          Try dropping the narrowest one — region and starter pack rule out the most partners.
        </p>
        <div class="mt-4">
          <Button variant="subtle" label="Clear all filters" @click="store.reset()" />
        </div>
      </div>

      <!-- Feedback. Kept inline at the end of the list rather than as a floating
           widget: it asks about the search you just did, so it belongs where
           that search ended. -->
      <div class="mt-10 pt-6">
        <p class="text-p-base text-ink-gray-7">
          Help us improve by providing feedback on your search experience
        </p>
        <div class="mt-3">
          <Button variant="subtle" label="Share feedback" />
        </div>
      </div>
    </div>
  </ConnectShell>
</template>
