<script setup>
import { computed, ref } from 'vue'
import { Avatar, Button } from 'frappe-ui'
import IconPositive from '~icons/lucide/check'
import IconCaution from '~icons/lucide/info'
import FilterChip from './FilterChip.vue'
import MediaLightbox from './MediaLightbox.vue'
import { reviewMediaFor } from '../data/media'
import { reviewsFor } from '../data/reviews'

// SCREEN 6, fifth section — "Reviews".
//
// ⚠️ The reviews themselves are FABRICATED, and they're the most sensitive
// placeholder data in the mock: made-up testimonials attributed to made-up
// customers, about real, named companies. Read the warning at the top of
// `data/reviews.js` before screenshotting this.
const props = defineProps({
  partner: { type: Object, required: true },
})

const media = computed(() => reviewMediaFor(props.partner.id))
const review = computed(() => reviewsFor(props.partner))

// The aggregate comes from the partner record — the same `rating` and `reviews`
// the listing row shows, so the two screens can't disagree. It deliberately
// isn't the average of the rows below: those are the first four of twelve, and
// a sample of a set doesn't have to average to the set.
const rating = computed(() => props.partner.rating.toFixed(1))

const iconFor = (sentiment) => (sentiment === 'caution' ? IconCaution : IconPositive)

// ⚠️ Selection is local and does nothing downstream — what a click filters is
// still to be decided. Held here so the chips are genuinely pressable and the
// selected state is reviewable, rather than being dead controls that look live.
const activeTags = ref([])
const toggleTag = (label) => {
  activeTags.value = activeTags.value.includes(label)
    ? activeTags.value.filter((l) => l !== label)
    : [...activeTags.value, label]
}

const lightboxOpen = ref(false)
const lightboxAt = ref(0)
const openAt = (i) => {
  lightboxAt.value = i
  lightboxOpen.value = true
}

const ago = (months) => (months < 12 ? `${months} months ago` : `${Math.floor(months / 12)}y ago`)
</script>

<template>
  <section>
    <h2 class="text-base font-semibold text-ink-gray-8">Reviews</h2>

    <!-- ── The aggregate ───────────────────────────────────────────────── -->
    <div class="mt-4 flex items-start justify-between gap-4">
      <div>
        <p class="flex items-center gap-1.5">
          <span class="text-6xl font-medium tabular-nums text-ink-gray-8">{{ rating }}</span>
          <LucideStar class="size-4 fill-current text-ink-gray-5" aria-hidden="true" />
          <span class="sr-only">out of 5</span>
        </p>
        <p class="mt-0.5 text-p-base text-ink-gray-6">
          {{ partner.reviews }} {{ partner.reviews === 1 ? 'review' : 'reviews' }}
        </p>
      </div>
      <!-- ⚠️ Inert. Writing a review needs an account and a completed project,
           both of which are `store.account` questions this section doesn't ask
           yet — see the demo switcher notes in the README. -->
      <Button variant="subtle" label="Write a review">
        <template #prefix><LucidePlus class="size-4" /></template>
      </Button>
    </div>

    <!-- ── Customer media ──────────────────────────────────────────────── -->
    <!-- Opens the same lightbox as the profile gallery: one overlay, one set
         of keyboard shortcuts, wherever media is clicked on this page. -->
    <div v-if="media.length" class="mt-4 grid grid-cols-3 gap-3">
      <button
        v-for="(m, i) in media"
        :key="m.id"
        class="group relative aspect-[2/1] cursor-zoom-in overflow-hidden rounded-5 bg-surface-gray-2"
        :aria-label="m.kind === 'video' ? `Play ${m.alt}` : `Open ${m.alt} full screen`"
        @click="openAt(i)"
      >
        <img
          :src="m.kind === 'video' ? (m.poster ?? m.src) : m.src"
          :alt="m.alt"
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span
          v-if="m.kind === 'video'"
          class="absolute left-1/2 top-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all group-hover:scale-105 group-hover:bg-black/60"
          aria-hidden="true"
        >
          <LucidePlay class="size-5 translate-x-[1px] fill-current" />
        </span>
      </button>
    </div>

    <!-- ── What reviewers keep saying ──────────────────────────────────── -->
    <!-- The app's own chip (`FilterChip` — an outline ⇄ subtle Button), the
         same control as the quiz's region chips and the mid-list app chips.
         Pressable with a real selected state; the icon carries the sentiment. -->
    <div class="mt-4 flex flex-wrap gap-2">
      <FilterChip
        v-for="t in review.tags"
        :key="t.label"
        :label="t.label"
        :count="t.count"
        :icon="iconFor(t.sentiment)"
        :selected="activeTags.includes(t.label)"
        @toggle="toggleTag(t.label)"
      />
    </div>

    <!-- ── The reviews ─────────────────────────────────────────────────── -->
    <div class="mt-8 divide-y divide-outline-gray-1">
      <article v-for="r in review.items" :key="r.id" class="py-5">
        <div class="flex items-start gap-3">
          <!-- ⚠️ Placeholder: no image and no label, so it renders as a plain
               circle rather than an initial. A letter would read as this
               person's monogram, and the person is invented. -->
          <Avatar class="size-9 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <p class="text-base font-medium text-ink-gray-8">{{ r.name }}</p>
              <!-- Stored as an age rather than a date, so the label can't drift
                   as the mock gets older — see `data/reviews.js`. -->
              <p class="shrink-0 text-p-base text-ink-gray-5">{{ ago(r.monthsAgo) }}</p>
            </div>
            <p class="mt-0.5 text-p-base text-ink-gray-6">{{ r.company }}</p>
          </div>
        </div>

        <!-- Body and footer sit outside the avatar row rather than indented
             beside it: at this column width an indented paragraph loses 48px of
             measure for no gain, and the design runs them full width too. -->
        <p class="mt-2 text-p-base text-ink-gray-7">{{ r.text }}</p>
        <div class="mt-2 flex items-center gap-4">
          <p class="flex items-center gap-1.5 text-p-base font-medium text-ink-gray-8">
            <!-- Lighter than the figure beside it: `fill-current` would inherit the
                 row's ink-8, which makes a solid black star the loudest thing in
                 the review. -->
            <LucideStar class="size-3.5 fill-current text-ink-gray-5" aria-hidden="true" />
            {{ r.stars.toFixed(1) }}
            <span class="sr-only">out of 5</span>
          </p>
          <!-- Only shown when true. "Would not recommend" as a grey line next
               to a 3-star rating reads as a label rather than a verdict; the
               rating already carries it. -->
          <p v-if="r.recommend" class="flex items-center gap-1.5 text-p-base text-ink-gray-6">
            <LucideCheck class="size-3.5" aria-hidden="true" />
            Would recommend
          </p>
        </div>
      </article>
    </div>

    <!-- ⚠️ Inert — there's no all-reviews screen yet. Same treatment as the
         pricing links: ghost Button pulled back by `-ml-2` so the label lines
         up with the column edge rather than sitting inside its own padding. -->
    <Button
      v-if="partner.reviews > review.items.length"
      variant="ghost"
      label="View all"
      class="-ml-2 mt-3"
    >
      <template #suffix><LucideChevronRight class="size-4" /></template>
    </Button>

    <MediaLightbox
      :open="lightboxOpen"
      :items="media"
      :index="lightboxAt"
      @close="lightboxOpen = false"
      @update:index="lightboxAt = $event"
    />
  </section>
</template>
