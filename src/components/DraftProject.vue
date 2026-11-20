<script setup>
// A draft project: what it is, and the partners it can go to.
//
// ⚠️ NOT THE RECOMMENDATION SCREEN. A draft used to render
// `RecommendationView` with its own answers, so a project the business had
// already started argued for itself ("We recommend…", "Why we think…") and
// still offered Starter Packs, which are hidden. The page now holds one
// subject — this project — and one action, sharing it.
//
// ⚠️ THE SAME ROWS AS "HIRE A PARTNER" (`ProjectBids`): logo, name and tier,
// city and rating. Before sharing, the right column is the firm's rate; after,
// the project stops being a draft and the same firms come back as quotes.
import { computed, ref } from 'vue'
import { Avatar, Button } from 'frappe-ui'
import { List, ListCell, ListHeader, ListHeaderCell, ListRow } from 'frappe-ui/list'
import EmptyState from './EmptyState.vue'
import PartnerFiltersDialog from './PartnerFiltersDialog.vue'
import ShareRequirementsDialog from './ShareRequirementsDialog.vue'
import TierIcon from './TierIcon.vue'
import { TIMELINES, budgetLabel, matchingPartners } from '../data/custom'
import { cityOf } from '../data/partners'
import { logoFor } from '../data/logos'
import { useConnectStore } from '../stores/connect'

const props = defineProps({
  project: { type: Object, required: true },
  answers: { type: Object, required: true },
})
const emit = defineEmits(['update-brief', 'share', 'edit-answers'])

const store = useConnectStore()
const brief = computed(() => props.project.brief ?? {})
const matches = computed(() => matchingPartners(props.answers, brief.value))

// The answers in one line, so the page says what the project is without a
// form. Edit opens the draft's own dialog.
const summary = computed(() => {
  const a = props.answers
  const countries = a.countries?.length ? a.countries : [a.country].filter(Boolean)
  return [
    countries.join(', '),
    a.employees && `${a.employees} people`,
    (a.segments ?? []).join(', '),
    TIMELINES.find((t) => t.value === brief.value.timeline)?.label,
    // "Not decided yet" is an answer, not a fact about the project.
    brief.value.budget !== 'unsure' && budgetLabel(brief.value.budget),
  ]
    .filter(Boolean)
    .join(' · ')
})

const showFilters = ref(false)
const sharing = ref(false)
// The steps after sharing are said once, on the account's first share.
const firstTime = computed(() => !store.projects.some((p) => p.broadcast))
</script>

<template>
  <div class="mx-auto w-full max-w-3xl">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-center gap-2">
        <h1 class="truncate text-2xl font-semibold text-ink-gray-8">{{ project.name }}</h1>
      </div>
      <slot name="actions" />
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <p class="text-p-base text-ink-gray-6">{{ summary }}</p>
      <Button variant="ghost" size="sm" label="Edit" @click="emit('edit-answers')" />
    </div>
    <!-- The description, in the business's own words, as partners will read
         it. Edited with the rest of the draft. -->
    <p v-if="brief.scope" class="mt-4 max-w-prose whitespace-pre-line text-p-base text-ink-gray-7">
      {{ brief.scope }}
    </p>

    <section class="mt-10">
      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 class="text-xl font-semibold text-ink-gray-8">
          {{ matches.length }} matching {{ matches.length === 1 ? 'partner' : 'partners' }}
        </h2>
        <div class="flex items-center gap-2">
          <Button variant="subtle" label="Edit criteria" @click="showFilters = true" />
          <Button
            v-if="matches.length"
            variant="solid"
            label="Share requirements"
            icon-left="lucide-send"
            @click="sharing = true"
          />
        </div>
      </div>

      <EmptyState
        v-if="!matches.length"
        icon="lucide-building-2"
        title="No partners match"
        description="Widen the criteria to see more."
      />
      <!-- Below `sm` the rate leaves its column and joins the city line, so
           a narrow screen keeps one column and nothing overlaps. -->
      <List
        v-else
        class="mt-4"
        :columns="{ base: ['minmax(0,1fr)'], sm: ['minmax(0,1fr)', '8rem'] }"
        :row-height="72"
      >
        <!-- The same header as the quotes list ("Partner", "Quote"), so the
             list keeps its shape when it is shared. -->
        <ListHeader>
          <ListHeaderCell>Partner</ListHeaderCell>
          <ListHeaderCell class="hidden sm:flex">Rate</ListHeaderCell>
        </ListHeader>
        <ListRow v-for="p in matches" :key="p.id" class="!items-start pt-4">
          <ListCell class="!items-start gap-3">
            <Avatar
              :image="logoFor(p.id)"
              :label="p.name"
              size="2xl"
              shape="square"
              class="fc-logo-avatar shrink-0"
            />
            <div class="min-w-0">
              <span class="flex items-center gap-2">
                <RouterLink
                  :to="{ name: 'partner', params: { id: p.id } }"
                  class="truncate text-base text-ink-gray-8 hover:underline"
                >
                  {{ p.name }}
                </RouterLink>
                <TierIcon :tier="p.tier" />
              </span>
              <span class="mt-1 block truncate text-sm text-ink-gray-6">
                {{ cityOf(p) }}<template v-if="p.rating"> · {{ p.rating }} ({{ p.reviews }})</template><span
                  v-if="p.rate"
                  class="sm:hidden"
                > · From ${{ p.rate }}/hr</span>
              </span>
            </div>
          </ListCell>
          <ListCell class="hidden !items-start sm:flex">
            <span v-if="p.rate" class="text-sm tabular-nums text-ink-gray-6">From ${{ p.rate }}/hr</span>
          </ListCell>
        </ListRow>
      </List>
    </section>

    <PartnerFiltersDialog
      v-model:open="showFilters"
      :brief="brief"
      :answers="answers"
      @patch="emit('update-brief', $event)"
    />
    <ShareRequirementsDialog
      v-model:open="sharing"
      :brief="brief"
      :country="answers.country"
      :count="matches.length"
      :first-time="firstTime"
      @update-brief="emit('update-brief', $event)"
      @share="emit('share')"
    />
  </div>
</template>
