<script setup>
// SCREEN 5 — the partner listing.
//
// What the quiz buys you. The answers arrive as the initial filter state and
// stay visible and editable in the filter bar — someone who over-narrowed can
// widen without redoing the questions, and someone who skipped a question sees
// an unset filter rather than a silent constraint.

import { computed } from 'vue'
import { Button, MultiSelect, Select, TextInput, toast } from 'frappe-ui'
import ConnectShell from '../components/ConnectShell.vue'
import PartnerRow from '../components/PartnerRow.vue'
import FilterChip from '../components/FilterChip.vue'
import { useConnectStore } from '../stores/connect'
import { APPS } from '../data/partners'
import { IMPLEMENTATION_TYPES, INDUSTRIES, REGIONS } from '../data/quiz'

const store = useConnectStore()

const results = computed(() => store.results)
const suggestions = computed(() => store.suggestions)

// Copy for the suggestion groups. The store says which filter was lifted; this
// says what that means to a reader.
//
// Every title leads with what these partners DO have and leaves the gap to the
// note underneath, because the group's job is to widen a search that dead-ended,
// not to explain a rejection.
//
// ⚠️ The industry title is deliberately NOT "partners in other industries". A
// partner's `industries` are the segments they have published success stories
// in — the row renders them as exactly that — and not a declaration of what work
// they will take on. Saying they belong to other industries asserts a limit the
// data doesn't record, about real, named companies. "Proven in other industries"
// claims only the thing that is true, and the note carries the rest.
const suggestionCopy = (key) => {
  const { segments } = store.answers
  const appLabel = APPS.find((a) => a.value === store.filters.app)?.label
  switch (key) {
    case 'region':
      // No note: the title is already the whole fact, and every row names its
      // own city underneath.
      return { title: 'Partners outside your region' }
    case 'segments':
      return {
        title: 'Proven in other industries',
        note:
          segments.length === 1
            ? `No published ${segments[0]} work yet.`
            : 'No published work in your selected industries yet.',
      }
    case 'implementation':
      return {
        title: 'Partners who quote custom work',
        note: 'They scope each project rather than selling fixed-scope starter packs.',
      }
    case 'app':
      return {
        title: 'Working with other Frappe apps',
        note: appLabel ? `No ${appLabel} work listed yet.` : undefined,
      }
    default:
      return { title: 'Also worth considering' }
  }
}

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

// Clearing is the one destructive action on this screen: `store.reset()` drops
// all three quiz answers along with the filters, and before this there was no
// way back short of redoing the quiz. Two call sites — the funnel in the bar and
// the ghost button beside the count when nothing matched — so it's one function,
// and Undo restores the snapshot `reset()` takes.
//
// The store's stash is one-shot, so a stale Undo (a second clear since, or one
// already used) says so rather than appearing to work.
const clearFilters = () => {
  store.reset()
  toast('Filters cleared', {
    id: 'filters-cleared',
    description: 'The quiz answers went with them.',
    action: {
      label: 'Undo',
      onClick: () => {
        if (!store.restoreCleared()) toast.info('Those filters are no longer available to restore')
      },
    },
  })
}

