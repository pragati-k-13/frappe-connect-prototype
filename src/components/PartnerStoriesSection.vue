<script setup>
import { computed } from 'vue'
import { Badge } from 'frappe-ui'
import { storyCovers } from '../data/media'
import { statsFor, storiesFor } from '../data/stories'

// SCREEN 6, sixth section — "Success stories".
//
// ⚠️ The story titles and the clients they name are invented, and the two
// invented stats are flagged in `data/stories.js`. The segments are real —
// each story's industry label comes from the partner's own `industries`.
const props = defineProps({
  partner: { type: Object, required: true },
})

const stats = computed(() => statsFor(props.partner))
const stories = computed(() => storiesFor(props.partner))
const total = computed(() => props.partner.stories)

// Three covers against up to nine tiles, so the index wraps. `% length` rather
// than clamping, because clamping would give every story past the third the
// same picture.
const covers = storyCovers()
const coverFor = (i) => covers[i % covers.length]
</script>

<template>
  <section>
    <!-- The count belongs to the title: it's how many there are, not a
         separate fact. No badge at zero — a "0" chip is noise where the empty
         line below already says it. -->
    <h2 class="flex items-center gap-2 text-base font-semibold text-ink-gray-8">
      Success stories
      <Badge v-if="total" theme="gray" variant="subtle" size="md" :label="`${total}`" />
    </h2>

    <!-- ── Stats ───────────────────────────────────────────────────────── -->
    <!-- Shown even when there are no stories: a partner's scale and tenure
         don't depend on whether they've written anything up. -->
    <div v-if="stats.length" class="mt-4 grid gap-3 sm:grid-cols-3">
      <div
        v-for="s in stats"
        :key="s.key"
        class="rounded-5 border border-outline-gray-2 bg-surface-base px-4 py-3"
      >
        <p class="text-2xl font-medium tabular-nums text-ink-gray-8">{{ s.value }}</p>
        <p class="mt-0.5 text-p-base text-ink-gray-6">{{ s.label }}</p>
      </div>
    </div>

    <!-- ── The pinned story ────────────────────────────────────────────── -->
    <!-- One story the partner leads with, at full width. Not repeated in the
         grid below — the design mock shows it twice, which reads as a
         duplicate rather than as emphasis. `aspect-[4/1]` is the design's
         banner crop; the grid tiles are 2:1. -->
    <article v-if="stories.pinned" class="mt-6">
      <img
        :src="coverFor(stories.pinned.cover).src"
        :alt="coverFor(stories.pinned.cover).alt"
        class="aspect-[4/1] w-full rounded-5 bg-surface-gray-2 object-cover"
      />
      <p class="mt-3 text-p-xs uppercase tracking-wide text-ink-gray-5">
        {{ stories.pinned.segment }}
      </p>
      <p class="mt-1 text-base text-ink-gray-8">{{ stories.pinned.title }}</p>
    </article>

    <!-- ── The rest ────────────────────────────────────────────────────── -->
    <!-- `gap-y` is larger than `gap-x`: each tile is a picture plus two lines
         of text, so rows need more air between them than columns do or the
         next cover reads as part of the title above it. -->
    <div v-if="stories.rest.length" class="mt-6 grid gap-x-4 gap-y-6 sm:grid-cols-3">
      <article v-for="s in stories.rest" :key="s.id">
        <img
          :src="coverFor(s.cover).src"
          :alt="coverFor(s.cover).alt"
          class="aspect-[2/1] w-full rounded-4 bg-surface-gray-2 object-cover"
        />
        <p class="mt-3 text-p-xs uppercase tracking-wide text-ink-gray-5">{{ s.segment }}</p>
        <p class="mt-1 text-p-base text-ink-gray-8">{{ s.title }}</p>
      </article>
    </div>

    <!-- Two of the thirteen partners have none, which is what makes this state
         worth having rather than assuming every profile is full. -->
    <p v-if="!total" class="mt-6 text-p-base text-ink-gray-6">No success stories published yet.</p>
  </section>
</template>
