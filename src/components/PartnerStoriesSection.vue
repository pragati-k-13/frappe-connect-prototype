<script setup>
import { computed } from 'vue'
import { Badge } from 'frappe-ui'
import { storyCovers } from '../data/media'
import { storiesFor } from '../data/stories'

// SCREEN 6, sixth section — "Success stories".
//
// ⚠️ The story titles and the clients they name are invented — see
// `data/stories.js`. The segments are real: each story's industry label comes
// from the partner's own `industries`.
//
// There used to be a row of three stat tiles above the stories — "800+ FC
// sites", "75% Would recommend", "17y Years operating". Removed. Two of the
// three were invented claims a directory would have to source, and the middle
// one openly disagreed with the 4.5★ the Reviews section showed two sections
// later, because the two numbers were generated independently. The section is
// about the write-ups; the tiles were a scoreboard bolted to the top of it.
const props = defineProps({
  partner: { type: Object, required: true },
})

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

    <!-- ── The pinned story ────────────────────────────────────────────── -->
    <!-- One story the partner leads with, at full width. Not repeated in the
         grid below — the design mock shows it twice, which reads as a
         duplicate rather than as emphasis. `aspect-[4/1]` is the design's
         banner crop; the grid tiles are 2:1. -->
    <article v-if="stories.pinned" class="mt-4">
      <img
        :src="coverFor(stories.pinned.cover).src"
        :alt="coverFor(stories.pinned.cover).alt"
        class="aspect-[4/1] w-full rounded-5 bg-surface-gray-2 object-cover"
      />
      <p class="mt-3 text-p-xs uppercase tracking-wide text-ink-gray-5">
        {{ stories.pinned.segment }}
      </p>
      <p class="mt-1 text-base text-ink-gray-7">{{ stories.pinned.title }}</p>
    </article>

    <!-- ── The rest ────────────────────────────────────────────────────── -->
    <!-- `gap-y` is larger than `gap-x`: each tile is a picture plus two lines
         of text, so rows need more air between them than columns do or the
         next cover reads as part of the title above it.

         ⚠️ The top margin depends on what's above. Following the pinned story
         it's 24px, separating two different treatments of the same thing.
         Following the HEADING — which is now the common case, since pinning
         needs four stories — it's 16px, the same title-to-content gap Reviews
         and Pricing use. At a flat 24px this section sat visibly lower under
         its own title than every other section on the page. -->
    <div
      v-if="stories.rest.length"
      class="grid gap-x-4 gap-y-6 sm:grid-cols-3"
      :class="stories.pinned ? 'mt-6' : 'mt-4'"
    >
      <article v-for="s in stories.rest" :key="s.id">
        <img
          :src="coverFor(s.cover).src"
          :alt="coverFor(s.cover).alt"
          class="aspect-[2/1] w-full rounded-4 bg-surface-gray-2 object-cover"
        />
        <p class="mt-3 text-p-xs uppercase tracking-wide text-ink-gray-5">{{ s.segment }}</p>
        <!-- `ink-7`, the same as the pinned story's title above. What separates
             the pinned one is its 4:1 cover and its `text-base`; the ink is the
             same across the whole section, so a card title never competes with
             a section heading for the darkest thing on the page. -->
        <p class="mt-1 text-p-base text-ink-gray-7">{{ s.title }}</p>
      </article>
    </div>

    <!-- Two of the thirteen partners have none, which is what makes this state
         worth having rather than assuming every profile is full. -->
    <!-- Same 16px as the grid's un-pinned case: it's the section's content, and
         it sits where the content would. -->
    <p v-if="!total" class="mt-4 text-p-base text-ink-gray-6">No success stories published yet.</p>
  </section>
</template>