// ⚠️ Inert. There is no feedback form, and a text field in a toast isn't one —
// this says where the answer would go rather than swallowing the click.
const feedbackToast = () =>
  toast.info('The feedback form is not built yet', {
    description: 'It would ask about the search you just ran.',
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
          @click="clearFilters"
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
           label, so it takes the space with it.

           At zero it becomes the empty state. This used to be a centre-aligned
           block below — headline, hint and a button — which stopped working once
           suggestions landed underneath it: a tall centred panel sat between the
           count and the partners it was telling you about, so the screen read as
           finished when the useful part was below the fold. A label already
           saying how many matched is the honest place for "none did", and it
           costs no vertical space.

           `ghost` for Clear filters because the suggestions below are now the
           real way forward — this is the escape hatch, not the recommendation,
           and a `subtle` button here would outrank the partners.

           The Button is 28px against the text's 21px line box, so it sets the
           row height and `items-center` centres the text against it — the
           `text-p-base`-in-a-flex-row trap in FRAPPE-UI-NOTES needs the text to
           be the tallest item to bite, and it isn't. -->
      <div class="mt-9 flex flex-wrap items-center gap-x-1 gap-y-1">
        <p class="text-p-base text-ink-gray-6">
          <template v-if="results.length">
            {{ results.length }} {{ results.length === 1 ? 'partner' : 'partners' }}
          </template>
          <template v-else>No partners match every filter</template>
        </p>
        <!-- `gap-x-1` rather than the `gap-x-2` this bar uses elsewhere: the
             ghost Button carries 8px of internal padding of its own, so 4px of
             gap reads as 12px between the two pieces of text, which is the
             spacing that was wanted. Measure to the label, not the box. -->
        <Button
          v-if="!results.length && anyFilterActive"
          variant="ghost"
          label="Clear filters"
          @click="clearFilters"
        />
      </div>

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

      <!-- ── Suggestions ─────────────────────────────────────────────────
           Shown when the filters have narrowed to two partners or fewer, which
           is few enough that the list has stopped being a choice.

           Below the results AND below the empty state, deliberately: it answers
           "what now?", which is only a question once you've seen how little
           came back. The empty-state screen is the one that needs it most — its
           only way out used to be discarding the whole quiz.

           Each group is one lifted filter, so its title can say why these
           partners are here. No rule above the block: the group titles already
           say these aren't results, and a stroke here would be structure rather
           than meaning. Same reason the mid-list app interstitial has none. -->
      <div v-if="suggestions.length" class="mt-12">
        <div v-for="g in suggestions" :key="g.key" class="mt-8 first:mt-0">
          <p class="text-p-base font-medium text-ink-gray-8">{{ suggestionCopy(g.key).title }}</p>
          <p v-if="suggestionCopy(g.key).note" class="mt-0.5 text-p-sm text-ink-gray-6">
            {{ suggestionCopy(g.key).note }}
          </p>
          <!-- Real `PartnerRow`s, not a reduced card: Save and Contact have to
               behave here exactly as they do in the list, and a suggested
               partner is still a partner you might click through to. `mt-1`
               matches the results list's own leading gap. -->
          <div class="mt-1">
            <PartnerRow v-for="p in g.partners" :key="p.id" :partner="p" />
          </div>
        </div>
      </div>

      <!-- Feedback. Kept inline at the end of the list rather than as a floating
           widget: it asks about the search you just did, so it belongs where
           that search ended.

           The prompt and its button sit on ONE line, with the button pushed to
           the right edge of the content column — which is the same edge every
           row's Contact button sits on, so it joins that vertical rather than
           floating mid-column. The rows bleed their hover fill 12px past this
           column (`-mx-3 px-3`) but their content is measured to it, so
           `justify-between` here lands flush with them.

           `text-p-base` stays, even though FRAPPE-UI-NOTES warns the paragraph
           scale stretches a flex row to its own 21px line box. That only bites
           when the text is the TALLEST item in the row; here the 28px Button is,
           so the row is 28px either way and `items-center` lands both dead
           centre. Keeping the paragraph scale is what makes the wrapped case
           read — narrow enough and this is two lines, where 21px leading is
           right and `text-base`'s 16px is cramped.

           `flex-wrap` + `gap-y-3` so a narrow viewport drops the button onto its
           own line at the same spacing it used to have, rather than crushing the
           text. -->
      <div class="mt-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 pt-6">
        <p class="text-p-base text-ink-gray-7">
          Help us improve by providing feedback on your search experience
        </p>
        <Button variant="subtle" label="Share feedback" @click="feedbackToast" />
      </div>
    </div>
  </ConnectShell>
</template>
